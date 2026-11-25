import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'
import { one, run } from '../db.ts'
import { hashPassword, verifyPassword } from '../lib/crypto.ts'
import { audit } from '../lib/audit.ts'
import { COOKIE, createSession, destroySession, destroyUserSessions, me, requireAuth } from '../auth.ts'
import { HttpError, bad, body, clearRateLimit, clientIp, rateLimit, type AppEnv } from '../http.ts'

export const authRoutes = new Hono<AppEnv>()

const passwordSchema = z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт').max(200)

authRoutes.post('/login', async (c) => {
  const { username, password } = await body(c, z.object({ username: z.string().trim().min(1).max(60), password: z.string().min(1).max(200) }))
  const key = `login:${clientIp(c)}:${username.toLowerCase()}`
  rateLimit(key, 8, 15 * 60_000)
  const user = one<{ id: number; password_hash: string; active: number }>(
    'SELECT id, password_hash, active FROM users WHERE username = ?',
    username,
  )
  if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'Нэвтрэх нэр эсвэл нууц үг буруу байна')
  }
  clearRateLimit(key)
  createSession(c, user.id)
  audit(user.id, 'login', 'user', user.id, clientIp(c))
  return c.json({ user: publicUser(user.id) })
})

authRoutes.post('/logout', (c) => {
  destroySession(c)
  return c.json({ ok: true })
})

authRoutes.get('/me', (c) => {
  const u = c.get('user')
  return c.json({ user: u ? publicUser(u.id) : null })
})

authRoutes.post('/password', requireAuth(), async (c) => {
  const u = me(c)
  const { current, next } = await body(c, z.object({ current: z.string().min(1), next: passwordSchema }))
  const row = one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', u.id)!
  if (!verifyPassword(current, row.password_hash)) throw bad('Одоогийн нууц үг буруу байна')
  if (current === next) throw bad('Шинэ нууц үг хуучнаасаа өөр байх ёстой')
  run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', hashPassword(next), u.id)
  destroyUserSessions(u.id, getCookie(c, COOKIE))
  audit(u.id, 'password_change', 'user', u.id)
  return c.json({ ok: true })
})

export function publicUser(id: number) {
  return one<{
    id: number
    username: string
    name: string
    role: string
    is_doctor: number
    must_change_password: number
  }>('SELECT id, username, name, role, is_doctor, must_change_password FROM users WHERE id = ?', id)
}

export { passwordSchema }
