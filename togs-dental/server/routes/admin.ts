import { Hono } from 'hono'
import { z } from 'zod'
import { all, one, run } from '../db.ts'
import { audit } from '../lib/audit.ts'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { aiConfigured, env } from '../lib/env.ts'
import { APPT_SELECT } from '../lib/queries.ts'
import { clinicSchema, getSettings, saveSettings, smsSchema } from '../lib/settings.ts'
import { addDays, isYmd, nowMinute, today } from '../lib/time.ts'
import { me, requireAuth } from '../auth.ts'
import { bad, body, intParam, notFound, phoneSchema, type AppEnv } from '../http.ts'
import { hasDoctors } from '../services/booking.ts'
import { sendSms, smsStats } from '../services/sms.ts'

export const adminRoutes = new Hono<AppEnv>()
adminRoutes.use('*', requireAuth())

/* ---------------- Хянах самбар ---------------- */
adminRoutes.get('/dashboard', (c) => {
  const u = me(c)
  const date = isYmd(c.req.query('date')) ? c.req.query('date')! : today()
  const ownOnly = u.role === 'doctor'
  const docFilter = ownOnly ? ' AND (a.doctor_id = ? OR a.doctor_id IS NULL)' : ''
  const docParams = ownOnly ? [u.id] : []
  const todayList = all(`${APPT_SELECT} WHERE a.date = ?${docFilter} AND a.status != 'cancelled' ORDER BY a.start_min`, date, ...docParams)
  const pending = all(
    `${APPT_SELECT} WHERE a.status = 'pending' AND a.date >= ?${docFilter} ORDER BY a.date, a.start_min LIMIT 20`,
    today(),
    ...docParams,
  )
  const payDoc = ownOnly ? ' AND doctor_id = ?' : ''
  const revenueToday = one<{ s: number }>(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE paid_at = ?${payDoc}`, date, ...docParams)!.s
  const monthStart = `${date.slice(0, 7)}-01`
  const revenueMonth = one<{ s: number }>(
    `SELECT COALESCE(SUM(amount),0) s FROM payments WHERE paid_at BETWEEN ? AND ?${payDoc}`,
    monthStart,
    date,
    ...docParams,
  )!.s
  const tomorrowCount = one<{ n: number }>(
    `SELECT COUNT(*) n FROM appointments a WHERE a.date = ? AND a.status IN ('pending','confirmed')${docFilter}`,
    addDays(date, 1),
    ...docParams,
  )!.n
  const marketing = {
    drafts: one<{ n: number }>(`SELECT COUNT(*) n FROM posts WHERE status = 'draft'`)!.n,
    failed: one<{ n: number }>(`SELECT COUNT(*) n FROM posts WHERE status = 'failed'`)!.n,
    next: one(`SELECT id, scheduled_at, kind, topic FROM posts WHERE status = 'approved' AND scheduled_at >= ? ORDER BY scheduled_at LIMIT 1`, nowMinute()),
  }
  const social = getSettings('social')
  const sms = getSettings('sms')
  const warnings: string[] = []
  if (u.role === 'admin') {
    if (!hasDoctors()) warnings.push('Эмч бүртгэгдээгүй байна. Тохиргоо → Ажилтнууд хэсэгт эмч нэмнэ үү.')
    if (!sms.enabled) warnings.push('SMS сануулга идэвхгүй байна (Тохиргоо → SMS).')
    if (!aiConfigured()) warnings.push('AI маркетинг ажиллахын тулд серверт ANTHROPIC_API_KEY тохируулна уу.')
    if (!social.pageId || !social.pageToken) warnings.push('Facebook хуудас холбогдоогүй байна (AI маркетинг → Холболт).')
    if (marketing.failed) warnings.push(`${marketing.failed} пост нийтлэгдэж чадсангүй. AI маркетинг хэсгийг шалгана уу.`)
  }
  return c.json({
    date,
    today: todayList,
    pending,
    stats: {
      total: todayList.length,
      arrived: todayList.filter((a) => (a as { status: string }).status === 'arrived').length,
      completed: todayList.filter((a) => (a as { status: string }).status === 'completed').length,
      pending: pending.length,
      tomorrow: tomorrowCount,
      revenueToday: u.role === 'reception' || u.role === 'admin' || ownOnly ? revenueToday : 0,
      revenueMonth,
    },
    marketing,
    sms: { enabled: sms.enabled, ...smsStats() },
    warnings,
  })
})

/* ---------------- Тайлан ---------------- */
function reportRange(c: { req: { query: (k: string) => string | undefined } }) {
  const from = c.req.query('from') ?? `${today().slice(0, 7)}-01`
  const to = c.req.query('to') ?? today()
  if (!isYmd(from) || !isYmd(to) || to < from) throw bad('Огнооны хүрээ буруу')
  return { from, to }
}

adminRoutes.get('/reports', (c) => {
  const u = me(c)
  const { from, to } = reportRange(c)
  let doctor = Number(c.req.query('doctor')) || 0
  if (u.role === 'doctor') doctor = u.id
  const pd = doctor ? ' AND y.doctor_id = ?' : ''
  const vd = doctor ? ' AND v.doctor_id = ?' : ''
  const ad = doctor ? ' AND a.doctor_id = ?' : ''
  const dp = doctor ? [doctor] : []

  const collected = one<{ s: number; n: number }>(
    `SELECT COALESCE(SUM(amount),0) s, COUNT(*) n FROM payments y WHERE paid_at BETWEEN ? AND ?${pd}`,
    from,
    to,
    ...dp,
  )!
  const billed = one<{ s: number; n: number; d: number }>(
    `SELECT COALESCE(SUM(total - discount),0) s, COUNT(*) n, COALESCE(SUM(discount),0) d FROM visits v WHERE date BETWEEN ? AND ?${vd}`,
    from,
    to,
    ...dp,
  )!
  const byMethod = all(
    `SELECT method, SUM(amount) amount, COUNT(*) n FROM payments y WHERE paid_at BETWEEN ? AND ?${pd} GROUP BY method ORDER BY amount DESC`,
    from,
    to,
    ...dp,
  )
  const byDoctor = all(
    `SELECT u.id, COALESCE(u.name, 'Эмчгүй') name, u.color,
            (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.doctor_id IS u.id AND paid_at BETWEEN ? AND ?) collected,
            (SELECT COALESCE(SUM(total - discount),0) FROM visits v WHERE v.doctor_id IS u.id AND date BETWEEN ? AND ?) billed,
            (SELECT COUNT(*) FROM visits v WHERE v.doctor_id IS u.id AND date BETWEEN ? AND ?) visits,
            (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id IS u.id AND date BETWEEN ? AND ? AND status = 'completed') completed
       FROM users u WHERE (u.is_doctor = 1 OR u.role = 'doctor')${doctor ? ' AND u.id = ?' : ''}
      ORDER BY collected DESC`,
    from,
    to,
    from,
    to,
    from,
    to,
    from,
    to,
    ...dp,
  )
  const byService = all(
    `SELECT i.name, SUM(i.qty) qty, SUM(i.qty * i.price) amount FROM visit_items i JOIN visits v ON v.id = i.visit_id
      WHERE v.date BETWEEN ? AND ?${vd} GROUP BY i.name ORDER BY amount DESC LIMIT 30`,
    from,
    to,
    ...dp,
  )
  const daily = all(
    `SELECT paid_at day, SUM(amount) amount FROM payments y WHERE paid_at BETWEEN ? AND ?${pd} GROUP BY paid_at ORDER BY paid_at`,
    from,
    to,
    ...dp,
  )
  const appointments = all(
    `SELECT status, COUNT(*) n FROM appointments a WHERE date BETWEEN ? AND ?${ad} GROUP BY status`,
    from,
    to,
    ...dp,
  )
  const online = one<{ n: number; social: number }>(
    `SELECT COUNT(*) n, SUM(utm LIKE '%post-%' OR utm LIKE 'facebook%' OR utm LIKE 'instagram%') social
       FROM appointments a WHERE source = 'online' AND date(created_at) BETWEEN ? AND ?${ad}`,
    from,
    to,
    ...dp,
  )!
  const newPatients = one<{ n: number }>(`SELECT COUNT(*) n FROM patients WHERE date(created_at) BETWEEN ? AND ?`, from, to)!.n
  const receivables =
    u.role === 'doctor'
      ? null
      : {
          total: one<{ s: number }>(
            `SELECT COALESCE(SUM(b),0) s FROM (
               SELECT (SELECT COALESCE(SUM(total - discount),0) FROM visits v WHERE v.patient_id = p.id)
                    - (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.patient_id = p.id) b
                 FROM patients p) WHERE b > 0`,
          )!.s,
          top: all(
            `SELECT * FROM (
               SELECT p.id, p.card_no, p.last_name, p.first_name, p.phone,
                      (SELECT COALESCE(SUM(total - discount),0) FROM visits v WHERE v.patient_id = p.id)
                    - (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.patient_id = p.id) balance
                 FROM patients p) WHERE balance > 0 ORDER BY balance DESC LIMIT 10`,
          ),
        }
  return c.json({ from, to, doctor, collected, billed, byMethod, byDoctor, byService, daily, appointments, online, newPatients, receivables })
})

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}
adminRoutes.get('/reports/export', requireAuth('admin', 'reception'), (c) => {
  const { from, to } = reportRange(c)
  const type = c.req.query('type') === 'visits' ? 'visits' : 'payments'
  const rows =
    type === 'payments'
      ? all<Record<string, unknown>>(
          `SELECT y.paid_at "Огноо", p.card_no "Карт", p.last_name "Овог", p.first_name "Нэр", y.amount "Дүн", y.method "Төрөл", u.name "Эмч", y.note "Тэмдэглэл"
             FROM payments y JOIN patients p ON p.id = y.patient_id LEFT JOIN users u ON u.id = y.doctor_id
            WHERE y.paid_at BETWEEN ? AND ? ORDER BY y.paid_at, y.id`,
          from,
          to,
        )
      : all<Record<string, unknown>>(
          `SELECT v.date "Огноо", p.card_no "Карт", p.last_name "Овог", p.first_name "Нэр", u.name "Эмч", v.diagnosis "Онош", v.treatment "Эмчилгээ", v.teeth "Шүд", v.total "Нийт", v.discount "Хөнгөлөлт"
             FROM visits v JOIN patients p ON p.id = v.patient_id LEFT JOIN users u ON u.id = v.doctor_id
            WHERE v.date BETWEEN ? AND ? ORDER BY v.date, v.id`,
          from,
          to,
        )
  const headers = rows[0] ? Object.keys(rows[0]) : ['Огноо']
  const csv = '﻿' + [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\r\n')
  audit(me(c).id, 'export', type, null, `${from}..${to}`)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="togs-${type}-${from}-${to}.csv"`)
  return c.body(csv)
})

/* ---------------- Үйлчилгээ, үнэ ---------------- */
const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).default(''),
  icon: z.enum(['tooth', 'spark', 'bridge', 'link', 'root', 'baby', 'steth', 'smile', 'shield', 'xray', 'crown', 'brace']).default('tooth'),
  price: z.number().int().min(0).max(100_000_000).default(0),
  price_note: z.string().trim().max(120).default(''),
  duration: z.number().int().min(10).max(480).default(30),
  tag: z.string().trim().max(30).default(''),
  show_on_site: z.boolean().default(true),
  online_booking: z.boolean().default(true),
  sort: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
})

adminRoutes.get('/services', (c) => c.json({ items: all('SELECT * FROM services ORDER BY active DESC, sort, id') }))

adminRoutes.post('/services', requireAuth('admin'), async (c) => {
  const b = await body(c, serviceSchema)
  const { id } = run(
    `INSERT INTO services (name, description, icon, price, price_note, duration, tag, show_on_site, online_booking, sort, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    b.name,
    b.description,
    b.icon,
    b.price,
    b.price_note,
    b.duration,
    b.tag,
    b.show_on_site,
    b.online_booking,
    b.sort,
    b.active,
  )
  audit(me(c).id, 'create', 'service', id, b.name)
  return c.json({ id }, 201)
})

adminRoutes.patch('/services/:id', requireAuth('admin'), async (c) => {
  const id = intParam(c.req.param('id'))
  const b = await body(c, serviceSchema.partial())
  if (!one('SELECT 1 FROM services WHERE id = ?', id)) throw notFound()
  const entries = Object.entries(b)
  if (entries.length)
    run(`UPDATE services SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, ...entries.map(([, v]) => v as string | number | boolean), id)
  audit(me(c).id, 'update', 'service', id)
  return c.json({ ok: true })
})

/* ---------------- Тохиргоо ---------------- */
adminRoutes.get('/settings/clinic', (c) => c.json(getSettings('clinic')))
adminRoutes.put('/settings/clinic', requireAuth('admin'), async (c) => {
  const v = saveSettings('clinic', await body(c, clinicSchema))
  // Facebook-т хуваалцах зургийг шинэ мэдээллээр дахин бүтээнэ
  rmSync(resolve(env.dataDir, 'og.jpg'), { force: true })
  audit(me(c).id, 'update', 'settings', null, 'clinic')
  return c.json(v)
})

adminRoutes.get('/settings/sms', requireAuth('admin'), (c) => c.json(getSettings('sms')))
adminRoutes.put('/settings/sms', requireAuth('admin'), async (c) => {
  const v = saveSettings('sms', await body(c, smsSchema))
  audit(me(c).id, 'update', 'settings', null, 'sms')
  return c.json(v)
})
adminRoutes.post('/settings/sms/test', requireAuth('admin'), async (c) => {
  const b = await body(c, z.object({ phone: phoneSchema, config: smsSchema.optional() }))
  const clinic = getSettings('clinic')
  const cfg = b.config ? { ...b.config, enabled: true } : undefined
  const r = await sendSms(b.phone, `${clinic.shortName || clinic.name}: SMS туршилт амжилттай.`, 'test', {}, cfg)
  return c.json(r)
})

adminRoutes.get('/sms/log', requireAuth('admin', 'reception'), (c) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const items = all('SELECT * FROM sms_log ORDER BY id DESC LIMIT 50 OFFSET ?', (page - 1) * 50)
  const total = one<{ n: number }>('SELECT COUNT(*) n FROM sms_log')!.n
  return c.json({ items, total, page })
})

adminRoutes.post('/sms/send', requireAuth('admin', 'reception'), async (c) => {
  const b = await body(
    c,
    z.object({ phone: phoneSchema, message: z.string().trim().min(2).max(480), patient_id: z.number().int().positive().nullable().optional() }),
  )
  const r = await sendSms(b.phone, b.message, 'manual', { patient_id: b.patient_id ?? null })
  audit(me(c).id, 'sms', 'patient', b.patient_id ?? null, b.phone)
  return c.json(r)
})

adminRoutes.get('/audit', requireAuth('admin'), (c) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const items = all(
    `SELECT l.*, u.name AS user_name FROM audit_log l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 100 OFFSET ?`,
    (page - 1) * 100,
  )
  return c.json({ items, page })
})
