import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CalendarPlus, FileText, MessageSquare, Pencil, Phone, Plus, Stethoscope, Trash2, Upload, Wallet } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { age, formatPhone, humanDate, money, todayYmd } from '../../shared/format.ts'
import { SOURCE_LABEL, type Appointment, type Service } from '../../shared/types.ts'
import { useAction, useLoad, useUser } from '../lib.tsx'
import { Badge, Button, Card, Empty, ErrorBox, Input, Modal, Select, Spinner, StatusBadge, Tabs, Textarea, Toggle } from '../ui.tsx'
import { AppointmentForm, type Doctor } from '../components/appointments.tsx'
import { PatientForm, type PatientFields } from '../components/PatientForm.tsx'
import { TOOTH_STATUS, ToothChart, type ToothStatus } from '../components/ToothChart.tsx'

type VisitItem = { id?: number; service_id: number | null; name: string; tooth: string; qty: number; price: number }
type Visit = {
  id: number
  appointment_id: number | null
  doctor_id: number | null
  doctor_name: string | null
  date: string
  complaint: string
  diagnosis: string
  treatment: string
  teeth: string
  notes: string
  next_visit: string
  total: number
  discount: number
  created_by: number | null
  items: VisitItem[]
}
type Payment = { id: number; visit_id: number | null; amount: number; method: string; paid_at: string; note: string; received_by_name: string | null }
type PFile = { id: number; kind: string; original_name: string; mime: string; size: number; note: string; created_at: string }
type Patient = PatientFields & { id: number; card_no: string; balance: number; recall_due: string | null; created_at: string }
type CardData = { patient: Patient; visits: Visit[]; payments: Payment[]; appointments: Appointment[]; chart: { tooth: number; status: string }[]; files: PFile[] }

const METHOD: Record<string, string> = { cash: 'Бэлэн', card: 'Карт', transfer: 'Шилжүүлэг', qpay: 'QPay', other: 'Бусад' }

export default function PatientCard() {
  const { id } = useParams()
  const pid = Number(id)
  const user = useUser()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, error, loading, reload } = useLoad(() => api.get<CardData>(`/api/patients/${pid}`), [pid])
  const meta = useLoad(() => Promise.all([api.get<{ items: Doctor[] }>('/api/doctors'), api.get<{ items: Service[] }>('/api/services')]), [])
  const doctors = meta.data?.[0].items ?? []
  const services = (meta.data?.[1].items ?? []).filter((s) => s.active !== 0)
  const [tab, setTab] = useState<'history' | 'chart' | 'appointments' | 'payments' | 'files' | 'info'>('history')
  const [visitForm, setVisitForm] = useState<{ visit?: Visit; appointment?: Appointment } | null>(null)
  const [payForm, setPayForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [booking, setBooking] = useState(false)
  const [sms, setSms] = useState(false)
  const [toothPick, setToothPick] = useState<number | null>(null)
  const { busy, run } = useAction()

  // Хуваариас "эмчилгээ бүртгэх" дарж ирсэн бол форм шууд нээгдэнэ
  useEffect(() => {
    const visitFor = Number(params.get('visit'))
    if (visitFor && data) {
      const appt = data.appointments.find((a) => a.id === visitFor)
      setVisitForm({ appointment: appt })
      params.delete('visit')
      setParams(params, { replace: true })
    }
  }, [data, params, setParams])

  if (error) return <ErrorBox message={error} onRetry={reload} />
  if (loading && !data) return <Spinner />
  if (!data) return null
  const p = data.patient
  const canTreat = user.role !== 'reception'
  const billed = data.visits.reduce((s, v) => s + v.total - v.discount, 0)
  const paid = data.payments.reduce((s, y) => s + y.amount, 0)
  const upcoming = data.appointments.filter((a) => a.date >= todayYmd() && ['pending', 'confirmed'].includes(a.status))

  const setTooth = (status: ToothStatus) =>
    run(async () => {
      await api.put(`/api/patients/${pid}/chart`, { tooth: toothPick, status })
      setToothPick(null)
      await reload()
    }, 'Шүдний диаграм шинэчлэгдлээ')

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Буцах
      </button>

      <Card className="mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl brand-grad font-display text-xl font-extrabold text-white">{p.first_name.charAt(0)}</span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {p.last_name} {p.first_name}
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                Карт №{p.card_no}
                {age(p.birth_date) !== null && ` · ${age(p.birth_date)} нас`}
                {p.gender && ` · ${p.gender === 'm' ? 'Эрэгтэй' : 'Эмэгтэй'}`}
                {p.register_no && ` · ${p.register_no}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {p.phone && (
                  <a href={`tel:+976${p.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-sky px-2.5 py-1 text-sm font-semibold text-blue">
                    <Phone size={14} /> {formatPhone(p.phone)}
                  </a>
                )}
                {p.phone2 && <span className="text-sm text-muted">{formatPhone(p.phone2)}</span>}
                <Badge tone={p.balance > 0 ? 'red' : 'green'}>{p.balance > 0 ? `Үлдэгдэл ${money(p.balance)}` : 'Тооцоо дууссан'}</Badge>
                {p.recall_due && <Badge tone="blue">Дараагийн үзлэг: {p.recall_due}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canTreat && (
              <Button onClick={() => setVisitForm({})}>
                <Stethoscope size={17} /> Үзлэг бүртгэх
              </Button>
            )}
            <Button variant="secondary" onClick={() => setPayForm(true)}>
              <Wallet size={17} /> Төлбөр авах
            </Button>
            <Button variant="secondary" onClick={() => setBooking(true)}>
              <CalendarPlus size={17} /> Цаг товлох
            </Button>
            {user.role !== 'doctor' && p.phone && (
              <Button variant="secondary" onClick={() => setSms(true)}>
                <MessageSquare size={17} /> SMS
              </Button>
            )}
          </div>
        </div>
        {(p.allergies || p.medical_notes) && (
          <div className="mt-4 space-y-2">
            {p.allergies && (
              <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={16} /> Харшил: {p.allergies}
              </p>
            )}
            {p.medical_notes && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">Эрүүл мэнд: {p.medical_notes}</p>}
          </div>
        )}
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'history', label: 'Эмчилгээний түүх', count: data.visits.length },
          { value: 'chart', label: 'Шүдний диаграм' },
          { value: 'appointments', label: 'Цагууд', count: upcoming.length },
          { value: 'payments', label: 'Төлбөр' },
          { value: 'files', label: 'Рентген, файл', count: data.files.length },
          { value: 'info', label: 'Мэдээлэл' },
        ]}
      />

      {tab === 'history' &&
        (data.visits.length === 0 ? (
          <Empty icon={<Stethoscope size={22} />} title="Эмчилгээний түүх алга" text="Үзлэг, эмчилгээ бүртгэхэд энд харагдана." action={canTreat && <Button onClick={() => setVisitForm({})}>Үзлэг бүртгэх</Button>} />
        ) : (
          <ol className="relative space-y-4 border-l-2 border-line pl-5">
            {data.visits.map((v) => (
              <li key={v.id} className="relative">
                <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-white bg-blue ring-2 ring-sky" />
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{humanDate(v.date)}</p>
                      <p className="text-sm text-muted">{v.doctor_name ?? 'Эмч тодорхойгүй'}{v.teeth && ` · Шүд: ${v.teeth}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold tabular-nums">{money(v.total - v.discount)}</span>
                      {(user.role === 'admin' || v.created_by === user.id || v.doctor_id === user.id) && (
                        <Button size="sm" variant="ghost" onClick={() => setVisitForm({ visit: v })} aria-label="Засах">
                          <Pencil size={15} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                    {v.complaint && (
                      <>
                        <dt className="text-muted">Зовиур</dt>
                        <dd>{v.complaint}</dd>
                      </>
                    )}
                    {v.diagnosis && (
                      <>
                        <dt className="text-muted">Онош</dt>
                        <dd className="font-semibold">{v.diagnosis}</dd>
                      </>
                    )}
                    {v.treatment && (
                      <>
                        <dt className="text-muted">Эмчилгээ</dt>
                        <dd className="whitespace-pre-wrap">{v.treatment}</dd>
                      </>
                    )}
                    {v.notes && (
                      <>
                        <dt className="text-muted">Тэмдэглэл</dt>
                        <dd className="whitespace-pre-wrap">{v.notes}</dd>
                      </>
                    )}
                    {v.next_visit && (
                      <>
                        <dt className="text-muted">Дараагийн</dt>
                        <dd>{v.next_visit}</dd>
                      </>
                    )}
                  </dl>
                  {v.items.length > 0 && (
                    <ul className="mt-3 divide-y divide-line rounded-xl bg-soft px-3 text-sm">
                      {v.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-3 py-2">
                          <span>
                            {it.name}
                            {it.tooth && <span className="text-muted"> · {it.tooth}</span>}
                            {it.qty > 1 && <span className="text-muted"> ×{it.qty}</span>}
                          </span>
                          <span className="tabular-nums">{money(it.qty * it.price)}</span>
                        </li>
                      ))}
                      {v.discount > 0 && (
                        <li className="flex justify-between gap-3 py-2 text-lime-dark">
                          <span>Хөнгөлөлт</span>
                          <span className="tabular-nums">−{money(v.discount)}</span>
                        </li>
                      )}
                    </ul>
                  )}
                </Card>
              </li>
            ))}
          </ol>
        ))}

      {tab === 'chart' && (
        <Card title="Шүдний диаграм" action={<span className="text-xs text-muted">Шүдэн дээр дарж төлөв сонгоно</span>}>
          <ToothChart chart={data.chart} onToothClick={canTreat ? setToothPick : undefined} child={(age(p.birth_date) ?? 30) < 12} />
        </Card>
      )}

      {tab === 'appointments' && (
        <Card
          title="Цагууд"
          action={
            <Button size="sm" onClick={() => setBooking(true)}>
              <Plus size={15} /> Цаг товлох
            </Button>
          }
        >
          {data.appointments.length === 0 ? (
            <p className="text-sm text-muted">Цаг бүртгэгдээгүй.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.appointments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span>
                    <b>
                      {humanDate(a.date)} · {a.start_time}
                    </b>
                    <span className="block text-muted">
                      {a.service_name}
                      {a.doctor_name ? ` · ${a.doctor_name}` : ''} · {SOURCE_LABEL[a.source]}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <p className="text-xs text-muted">Эмчилгээний дүн</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums">{money(billed)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <p className="text-xs text-muted">Төлсөн</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-lime-dark">{money(paid)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <p className="text-xs text-muted">Үлдэгдэл</p>
              <p className={`mt-1 font-display text-xl font-bold tabular-nums ${p.balance > 0 ? 'text-red-600' : ''}`}>{money(p.balance)}</p>
            </div>
          </div>
          <Card
            title="Төлбөрийн түүх"
            action={
              <Button size="sm" onClick={() => setPayForm(true)}>
                <Plus size={15} /> Төлбөр авах
              </Button>
            }
          >
            {data.payments.length === 0 ? (
              <p className="text-sm text-muted">Төлбөр бүртгэгдээгүй.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.payments.map((y) => (
                  <li key={y.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      <b>{y.paid_at}</b> · {METHOD[y.method] ?? y.method}
                      <span className="block text-muted">
                        {y.received_by_name ? `Хүлээн авсан: ${y.received_by_name}` : ''}
                        {y.note ? ` · ${y.note}` : ''}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-lime-dark">{money(y.amount)}</span>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                          aria-label="Устгах"
                          onClick={() => {
                            if (confirm('Энэ төлбөрийг устгах уу?')) void run(async () => (await api.del(`/api/patients/payments/${y.id}`), reload()), 'Устгагдлаа')
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'files' && <FilesTab patientId={pid} files={data.files} onChanged={reload} />}

      {tab === 'info' && (
        <Card
          title="Хувийн мэдээлэл"
          action={
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Засах
            </Button>
          }
        >
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {(
              [
                ['Овог нэр', `${p.last_name} ${p.first_name}`],
                ['Регистр', p.register_no || '—'],
                ['Төрсөн огноо', p.birth_date || '—'],
                ['Утас', [p.phone, p.phone2].filter(Boolean).map(formatPhone).join(', ') || '—'],
                ['Хаяг', p.address || '—'],
                ['Хаанаас', SOURCE_LABEL[p.source] ?? p.source],
                ['SMS', p.sms_opt_out ? 'Илгээхгүй' : 'Илгээнэ'],
                ['Бүртгэсэн', p.created_at.slice(0, 10)],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
            {p.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Тэмдэглэл</dt>
                <dd className="whitespace-pre-wrap">{p.notes}</dd>
              </div>
            )}
          </dl>
          {user.role === 'admin' && (
            <div className="mt-6 border-t border-line pt-4">
              <Button
                variant="danger"
                size="sm"
                busy={busy}
                onClick={() => {
                  if (confirm('Энэ үйлчлүүлэгчийн бүх мэдээлэл (түүх, төлбөр, файл) бүрмөсөн устна. Итгэлтэй байна уу?'))
                    void run(async () => {
                      await api.del(`/api/patients/${pid}`)
                      navigate('/patients')
                    }, 'Устгагдлаа')
                }}
              >
                <Trash2 size={15} /> Бүртгэл устгах
              </Button>
            </div>
          )}
        </Card>
      )}

      {visitForm && (
        <VisitForm
          patientId={pid}
          visit={visitForm.visit}
          appointment={visitForm.appointment}
          doctors={doctors}
          services={services}
          chart={data.chart}
          onClose={() => setVisitForm(null)}
          onSaved={() => {
            setVisitForm(null)
            void reload()
          }}
        />
      )}
      {payForm && (
        <PaymentForm
          patientId={pid}
          balance={p.balance}
          visits={data.visits}
          payments={data.payments}
          onClose={() => setPayForm(false)}
          onSaved={() => {
            setPayForm(false)
            void reload()
          }}
        />
      )}
      <PatientForm open={editing} onClose={() => setEditing(false)} patient={p} onSaved={() => void reload()} />
      <AppointmentForm
        open={booking}
        onClose={() => setBooking(false)}
        onCreated={() => void reload()}
        doctors={doctors}
        services={services}
        initial={{ patient: { id: p.id, card_no: p.card_no, last_name: p.last_name, first_name: p.first_name, phone: p.phone } }}
      />
      {sms && <SmsModal phone={p.phone} patientId={p.id} name={p.first_name} onClose={() => setSms(false)} />}
      <Modal open={toothPick !== null} onClose={() => setToothPick(null)} title={`Шүд №${toothPick}`}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TOOTH_STATUS) as ToothStatus[]).map((k) => (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => void setTooth(k)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ring-1 ring-line hover:ring-blue"
            >
              <span className="h-4 w-4 rounded ring-1 ring-line" style={{ background: TOOTH_STATUS[k].color }} />
              {TOOTH_STATUS[k].label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function VisitForm({
  patientId,
  visit,
  appointment,
  doctors,
  services,
  chart,
  onClose,
  onSaved,
}: {
  patientId: number
  visit?: Visit
  appointment?: Appointment
  doctors: Doctor[]
  services: Service[]
  chart: { tooth: number; status: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const user = useUser()
  const { busy, run } = useAction()
  const initialItems = (): VisitItem[] => {
    if (visit) return visit.items.map((i) => ({ service_id: i.service_id, name: i.name, tooth: i.tooth, qty: i.qty, price: i.price }))
    const s = appointment?.service_id ? services.find((x) => x.id === appointment.service_id) : undefined
    return s ? [{ service_id: s.id, name: s.name, tooth: appointment?.teeth ?? '', qty: 1, price: s.price }] : []
  }
  const [f, setF] = useState({
    date: visit?.date ?? todayYmd(),
    doctor_id: String(visit?.doctor_id ?? appointment?.doctor_id ?? (user.is_doctor || user.role === 'doctor' ? user.id : doctors[0]?.id ?? '')),
    complaint: visit?.complaint ?? appointment?.patient_note ?? '',
    diagnosis: visit?.diagnosis ?? '',
    treatment: visit?.treatment ?? '',
    teeth: visit?.teeth ?? appointment?.teeth ?? '',
    notes: visit?.notes ?? '',
    next_visit: visit?.next_visit ?? '',
    discount: String(visit?.discount ?? 0),
  })
  const [items, setItems] = useState<VisitItem[]>(initialItems)
  const [recall, setRecall] = useState(!visit)
  const [showChart, setShowChart] = useState(false)
  const total = useMemo(() => items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0), [items])
  const selectedTeeth = new Set(
    f.teeth
      .split(/[,\s]+/)
      .map(Number)
      .filter(Boolean),
  )

  const setItem = (i: number, patch: Partial<VisitItem>) => setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const save = () =>
    run(async () => {
      const body = {
        ...f,
        doctor_id: f.doctor_id ? Number(f.doctor_id) : null,
        discount: Number(f.discount) || 0,
        items: items.filter((i) => i.name.trim()).map((i) => ({ ...i, qty: Number(i.qty) || 1, price: Number(i.price) || 0 })),
      }
      if (visit) await api.patch(`/api/patients/visits/${visit.id}`, body)
      else await api.post(`/api/patients/${patientId}/visits`, { ...body, appointment_id: appointment?.id ?? null, set_recall: recall })
      onSaved()
    }, 'Эмчилгээ хадгалагдлаа')

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={visit ? 'Эмчилгээний бүртгэл засах' : 'Үзлэг, эмчилгээ бүртгэх'}
      footer={
        <>
          <span className="mr-auto self-center font-display text-lg font-bold tabular-nums">
            Нийт: {money(total - (Number(f.discount) || 0))}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} onClick={() => void save()}>
            Хадгалах
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="date" label="Огноо" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <Select label="Эмч" value={f.doctor_id} onChange={(e) => setF({ ...f, doctor_id: e.target.value })}>
            <option value="">—</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <div>
            <Input label="Шүд" hint="FDI: 16, 26" value={f.teeth} onChange={(e) => setF({ ...f, teeth: e.target.value })} />
            <button type="button" className="mt-1 text-xs font-semibold text-blue" onClick={() => setShowChart((v) => !v)}>
              {showChart ? 'Диаграм хаах' : 'Диаграмаас сонгох'}
            </button>
          </div>
        </div>
        {showChart && (
          <ToothChart
            chart={chart}
            selected={selectedTeeth}
            onToothClick={(n) => {
              const next = new Set(selectedTeeth)
              if (next.has(n)) next.delete(n)
              else next.add(n)
              setF({ ...f, teeth: [...next].sort((a, b) => a - b).join(', ') })
            }}
          />
        )}
        <Textarea label="Зовиур" value={f.complaint} onChange={(e) => setF({ ...f, complaint: e.target.value })} className="[&_textarea]:min-h-16" />
        <Input label="Онош" value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} placeholder="Жишээ: Цоорол (K02.1)" />
        <Textarea label="Хийсэн эмчилгээ" value={f.treatment} onChange={(e) => setF({ ...f, treatment: e.target.value })} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Үйлчилгээ, үнэ</p>
            <Button size="sm" variant="ghost" onClick={() => setItems([...items, { service_id: null, name: '', tooth: '', qty: 1, price: 0 }])}>
              <Plus size={15} /> Мөр нэмэх
            </Button>
          </div>
          {items.length === 0 && <p className="rounded-xl bg-soft px-3 py-3 text-sm text-muted">Үнэ бүртгэх бол мөр нэмнэ үү.</p>}
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-soft p-2 sm:grid-cols-[1.6fr_0.7fr_0.5fr_0.9fr_auto]">
                <select
                  className="h-10 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-line"
                  value={it.service_id ?? (it.name ? 'custom' : '')}
                  onChange={(e) => {
                    const s = services.find((x) => x.id === Number(e.target.value))
                    if (s) setItem(i, { service_id: s.id, name: s.name, price: s.price || it.price })
                    else setItem(i, { service_id: null })
                  }}
                >
                  <option value="">Үйлчилгээ сонгох…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="custom">Бусад (гараар)</option>
                </select>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 sm:order-last" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Мөр устгах">
                  <Trash2 size={16} />
                </button>
                {!it.service_id && (
                  <input className="col-span-2 h-10 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-line sm:col-span-1" placeholder="Нэр" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                )}
                <input className="h-10 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-line" placeholder="Шүд" value={it.tooth} onChange={(e) => setItem(i, { tooth: e.target.value })} />
                <input className="h-10 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-line" type="number" min={1} placeholder="Тоо" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
                <input className="col-span-2 h-10 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-line sm:col-span-1" type="number" min={0} step={1000} placeholder="Үнэ ₮" value={it.price} onChange={(e) => setItem(i, { price: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-3 text-sm">
            <span className="text-muted">Дүн: {money(total)}</span>
            <label className="flex items-center gap-2">
              Хөнгөлөлт ₮
              <input className="h-9 w-28 rounded-lg border-0 bg-white px-2 ring-1 ring-line" type="number" min={0} step={1000} value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} />
            </label>
          </div>
        </div>
        <Input label="Дараагийн үзлэг / зөвлөмж" value={f.next_visit} onChange={(e) => setF({ ...f, next_visit: e.target.value })} placeholder="Жишээ: 2 долоо хоногийн дараа ломбо солих" />
        <Textarea label="Тэмдэглэл" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="[&_textarea]:min-h-16" />
        {!visit && <Toggle checked={recall} onChange={setRecall} label="Давтан үзлэгийн сануулга" hint="Тохиргоонд заасан сарын дараа SMS-ээр сануулна" />}
      </div>
    </Modal>
  )
}

function PaymentForm({
  patientId,
  balance,
  visits,
  payments,
  onClose,
  onSaved,
}: {
  patientId: number
  balance: number
  visits: Visit[]
  payments: Payment[]
  onClose: () => void
  onSaved: () => void
}) {
  const { busy, run } = useAction()
  const [amount, setAmount] = useState(String(Math.max(0, balance) || ''))
  const [method, setMethod] = useState('cash')
  const [date, setDate] = useState(todayYmd())
  const [visitId, setVisitId] = useState(() => {
    const unpaid = visits.find((v) => v.total - v.discount > payments.filter((y) => y.visit_id === v.id).reduce((s, y) => s + y.amount, 0))
    return unpaid ? String(unpaid.id) : ''
  })
  const [note, setNote] = useState('')
  const save = () =>
    run(async () => {
      await api.post(`/api/patients/${patientId}/payments`, { amount: Number(amount), method, paid_at: date, visit_id: visitId ? Number(visitId) : null, note })
      onSaved()
    }, 'Төлбөр бүртгэгдлээ')
  return (
    <Modal
      open
      onClose={onClose}
      title="Төлбөр авах"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={!(Number(amount) > 0)} onClick={() => void save()}>
            Бүртгэх
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {balance > 0 && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">Одоогийн үлдэгдэл: {money(balance)}</p>}
        <Input type="number" label="Дүн ₮" min={0} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <div>
          <p className="mb-1.5 text-sm font-semibold">Төлбөрийн хэлбэр</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Object.entries(METHOD).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMethod(k)}
                className={`h-10 rounded-xl text-sm font-semibold ring-1 ${method === k ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:ring-blue'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" label="Огноо" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Эмчилгээ" value={visitId} onChange={(e) => setVisitId(e.target.value)}>
            <option value="">Ерөнхий</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.date} · {money(v.total - v.discount)}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Тэмдэглэл" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  )
}

function FilesTab({ patientId, files, onChanged }: { patientId: number; files: PFile[]; onChanged: () => void }) {
  const { busy, run } = useAction()
  const [kind, setKind] = useState('xray')
  const [note, setNote] = useState('')
  const upload = (file: File) =>
    run(async () => {
      const form = new FormData()
      form.set('file', file)
      form.set('kind', kind)
      form.set('note', note)
      await api.post(`/api/patients/${patientId}/files`, form)
      setNote('')
      onChanged()
    }, 'Файл хадгалагдлаа')
  return (
    <div className="space-y-4">
      <Card title="Файл нэмэх">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <Select label="Төрөл" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="xray">Рентген</option>
            <option value="photo">Зураг</option>
            <option value="document">Баримт</option>
          </Select>
          <Input label="Тайлбар" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ: Дэлгэмэл зураг" />
          <label className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl brand-grad px-4 font-semibold text-white ${busy ? 'opacity-50' : ''}`}>
            <Upload size={17} /> Файл сонгох
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void upload(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">JPG, PNG, WEBP эсвэл PDF, 20MB хүртэл. Файлууд зөвхөн нэвтэрсэн ажилтанд харагдана.</p>
      </Card>
      {files.length === 0 ? (
        <Empty icon={<FileText size={22} />} title="Файл алга" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <a href={`/api/patients/files/${f.id}`} target="_blank" rel="noopener" className="block aspect-[4/3] bg-soft">
                {f.mime.startsWith('image/') ? (
                  <img src={`/api/patients/files/${f.id}`} alt={f.note || f.original_name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-full place-items-center text-muted">
                    <FileText size={36} />
                  </span>
                )}
              </a>
              <div className="flex items-start justify-between gap-2 p-2.5">
                <div className="min-w-0 text-xs">
                  <p className="truncate font-semibold">{f.note || f.original_name}</p>
                  <p className="text-muted">
                    {{ xray: 'Рентген', photo: 'Зураг', document: 'Баримт' }[f.kind] ?? f.kind} · {f.created_at.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Устгах"
                  onClick={() => {
                    if (confirm('Файлыг устгах уу?')) void run(async () => (await api.del(`/api/patients/files/${f.id}`), onChanged()), 'Устгагдлаа')
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SmsModal({ phone, patientId, name, onClose }: { phone: string; patientId: number; name: string; onClose: () => void }) {
  const { busy, run } = useAction()
  const [msg, setMsg] = useState(`Sain baina uu ${name}! `)
  return (
    <Modal
      open
      onClose={onClose}
      title={`SMS илгээх · ${formatPhone(phone)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button
            busy={busy}
            disabled={msg.trim().length < 2}
            onClick={() =>
              void run(async () => {
                const r = await api.post<{ ok: boolean; error?: string }>('/api/sms/send', { phone, message: msg, patient_id: patientId })
                if (!r.ok) throw new Error(r.error ?? 'SMS илгээгдсэнгүй')
                onClose()
              }, 'SMS илгээгдлээ')
            }
          >
            Илгээх
          </Button>
        </>
      }
    >
      <Textarea label="Мессеж" hint={`${msg.length} тэмдэгт`} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <p className="mt-2 text-xs text-muted">Тохиргооноос хамааран кирилл үсгийг латин болгож илгээнэ (хямд).</p>
    </Modal>
  )
}
