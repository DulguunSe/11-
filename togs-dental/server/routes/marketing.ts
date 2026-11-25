import { Hono } from 'hono'
import { z } from 'zod'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { all, one, run } from '../db.ts'
import { audit } from '../lib/audit.ts'
import { randomToken } from '../lib/crypto.ts'
import { aiConfigured, env } from '../lib/env.ts'
import { autopilotSchema, brandSchema, getSettings, saveSettings, socialSchema } from '../lib/settings.ts'
import { nowMinute, nowStamp } from '../lib/time.ts'
import { me, requireAuth } from '../auth.ts'
import { HttpError, bad, body, intParam, notFound, type AppEnv } from '../http.ts'
import { describeImage, learnStyle } from '../services/ai.ts'
import { resetLogoCache, TEMPLATES } from '../services/render.ts'
import {
  deletePostFiles,
  fullCaption,
  generatePosts,
  getPost,
  imageUrl,
  nextSlots,
  publishPost,
  renderPost,
  type Post,
} from '../services/posts.ts'
import { recentPageTexts, socialConnected, testConnection } from '../services/social.ts'

export const marketingRoutes = new Hono<AppEnv>()
marketingRoutes.use('*', requireAuth('admin', 'reception'))

const maskToken = (t: string) => (t ? `••••${t.slice(-4)}` : '')

marketingRoutes.get('/overview', (c) => {
  const social = getSettings('social')
  const counts = Object.fromEntries(
    all<{ status: string; n: number }>('SELECT status, COUNT(*) n FROM posts GROUP BY status').map((r) => [r.status, r.n]),
  )
  const bookingsFromPosts = one<{ n: number }>(
    `SELECT COUNT(*) n FROM appointments WHERE source = 'online' AND utm LIKE '%post-%'`,
  )!.n
  return c.json({
    aiConfigured: aiConfigured(),
    model: env.claudeModel,
    publicUrl: env.publicUrl,
    httpsReady: env.publicUrl.startsWith('https://'),
    social: { connected: socialConnected(social), pageName: social.pageName, igUsername: social.igUsername, hasInstagram: Boolean(social.igUserId) },
    autopilot: getSettings('autopilot'),
    counts,
    bookingsFromPosts,
    nextSlots: nextSlots(3),
  })
})

/* ---------------- Брэнд ---------------- */
marketingRoutes.get('/brand', (c) => c.json(getSettings('brand')))
marketingRoutes.put('/brand', async (c) => {
  const v = saveSettings('brand', await body(c, brandSchema))
  audit(me(c).id, 'update', 'settings', null, 'brand')
  return c.json(v)
})

/** Өмнөх постуудаас бичих хэв маяг сурах */
marketingRoutes.post('/brand/learn', async (c) => {
  const b = await body(c, z.object({ samples: z.string().max(12000).optional(), fromFacebook: z.boolean().default(false) }))
  let samples = b.samples ?? getSettings('brand').samples
  if (b.fromFacebook) {
    const cfg = getSettings('social')
    if (!socialConnected(cfg)) throw bad('Facebook хуудас холбогдоогүй байна')
    const texts = await recentPageTexts(cfg).catch((e: Error) => {
      throw bad(e.message)
    })
    if (!texts.length) throw bad('Хуудсанд тексттэй пост олдсонгүй')
    samples = texts.join('\n\n---\n\n').slice(0, 8000)
  }
  if (!samples || samples.trim().length < 80) throw bad('Дор хаяж 2-3 өмнөх постын текст оруулна уу')
  const styleGuide = await learnStyle(samples)
  const brand = saveSettings('brand', { ...getSettings('brand'), samples: samples.slice(0, 8000), styleGuide })
  audit(me(c).id, 'ai_learn', 'settings', null, 'brand style')
  return c.json(brand)
})

/* ---------------- Зургийн сан ---------------- */
const mediaUrl = (path: string) => `/${path}`
marketingRoutes.get('/media', (c) =>
  c.json({
    items: all<{ id: number; path: string; kind: string; description: string; width: number; height: number; created_at: string }>(
      'SELECT * FROM media ORDER BY kind DESC, id DESC',
    ).map((m) => ({ ...m, url: mediaUrl(m.path) })),
  }),
)

marketingRoutes.post('/media', async (c) => {
  const form = await c.req.parseBody()
  const file = form.file
  if (!(file instanceof File)) throw bad('Зураг сонгоно уу')
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type)) throw bad('Зөвхөн JPG, PNG, WEBP зураг')
  if (file.size > 15 * 1024 * 1024) throw bad('Зураг 15MB-аас ихгүй байна')
  const kind = form.kind === 'logo' ? 'logo' : 'photo'
  const input = Buffer.from(await file.arrayBuffer())
  let out: Buffer
  let ext: string
  try {
    if (kind === 'logo') {
      out = await sharp(input).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
      ext = 'png'
    } else {
      out = await sharp(input).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
      ext = 'jpg'
    }
  } catch {
    throw bad('Зургийг уншиж чадсангүй')
  }
  const meta = await sharp(out).metadata()
  const rel = `media/library/${randomToken(10)}.${ext}`
  mkdirSync(resolve(env.uploadsDir, 'media/library'), { recursive: true })
  writeFileSync(resolve(env.uploadsDir, rel), out)
  let description = String(form.description ?? '').slice(0, 200)
  if (!description && kind === 'photo' && aiConfigured()) {
    description = (await describeImage(resolve(env.uploadsDir, rel)).catch(() => '')) ?? ''
  }
  const { id } = run(
    'INSERT INTO media (path, kind, description, width, height, created_at) VALUES (?,?,?,?,?,?)',
    rel,
    kind,
    description,
    meta.width ?? 0,
    meta.height ?? 0,
    nowStamp(),
  )
  if (kind === 'logo') resetLogoCache()
  audit(me(c).id, 'upload', 'media', id)
  return c.json({ id, url: mediaUrl(rel), description }, 201)
})

marketingRoutes.patch('/media/:id', async (c) => {
  const id = intParam(c.req.param('id'))
  const { description } = await body(c, z.object({ description: z.string().trim().max(200) }))
  if (!run('UPDATE media SET description = ? WHERE id = ?', description, id).changes) throw notFound()
  return c.json({ ok: true })
})

marketingRoutes.delete('/media/:id', (c) => {
  const id = intParam(c.req.param('id'))
  const m = one<{ path: string; kind: string }>('SELECT path, kind FROM media WHERE id = ?', id)
  if (!m) throw notFound()
  run('DELETE FROM media WHERE id = ?', id)
  const f = resolve(env.uploadsDir, m.path)
  if (existsSync(f)) unlinkSync(f)
  if (m.kind === 'logo') resetLogoCache()
  audit(me(c).id, 'delete', 'media', id)
  return c.json({ ok: true })
})

/* ---------------- Постууд ---------------- */
const view = (p: Post) => ({
  ...p,
  design: JSON.parse(p.design || '{}'),
  image_url: imageUrl(p),
  preview_caption: fullCaption(p, 'facebook'),
  overdue: p.status === 'draft' && Boolean(p.scheduled_at && p.scheduled_at < nowMinute()),
})

marketingRoutes.get('/posts', (c) => {
  const status = c.req.query('status')
  const where =
    status === 'upcoming'
      ? `status IN ('draft','approved','publishing')`
      : status === 'history'
        ? `status IN ('published','failed','rejected')`
        : status
          ? 'status = ?'
          : '1'
  const params = status && !['upcoming', 'history'].includes(status) ? [status] : []
  const order = status === 'history' ? 'COALESCE(published_at, updated_at) DESC' : 'COALESCE(scheduled_at, created_at), id'
  const items = all<Post>(`SELECT * FROM posts WHERE ${where} ORDER BY ${order} LIMIT 100`, ...params).map(view)
  return c.json({ items })
})

const designSchema = z.object({
  headline: z.string().trim().min(1, 'Гарчиг бичнэ үү').max(80),
  subline: z.string().trim().max(160).default(''),
  points: z.array(z.string().trim().max(80)).max(4).default([]),
  badge: z.string().trim().max(24).default(''),
  media_id: z.number().int().positive().nullable().default(null),
})
const slotSchema = z.string().regex(/^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d$/, 'Огноо, цаг буруу')
const platformsSchema = z.array(z.enum(['facebook', 'instagram'])).min(1, 'Дор хаяж нэг платформ')

marketingRoutes.post('/posts', async (c) => {
  const u = me(c)
  const b = await body(
    c,
    z.object({
      caption: z.string().trim().min(10, 'Текст хэт богино').max(2200),
      hashtags: z.string().trim().max(300).default(''),
      template: z.enum(TEMPLATES),
      design: designSchema,
      platforms: platformsSchema.default(['facebook', 'instagram']),
      scheduled_at: slotSchema.nullable().default(null),
      topic: z.string().trim().max(120).default(''),
    }),
  )
  const stamp = nowStamp()
  const { id } = run(
    `INSERT INTO posts (status, source, kind, topic, caption, hashtags, template, design, platforms, scheduled_at, created_by, created_at, updated_at)
     VALUES ('draft', 'manual', 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    b.topic || b.design.headline,
    b.caption,
    b.hashtags,
    b.template,
    JSON.stringify(b.design),
    b.platforms.join(','),
    b.scheduled_at ?? nextSlots(1)[0] ?? null,
    u.id,
    stamp,
    stamp,
  )
  await renderPost(id)
  audit(u.id, 'create', 'post', id)
  return c.json({ item: view(getPost(id)!) }, 201)
})

marketingRoutes.post('/posts/generate', async (c) => {
  const u = me(c)
  const b = await body(c, z.object({ count: z.number().int().min(1).max(7), focus: z.string().trim().max(500).default('') }))
  const ids = await generatePosts({ count: b.count, focus: b.focus || undefined, userId: u.id })
  audit(u.id, 'ai_generate', 'post', null, `${ids.length} пост`)
  return c.json({ items: ids.map((id) => view(getPost(id)!)) }, 201)
})

marketingRoutes.patch('/posts/:id', async (c) => {
  const u = me(c)
  const id = intParam(c.req.param('id'))
  const p = getPost(id)
  if (!p) throw notFound('Пост олдсонгүй')
  if (['published', 'publishing'].includes(p.status)) throw bad('Нийтлэгдсэн постыг засах боломжгүй')
  const b = await body(
    c,
    z.object({
      caption: z.string().trim().min(10).max(2200).optional(),
      hashtags: z.string().trim().max(300).optional(),
      template: z.enum(TEMPLATES).optional(),
      design: designSchema.optional(),
      platforms: platformsSchema.optional(),
      scheduled_at: slotSchema.nullable().optional(),
    }),
  )
  const sets: string[] = []
  const vals: (string | null)[] = []
  if (b.caption !== undefined) (sets.push('caption = ?'), vals.push(b.caption))
  if (b.hashtags !== undefined) (sets.push('hashtags = ?'), vals.push(b.hashtags))
  if (b.template !== undefined) (sets.push('template = ?'), vals.push(b.template))
  if (b.design !== undefined) (sets.push('design = ?'), vals.push(JSON.stringify(b.design)))
  if (b.platforms !== undefined) (sets.push('platforms = ?'), vals.push(b.platforms.join(',')))
  if (b.scheduled_at !== undefined) (sets.push('scheduled_at = ?'), vals.push(b.scheduled_at))
  if (p.status === 'failed' || p.status === 'rejected') sets.push(`status = 'draft'`, 'error = NULL')
  if (sets.length) run(`UPDATE posts SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, ...vals, nowStamp(), id)
  if (b.template !== undefined || b.design !== undefined) await renderPost(id)
  audit(u.id, 'update', 'post', id)
  return c.json({ item: view(getPost(id)!) })
})

marketingRoutes.post('/posts/:id/approve', async (c) => {
  const u = me(c)
  const id = intParam(c.req.param('id'))
  const p = getPost(id)
  if (!p) throw notFound('Пост олдсонгүй')
  if (!['draft', 'failed', 'rejected'].includes(p.status)) throw bad('Энэ постыг батлах боломжгүй')
  const b = await body(c, z.object({ scheduled_at: slotSchema.nullable().optional() }))
  let at = b.scheduled_at ?? p.scheduled_at
  if (!at || at <= nowMinute()) at = nextSlots(1)[0] ?? null
  if (!at) throw bad('Нийтлэх цаг олдсонгүй')
  run(`UPDATE posts SET status = 'approved', scheduled_at = ?, error = NULL, updated_at = ? WHERE id = ?`, at, nowStamp(), id)
  audit(u.id, 'approve', 'post', id, at)
  return c.json({ item: view(getPost(id)!) })
})

marketingRoutes.post('/posts/:id/unapprove', (c) => {
  const id = intParam(c.req.param('id'))
  const r = run(`UPDATE posts SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'approved'`, nowStamp(), id)
  if (!r.changes) throw bad('Батлагдсан пост биш')
  return c.json({ item: view(getPost(id)!) })
})

marketingRoutes.post('/posts/:id/reject', (c) => {
  const id = intParam(c.req.param('id'))
  const r = run(`UPDATE posts SET status = 'rejected', updated_at = ? WHERE id = ? AND status IN ('draft','approved','failed')`, nowStamp(), id)
  if (!r.changes) throw bad('Энэ постыг татгалзах боломжгүй')
  audit(me(c).id, 'reject', 'post', id)
  return c.json({ item: view(getPost(id)!) })
})

marketingRoutes.post('/posts/:id/publish', async (c) => {
  const id = intParam(c.req.param('id'))
  const p = getPost(id)
  if (!p) throw notFound('Пост олдсонгүй')
  if (p.status === 'published') throw bad('Аль хэдийн нийтлэгдсэн')
  const updated = await publishPost(id)
  audit(me(c).id, 'publish', 'post', id, updated.status)
  if (updated.status === 'failed') throw new HttpError(502, updated.error ?? 'Нийтлэгдсэнгүй')
  return c.json({ item: view(updated) })
})

marketingRoutes.post('/posts/:id/render', async (c) => {
  const id = intParam(c.req.param('id'))
  if (!getPost(id)) throw notFound('Пост олдсонгүй')
  await renderPost(id)
  return c.json({ item: view(getPost(id)!) })
})

marketingRoutes.delete('/posts/:id', (c) => {
  const id = intParam(c.req.param('id'))
  const p = getPost(id)
  if (!p) throw notFound('Пост олдсонгүй')
  if (p.status === 'publishing') throw bad('Нийтлэгдэж байна')
  run('DELETE FROM posts WHERE id = ?', id)
  if (p.status !== 'published') deletePostFiles(p)
  audit(me(c).id, 'delete', 'post', id)
  return c.json({ ok: true })
})

/* ---------------- Autopilot ---------------- */
marketingRoutes.get('/autopilot', (c) => c.json({ ...getSettings('autopilot'), nextSlots: nextSlots(5) }))
marketingRoutes.put('/autopilot', requireAuth('admin'), async (c) => {
  const v = saveSettings('autopilot', await body(c, autopilotSchema))
  audit(me(c).id, 'update', 'settings', null, `autopilot ${v.enabled ? 'on' : 'off'}`)
  return c.json({ ...v, nextSlots: nextSlots(5) })
})

/* ---------------- Facebook / Instagram холболт ---------------- */
marketingRoutes.get('/social', requireAuth('admin'), (c) => {
  const s = getSettings('social')
  return c.json({ ...s, pageToken: maskToken(s.pageToken), hasToken: Boolean(s.pageToken) })
})

marketingRoutes.put('/social', requireAuth('admin'), async (c) => {
  const b = await body(
    c,
    socialSchema.pick({ pageId: true, igUserId: true, graphVersion: true }).extend({ pageToken: z.string().trim().max(2000).optional() }),
  )
  const cur = getSettings('social')
  const next = { ...cur, ...b, pageToken: b.pageToken ? b.pageToken : cur.pageToken }
  let info = { pageName: '', igUserId: next.igUserId, igUsername: '' }
  if (next.pageId && next.pageToken) {
    info = await testConnection(next).catch((e: Error) => {
      throw bad(`Холболт амжилтгүй: ${e.message}`)
    })
  }
  const saved = saveSettings('social', {
    ...next,
    pageName: info.pageName,
    igUserId: next.igUserId || info.igUserId,
    igUsername: info.igUsername,
  })
  audit(me(c).id, 'update', 'settings', null, 'social')
  return c.json({ ...saved, pageToken: maskToken(saved.pageToken), hasToken: Boolean(saved.pageToken) })
})

marketingRoutes.post('/social/test', requireAuth('admin'), async (c) => {
  const cfg = getSettings('social')
  if (!socialConnected(cfg)) throw bad('Хуудасны ID болон токен оруулна уу')
  const info = await testConnection(cfg).catch((e: Error) => {
    throw bad(e.message)
  })
  return c.json(info)
})
