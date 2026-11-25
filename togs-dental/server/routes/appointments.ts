import { Hono } from 'hono'
import { z } from 'zod'
import { all, one, run, tx } from '../db.ts'
import { audit } from '../lib/audit.ts'
import { getSettings } from '../lib/settings.ts'
import { addDays, fromMin, isHm, isYmd, nowStamp, toMin, today } from '../lib/time.ts'
import { me, requireAuth } from '../auth.ts'
import { HttpError, bad, body, forbidden, intParam, notFound, phoneSchema, type AppEnv } from '../http.ts'
import { ACTIVE_STATUSES, createAppointment, findConflict, onlineSlots, rescheduleAppointment, type Appointment } from '../services/booking.ts'
import { createPatient, patientInput } from './patients.ts'
import { APPT_SELECT } from '../lib/queries.ts'

export const appointmentRoutes = new Hono<AppEnv>()
appointmentRoutes.use('*', requireAuth())

appointmentRoutes.get('/', (c) => {
  const from = c.req.query('from') ?? today()
  const to = c.req.query('to') ?? from
  if (!isYmd(from) || !isYmd(to) || to < from) throw bad('Огнооны хүрээ буруу')
  if (addDays(from, 62) < to) throw bad('Хэт урт хугацаа (62 хоногоос ихгүй)')
  const where = ['a.date BETWEEN ? AND ?']
  const params: (string | number)[] = [from, to]
  const doctor = Number(c.req.query('doctor')) || 0
  if (doctor) {
    where.push('a.doctor_id = ?')
    params.push(doctor)
  }
  const status = c.req.query('status')
  if (status === 'active') where.push(`a.status IN ('pending','confirmed','arrived','completed')`)
  else if (status) {
    where.push('a.status = ?')
    params.push(status)
  }
  if (c.req.query('source')) {
    where.push('a.source = ?')
    params.push(c.req.query('source')!)
  }
  const items = all(`${APPT_SELECT} WHERE ${where.join(' AND ')} ORDER BY a.date, a.start_min, a.id`, ...params)
  return c.json({ items })
})

/** Онлайн захиалга (баталгаажуулалт хүлээж буй) */
appointmentRoutes.get('/pending', (c) => {
  const items = all(
    `${APPT_SELECT} WHERE a.status = 'pending' AND a.date >= ? ORDER BY a.date, a.start_min`,
    today(),
  )
  return c.json({ items })
})

/** Ажилтанд зориулсан сул цагийн тусламж (ажлын цагаар) */
appointmentRoutes.get('/slots', (c) => {
  const date = c.req.query('date') ?? ''
  if (!isYmd(date)) throw bad('Огноо буруу')
  const doctor = Number(c.req.query('doctor')) || null
  const duration = Math.min(480, Math.max(10, Number(c.req.query('duration')) || getSettings('clinic').slotMinutes))
  return c.json({ date, slots: onlineSlots(date, doctor, duration, new Date(0)) })
})

const createSchema = z.object({
  patient_id: z.number().int().positive().nullable().optional(),
  contact_name: z.string().trim().max(80).default(''),
  contact_phone: z.union([phoneSchema, z.literal('')]).default(''),
  doctor_id: z.number().int().positive().nullable(),
  service_id: z.number().int().positive().nullable().optional(),
  service_name: z.string().trim().max(120).default(''),
  date: z.string().refine(isYmd, 'Огноо буруу'),
  start_time: z.string().refine(isHm, 'Цаг буруу'),
  duration: z.number().int().min(10).max(480),
  status: z.enum(['pending', 'confirmed', 'arrived']).default('confirmed'),
  source: z.enum(['phone', 'walk_in', 'staff']).default('phone'),
  teeth: z.string().max(200).default(''),
  staff_note: z.string().trim().max(1000).default(''),
})

appointmentRoutes.post('/', async (c) => {
  const u = me(c)
  const b = await body(c, createSchema)
  if (!b.patient_id && !b.contact_name) throw bad('Үйлчлүүлэгч сонгох эсвэл нэр бичнэ үү')
  if (toMin(b.start_time) + b.duration > 24 * 60) throw bad('Цаг буруу')
  let serviceName = b.service_name
  if (b.service_id) {
    const s = one<{ name: string }>('SELECT name FROM services WHERE id = ?', b.service_id)
    if (!s) throw bad('Үйлчилгээ олдсонгүй')
    serviceName ||= s.name
  }
  let contactName = b.contact_name
  let contactPhone = b.contact_phone
  if (b.patient_id) {
    const p = one<{ first_name: string; last_name: string; phone: string }>('SELECT * FROM patients WHERE id = ?', b.patient_id)
    if (!p) throw bad('Үйлчлүүлэгч олдсонгүй')
    contactName ||= `${p.last_name ? p.last_name.charAt(0) + '. ' : ''}${p.first_name}`
    contactPhone ||= p.phone
  }
  if (b.doctor_id && !one('SELECT 1 FROM users WHERE id = ? AND active = 1', b.doctor_id)) throw bad('Эмч олдсонгүй')
  const appt = createAppointment({
    ...b,
    service_name: serviceName || 'Үзлэг',
    contact_name: contactName,
    contact_phone: contactPhone,
    created_by: u.id,
  })
  audit(u.id, 'create', 'appointment', appt.id, `${appt.date} ${appt.start_time}`)
  return c.json({ item: one(`${APPT_SELECT} WHERE a.id = ?`, appt.id) }, 201)
})

const patchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show']).optional(),
  staff_note: z.string().trim().max(1000).optional(),
  service_id: z.number().int().positive().nullable().optional(),
  service_name: z.string().trim().max(120).optional(),
  teeth: z.string().max(200).optional(),
  contact_name: z.string().trim().max(80).optional(),
  contact_phone: z.union([phoneSchema, z.literal('')]).optional(),
  date: z.string().refine(isYmd, 'Огноо буруу').optional(),
  start_time: z.string().refine(isHm, 'Цаг буруу').optional(),
  duration: z.number().int().min(10).max(480).optional(),
  doctor_id: z.number().int().positive().nullable().optional(),
})

appointmentRoutes.patch('/:id', async (c) => {
  const u = me(c)
  const id = intParam(c.req.param('id'))
  const cur = one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)
  if (!cur) throw notFound('Цаг олдсонгүй')
  if (u.role === 'doctor' && cur.doctor_id && cur.doctor_id !== u.id) throw forbidden('Зөвхөн өөрийн цагийг өөрчилнө')
  const b = await body(c, patchSchema)

  tx(() => {
    if (b.date !== undefined || b.start_time !== undefined || b.duration !== undefined || b.doctor_id !== undefined) {
      rescheduleAppointment(id, { date: b.date, start_time: b.start_time, duration: b.duration, doctor_id: b.doctor_id })
    }
    if (b.status && b.status !== cur.status) {
      const wasActive = (ACTIVE_STATUSES as readonly string[]).includes(cur.status)
      const willBeActive = (ACTIVE_STATUSES as readonly string[]).includes(b.status)
      if (!wasActive && willBeActive) {
        const now = one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)!
        const conflict = findConflict(now.doctor_id, now.date, now.start_min, now.end_min, id)
        if (conflict) throw new HttpError(409, `Энэ цаг давхцаж байна (${conflict.start_time}–${fromMin(conflict.end_min)})`)
      }
    }
    const sets: string[] = []
    const vals: (string | number | null)[] = []
    for (const k of ['status', 'staff_note', 'service_id', 'service_name', 'teeth', 'contact_name', 'contact_phone'] as const) {
      if (b[k] !== undefined) {
        sets.push(`${k} = ?`)
        vals.push(b[k] as string | number | null)
      }
    }
    if (b.service_id && b.service_name === undefined) {
      const s = one<{ name: string }>('SELECT name FROM services WHERE id = ?', b.service_id)
      if (s) {
        sets.push('service_name = ?')
        vals.push(s.name)
      }
    }
    if (sets.length) run(`UPDATE appointments SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, ...vals, nowStamp(), id)
  })
  audit(u.id, 'update', 'appointment', id, Object.keys(b).join(','))
  return c.json({ item: one(`${APPT_SELECT} WHERE a.id = ?`, id) })
})

/** Онлайн захиалгыг үйлчлүүлэгчийн картай холбох (байгаа эсвэл шинээр) */
appointmentRoutes.post('/:id/link', async (c) => {
  const u = me(c)
  const id = intParam(c.req.param('id'))
  const cur = one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)
  if (!cur) throw notFound('Цаг олдсонгүй')
  const b = await body(
    c,
    z.object({ patient_id: z.number().int().positive().optional(), create: patientInput.partial({ first_name: true }).optional() }),
  )
  let patientId = b.patient_id
  if (!patientId) {
    if (!b.create?.first_name) throw bad('Үйлчлүүлэгч сонгох эсвэл шинээр бүртгэнэ үү')
    patientId = createPatient({ ...patientInput.parse({ ...b.create, source: cur.source === 'online' ? 'online' : 'phone' }) }, u.id)
  } else if (!one('SELECT 1 FROM patients WHERE id = ?', patientId)) throw bad('Үйлчлүүлэгч олдсонгүй')
  run('UPDATE appointments SET patient_id = ?, updated_at = ? WHERE id = ?', patientId, nowStamp(), id)
  audit(u.id, 'link', 'appointment', id, `patient ${patientId}`)
  return c.json({ item: one(`${APPT_SELECT} WHERE a.id = ?`, id) })
})

/** Ижил утасны дугаартай үйлчлүүлэгчид (холбоход санал болгох) */
appointmentRoutes.get('/:id/matches', (c) => {
  const id = intParam(c.req.param('id'))
  const cur = one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)
  if (!cur) throw notFound('Цаг олдсонгүй')
  const items = cur.contact_phone
    ? all('SELECT id, card_no, last_name, first_name, phone, birth_date FROM patients WHERE phone = ? OR phone2 = ? LIMIT 10', cur.contact_phone, cur.contact_phone)
    : []
  return c.json({ items })
})
