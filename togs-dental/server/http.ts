import type { Context } from 'hono'
import { z } from 'zod'

export type Role = 'admin' | 'doctor' | 'reception'
export type SessionUser = {
  id: number
  username: string
  name: string
  role: Role
  is_doctor: number
  must_change_password: number
}
export type AppEnv = { Variables: { user: SessionUser | null } }

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export const bad = (msg: string) => new HttpError(400, msg)
export const notFound = (msg = 'Олдсонгүй') => new HttpError(404, msg)
export const forbidden = (msg = 'Танд энэ үйлдлийг хийх эрх байхгүй') => new HttpError(403, msg)

/** JSON биеийг zod схемээр шалгана */
export async function body<S extends z.ZodType>(c: Context, schema: S): Promise<z.infer<S>> {
  let data: unknown
  try {
    data = await c.req.json()
  } catch {
    throw bad('JSON өгөгдөл буруу байна')
  }
  const r = schema.safeParse(data)
  if (!r.success) throw bad(zodMessage(r.error))
  return r.data
}

export function zodMessage(err: z.ZodError) {
  const issue = err.issues[0]
  const path = issue?.path?.join('.') || ''
  return `Мэдээлэл буруу байна${path ? ` (${path})` : ''}: ${issue?.message ?? ''}`.trim()
}

export const intParam = (v: string | undefined) => {
  const n = Number(v)
  if (!Number.isInteger(n) || n <= 0) throw bad('ID буруу байна')
  return n
}

/** Энгийн санах ойн хурд хязгаарлагч */
const buckets = new Map<string, { count: number; reset: number }>()
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return
  }
  b.count++
  if (b.count > max) throw new HttpError(429, 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.')
}
export function clearRateLimit(key: string) {
  buckets.delete(key)
}
setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k)
}, 10 * 60_000).unref()

export function clientIp(c: Context) {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    (c.env as { incoming?: { socket?: { remoteAddress?: string } } })?.incoming?.socket?.remoteAddress ||
    'unknown'
  )
}

/** Монгол утасны дугаар: 8 орон (+976 байж болно) */
export function normalizePhone(v: string) {
  let d = v.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('976')) d = d.slice(3)
  return d
}
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((d) => /^\d{8}$/.test(d), { message: 'Утасны дугаар 8 оронтой байна' })
