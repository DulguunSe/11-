import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ExternalLink, Phone, Stethoscope, UserPlus, Link2 } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { formatPhone, fromMin, humanDate, todayYmd, toMin } from '../../shared/format.ts'
import { SOURCE_LABEL, type Appointment, type AppointmentStatus, type Service } from '../../shared/types.ts'
import { useAction, useDebounced, useUser } from '../lib.tsx'
import { Badge, Button, Drawer, Input, Modal, Select, StatusBadge, Textarea } from '../ui.tsx'

export type Doctor = { id: number; name: string; specialty: string; color: string; online_booking: number }

export const patientName = (a: Pick<Appointment, 'p_first_name' | 'p_last_name' | 'contact_name'>) =>
  a.p_first_name ? `${a.p_last_name ? a.p_last_name + ' ' : ''}${a.p_first_name}` : a.contact_name || 'Нэргүй'

export function sourceBadge(a: Pick<Appointment, 'source' | 'utm'>) {
  if (a.source === 'online' && /facebook|instagram|post-/.test(a.utm)) {
    return <Badge tone="violet">{a.utm.startsWith('instagram') ? 'Instagram пост' : 'Facebook пост'}</Badge>
  }
  return <Badge tone={a.source === 'online' ? 'blue' : 'gray'}>{SOURCE_LABEL[a.source] ?? a.source}</Badge>
}

type Match = { id: number; card_no: string; last_name: string; first_name: string; phone: string; birth_date: string | null }

export function AppointmentDrawer({
  appt,
  doctors,
  onClose,
  onChanged,
}: {
  appt: Appointment | null
  doctors: Doctor[]
  onClose: () => void
  onChanged: (a: Appointment) => void
}) {
  const user = useUser()
  const navigate = useNavigate()
  const { busy, run } = useAction()
  const [note, setNote] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [newP, setNewP] = useState({ last_name: '', first_name: '', phone: '' })
  const [move, setMove] = useState(false)
  const [mv, setMv] = useState({ date: '', start_time: '', doctor_id: '', duration: '' })

  useEffect(() => {
    if (!appt) return
    setNote(appt.staff_note)
    setMove(false)
    setMv({ date: appt.date, start_time: appt.start_time, doctor_id: appt.doctor_id ? String(appt.doctor_id) : '', duration: String(appt.duration) })
    const parts = appt.contact_name.trim().split(/\s+/)
    setNewP({ last_name: parts.length > 1 ? parts.slice(0, -1).join(' ') : '', first_name: parts.at(-1) ?? '', phone: appt.contact_phone })
    setMatches([])
    if (!appt.patient_id && appt.contact_phone) {
      api
        .get<{ items: Match[] }>(`/api/appointments/${appt.id}/matches`)
        .then((r) => setMatches(r.items))
        .catch(() => {})
    }
  }, [appt])

  if (!appt) return null
  const canEdit = user.role !== 'doctor' || !appt.doctor_id || appt.doctor_id === user.id
  const patch = (body: object, ok?: string) =>
    run(async () => {
      const r = await api.patch<{ item: Appointment }>(`/api/appointments/${appt.id}`, body)
      onChanged(r.item)
      return r
    }, ok)
  const link = (body: object) =>
    run(async () => {
      const r = await api.post<{ item: Appointment }>(`/api/appointments/${appt.id}/link`, body)
      onChanged(r.item)
      return r
    }, 'Үйлчлүүлэгчтэй холбогдлоо')
  const setStatus = (status: AppointmentStatus, ok: string) => patch({ status }, ok)
  const phone = appt.p_phone || appt.contact_phone
  const startVisit = () => navigate(`/patients/${appt.patient_id}?visit=${appt.id}`)

  return (
    <Drawer open onClose={onClose} title={`${appt.start_time}–${fromMin(appt.end_min)} · ${humanDate(appt.date)}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appt.status} />
          {sourceBadge(appt)}
          <span className="text-xs text-muted">№{appt.ref}</span>
        </div>

        <div className="rounded-2xl bg-soft p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{patientName(appt)}</p>
              {appt.p_card_no && <p className="text-xs text-muted">Карт №{appt.p_card_no}</p>}
            </div>
            {appt.patient_id && (
              <Link to={`/patients/${appt.patient_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue">
                Карт <ExternalLink size={14} />
              </Link>
            )}
          </div>
          {phone && (
            <a href={`tel:+976${phone}`} className="mt-2 inline-flex items-center gap-2 text-[15px] font-semibold text-blue">
              <Phone size={16} /> {formatPhone(phone)}
            </a>
          )}
          {appt.p_allergies && (
            <p className="mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              <AlertTriangle size={16} /> Харшил: {appt.p_allergies}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Үйлчилгээ</dt>
          <dd className="font-semibold">{appt.service_name}</dd>
          <dt className="text-muted">Эмч</dt>
          <dd className="font-semibold">{appt.doctor_name ?? 'Оноогоогүй'}</dd>
          <dt className="text-muted">Хугацаа</dt>
          <dd>{appt.duration} минут</dd>
          {appt.teeth && (
            <>
              <dt className="text-muted">Шүд</dt>
              <dd>{appt.teeth}</dd>
            </>
          )}
          {appt.patient_note && (
            <>
              <dt className="text-muted">Үйлчлүүлэгчийн тайлбар</dt>
              <dd className="whitespace-pre-wrap">{appt.patient_note}</dd>
            </>
          )}
        </dl>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {appt.status === 'pending' && (
              <Button variant="success" busy={busy} onClick={() => void setStatus('confirmed', 'Баталгаажлаа')}>
                Баталгаажуулах
              </Button>
            )}
            {['pending', 'confirmed'].includes(appt.status) && (
              <Button variant="secondary" busy={busy} onClick={() => void setStatus('arrived', 'Ирсэн гэж тэмдэглэлээ')}>
                Ирсэн
              </Button>
            )}
            {appt.status === 'confirmed' && (
              <Button variant="secondary" busy={busy} onClick={() => void setStatus('no_show', 'Ирээгүй гэж тэмдэглэлээ')}>
                Ирээгүй
              </Button>
            )}
            {appt.status === 'arrived' && (
              <Button variant="secondary" busy={busy} onClick={() => void setStatus('completed', 'Дууссан')}>
                Дууссан
              </Button>
            )}
            {['cancelled', 'no_show'].includes(appt.status) && (
              <Button variant="secondary" busy={busy} onClick={() => void setStatus('confirmed', 'Сэргээлээ')}>
                Сэргээх
              </Button>
            )}
            {['pending', 'confirmed', 'arrived'].includes(appt.status) && (
              <Button
                variant="danger"
                busy={busy}
                onClick={() => {
                  if (confirm('Энэ цагийг цуцлах уу?')) void setStatus('cancelled', 'Цуцлагдлаа')
                }}
              >
                Цуцлах
              </Button>
            )}
          </div>
        )}

        {appt.patient_id && user.role !== 'reception' && ['arrived', 'confirmed', 'completed'].includes(appt.status) && (
          <Button className="w-full" onClick={startVisit}>
            <Stethoscope size={18} /> Үзлэг, эмчилгээ бүртгэх
          </Button>
        )}

        {!appt.patient_id && (
          <div className="space-y-3 rounded-2xl p-4 ring-1 ring-line">
            <p className="flex items-center gap-2 font-semibold">
              <Link2 size={17} /> Үйлчлүүлэгчийн карттай холбох
            </p>
            <p className="text-xs text-muted">Онлайн захиалгыг картад холбосноор эмчилгээний түүх, төлбөр хадгалагдана.</p>
            {matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted">Ижил утастай бүртгэл:</p>
                {matches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-soft px-3 py-2 text-sm">
                    <span>
                      <b>
                        {m.last_name} {m.first_name}
                      </b>{' '}
                      <span className="text-muted">№{m.card_no}</span>
                    </span>
                    <Button size="sm" variant="secondary" busy={busy} onClick={() => void link({ patient_id: m.id })}>
                      Холбох
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Овог" value={newP.last_name} onChange={(e) => setNewP({ ...newP, last_name: e.target.value })} />
              <Input placeholder="Нэр" value={newP.first_name} onChange={(e) => setNewP({ ...newP, first_name: e.target.value })} />
              <Input className="col-span-2" placeholder="Утас" inputMode="tel" value={newP.phone} onChange={(e) => setNewP({ ...newP, phone: e.target.value })} />
            </div>
            <Button variant="secondary" className="w-full" busy={busy} disabled={!newP.first_name.trim()} onClick={() => void link({ create: newP })}>
              <UserPlus size={17} /> Шинэ карт нээж холбох
            </Button>
          </div>
        )}

        {canEdit && !['completed'].includes(appt.status) && (
          <div className="rounded-2xl p-4 ring-1 ring-line">
            <button type="button" className="flex w-full items-center gap-2 font-semibold" onClick={() => setMove((v) => !v)}>
              <CalendarClock size={17} /> Цаг шилжүүлэх
            </button>
            {move && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Input type="date" label="Өдөр" value={mv.date} onChange={(e) => setMv({ ...mv, date: e.target.value })} />
                <Input type="time" label="Цаг" step={300} value={mv.start_time} onChange={(e) => setMv({ ...mv, start_time: e.target.value })} />
                <Select label="Эмч" value={mv.doctor_id} onChange={(e) => setMv({ ...mv, doctor_id: e.target.value })}>
                  <option value="">Оноогоогүй</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
                <Input type="number" label="Минут" min={10} step={5} value={mv.duration} onChange={(e) => setMv({ ...mv, duration: e.target.value })} />
                <Button
                  className="col-span-2"
                  busy={busy}
                  onClick={() =>
                    void patch(
                      { date: mv.date, start_time: mv.start_time, doctor_id: mv.doctor_id ? Number(mv.doctor_id) : null, duration: Number(mv.duration) },
                      'Цаг шилжлээ',
                    )
                  }
                >
                  Хадгалах
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <Textarea label="Дотоод тэмдэглэл" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Зөвхөн ажилтнуудад харагдана" />
          {note !== appt.staff_note && (
            <Button size="sm" className="mt-2" busy={busy} onClick={() => void patch({ staff_note: note }, 'Хадгалагдлаа')}>
              Тэмдэглэл хадгалах
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  )
}

type PatientHit = { id: number; card_no: string; last_name: string; first_name: string; phone: string }

export function PatientSearch({ value, onPick }: { value: PatientHit | null; onPick: (p: PatientHit | null) => void }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q, 250)
  const [hits, setHits] = useState<PatientHit[]>([])
  useEffect(() => {
    if (dq.trim().length < 2) return setHits([])
    api
      .get<{ items: PatientHit[] }>(`/api/patients?limit=8&q=${encodeURIComponent(dq.trim())}`)
      .then((r) => setHits(r.items))
      .catch(() => setHits([]))
  }, [dq])
  if (value)
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-sky px-3 py-2.5 text-sm">
        <span>
          <b>
            {value.last_name} {value.first_name}
          </b>{' '}
          <span className="text-muted">
            №{value.card_no} · {formatPhone(value.phone)}
          </span>
        </span>
        <button type="button" className="font-semibold text-blue" onClick={() => onPick(null)}>
          Солих
        </button>
      </div>
    )
  return (
    <div className="relative">
      <Input placeholder="Нэр, утас, картын дугаараар хайх…" value={q} onChange={(e) => setQ(e.target.value)} />
      {hits.length > 0 && (
        <div className="absolute inset-x-0 top-12 z-10 max-h-60 overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-line">
          {hits.map((h) => (
            <button
              key={h.id}
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm hover:bg-soft"
              onClick={() => {
                onPick(h)
                setQ('')
                setHits([])
              }}
            >
              <b>
                {h.last_name} {h.first_name}
              </b>{' '}
              <span className="text-muted">
                №{h.card_no} · {formatPhone(h.phone)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppointmentForm({
  open,
  onClose,
  onCreated,
  doctors,
  services,
  initial,
}: {
  open: boolean
  onClose: () => void
  onCreated: (a: Appointment) => void
  doctors: Doctor[]
  services: Service[]
  initial?: { date?: string; start_time?: string; doctor_id?: number | null; patient?: PatientHit | null }
}) {
  const user = useUser()
  const { busy, run } = useAction()
  const [patient, setPatient] = useState<PatientHit | null>(null)
  const [contact, setContact] = useState({ name: '', phone: '' })
  const [f, setF] = useState({ service_id: '', doctor_id: '', date: todayYmd(), start_time: '', duration: '30', source: 'phone', status: 'confirmed', staff_note: '' })
  const [slots, setSlots] = useState<{ time: string; free: boolean }[]>([])

  useEffect(() => {
    if (!open) return
    const defDoctor = initial?.doctor_id ?? (user.role === 'doctor' ? user.id : doctors[0]?.id ?? null)
    setPatient(initial?.patient ?? null)
    setContact({ name: '', phone: '' })
    setF({
      service_id: '',
      doctor_id: defDoctor ? String(defDoctor) : '',
      date: initial?.date ?? todayYmd(),
      start_time: initial?.start_time ?? '',
      duration: '30',
      source: 'phone',
      status: 'confirmed',
      staff_note: '',
    })
  }, [open, initial, doctors, user])

  useEffect(() => {
    if (!open || !f.date) return
    const q = new URLSearchParams({ date: f.date, duration: f.duration || '30', ...(f.doctor_id ? { doctor: f.doctor_id } : {}) })
    api
      .get<{ slots: { time: string; free: boolean }[] }>(`/api/appointments/slots?${q}`)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
  }, [open, f.date, f.doctor_id, f.duration])

  const activeServices = useMemo(() => services.filter((s) => s.active !== 0), [services])
  const submit = () =>
    run(async () => {
      const r = await api.post<{ item: Appointment }>('/api/appointments', {
        patient_id: patient?.id ?? null,
        contact_name: patient ? '' : contact.name.trim(),
        contact_phone: patient ? '' : contact.phone.replace(/\D/g, ''),
        service_id: f.service_id ? Number(f.service_id) : null,
        doctor_id: f.doctor_id ? Number(f.doctor_id) : null,
        date: f.date,
        start_time: f.start_time,
        duration: Number(f.duration),
        source: f.source,
        status: f.status,
        staff_note: f.staff_note,
      })
      onCreated(r.item)
      onClose()
      return r
    }, 'Цаг бүртгэгдлээ')

  const valid = (patient || contact.name.trim().length >= 2) && f.date && /^\d{2}:\d{2}$/.test(f.start_time) && Number(f.duration) >= 10
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Шинэ цаг бүртгэх"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={!valid} onClick={() => void submit()}>
            Бүртгэх
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold">Үйлчлүүлэгч</p>
          <PatientSearch value={patient} onPick={setPatient} />
          {!patient && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input placeholder="эсвэл шинэ хүний нэр" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              <Input placeholder="Утас" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Үйлчилгээ"
            value={f.service_id}
            onChange={(e) => {
              const s = activeServices.find((x) => x.id === Number(e.target.value))
              setF({ ...f, service_id: e.target.value, duration: s ? String(s.duration) : f.duration })
            }}
          >
            <option value="">Үзлэг</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select label="Эмч" value={f.doctor_id} onChange={(e) => setF({ ...f, doctor_id: e.target.value })}>
            {doctors.length === 0 && <option value="">Эмчгүй</option>}
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Input type="date" label="Өдөр" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <Input type="number" label="Үргэлжлэх (мин)" min={10} step={5} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
        </div>
        <div>
          <Input type="time" label="Цаг" step={300} value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} />
          {slots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.free}
                  onClick={() => setF({ ...f, start_time: s.time })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 transition ${
                    f.start_time === s.time ? 'bg-ink text-white ring-ink' : s.free ? 'bg-white ring-line hover:ring-blue' : 'bg-soft text-muted/50 line-through ring-line'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {f.start_time && toMin(f.start_time) + Number(f.duration || 0) > 0 && (
            <p className="mt-1 text-xs text-muted">
              {f.start_time}–{fromMin(toMin(f.start_time) + Number(f.duration || 0))}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Хаанаас" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
            <option value="phone">Утсаар</option>
            <option value="walk_in">Биеэр ирсэн</option>
            <option value="staff">Бусад</option>
          </Select>
          <Select label="Төлөв" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="confirmed">Баталгаажсан</option>
            <option value="arrived">Ирсэн (одоо үзүүлж байна)</option>
            <option value="pending">Баталгаажаагүй</option>
          </Select>
        </div>
        <Textarea label="Тэмдэглэл" value={f.staff_note} onChange={(e) => setF({ ...f, staff_note: e.target.value })} />
      </div>
    </Modal>
  )
}
