import { Hono } from 'hono'
import { z } from 'zod'
import { all, one, run } from '../db.ts'
import { getSettings } from '../lib/settings.ts'
import { addDays, isHm, isYmd, nowStamp, toMin, today } from '../lib/time.ts'
import { HttpError, bad, body, clientIp, notFound, phoneSchema, rateLimit, type AppEnv } from '../http.ts'
import { createAppointment, freeDoctors, hasDoctors, onlineSlots, type Appointment } from '../services/booking.ts'
import { notifyBookingReceived } from '../services/sms.ts'

export const publicRoutes = new Hono<AppEnv>()

type ServiceRow = {
  id: number
  name: string
  description: string
  icon: string
  price: number
  price_note: string
  duration: number
  tag: string
  show_on_site: number
  online_booking: number
}

const siteServices = () =>
  all<ServiceRow>(
    `SELECT id, name, description, icon, price, price_note, duration, tag, show_on_site, online_booking
       FROM services WHERE active = 1 ORDER BY sort, id`,
  )

/** Вэбсайтад хэрэгтэй бүх мэдээлэл */
publicRoutes.get('/site', (c) => {
  const clinic = getSettings('clinic')
  const doctors = all<{ id: number; name: string; specialty: string; bio: string; online_booking: number }>(
    `SELECT id, name, specialty, bio, online_booking FROM users
      WHERE active = 1 AND show_on_site = 1 AND (is_doctor = 1 OR role = 'doctor') ORDER BY id`,
  )
  c.header('Cache-Control', 'no-store')
  return c.json({
    clinic,
    services: siteServices(),
    doctors,
    today: today(),
  })
})

/** Сул цагууд */
publicRoutes.get('/slots', (c) => {
  const date = c.req.query('date') ?? ''
  if (!isYmd(date)) throw bad('Огноо буруу')
  const clinic = getSettings('clinic')
  if (date < today() || date > addDays(today(), clinic.daysAhead)) return c.json({ date, slots: [] })
  const service = one<ServiceRow>('SELECT * FROM services WHERE id = ? AND active = 1', Number(c.req.query('service')) || 0)
  const doctorId = Number(c.req.query('doctor')) || null
  c.header('Cache-Control', 'no-store')
  return c.json({ date, slots: onlineSlots(date, doctorId, service?.duration ?? clinic.slotMinutes) })
})

const bookingSchema = z.object({
  service_id: z.number().int().positive(),
  doctor_id: z.number().int().positive().nullable().optional(),
  date: z.string().refine(isYmd, 'Огноо буруу'),
  time: z.string().refine(isHm, 'Цаг буруу'),
  teeth: z.array(z.number().int().min(11).max(85)).max(32).default([]),
  name: z.string().trim().min(2, 'Нэрээ бичнэ үү').max(80),
  phone: phoneSchema,
  note: z.string().trim().max(500).default(''),
  utm: z.string().trim().max(120).default(''),
  website: z.string().max(0).optional(), // honeypot: хүн бөглөхгүй
})

publicRoutes.post('/bookings', async (c) => {
  rateLimit(`book:${clientIp(c)}`, 8, 60 * 60_000)
  const b = await body(c, bookingSchema)
  const clinic = getSettings('clinic')
  if (!clinic.bookingEnabled) throw new HttpError(403, 'Онлайн захиалга түр хаалттай байна. Утсаар холбогдоно уу.')
  if (b.date < today() || b.date > addDays(today(), clinic.daysAhead)) throw bad('Энэ өдөрт захиалга авахгүй')
  const service = one<ServiceRow>('SELECT * FROM services WHERE id = ? AND active = 1 AND online_booking = 1', b.service_id)
  if (!service) throw bad('Үйлчилгээ олдсонгүй')

  // Утас бүрээс ирээдүйн идэвхтэй захиалгын тоог хязгаарлана
  const activeCount = one<{ n: number }>(
    `SELECT COUNT(*) n FROM appointments WHERE contact_phone = ? AND date >= ? AND status IN ('pending','confirmed')`,
    b.phone,
    today(),
  )!.n
  if (activeCount >= 3) throw bad('Энэ дугаараас 3-аас олон идэвхтэй захиалга байна. Утсаар холбогдоно уу.')

  // Сонгосон цаг онлайн хуваарьт байгаа эсэх
  const slot = onlineSlots(b.date, b.doctor_id ?? null, service.duration).find((s) => s.time === b.time)
  if (!slot) throw bad('Энэ цагт захиалга авахгүй')
  if (!slot.free) throw new HttpError(409, 'Энэ цагийг саяхан өөр хүн авчихлаа. Өөр цаг сонгоно уу.')

  let doctorId: number | null = b.doctor_id ?? null
  if (doctorId) {
    const ok = one('SELECT 1 FROM users WHERE id = ? AND active = 1 AND online_booking = 1', doctorId)
    if (!ok) throw bad('Эмч олдсонгүй')
  } else if (hasDoctors()) {
    const start = toMin(b.time)
    const free = freeDoctors(b.date, start, start + service.duration)
    if (!free.length) throw new HttpError(409, 'Энэ цагийг саяхан өөр хүн авчихлаа. Өөр цаг сонгоно уу.')
    doctorId = free[0].id
  }

  const appt = createAppointment({
    doctor_id: doctorId,
    service_id: service.id,
    service_name: service.name,
    date: b.date,
    start_time: b.time,
    duration: service.duration,
    status: clinic.autoConfirm ? 'confirmed' : 'pending',
    source: 'online',
    utm: b.utm,
    teeth: b.teeth.sort((x, y) => x - y).join(','),
    contact_name: b.name,
    contact_phone: b.phone,
    patient_note: b.note,
  })
  void notifyBookingReceived(appt).catch(() => {})
  const doctor = doctorId ? one<{ name: string }>('SELECT name FROM users WHERE id = ?', doctorId) : undefined
  return c.json(
    {
      ref: appt.ref,
      date: appt.date,
      time: appt.start_time,
      service: appt.service_name,
      doctor: doctor?.name ?? null,
      status: appt.status,
    },
    201,
  )
})

const lookupSchema = z.object({
  items: z.array(z.object({ ref: z.string().max(12), phone: phoneSchema })).max(20),
})

/** "Миний захиалгууд": төхөөрөмж дээр хадгалсан дугаараар төлөв авах */
publicRoutes.post('/bookings/status', async (c) => {
  rateLimit(`lookup:${clientIp(c)}`, 60, 60 * 60_000)
  const { items } = await body(c, lookupSchema)
  const out = items
    .map(({ ref, phone }) => {
      const a = one<Appointment>('SELECT * FROM appointments WHERE ref = ? AND contact_phone = ?', ref.toUpperCase(), phone)
      if (!a) return null
      return { ref: a.ref, date: a.date, time: a.start_time, service: a.service_name, status: a.status }
    })
    .filter(Boolean)
  return c.json({ items: out })
})

publicRoutes.post('/bookings/:ref/cancel', async (c) => {
  rateLimit(`cancel:${clientIp(c)}`, 20, 60 * 60_000)
  const { phone } = await body(c, z.object({ phone: phoneSchema }))
  const a = one<Appointment>('SELECT * FROM appointments WHERE ref = ? AND contact_phone = ?', c.req.param('ref').toUpperCase(), phone)
  if (!a) throw notFound('Захиалга олдсонгүй')
  if (!['pending', 'confirmed'].includes(a.status)) throw bad('Энэ захиалгыг цуцлах боломжгүй')
  if (a.date < today()) throw bad('Өнгөрсөн захиалгыг цуцлах боломжгүй')
  run(
    `UPDATE appointments SET status = 'cancelled', staff_note = trim(staff_note || ' [Үйлчлүүлэгч онлайнаар цуцалсан]'), updated_at = ? WHERE id = ?`,
    nowStamp(),
    a.id,
  )
  return c.json({ ok: true })
})
