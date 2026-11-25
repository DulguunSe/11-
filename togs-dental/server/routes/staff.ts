import { Hono } from 'hono'
import { z } from 'zod'
import { all, one, run } from '../db.ts'
import { hashPassword } from '../lib/crypto.ts'
import { audit } from '../lib/audit.ts'
import { nowStamp } from '../lib/time.ts'
import { destroyUserSessions, listDoctors, me, requireAuth } from '../auth.ts'
import { bad, body, intParam, notFound, type AppEnv } from '../http.ts'
import { passwordSchema } from './auth.ts'

export const staffRoutes = new Hono<AppEnv>()

/** Эмч нарын жагсаалт (бүх ажилтанд) */
staffRoutes.get('/doctors', requireAuth(), (c) => c.json({ items: listDoctors() }))

const fields = {
  name: z.string().trim().min(2).max(80),
  role: z.enum(['admin', 'doctor', 'reception']),
  is_doctor: z.boolean(),
  phone: z.string().trim().max(40),
  specialty: z.string().trim().max(120),
  bio: z.string().trim().max(600),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  online_booking: z.boolean(),
  show_on_site: z.boolean(),
  active: z.boolean(),
}

staffRoutes.get('/staff', requireAuth('admin'), (c) =>
  c.json({
    items: all(
      `SELECT id, username, name, role, is_doctor, phone, specialty, bio, color, online_booking, show_on_site, active, must_change_password, created_at
         FROM users ORDER BY active DESC, role, name`,
    ),
  }),
)

staffRoutes.post('/staff', requireAuth('admin'), async (c) => {
  const b = await body(
    c,
    z.object({
      username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/, 'Зөвхөн латин үсэг, тоо'),
      password: passwordSchema,
      ...fields,
      active: fields.active.default(true),
    }),
  )
  if (one('SELECT 1 FROM users WHERE username = ?', b.username)) throw bad('Ийм нэвтрэх нэр бүртгэлтэй байна')
  const isDoctor = b.role === 'doctor' || b.is_doctor
  const { id } = run(
    `INSERT INTO users (username, name, role, is_doctor, password_hash, phone, specialty, bio, color, online_booking, show_on_site, active, must_change_password, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
    b.username,
    b.name,
    b.role,
    isDoctor,
    hashPassword(b.password),
    b.phone,
    b.specialty,
    b.bio,
    b.color,
    b.online_booking,
    b.show_on_site,
    b.active,
    nowStamp(),
  )
  audit(me(c).id, 'create', 'user', id, `${b.username} (${b.role})`)
  return c.json({ id }, 201)
})

staffRoutes.patch('/staff/:id', requireAuth('admin'), async (c) => {
  const id = intParam(c.req.param('id'))
  const u = me(c)
  const cur = one<{ role: string; is_doctor: number }>('SELECT role, is_doctor FROM users WHERE id = ?', id)
  if (!cur) throw notFound()
  const b = await body(c, z.object(fields).partial())
  if (id === u.id && (b.role && b.role !== 'admin')) throw bad('Өөрийн админ эрхийг хасах боломжгүй')
  if (id === u.id && b.active === false) throw bad('Өөрийгөө идэвхгүй болгох боломжгүй')
  const sets: string[] = []
  const vals: (string | number | boolean)[] = []
  for (const [k, v] of Object.entries(b)) {
    sets.push(`${k} = ?`)
    vals.push(v as string | number | boolean)
  }
  const role = b.role ?? cur.role
  if (role === 'doctor') sets.push('is_doctor = 1')
  if (!sets.length) return c.json({ ok: true })
  run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...vals, id)
  if (b.active === false) destroyUserSessions(id)
  audit(u.id, 'update', 'user', id, Object.keys(b).join(','))
  return c.json({ ok: true })
})

staffRoutes.post('/staff/:id/password', requireAuth('admin'), async (c) => {
  const id = intParam(c.req.param('id'))
  const { password } = await body(c, z.object({ password: passwordSchema }))
  const r = run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', hashPassword(password), id)
  if (!r.changes) throw notFound()
  destroyUserSessions(id)
  audit(me(c).id, 'password_reset', 'user', id)
  return c.json({ ok: true })
})
