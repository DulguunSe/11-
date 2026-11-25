import { readFileSync } from 'node:fs'
import { env } from '../lib/env.ts'
import type { SocialSettings } from '../lib/settings.ts'

/**
 * Facebook Page болон Instagram Business руу Graph API-аар нийтлэх.
 * Шаардлага: Page access token (pages_manage_posts, pages_read_engagement,
 * instagram_basic, instagram_content_publish эрхтэй), Instagram нь Facebook хуудастай холбогдсон байх.
 */
type GraphError = { error?: { message?: string; code?: number; error_subcode?: number } }

async function graph<T>(cfg: SocialSettings, path: string, init?: RequestInit & { query?: Record<string, string> }): Promise<T> {
  const url = new URL(`${env.graphApiBase}/${cfg.graphVersion}/${path}`)
  for (const [k, v] of Object.entries(init?.query ?? {})) url.searchParams.set(k, v)
  if (!init?.body) url.searchParams.set('access_token', cfg.pageToken)
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = JSON.parse(text)
  } catch {
    data = {}
  }
  if (!res.ok || (data as GraphError).error) {
    const err = (data as GraphError).error
    const msg = err?.message ?? `HTTP ${res.status}`
    if (err?.code === 190) throw new Error(`Facebook токен хүчингүй болсон байна. Шинэ токен оруулна уу. (${msg})`)
    if (err?.code === 10 || err?.code === 200) throw new Error(`Facebook зөвшөөрөл хүрэлцэхгүй байна. (${msg})`)
    throw new Error(`Facebook: ${msg}`)
  }
  return data as T
}

export const socialConnected = (cfg: SocialSettings) => Boolean(cfg.pageId && cfg.pageToken)

/** Холболт шалгах: хуудасны нэр болон холбогдсон Instagram дансыг буцаана */
export async function testConnection(cfg: SocialSettings) {
  const page = await graph<{ id: string; name: string; instagram_business_account?: { id: string; username?: string } }>(
    cfg,
    cfg.pageId,
    { query: { fields: 'id,name,instagram_business_account{id,username}' } },
  )
  return {
    pageName: page.name,
    igUserId: page.instagram_business_account?.id ?? '',
    igUsername: page.instagram_business_account?.username ?? '',
  }
}

/** Facebook хуудсанд зурагтай пост нийтлэх */
export async function publishFacebook(cfg: SocialSettings, caption: string, imageAbsPath: string) {
  const form = new FormData()
  form.set('message', caption)
  form.set('published', 'true')
  form.set('access_token', cfg.pageToken)
  form.set('source', new Blob([readFileSync(imageAbsPath)], { type: 'image/jpeg' }), 'post.jpg')
  const r = await graph<{ id: string; post_id?: string }>(cfg, `${cfg.pageId}/photos`, { method: 'POST', body: form })
  return r.post_id ?? r.id
}

/** Instagram-д нийтлэх (зураг нийтэд нээлттэй HTTPS хаягтай байх ёстой) */
export async function publishInstagram(cfg: SocialSettings, caption: string, imageUrl: string) {
  if (!cfg.igUserId) throw new Error('Instagram данс холбогдоогүй байна')
  if (!/^https:\/\//.test(imageUrl)) throw new Error('Instagram-д нийтлэхийн тулд сайт HTTPS бодит домэйн дээр (PUBLIC_URL) ажиллаж байх ёстой')
  const form = (o: Record<string, string>) => {
    const f = new URLSearchParams(o)
    f.set('access_token', cfg.pageToken)
    return f
  }
  const created = await graph<{ id: string }>(cfg, `${cfg.igUserId}/media`, {
    method: 'POST',
    body: form({ image_url: imageUrl, caption }),
  })
  // Зураг боловсруулагдахыг хүлээнэ
  for (let i = 0; i < 15; i++) {
    const st = await graph<{ status_code?: string }>(cfg, created.id, { query: { fields: 'status_code' } })
    if (!st.status_code || st.status_code === 'FINISHED') break
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram зураг хүлээж авсангүй (${st.status_code})`)
    await new Promise((r) => setTimeout(r, 2000))
  }
  const published = await graph<{ id: string }>(cfg, `${cfg.igUserId}/media_publish`, {
    method: 'POST',
    body: form({ creation_id: created.id }),
  })
  return published.id
}

/** Хуудасны сүүлийн постуудын текст (хэв маяг сургахад) */
export async function recentPageTexts(cfg: SocialSettings, limit = 25) {
  const r = await graph<{ data: { message?: string }[] }>(cfg, `${cfg.pageId}/posts`, {
    query: { fields: 'message', limit: String(limit) },
  })
  return r.data.map((p) => p.message?.trim()).filter((m): m is string => Boolean(m))
}
