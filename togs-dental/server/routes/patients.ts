import { Hono } from 'hono'
import { z } from 'zod'
import { createReadStream, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { all, one, run, tx } from '../db.ts'
import { audit } from '../lib/audit.ts'
import { env } from '../lib/env.ts'
import { randomToken } from '../lib/crypto.ts'
import { isYmd, nowStamp, today } from '../lib/time.ts'
import { me, requireAuth } from '../auth.ts'
import { bad, body, forbidden, intParam, normalizePhone, notFound, type AppEnv } from '../http.ts'
import { recallDateFrom } from '../services/sms.ts'
import { APPT_SELECT } from '../lib/queries.ts'

export const patientRoutes = new Hono<AppEnv>()
patientRoutes.use('*', requireAuth())

const optPhone = z
  .string()
  .transform(normalizePhone)
  .refine((d) => d === '' || /^\d{8}$/.test(d), { message: 'Утасны дугаар 8 оронтой байна' })

export const patientInput = z.object({
  last_name: z.string().trim().max(60).default(''),
  first_name: z.string().trim().min(1, 'Нэр заавал').max(60),
  phone: optPhone.default(''),
  phone2: optPhone.default(''),
  register_no: z.string().trim().toUpperCase().max(12).default(''),
  birth_date: z.string().refine(isYmd, 'Огноо буруу').nullable().default(null),
  gender: z.enum(['m', 'f']).nullable().default(null),
  address: z.string().trim().max(300).default(''),
  allergies: z.string().trim().max(500).default(''),
  medical_notes: z.string().trim().max(2000).default(''),
  notes: z.string().trim().max(2000).default(''),
  source: z.enum(['walk_in', 'phone', 'online', 'referral', 'facebook', 'other']).default('walk_in'),
  sms_opt_out: z.boolean().default(false),
})
export type PatientInput = z.infer<typeof patientInput>

export function createPatient(p: PatientInput, userId: number) {
  return tx(() => {
    const stamp = nowStamp()
    const { id } = run(
      `INSERT INTO patients (last_name, first_name, phone, phone2, register_no, birth_date, gender, address, allergies, medical_notes, notes, source, sms_opt_out, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      p.last_name,
      p.first_name,
      p.phone,
      p.phone2,
      p.register_no,
      p.birth_date,
      p.gender,
      p.address,
      p.allergies,
      p.medical_notes,
      p.notes,
      p.source,
      p.sms_opt_out,
      stamp,
      stamp,
    )
    run('UPDATE patients SET card_no = ? WHERE id = ?', String(id).padStart(5, '0'), id)
    audit(userId, 'create', 'patient', id)
    return id
  })
}

const balanceSql = `
  (SELECT COALESCE(SUM(total - discount), 0) FROM visits v WHERE v.patient_id = p.id)
  - (SELECT COALESCE(SUM(amount), 0) FROM payments y WHERE y.patient_id = p.id)`

patientRoutes.get('/', (c) => {
  const q = (c.req.query('q') ?? '').trim()
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limit = Math.min(100, Math.max(5, Number(c.req.query('limit')) || 30))
  const where: string[] = []
  const params: string[] = []
  if (q) {
    const digits = q.replace(/\D/g, '')
    const like = `%${q.toLowerCase()}%`
    const conds = ['ulower(p.first_name) LIKE ?', 'ulower(p.last_name) LIKE ?', "ulower(p.last_name || ' ' || p.first_name) LIKE ?", 'ulower(p.register_no) LIKE ?']
    params.push(like, like, like, like)
    if (digits.length >= 3) {
      conds.push('p.phone LIKE ?', 'p.phone2 LIKE ?', 'p.card_no LIKE ?')
      params.push(`%${digits}%`, `%${digits}%`, `%${digits}%`)
    }
    where.push(`(${conds.join(' OR ')})`)
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = one<{ n: number }>(`SELECT COUNT(*) n FROM patients p ${w}`, ...params)!.n
  const items = all(
    `SELECT p.id, p.card_no, p.last_name, p.first_name, p.phone, p.birth_date, p.gender, p.allergies, p.created_at,
            (SELECT MAX(date) FROM visits v WHERE v.patient_id = p.id) AS last_visit,
            (SELECT MIN(date || ' ' || start_time) FROM appointments a WHERE a.patient_id = p.id AND a.date >= ? AND a.status IN ('pending','confirmed')) AS next_appointment,
            ${balanceSql} AS balance
       FROM patients p ${w}
      ORDER BY COALESCE((SELECT MAX(date) FROM visits v WHERE v.patient_id = p.id), p.created_at) DESC, p.id DESC
      LIMIT ? OFFSET ?`,
    today(),
    ...params,
    limit,
    (page - 1) * limit,
  )
  return c.json({ items, total, page, limit })
})

patientRoutes.post('/', async (c) => {
  const u = me(c)
  const b = await body(c, patientInput)
  if (b.register_no && one('SELECT 1 FROM patients WHERE register_no = ?', b.register_no)) {
    throw bad('Ийм регистрийн дугаартай үйлчлүүлэгч бүртгэлтэй байна')
  }
  const id = createPatient(b, u.id)
  return c.json({ id }, 201)
})

/** Үйлчлүүлэгчийн бүрэн карт: мэдээлэл, түүх, цаг, төлбөр, шүдний диаграм, файл */
patientRoutes.get('/:id', (c) => {
  const id = intParam(c.req.param('id'))
  const patient = one(`SELECT p.*, ${balanceSql} AS balance FROM patients p WHERE p.id = ?`, id)
  if (!patient) throw notFound('Үйлчлүүлэгч олдсонгүй')
  const visits = all<{ id: number }>(
    `SELECT v.*, u.name AS doctor_name FROM visits v LEFT JOIN users u ON u.id = v.doctor_id
      WHERE v.patient_id = ? ORDER BY v.date DESC, v.id DESC`,
    id,
  )
  const items = all<{ visit_id: number }>(
    `SELECT i.* FROM visit_items i JOIN visits v ON v.id = i.visit_id WHERE v.patient_id = ? ORDER BY i.id`,
    id,
  )
  const byVisit = new Map<number, unknown[]>()
  for (const it of items) byVisit.set(it.visit_id, [...(byVisit.get(it.visit_id) ?? []), it])
  const payments = all(
    `SELECT y.*, u.name AS received_by_name FROM payments y LEFT JOIN users u ON u.id = y.received_by
      WHERE y.patient_id = ? ORDER BY y.paid_at DESC, y.id DESC`,
    id,
  )
  const appointments = all(`${APPT_SELECT} WHERE a.patient_id = ? ORDER BY a.date DESC, a.start_min DESC LIMIT 100`, id)
  const chart = all('SELECT tooth, status, note, updated_at FROM tooth_chart WHERE patient_id = ?', id)
  const files = all(
    'SELECT id, kind, original_name, mime, size, note, created_at FROM patient_files WHERE patient_id = ? ORDER BY id DESC',
    id,
  )
  audit(me(c).id, 'view', 'patient', id)
  return c.json({
    patient,
    visits: visits.map((v) => ({ ...v, items: byVisit.get(v.id) ?? [] })),
    payments,
    appointments,
    chart,
    files,
  })
})

patientRoutes.patch('/:id', async (c) => {
  const u = me(c)
  const id = intParam(c.req.param('id'))
  const b = await body(c, patientInput.partial())
  if (!one('SELECT 1 FROM patients WHERE id = ?', id)) throw notFound('Үйлчлүүлэгч олдсонгүй')
  if (b.register_no && one('SELECT 1 FROM patients WHERE register_no = ? AND id != ?', b.register_no, id)) {
    throw bad('Ийм регистрийн дугаартай өөр үйлчлүүлэгч бүртгэлтэй байна')
  }
  const sets: string[] = []
  const vals: (string | number | boolean | null)[] = []
  for (const [k, v] of Object.entries(b)) {
    sets.push(`${k} = ?`)
    vals.push(v as string | number | boolean | null)
  }
  if (sets.length) run(`UPDATE patients SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, ...vals, nowStamp(), id)
  audit(u.id, 'update', 'patient', id, Object.keys(b).join(','))
  return c.json({ ok: true })
})

patientRoutes.delete('/:id', requireAuth('admin'), (c) => {
  const id = intParam(c.req.param('id'))
  const files = all<{ path: string }>('SELECT path FROM patient_files WHERE patient_id = ?', id)
  const r = run('DELETE FROM patients WHERE id = ?', id)
  if (!r.changes) throw notFound('Үйлчлүүлэгч олдсонгүй')
  for (const f of files) {
    try {
      unlinkSync(resolve(env.uploadsDir, f.path))
    } catch {
      /* файл аль хэдийн байхгүй */
    }
  }
  audit(me(c).id, 'delete', 'patient', id)
  return c.json({ ok: true })
})

/* ---------------- Эмчилгээний бүртгэл (visit) ---------------- */
const itemSchema = z.object({
  service_id: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(160),
  tooth: z.string().trim().max(40).default(''),
  qty: z.number().int().min(1).max(100).default(1),
  price: z.number().int().min(0).max(100_000_000),
})
const visitSchema = z.object({
  appointment_id: z.number().int().positive().nullable().optional(),
  doctor_id: z.number().int().positive().nullable().optional(),
  date: z.string().refine(isYmd, 'Огноо буруу'),
  complaint: z.string().trim().max(2000).default(''),
  diagnosis: z.string().trim().max(2000).default(''),
  treatment: z.string().trim().max(4000).default(''),
  teeth: z.string().trim().max(200).default(''),
  notes: z.string().trim().max(4000).default(''),
  next_visit: z.string().trim().max(500).default(''),
  discount: z.number().int().min(0).max(100_000_000).default(0),
  items: z.array(itemSchema).max(50).default([]),
  set_recall: z.boolean().default(true),
  chart: z.array(z.object({ tooth: z.number().int().min(11).max(85), status: z.string().max(30) })).max(52).default([]),
})

function saveVisitItems(visitId: number, items: z.infer<typeof itemSchema>[]) {
  run('DELETE FROM visit_items WHERE visit_id = ?', visitId)
  for (const it of items) {
    run(
      'INSERT INTO visit_items (visit_id, service_id, name, tooth, qty, price) VALUES (?,?,?,?,?,?)',
      visitId,
      it.service_id ?? null,
      it.name,
      it.tooth,
      it.qty,
      it.price,
    )
  }
  return items.reduce((s, it) => s + it.qty * it.price, 0)
}

function applyChart(patientId: number, chart: { tooth: number; status: string }[], userId: number) {
  for (const t of chart) {
    if (t.status === 'healthy') run('DELETE FROM tooth_chart WHERE patient_id = ? AND tooth = ?', patientId, t.tooth)
    else
      run(
        `INSERT INTO tooth_chart (patient_id, tooth, status, updated_at, updated_by) VALUES (?,?,?,?,?)
         ON CONFLICT(patient_id, tooth) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
        patientId,
        t.tooth,
        t.status,
        nowStamp(),
        userId,
      )
  }
}

patientRoutes.post('/:id/visits', async (c) => {
  const u = me(c)
  if (u.role === 'reception') throw forbidden('Эмчилгээг эмч бүртгэнэ')
  const patientId = intParam(c.req.param('id'))
  if (!one('SELECT 1 FROM patients WHERE id = ?', patientId)) throw notFound('Үйлчлүүлэгч олдсонгүй')
  const b = await body(c, visitSchema)
  const doctorId = b.doctor_id ?? (u.is_doctor || u.role === 'doctor' ? u.id : null)
  const total = b.items.reduce((s, it) => s + it.qty * it.price, 0)
  if (b.discount > total) throw bad('Хөнгөлөлт нийт дүнгээс их байна')
  const id = tx(() => {
    const stamp = nowStamp()
    const { id } = run(
      `INSERT INTO visits (patient_id, appointment_id, doctor_id, date, complaint, diagnosis, treatment, teeth, notes, next_visit, total, discount, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      patientId,
      b.appointment_id ?? null,
      doctorId,
      b.date,
      b.complaint,
      b.diagnosis,
      b.treatment,
      b.teeth,
      b.notes,
      b.next_visit,
      0,
      b.discount,
      u.id,
      stamp,
      stamp,
    )
    const sum = saveVisitItems(id, b.items)
    run('UPDATE visits SET total = ? WHERE id = ?', sum, id)
    if (b.appointment_id) {
      run(
        `UPDATE appointments SET patient_id = ?, status = CASE WHEN status IN ('cancelled','no_show') THEN status ELSE 'completed' END, updated_at = ? WHERE id = ?`,
        patientId,
        stamp,
        b.appointment_id,
      )
    }
    if (b.set_recall) run('UPDATE patients SET recall_due = ?, updated_at = ? WHERE id = ?', recallDateFrom(b.date), stamp, patientId)
    applyChart(patientId, b.chart, u.id)
    return id
  })
  audit(u.id, 'create', 'visit', id, `patient ${patientId}`)
  return c.json({ id }, 201)
})

patientRoutes.patch('/visits/:visitId', async (c) => {
  const u = me(c)
  const visitId = intParam(c.req.param('visitId'))
  const cur = one<{ patient_id: number; doctor_id: number | null; created_by: number | null }>('SELECT * FROM visits WHERE id = ?', visitId)
  if (!cur) throw notFound('Бүртгэл олдсонгүй')
  if (u.role !== 'admin' && cur.created_by !== u.id && cur.doctor_id !== u.id) throw forbidden('Зөвхөн өөрийн бүртгэлийг засна')
  const b = await body(c, visitSchema.partial())
  tx(() => {
    const sets: string[] = []
    const vals: (string | number | null)[] = []
    for (const k of ['date', 'complaint', 'diagnosis', 'treatment', 'teeth', 'notes', 'next_visit', 'discount', 'doctor_id'] as const) {
      if (b[k] !== undefined) {
        sets.push(`${k} = ?`)
        vals.push(b[k] as string | number | null)
      }
    }
    if (b.items) {
      sets.push('total = ?')
      vals.push(saveVisitItems(visitId, b.items))
    }
    if (sets.length) run(`UPDATE visits SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, ...vals, nowStamp(), visitId)
    const v = one<{ total: number; discount: number }>('SELECT total, discount FROM visits WHERE id = ?', visitId)!
    if (v.discount > v.total) throw bad('Хөнгөлөлт нийт дүнгээс их байна')
    if (b.chart) applyChart(cur.patient_id, b.chart, u.id)
  })
  audit(u.id, 'update', 'visit', visitId)
  return c.json({ ok: true })
})

patientRoutes.delete('/visits/:visitId', requireAuth('admin'), (c) => {
  const visitId = intParam(c.req.param('visitId'))
  const r = run('DELETE FROM visits WHERE id = ?', visitId)
  if (!r.changes) throw notFound('Бүртгэл олдсонгүй')
  audit(me(c).id, 'delete', 'visit', visitId)
  return c.json({ ok: true })
})

/* ---------------- Төлбөр ---------------- */
patientRoutes.post('/:id/payments', async (c) => {
  const u = me(c)
  const patientId = intParam(c.req.param('id'))
  if (!one('SELECT 1 FROM patients WHERE id = ?', patientId)) throw notFound('Үйлчлүүлэгч олдсонгүй')
  const b = await body(
    c,
    z.object({
      amount: z.number().int().min(1).max(100_000_000),
      method: z.enum(['cash', 'card', 'transfer', 'qpay', 'other']),
      paid_at: z.string().refine(isYmd, 'Огноо буруу').default(today()),
      visit_id: z.number().int().positive().nullable().optional(),
      doctor_id: z.number().int().positive().nullable().optional(),
      note: z.string().trim().max(300).default(''),
    }),
  )
  let doctorId = b.doctor_id ?? null
  if (b.visit_id) {
    const v = one<{ patient_id: number; doctor_id: number | null }>('SELECT patient_id, doctor_id FROM visits WHERE id = ?', b.visit_id)
    if (!v || v.patient_id !== patientId) throw bad('Эмчилгээний бүртгэл олдсонгүй')
    doctorId ??= v.doctor_id
  }
  const { id } = run(
    'INSERT INTO payments (patient_id, visit_id, doctor_id, amount, method, paid_at, note, received_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    patientId,
    b.visit_id ?? null,
    doctorId,
    b.amount,
    b.method,
    b.paid_at,
    b.note,
    u.id,
    nowStamp(),
  )
  audit(u.id, 'create', 'payment', id, `${b.amount} ${b.method}`)
  return c.json({ id }, 201)
})

patientRoutes.delete('/payments/:paymentId', requireAuth('admin'), (c) => {
  const id = intParam(c.req.param('paymentId'))
  const r = run('DELETE FROM payments WHERE id = ?', id)
  if (!r.changes) throw notFound('Төлбөр олдсонгүй')
  audit(me(c).id, 'delete', 'payment', id)
  return c.json({ ok: true })
})

/* ---------------- Шүдний диаграм ---------------- */
const TOOTH_STATUSES = ['healthy', 'caries', 'filled', 'root_canal', 'crown', 'bridge', 'missing', 'implant', 'extract'] as const
patientRoutes.put('/:id/chart', async (c) => {
  const u = me(c)
  const patientId = intParam(c.req.param('id'))
  if (!one('SELECT 1 FROM patients WHERE id = ?', patientId)) throw notFound('Үйлчлүүлэгч олдсонгүй')
  const b = await body(
    c,
    z.object({ tooth: z.number().int().min(11).max(85), status: z.enum(TOOTH_STATUSES), note: z.string().max(300).default('') }),
  )
  if (b.status === 'healthy') run('DELETE FROM tooth_chart WHERE patient_id = ? AND tooth = ?', patientId, b.tooth)
  else
    run(
      `INSERT INTO tooth_chart (patient_id, tooth, status, note, updated_at, updated_by) VALUES (?,?,?,?,?,?)
       ON CONFLICT(patient_id, tooth) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      patientId,
      b.tooth,
      b.status,
      b.note,
      nowStamp(),
      u.id,
    )
  return c.json({ ok: true })
})

/* ---------------- Файл (рентген, зураг) — зөвхөн нэвтэрсэн ажилтанд ---------------- */
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
])

patientRoutes.post('/:id/files', async (c) => {
  const u = me(c)
  const patientId = intParam(c.req.param('id'))
  if (!one('SELECT 1 FROM patients WHERE id = ?', patientId)) throw notFound('Үйлчлүүлэгч олдсонгүй')
  const form = await c.req.parseBody()
  const file = form.file
  if (!(file instanceof File)) throw bad('Файл сонгоно уу')
  const ext = ALLOWED.get(file.type)
  if (!ext) throw bad('Зөвхөн JPG, PNG, WEBP, PDF файл')
  if (file.size > 20 * 1024 * 1024) throw bad('Файл 20MB-аас ихгүй байна')
  const kind = ['xray', 'photo', 'document'].includes(String(form.kind)) ? String(form.kind) : 'xray'
  const rel = join('patients', String(patientId), `${randomToken(12)}${ext}`)
  mkdirSync(resolve(env.uploadsDir, 'patients', String(patientId)), { recursive: true })
  writeFileSync(resolve(env.uploadsDir, rel), Buffer.from(await file.arrayBuffer()))
  const { id } = run(
    'INSERT INTO patient_files (patient_id, kind, path, original_name, mime, size, note, uploaded_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    patientId,
    kind,
    rel,
    file.name.slice(0, 200),
    file.type,
    file.size,
    String(form.note ?? '').slice(0, 300),
    u.id,
    nowStamp(),
  )
  audit(u.id, 'upload', 'patient_file', id, `patient ${patientId}`)
  return c.json({ id }, 201)
})

patientRoutes.get('/files/:fileId', (c) => {
  const f = one<{ path: string; mime: string; original_name: string }>('SELECT * FROM patient_files WHERE id = ?', intParam(c.req.param('fileId')))
  if (!f) throw notFound('Файл олдсонгүй')
  const abs = resolve(env.uploadsDir, f.path)
  if (!abs.startsWith(resolve(env.uploadsDir))) throw notFound()
  const size = statSync(abs).size
  c.header('Content-Type', f.mime)
  c.header('Content-Length', String(size))
  c.header('Cache-Control', 'private, max-age=3600')
  c.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(f.original_name || `file${extname(f.path)}`)}`)
  return c.body(Readable.toWeb(createReadStream(abs)) as ReadableStream)
})

patientRoutes.delete('/files/:fileId', (c) => {
  const u = me(c)
  const id = intParam(c.req.param('fileId'))
  const f = one<{ path: string; uploaded_by: number | null }>('SELECT path, uploaded_by FROM patient_files WHERE id = ?', id)
  if (!f) throw notFound('Файл олдсонгүй')
  if (u.role !== 'admin' && f.uploaded_by !== u.id) throw forbidden()
  run('DELETE FROM patient_files WHERE id = ?', id)
  try {
    unlinkSync(resolve(env.uploadsDir, f.path))
  } catch {
    /* ignore */
  }
  audit(u.id, 'delete', 'patient_file', id)
  return c.json({ ok: true })
})
