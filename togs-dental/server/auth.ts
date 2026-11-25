import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { all, one, run } from './db.ts'
import { env } from './lib/env.ts'
import { randomToken, sha256 } from './lib/crypto.ts'
import { HttpError, clientIp, type AppEnv, type Role, type SessionUser } from './http.ts'

export const COOKIE = 'togs_session'
const SESSION_DAYS = 30

export function createSession(c: Context, userId: number) {
  const token = randomToken()
  const now = Date.now()
  run(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
    sha256(token),
    userId,
    now + SESSION_DAYS * 86_400_000,
    now,
    clientIp(c),
    (c.req.header('user-agent') ?? '').slice(0, 200),
  )
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  })
}

export function destroySession(c: Context) {
  const token = getCookie(c, COOKIE)
  if (token) run('DELETE FROM sessions WHERE token_hash = ?', sha256(token))
  deleteCookie(c, COOKIE, { path: '/' })
}

/** Хэрэглэгчийн бүх сессийг устгах (нууц үг солиход) */
export function destroyUserSessions(userId: number, exceptToken?: string) {
  if (exceptToken) run('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?', userId, sha256(exceptToken))
  else run('DELETE FROM sessions WHERE user_id = ?', userId)
}

/** Cookie-оос хэрэглэгчийг уншина (заавал биш) */
export const loadUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set('user', null)
  const token = getCookie(c, COOKIE)
  if (token) {
    const row = one<SessionUser & { expires_at: number }>(
      `SELECT u.id, u.username, u.name, u.role, u.is_doctor, u.must_change_password, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND u.active = 1`,
      sha256(token),
    )
    if (row && row.expires_at > Date.now()) {
      const { expires_at: _e, ...user } = row
      c.set('user', user)
    }
  }
  await next()
}

/** Нэвтэрсэн байх шаардлага (+ эрхийн шалгалт) */
export const requireAuth =
  (...roles: Role[]): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const user = c.get('user')
    if (!user) throw new HttpError(401, 'Нэвтэрнэ үү')
    if (roles.length && !roles.includes(user.role)) throw new HttpError(403, 'Танд энэ хэсэгт хандах эрх байхгүй')
    await next()
  }

export const me = (c: Context<AppEnv>) => {
  const u = c.get('user')
  if (!u) throw new HttpError(401, 'Нэвтэрнэ үү')
  return u
}

/**
 * CSRF хамгаалалт: өөрчлөлт хийх бүх API хүсэлт "x-togs" толгойтой байх ёстой.
 * Өөр сайтаас браузер ийм толгой CORS-гүйгээр илгээж чадахгүй.
 */
export const csrfGuard: MiddlewareHandler = async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && c.req.header('x-togs') !== '1') {
    throw new HttpError(403, 'Хүсэлт баталгаажсангүй')
  }
  await next()
}

export function cleanupSessions() {
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now())
}

export function listDoctors() {
  return all<{ id: number; name: string; specialty: string; color: string; online_booking: number }>(
    `SELECT id, name, specialty, color, online_booking FROM users
      WHERE active = 1 AND (is_doctor = 1 OR role = 'doctor') ORDER BY name`,
  )
}
