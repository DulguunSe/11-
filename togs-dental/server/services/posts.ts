import { existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { all, one, run } from '../db.ts'
import { randomToken } from '../lib/crypto.ts'
import { aiConfigured, env } from '../lib/env.ts'
import { getSettings } from '../lib/settings.ts'
import { addDays, nowMinute, nowStamp, parseYmd, today } from '../lib/time.ts'
import { HttpError } from '../http.ts'
import { planPosts } from './ai.ts'
import { renderPostImage, type Design } from './render.ts'
import { publishFacebook, publishInstagram, socialConnected } from './social.ts'

export type Post = {
  id: number
  status: 'draft' | 'approved' | 'publishing' | 'published' | 'failed' | 'rejected'
  source: 'ai' | 'manual'
  kind: string
  topic: string
  caption: string
  hashtags: string
  template: string
  design: string
  image_path: string | null
  platforms: string
  scheduled_at: string | null
  published_at: string | null
  fb_post_id: string | null
  ig_media_id: string | null
  error: string | null
  attempts: number
  created_by: number | null
  created_at: string
  updated_at: string
}

export const getPost = (id: number) => one<Post>('SELECT * FROM posts WHERE id = ?', id)
export const imageUrl = (p: Pick<Post, 'image_path'>) => (p.image_path ? `/${p.image_path}` : null)

/** Зургийг шинээр бүтээж хуучныг устгана */
export async function renderPost(id: number) {
  const p = getPost(id)
  if (!p) throw new HttpError(404, 'Пост олдсонгүй')
  const design = JSON.parse(p.design || '{}') as Design
  const rel = `media/posts/post-${id}-${randomToken(6)}.jpg`
  await renderPostImage(p.template, design, resolve(env.uploadsDir, rel))
  if (p.image_path && p.image_path !== rel) {
    const old = resolve(env.uploadsDir, p.image_path)
    if (existsSync(old)) unlinkSync(old)
  }
  run('UPDATE posts SET image_path = ?, updated_at = ? WHERE id = ?', rel, nowStamp(), id)
  return rel
}

export function deletePostFiles(p: Post) {
  if (p.image_path) {
    const f = resolve(env.uploadsDir, p.image_path)
    if (existsSync(f)) unlinkSync(f)
  }
}

/** Пост дээр нэмэгдэх цаг захиалах холбоос, утас, hashtag */
export function fullCaption(p: Post, platform: 'facebook' | 'instagram') {
  const clinic = getSettings('clinic')
  const url = `${env.publicUrl}/?utm_source=${platform}&utm_campaign=post-${p.id}#book`
  const phones = [clinic.phone1, clinic.phone2].filter(Boolean).join(', ')
  const lines = [p.caption.trim(), '', `📅 Онлайнаар цаг захиалах: ${url}`]
  if (phones) lines.push(`📞 ${phones}`)
  if (clinic.addressShort || clinic.address) lines.push(`📍 ${clinic.addressShort || clinic.address}`)
  if (p.hashtags.trim()) lines.push('', p.hashtags.trim())
  return lines.join('\n')
}

/* ---------------- Нийтлэх хуваарь ---------------- */
const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86_400_000)

/** Автомат хуваарийн дагуу дараагийн сул нийтлэх цагууд ('YYYY-MM-DD HH:MM') */
export function nextSlots(count: number, after = nowMinute()): string[] {
  const ap = getSettings('autopilot')
  const rows = all<{ scheduled_at: string }>(
    `SELECT scheduled_at FROM posts WHERE scheduled_at IS NOT NULL AND scheduled_at >= ? AND status IN ('draft','approved','publishing','published')`,
    addDays(today(), -2),
  )
  const taken = new Set(rows.map((r) => r.scheduled_at.slice(0, 10)))
  let lastDay = rows.map((r) => r.scheduled_at.slice(0, 10)).sort().at(-1) ?? null
  const out: string[] = []
  let d = today()
  for (let i = 0; out.length < count && i < 400; i++, d = addDays(d, 1)) {
    const at = `${d} ${ap.time}`
    if (at <= after || taken.has(d)) continue
    if (ap.frequency === 'weekdays' && !ap.weekdays.includes(parseYmd(d).getDay())) continue
    if (ap.frequency === 'every2' && lastDay && lastDay < d && daysBetween(lastDay, d) < 2) continue
    out.push(at)
    taken.add(d)
    if (!lastDay || d > lastDay) lastDay = d
  }
  return out
}

/* ---------------- AI-аар пост үүсгэх ---------------- */
let generating = false

export async function generatePosts(opts: { count: number; focus?: string; userId: number | null; approve?: boolean }) {
  if (generating) throw new HttpError(409, 'AI одоо пост бэлтгэж байна. Түр хүлээнэ үү.')
  generating = true
  try {
    const slots = nextSlots(opts.count)
    const recentTopics = all<{ topic: string }>(
      `SELECT topic FROM posts WHERE topic != '' AND status != 'rejected' ORDER BY id DESC LIMIT 30`,
    ).map((r) => r.topic)
    const plan = await planPosts({ dates: slots, focus: opts.focus, recentTopics })
    const ap = getSettings('autopilot')
    const ids: number[] = []
    for (let i = 0; i < plan.length; i++) {
      const p = plan[i]
      const design: Design = { headline: p.headline, subline: p.subline, points: p.points, badge: p.badge, media_id: p.media_id }
      const stamp = nowStamp()
      const { id } = run(
        `INSERT INTO posts (status, source, kind, topic, caption, hashtags, template, design, platforms, scheduled_at, created_by, created_at, updated_at)
         VALUES (?, 'ai', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        opts.approve ? 'approved' : 'draft',
        p.kind,
        p.topic.slice(0, 120),
        p.caption.trim(),
        p.hashtags.join(' '),
        p.template,
        JSON.stringify(design),
        ap.platforms.join(','),
        slots[i] ?? null,
        opts.userId,
        stamp,
        stamp,
      )
      await renderPost(id)
      ids.push(id)
    }
    return ids
  } finally {
    generating = false
  }
}

/* ---------------- Нийтлэх ---------------- */
const publishing = new Set<number>()

export async function publishPost(id: number) {
  if (publishing.has(id)) throw new HttpError(409, 'Энэ пост нийтлэгдэж байна')
  const p = getPost(id)
  if (!p) throw new HttpError(404, 'Пост олдсонгүй')
  if (p.status === 'published') throw new HttpError(400, 'Аль хэдийн нийтлэгдсэн')
  const cfg = getSettings('social')
  publishing.add(id)
  run(`UPDATE posts SET status = 'publishing', attempts = attempts + 1, updated_at = ? WHERE id = ?`, nowStamp(), id)
  const errors: string[] = []
  let fbId = p.fb_post_id
  let igId = p.ig_media_id
  try {
    if (!socialConnected(cfg)) throw new Error('Facebook хуудас холбогдоогүй байна (AI маркетинг → Холболт)')
    const rel = p.image_path && existsSync(resolve(env.uploadsDir, p.image_path)) ? p.image_path : await renderPost(id)
    const abs = resolve(env.uploadsDir, rel)
    const platforms = p.platforms.split(',').filter(Boolean)
    if (platforms.includes('facebook') && !fbId) {
      try {
        fbId = await publishFacebook(cfg, fullCaption(p, 'facebook'), abs)
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }
    if (platforms.includes('instagram') && !igId) {
      try {
        igId = await publishInstagram(cfg, fullCaption(p, 'instagram'), `${env.publicUrl}/${rel}`)
      } catch (e) {
        errors.push(`Instagram: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  } finally {
    publishing.delete(id)
  }
  const ok = Boolean(fbId || igId)
  run(
    `UPDATE posts SET status = ?, fb_post_id = ?, ig_media_id = ?, error = ?, published_at = ?, updated_at = ? WHERE id = ?`,
    ok ? 'published' : 'failed',
    fbId,
    igId,
    errors.length ? errors.join(' | ').slice(0, 1000) : null,
    ok ? nowStamp() : null,
    nowStamp(),
    id,
  )
  return getPost(id)!
}

/** Цаг нь болсон батлагдсан постуудыг нийтлэх (минут тутам) */
export async function publishDue() {
  const due = all<{ id: number }>(
    `SELECT id FROM posts WHERE status = 'approved' AND scheduled_at IS NOT NULL AND scheduled_at <= ? ORDER BY scheduled_at LIMIT 5`,
    nowMinute(),
  )
  for (const { id } of due) await publishPost(id).catch(() => {})
  // Сервер унтарч гацсан "publishing" төлвийг сэргээх
  run(`UPDATE posts SET status = 'failed', error = 'Нийтлэх явц тасарсан' WHERE status = 'publishing' AND updated_at < ?`, nowStamp(new Date(Date.now() - 15 * 60_000)))
  return due.length
}

/** Autopilot: дараагийн постууд бэлэн байлгах */
export async function autopilotTick() {
  const ap = getSettings('autopilot')
  if (!ap.enabled || !aiConfigured()) return 0
  const upcoming = one<{ n: number }>(
    `SELECT COUNT(*) n FROM posts WHERE status IN ('draft','approved') AND scheduled_at > ?`,
    nowMinute(),
  )!.n
  const need = Math.min(7, ap.keepAhead - upcoming)
  if (need <= 0) return 0
  const ids = await generatePosts({ count: need, userId: null, approve: !ap.requireApproval })
  return ids.length
}
