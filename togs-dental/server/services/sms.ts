import { all, one, run } from '../db.ts'
import { env } from '../lib/env.ts'
import { getSettings, type SmsSettings } from '../lib/settings.ts'
import { addDays, addMonths, nowStamp, shortDate, today } from '../lib/time.ts'
import type { Appointment } from './booking.ts'

/** Кирилл → латин (SMS-ийн үнийг хямдруулна: латин 160, кирилл 70 тэмдэгт/SMS) */
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'ye', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: 'i', ы: 'ii', ь: 'i', э: 'e', ю: 'yu', я: 'ya',
}
export function transliterate(s: string) {
  return [...s]
    .map((ch) => {
      const lower = ch.toLowerCase()
      const t = MAP[lower]
      if (t === undefined) return ch === '₮' ? 'tug' : ch
      return ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1)
    })
    .join('')
}

export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m))
}

function parseHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

type SendRefs = { appointment_id?: number | null; patient_id?: number | null }

/** Тохируулсан SMS үйлчилгээгээр (HTTP API) мессеж илгээнэ */
export async function sendSms(phone: string, message: string, kind: string, refs: SendRefs = {}, cfg?: SmsSettings) {
  const s = cfg ?? getSettings('sms')
  const text = s.latin ? transliterate(message) : message
  const log = (status: 'sent' | 'failed' | 'skipped', error: string | null) =>
    run(
      'INSERT INTO sms_log (phone, message, kind, status, error, appointment_id, patient_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
      phone,
      text,
      kind,
      status,
      error,
      refs.appointment_id ?? null,
      refs.patient_id ?? null,
      nowStamp(),
    )
  if (!s.enabled || !s.url) {
    log('skipped', 'SMS тохиргоо идэвхгүй')
    return { ok: false, error: 'SMS тохиргоо идэвхгүй байна' }
  }
  if (!/^\d{8}$/.test(phone)) {
    log('failed', 'Утасны дугаар буруу')
    return { ok: false, error: 'Утасны дугаар буруу' }
  }
  const enc = encodeURIComponent
  const url = s.url.replaceAll('{phone}', enc(phone)).replaceAll('{message}', enc(text))
  const init: RequestInit = { method: s.method, headers: parseHeaders(s.headers), signal: AbortSignal.timeout(15_000) }
  if (s.method === 'POST') {
    const json = s.contentType.includes('json')
    const esc = (v: string) => (json ? JSON.stringify(v).slice(1, -1) : enc(v))
    init.body = s.body.replaceAll('{phone}', esc(phone)).replaceAll('{message}', esc(text))
    ;(init.headers as Record<string, string>)['Content-Type'] ||= s.contentType
  }
  try {
    const res = await fetch(url, init)
    const resText = (await res.text()).slice(0, 300)
    const ok = res.ok && (!s.successMatch || resText.includes(s.successMatch))
    log(ok ? 'sent' : 'failed', ok ? null : `HTTP ${res.status}: ${resText}`)
    return ok ? { ok: true as const } : { ok: false as const, error: `SMS илгээгдсэнгүй (HTTP ${res.status})` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log('failed', msg)
    return { ok: false as const, error: `SMS илгээгдсэнгүй: ${msg}` }
  }
}

function vars(a: Pick<Appointment, 'date' | 'start_time' | 'service_name'> & { name: string; doctor?: string }) {
  const clinic = getSettings('clinic')
  return {
    clinic: clinic.shortName || clinic.name,
    name: a.name,
    date: shortDate(a.date),
    time: a.start_time,
    service: a.service_name,
    doctor: a.doctor ?? '',
    phone: clinic.phone1,
    link: `${env.publicUrl}/#book`,
  }
}

/** Онлайн захиалга ирэхэд баталгаажуулах SMS */
export async function notifyBookingReceived(a: Appointment) {
  const s = getSettings('sms')
  if (!s.enabled || !s.bookingEnabled || !a.contact_phone) return
  const msg = renderTemplate(s.bookingTemplate, vars({ ...a, name: a.contact_name }))
  await sendSms(a.contact_phone, msg, 'booking', { appointment_id: a.id })
}

/** Маргаашийн цагийн сануулга (өдөрт нэг удаа, тохируулсан цагаас хойш) */
export async function runReminders(now = new Date()) {
  const s = getSettings('sms')
  if (!s.enabled || !s.reminderEnabled || now.getHours() < s.reminderHour) return 0
  const tomorrow = addDays(today(), 1)
  const rows = all<Appointment & { p_name: string | null; p_phone: string | null; opt_out: number | null }>(
    `SELECT a.*, p.first_name p_name, p.phone p_phone, p.sms_opt_out opt_out
       FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id
      WHERE a.date = ? AND a.status IN ('pending','confirmed') AND a.reminder_sent_at IS NULL`,
    tomorrow,
  )
  let sent = 0
  for (const a of rows) {
    const phone = a.p_phone || a.contact_phone
    // Давхар илгээхээс сэргийлж эхлээд тэмдэглэнэ
    run('UPDATE appointments SET reminder_sent_at = ? WHERE id = ?', nowStamp(), a.id)
    if (!phone || a.opt_out) continue
    const msg = renderTemplate(s.reminderTemplate, vars({ ...a, name: a.p_name || a.contact_name }))
    const r = await sendSms(phone, msg, 'reminder', { appointment_id: a.id, patient_id: a.patient_id })
    if (r.ok) sent++
  }
  return sent
}

/** 6 сар тутмын үзлэгийн сануулга (recall) */
export async function runRecalls() {
  const s = getSettings('sms')
  if (!s.enabled || !s.recallEnabled) return 0
  const d = today()
  const rows = all<{ id: number; first_name: string; phone: string; recall_due: string }>(
    `SELECT p.id, p.first_name, p.phone, p.recall_due FROM patients p
      WHERE p.recall_due IS NOT NULL AND p.recall_due <= ? AND p.sms_opt_out = 0 AND p.phone != ''
        AND (p.recall_sent_at IS NULL OR p.recall_sent_at < p.recall_due)
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.date >= ? AND a.status IN ('pending','confirmed'))
      LIMIT 50`,
    d,
    d,
  )
  const clinic = getSettings('clinic')
  let sent = 0
  for (const p of rows) {
    run('UPDATE patients SET recall_sent_at = ? WHERE id = ?', d, p.id)
    const msg = renderTemplate(s.recallTemplate, {
      clinic: clinic.shortName || clinic.name,
      name: p.first_name,
      phone: clinic.phone1,
      link: `${env.publicUrl}/#book`,
    })
    const r = await sendSms(p.phone, msg, 'recall', { patient_id: p.id })
    if (r.ok) sent++
  }
  return sent
}

/** Эмчилгээний дараа дараагийн үзлэгийн огноо */
export function recallDateFrom(visitDate: string) {
  return addMonths(visitDate, getSettings('sms').recallMonths)
}

export function smsStats() {
  return one<{ sent: number; failed: number }>(
    `SELECT SUM(status = 'sent') sent, SUM(status = 'failed') failed FROM sms_log WHERE created_at >= ?`,
    addDays(today(), -30),
  )
}
