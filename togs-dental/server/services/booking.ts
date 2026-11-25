import { randomInt } from 'node:crypto'
import { all, one, run, tx } from '../db.ts'
import { getSettings } from '../lib/settings.ts'
import { fromMin, nowStamp, parseYmd, toMin, today } from '../lib/time.ts'
import { HttpError } from '../http.ts'

/** Цаг эзэлж буй (давхардал шалгах) төлвүүд */
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'arrived', 'completed'] as const
const ACTIVE_SQL = `status IN ('pending','confirmed','arrived','completed')`

export type Appointment = {
  id: number
  ref: string
  patient_id: number | null
  doctor_id: number | null
  service_id: number | null
  service_name: string
  date: string
  start_time: string
  start_min: number
  end_min: number
  status: string
  source: string
  utm: string
  teeth: string
  contact_name: string
  contact_phone: string
  patient_note: string
  staff_note: string
  reminder_sent_at: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

export function clinicHours(date: string) {
  const s = getSettings('clinic')
  const day = parseYmd(date).getDay()
  return s.hours[String(day) as '0'] ?? null
}

type BookableDoctor = { id: number; name: string }
export function bookableDoctors(): BookableDoctor[] {
  return all<BookableDoctor>(
    `SELECT id, name FROM users WHERE active = 1 AND online_booking = 1 AND (is_doctor = 1 OR role = 'doctor') ORDER BY id`,
  )
}
export function hasDoctors() {
  return Boolean(one(`SELECT 1 FROM users WHERE active = 1 AND (is_doctor = 1 OR role = 'doctor') LIMIT 1`))
}

/** Тухайн эмчид (эсвэл эмчгүй бол эмнэлэгт) цаг давхцаж байгаа эсэх */
export function findConflict(
  doctorId: number | null,
  date: string,
  startMin: number,
  endMin: number,
  excludeId?: number,
): Appointment | undefined {
  return one<Appointment>(
    `SELECT * FROM appointments
      WHERE date = ? AND ${ACTIVE_SQL}
        AND ${doctorId === null ? 'doctor_id IS NULL' : 'doctor_id = ?'}
        AND start_min < ? AND end_min > ?
        AND id != ?
      LIMIT 1`,
    ...([date, ...(doctorId === null ? [] : [doctorId]), endMin, startMin, excludeId ?? 0] as (string | number)[]),
  )
}

/** Тухайн цагт сул байгаа онлайн захиалга авдаг эмч нар (хамгийн бага ачаалалтай нь эхэндээ) */
export function freeDoctors(date: string, startMin: number, endMin: number): BookableDoctor[] {
  const doctors = bookableDoctors().filter((d) => !findConflict(d.id, date, startMin, endMin))
  const load = new Map(
    all<{ doctor_id: number; n: number }>(
      `SELECT doctor_id, COUNT(*) n FROM appointments WHERE date = ? AND ${ACTIVE_SQL} GROUP BY doctor_id`,
      date,
    ).map((r) => [r.doctor_id, r.n]),
  )
  return doctors.sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))
}

export type Slot = { time: string; free: boolean }

/** Онлайн захиалгын цагууд (ажлын цаг, үдийн завсарлага, өнгөрсөн цагийг тооцно) */
export function onlineSlots(date: string, doctorId: number | null, duration: number, now = new Date()): Slot[] {
  const s = getSettings('clinic')
  const hours = clinicHours(date)
  if (!hours) return []
  const open = toMin(hours[0])
  const close = toMin(hours[1])
  const lunch = s.lunch ? [toMin(s.lunch[0]), toMin(s.lunch[1])] : null
  const isToday = date === today()
  const nowMin = now.getHours() * 60 + now.getMinutes() + s.leadMinutes
  const doctors = hasDoctors() ? bookableDoctors() : []
  const out: Slot[] = []
  for (let m = open; m + duration <= close; m += s.slotMinutes) {
    const end = m + duration
    if (lunch && m < lunch[1] && end > lunch[0]) continue
    if (isToday && m < nowMin) continue
    let free: boolean
    if (doctorId) free = !findConflict(doctorId, date, m, end)
    else if (doctors.length) free = doctors.some((d) => !findConflict(d.id, date, m, end))
    else free = !findConflict(null, date, m, end)
    out.push({ time: fromMin(m), free })
  }
  return out
}

export function makeRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (;;) {
    let ref = ''
    for (let i = 0; i < 6; i++) ref += alphabet[randomInt(alphabet.length)]
    if (!one('SELECT 1 FROM appointments WHERE ref = ?', ref)) return ref
  }
}

export type NewAppointment = {
  patient_id?: number | null
  doctor_id: number | null
  service_id?: number | null
  service_name: string
  date: string
  start_time: string
  duration: number
  status?: string
  source: 'online' | 'phone' | 'walk_in' | 'staff'
  utm?: string
  teeth?: string
  contact_name?: string
  contact_phone?: string
  patient_note?: string
  staff_note?: string
  created_by?: number | null
}

/** Цаг үүсгэх. Давхардвал 409 алдаа. */
export function createAppointment(a: NewAppointment): Appointment {
  return tx(() => {
    const start = toMin(a.start_time)
    const end = start + a.duration
    const conflict = findConflict(a.doctor_id, a.date, start, end)
    if (conflict) throw new HttpError(409, `Энэ цаг давхцаж байна (${conflict.start_time}–${fromMin(conflict.end_min)} захиалгатай)`)
    const stamp = nowStamp()
    const { id } = run(
      `INSERT INTO appointments (ref, patient_id, doctor_id, service_id, service_name, date, start_time, start_min, end_min,
        status, source, utm, teeth, contact_name, contact_phone, patient_note, staff_note, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      makeRef(),
      a.patient_id ?? null,
      a.doctor_id,
      a.service_id ?? null,
      a.service_name,
      a.date,
      a.start_time,
      start,
      end,
      a.status ?? 'pending',
      a.source,
      a.utm ?? '',
      a.teeth ?? '',
      a.contact_name ?? '',
      a.contact_phone ?? '',
      a.patient_note ?? '',
      a.staff_note ?? '',
      a.created_by ?? null,
      stamp,
      stamp,
    )
    return one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)!
  })
}

/** Цагийг өөрчлөх (огноо/цаг/эмч/үргэлжлэх хугацаа), давхардлыг шалгана */
export function rescheduleAppointment(id: number, patch: { date?: string; start_time?: string; duration?: number; doctor_id?: number | null }) {
  return tx(() => {
    const cur = one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)
    if (!cur) throw new HttpError(404, 'Цаг олдсонгүй')
    const date = patch.date ?? cur.date
    const startTime = patch.start_time ?? cur.start_time
    const duration = patch.duration ?? cur.end_min - cur.start_min
    const doctorId = patch.doctor_id === undefined ? cur.doctor_id : patch.doctor_id
    const start = toMin(startTime)
    const end = start + duration
    if ((ACTIVE_STATUSES as readonly string[]).includes(cur.status)) {
      const conflict = findConflict(doctorId, date, start, end, id)
      if (conflict) throw new HttpError(409, `Энэ цаг давхцаж байна (${conflict.start_time}–${fromMin(conflict.end_min)} захиалгатай)`)
    }
    run(
      `UPDATE appointments SET date = ?, start_time = ?, start_min = ?, end_min = ?, doctor_id = ?, reminder_sent_at = CASE WHEN date != ? OR start_time != ? THEN NULL ELSE reminder_sent_at END, updated_at = ? WHERE id = ?`,
      date,
      startTime,
      start,
      end,
      doctorId,
      date,
      startTime,
      nowStamp(),
      id,
    )
    return one<Appointment>('SELECT * FROM appointments WHERE id = ?', id)!
  })
}
