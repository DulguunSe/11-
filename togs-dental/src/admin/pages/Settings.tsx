import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyRound, Pencil, Plus, Send } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { WEEKDAYS, formatPhone, money } from '../../shared/format.ts'
import type { Clinic, Service } from '../../shared/types.ts'
import { ROLE_LABEL, useAction, useLoad, useUser } from '../lib.tsx'
import { Badge, Button, Card, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea, Toggle } from '../ui.tsx'

type Tab = 'clinic' | 'services' | 'staff' | 'sms' | 'audit'

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'clinic'
  return (
    <div>
      <PageHeader title="Тохиргоо" subtitle="Эмнэлгийн мэдээлэл, үйлчилгээ, ажилтнууд, SMS" />
      <Tabs
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        items={[
          { value: 'clinic', label: 'Эмнэлэг, цагийн хуваарь' },
          { value: 'services', label: 'Үйлчилгээ, үнэ' },
          { value: 'staff', label: 'Ажилтнууд' },
          { value: 'sms', label: 'SMS' },
          { value: 'audit', label: 'Үйлдлийн түүх' },
        ]}
      />
      {tab === 'clinic' && <ClinicTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'sms' && <SmsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}

function ClinicTab() {
  const data = useLoad(() => api.get<Clinic>('/api/settings/clinic'), [])
  const [c, setC] = useState<Clinic | null>(null)
  const { busy, run } = useAction()
  useEffect(() => {
    if (data.data) setC(data.data)
  }, [data.data])
  if (data.error) return <ErrorBox message={data.error} onRetry={data.reload} />
  if (!c) return <Spinner />
  const set = <K extends keyof Clinic>(k: K, v: Clinic[K]) => setC({ ...c, [k]: v })
  const save = () => run(async () => setC(await api.put<Clinic>('/api/settings/clinic', c)), 'Хадгалагдлаа. Вэбсайт шинэчлэгдлээ.')
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Эмнэлгийн мэдээлэл (вэбсайтад харагдана)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Нэр" value={c.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Богино нэр" value={c.shortName} onChange={(e) => set('shortName', e.target.value)} />
          <Input label="Хот" value={c.city} onChange={(e) => set('city', e.target.value)} />
          <Textarea className="sm:col-span-2" label="Уриа, танилцуулга" value={c.tagline} onChange={(e) => set('tagline', e.target.value)} />
          <Input label="Утас 1" value={c.phone1} onChange={(e) => set('phone1', e.target.value)} />
          <Input label="Утас 2" value={c.phone2} onChange={(e) => set('phone2', e.target.value)} />
          <Input className="sm:col-span-2" label="И-мэйл" value={c.email} onChange={(e) => set('email', e.target.value)} />
          <Input className="sm:col-span-2" label="Хаяг" value={c.address} onChange={(e) => set('address', e.target.value)} />
          <Input label="Товч хаяг" value={c.addressShort} onChange={(e) => set('addressShort', e.target.value)} />
          <Input label="Google Maps хайлт" value={c.mapsQuery} onChange={(e) => set('mapsQuery', e.target.value)} />
          <Input className="sm:col-span-2" label="Facebook хуудас" value={c.facebook} onChange={(e) => set('facebook', e.target.value)} />
          <Input label="Messenger холбоос" value={c.messenger} onChange={(e) => set('messenger', e.target.value)} />
          <Input label="FB дагагч (жш: 716+)" value={c.fbFollowers} onChange={(e) => set('fbFollowers', e.target.value)} />
        </div>
      </Card>
      <div className="space-y-5">
        <Card title="Ажлын цаг">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const key = String(d) as keyof Clinic['hours']
              const h = c.hours[key]
              return (
                <div key={d} className="grid grid-cols-[90px_auto_1fr] items-center gap-3">
                  <span className="text-sm font-semibold">{WEEKDAYS[d]}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(h)}
                    aria-label={`${WEEKDAYS[d]} ажиллана`}
                    onChange={(e) => set('hours', { ...c.hours, [key]: e.target.checked ? ['09:00', '18:00'] : null })}
                  />
                  {h ? (
                    <div className="flex items-center gap-2">
                      <input type="time" className="h-10 rounded-lg border-0 px-2 ring-1 ring-line" value={h[0]} onChange={(e) => set('hours', { ...c.hours, [key]: [e.target.value, h[1]] })} />
                      –
                      <input type="time" className="h-10 rounded-lg border-0 px-2 ring-1 ring-line" value={h[1]} onChange={(e) => set('hours', { ...c.hours, [key]: [h[0], e.target.value] })} />
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Амарна</span>
                  )}
                </div>
              )
            })}
            <div className="grid grid-cols-[90px_auto_1fr] items-center gap-3 border-t border-line pt-3">
              <span className="text-sm font-semibold">Үдийн цай</span>
              <input type="checkbox" className="h-4 w-4" checked={Boolean(c.lunch)} aria-label="Үдийн завсарлагатай" onChange={(e) => set('lunch', e.target.checked ? ['13:00', '14:00'] : null)} />
              {c.lunch ? (
                <div className="flex items-center gap-2">
                  <input type="time" className="h-10 rounded-lg border-0 px-2 ring-1 ring-line" value={c.lunch[0]} onChange={(e) => set('lunch', [e.target.value, c.lunch![1]])} />
                  –
                  <input type="time" className="h-10 rounded-lg border-0 px-2 ring-1 ring-line" value={c.lunch[1]} onChange={(e) => set('lunch', [c.lunch![0], e.target.value])} />
                </div>
              ) : (
                <span className="text-sm text-muted">Байхгүй</span>
              )}
            </div>
          </div>
        </Card>
        <Card title="Онлайн захиалга">
          <div className="space-y-3">
            <Toggle checked={c.bookingEnabled} onChange={(v) => set('bookingEnabled', v)} label="Вэбсайтаар цаг захиалах" />
            <Toggle checked={c.autoConfirm} onChange={(v) => set('autoConfirm', v)} label="Автоматаар баталгаажуулах" hint="Унтраасан бол ажилтан залгаж баталгаажуулна" />
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" label="Цагийн алхам (мин)" min={10} max={120} value={c.slotMinutes} onChange={(e) => set('slotMinutes', Number(e.target.value))} />
              <Input type="number" label="Хэдэн өдрийн өмнө" min={1} max={60} value={c.daysAhead} onChange={(e) => set('daysAhead', Number(e.target.value))} />
              <Input type="number" label="Хамгийн багадаа (мин өмнө)" min={0} value={c.leadMinutes} onChange={(e) => set('leadMinutes', Number(e.target.value))} />
            </div>
          </div>
        </Card>
        <Button busy={busy} className="w-full" onClick={() => void save()}>
          Хадгалах
        </Button>
      </div>
    </div>
  )
}

const ICON_LABEL: Record<string, string> = {
  tooth: 'Шүд',
  spark: 'Гялбаа (цайруулалт)',
  bridge: 'Гүүр',
  link: 'Холбоос (риббонд)',
  root: 'Үндэс',
  baby: 'Хүүхэд',
  steth: 'Үзлэг',
  smile: 'Инээмсэглэл',
  shield: 'Хамгаалалт',
}

function ServicesTab() {
  const data = useLoad(() => api.get<{ items: Service[] }>('/api/services'), [])
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  if (data.error) return <ErrorBox message={data.error} onRetry={data.reload} />
  if (!data.data) return <Spinner />
  return (
    <Card
      title="Үйлчилгээ, үнийн жагсаалт"
      action={
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus size={15} /> Нэмэх
        </Button>
      }
    >
      <ul className="divide-y divide-line">
        {data.data.items.map((s) => (
          <li key={s.id} className={`flex items-center justify-between gap-3 py-3 ${s.active ? '' : 'opacity-50'}`}>
            <div className="min-w-0">
              <p className="font-semibold">
                {s.name} {s.tag && <Badge tone="green">{s.tag}</Badge>}
              </p>
              <p className="text-xs text-muted">
                {s.price ? money(s.price) : s.price_note || 'Үнэ оруулаагүй'} · {s.duration} мин
                {s.show_on_site ? ' · Вэбсайтад' : ''}
                {s.online_booking ? ' · Онлайн захиалгатай' : ''}
                {!s.active && ' · Идэвхгүй'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing(s)}>
              <Pencil size={15} /> Засах
            </Button>
          </li>
        ))}
      </ul>
      {editing && <ServiceForm service={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), void data.reload())} />}
    </Card>
  )
}

function ServiceForm({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const { busy, run } = useAction()
  const [f, setF] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    icon: service?.icon ?? 'tooth',
    price: String(service?.price ?? 0),
    price_note: service?.price_note ?? '',
    duration: String(service?.duration ?? 30),
    tag: service?.tag ?? '',
    show_on_site: Boolean(service?.show_on_site ?? 1),
    online_booking: Boolean(service?.online_booking ?? 1),
    sort: String(service?.sort ?? 0),
    active: Boolean(service?.active ?? 1),
  })
  const save = () =>
    run(async () => {
      const body = { ...f, price: Number(f.price) || 0, duration: Number(f.duration) || 30, sort: Number(f.sort) || 0 }
      if (service) await api.patch(`/api/services/${service.id}`, body)
      else await api.post('/api/services', body)
      onSaved()
    }, 'Хадгалагдлаа')
  return (
    <Modal
      open
      onClose={onClose}
      title={service ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={f.name.trim().length < 2} onClick={() => void save()}>
            Хадгалах
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Нэр" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Textarea className="sm:col-span-2" label="Тайлбар (вэбсайтад)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Input type="number" label="Үнэ ₮" hint="0 = үзлэгийн дараа" min={0} step={1000} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <Input label="Үнийн тайлбар" value={f.price_note} onChange={(e) => setF({ ...f, price_note: e.target.value })} />
        <Input type="number" label="Үргэлжлэх (мин)" min={10} step={5} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} />
        <Select label="Дүрс" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })}>
          {Object.entries(ICON_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Input label="Шошго" hint="жш: Онцлох" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />
        <Input type="number" label="Дараалал" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} />
        <div className="space-y-1 sm:col-span-2">
          <Toggle checked={f.show_on_site} onChange={(v) => setF({ ...f, show_on_site: v })} label="Вэбсайтын үйлчилгээ хэсэгт харуулах" />
          <Toggle checked={f.online_booking} onChange={(v) => setF({ ...f, online_booking: v })} label="Онлайнаар захиалж болно" />
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Идэвхтэй" />
        </div>
      </div>
    </Modal>
  )
}

type Staff = {
  id: number
  username: string
  name: string
  role: 'admin' | 'doctor' | 'reception'
  is_doctor: number
  phone: string
  specialty: string
  bio: string
  color: string
  online_booking: number
  show_on_site: number
  active: number
  must_change_password: number
}

function StaffTab() {
  const data = useLoad(() => api.get<{ items: Staff[] }>('/api/staff'), [])
  const [editing, setEditing] = useState<Staff | 'new' | null>(null)
  const [pw, setPw] = useState<Staff | null>(null)
  if (data.error) return <ErrorBox message={data.error} onRetry={data.reload} />
  if (!data.data) return <Spinner />
  return (
    <Card
      title="Ажилтнууд, эрх"
      action={
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus size={15} /> Ажилтан нэмэх
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted">
        <b>Админ</b> бүх хэсэг · <b>Эмч</b> өөрийн цаг, үйлчлүүлэгчийн түүх, эмчилгээ бүртгэл · <b>Ресепшн</b> цаг, үйлчлүүлэгч, төлбөр, SMS, маркетинг.
      </p>
      <ul className="divide-y divide-line">
        {data.data.items.map((s) => (
          <li key={s.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${s.active ? '' : 'opacity-50'}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-9 w-9 shrink-0 rounded-xl" style={{ background: s.color }} />
              <div className="min-w-0">
                <p className="font-semibold">
                  {s.name} <span className="font-normal text-muted">@{s.username}</span>
                </p>
                <p className="text-xs text-muted">
                  {ROLE_LABEL[s.role]}
                  {s.is_doctor && s.role !== 'doctor' ? ' · эмч' : ''}
                  {s.specialty && ` · ${s.specialty}`}
                  {s.phone && ` · ${formatPhone(s.phone)}`}
                  {!s.active && ' · Идэвхгүй'}
                  {s.must_change_password ? ' · нууц үг солиогүй' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPw(s)}>
                <KeyRound size={15} /> Нууц үг
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(s)}>
                <Pencil size={15} /> Засах
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {editing && <StaffForm staff={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), void data.reload())} />}
      {pw && <ResetPassword staff={pw} onClose={() => setPw(null)} />}
    </Card>
  )
}

const COLORS = ['#1466d6', '#3fae12', '#a8833a', '#7c3aed', '#e11d48', '#0ea5e9', '#f97316', '#0c1a2c']

function StaffForm({ staff, onClose, onSaved }: { staff: Staff | null; onClose: () => void; onSaved: () => void }) {
  const me = useUser()
  const { busy, run } = useAction()
  const [f, setF] = useState({
    username: staff?.username ?? '',
    password: '',
    name: staff?.name ?? '',
    role: staff?.role ?? 'doctor',
    is_doctor: Boolean(staff?.is_doctor ?? 1),
    phone: staff?.phone ?? '',
    specialty: staff?.specialty ?? '',
    bio: staff?.bio ?? '',
    color: staff?.color ?? COLORS[0],
    online_booking: Boolean(staff?.online_booking ?? 1),
    show_on_site: Boolean(staff?.show_on_site ?? 1),
    active: Boolean(staff?.active ?? 1),
  })
  const save = () =>
    run(async () => {
      const { username, password, ...rest } = f
      const body = { ...rest, is_doctor: f.role === 'doctor' || f.is_doctor }
      if (staff) await api.patch(`/api/staff/${staff.id}`, body)
      else await api.post('/api/staff', { ...body, username, password })
      onSaved()
    }, 'Хадгалагдлаа')
  const isDoctor = f.role === 'doctor' || f.is_doctor
  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? 'Ажилтан засах' : 'Шинэ ажилтан'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={f.name.trim().length < 2 || (!staff && (f.username.length < 3 || f.password.length < 8))} onClick={() => void save()}>
            Хадгалах
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Нэр" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Б. Болормаа" />
        {!staff && (
          <>
            <Input label="Нэвтрэх нэр" hint="латинаар" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.trim() })} autoComplete="off" />
            <Input label="Анхны нууц үг" hint="8+ тэмдэгт" type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="off" />
          </>
        )}
        <Select label="Эрх" value={f.role} disabled={staff?.id === me.id} onChange={(e) => setF({ ...f, role: e.target.value as Staff['role'] })}>
          <option value="doctor">Эмч</option>
          <option value="reception">Ресепшн</option>
          <option value="admin">Админ</option>
        </Select>
        <Input label="Утас" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        {f.role === 'admin' && (
          <div className="sm:col-span-2">
            <Toggle checked={f.is_doctor} onChange={(v) => setF({ ...f, is_doctor: v })} label="Эмчилгээ хийдэг (хуваарьт харагдана)" />
          </div>
        )}
        {isDoctor && (
          <>
            <Input className="sm:col-span-2" label="Мэргэшил" value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} placeholder="Ерөнхий шүдний эмч" />
            <Textarea className="sm:col-span-2" label="Товч танилцуулга (вэбсайтад)" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-semibold">Хуваарийн өнгө</p>
              <div className="flex gap-2">
                {COLORS.map((col) => (
                  <button key={col} type="button" aria-label={col} onClick={() => setF({ ...f, color: col })} className={`h-8 w-8 rounded-lg ring-2 ${f.color === col ? 'ring-ink' : 'ring-transparent'}`} style={{ background: col }} />
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Toggle checked={f.online_booking} onChange={(v) => setF({ ...f, online_booking: v })} label="Онлайнаар цаг захиалж болно" />
              <Toggle checked={f.show_on_site} onChange={(v) => setF({ ...f, show_on_site: v })} label="Вэбсайтад харуулах" />
            </div>
          </>
        )}
        {staff && staff.id !== me.id && (
          <div className="sm:col-span-2">
            <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Идэвхтэй" hint="Идэвхгүй болговол нэвтэрч чадахгүй" />
          </div>
        )}
      </div>
    </Modal>
  )
}

function ResetPassword({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const { busy, run } = useAction()
  const [pw, setPw] = useState('')
  return (
    <Modal
      open
      onClose={onClose}
      title={`${staff.name} — нууц үг шинэчлэх`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={pw.length < 8} onClick={() => void run(async () => (await api.post(`/api/staff/${staff.id}/password`, { password: pw }), onClose()), 'Нууц үг шинэчлэгдлээ')}>
            Хадгалах
          </Button>
        </>
      }
    >
      <Input label="Түр нууц үг" hint="8+ тэмдэгт" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" />
      <p className="mt-2 text-xs text-muted">Ажилтан дараагийн нэвтрэхдээ өөрийн нууц үгийг тохируулна.</p>
    </Modal>
  )
}

type SmsCfg = {
  enabled: boolean
  method: 'GET' | 'POST'
  url: string
  body: string
  headers: string
  contentType: string
  successMatch: string
  latin: boolean
  reminderEnabled: boolean
  reminderHour: number
  reminderTemplate: string
  bookingEnabled: boolean
  bookingTemplate: string
  recallEnabled: boolean
  recallMonths: number
  recallTemplate: string
}

function SmsTab() {
  const data = useLoad(() => api.get<SmsCfg>('/api/settings/sms'), [])
  const [s, setS] = useState<SmsCfg | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const { busy, run } = useAction()
  useEffect(() => {
    if (data.data) setS(data.data)
  }, [data.data])
  if (data.error) return <ErrorBox message={data.error} onRetry={data.reload} />
  if (!s) return <Spinner />
  const save = () => run(async () => setS(await api.put<SmsCfg>('/api/settings/sms', s)), 'SMS тохиргоо хадгалагдлаа')
  const test = () =>
    run(async () => {
      const r = await api.post<{ ok: boolean; error?: string }>('/api/settings/sms/test', { phone: testPhone, config: s })
      if (!r.ok) throw new Error(r.error ?? 'Илгээгдсэнгүй')
    }, 'Туршилтын SMS илгээгдлээ')
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="SMS үйлчилгээ (gateway)">
        <div className="space-y-3">
          <Toggle checked={s.enabled} onChange={(v) => setS({ ...s, enabled: v })} label="SMS идэвхтэй" />
          <p className="text-sm text-muted">
            Монголын ямар ч SMS үйлчилгээ (Мобиком, Юнител, Скайтел, MessagePro г.м.)-ний HTTP API-г холбоно. Хаягт <code>{'{phone}'}</code> болон <code>{'{message}'}</code> орлуулагдана.
          </p>
          <Select label="Хүсэлтийн төрөл" value={s.method} onChange={(e) => setS({ ...s, method: e.target.value as SmsCfg['method'] })}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </Select>
          <Input label="API хаяг" value={s.url} onChange={(e) => setS({ ...s, url: e.target.value })} placeholder="https://api.example.mn/send?key=XXXX&to={phone}&text={message}" />
          {s.method === 'POST' && (
            <>
              <Input label="Content-Type" value={s.contentType} onChange={(e) => setS({ ...s, contentType: e.target.value })} />
              <Textarea label="Хүсэлтийн бие" value={s.body} onChange={(e) => setS({ ...s, body: e.target.value })} placeholder='{"to":"{phone}","text":"{message}"}' />
            </>
          )}
          <Textarea label="Толгой (header)" hint="мөр бүрт Нэр: утга" value={s.headers} onChange={(e) => setS({ ...s, headers: e.target.value })} placeholder="Authorization: Bearer XXXX" className="[&_textarea]:min-h-16" />
          <Input label="Амжилттай хариуны текст" hint="заавал биш" value={s.successMatch} onChange={(e) => setS({ ...s, successMatch: e.target.value })} placeholder="OK" />
          <Toggle checked={s.latin} onChange={(v) => setS({ ...s, latin: v })} label="Кирилл үсгийг латин болгох" hint="Латин SMS 160 тэмдэгт, кирилл 70 — хямд" />
          <div className="flex gap-2 border-t border-line pt-3">
            <Input className="flex-1" placeholder="Туршилтын утас" inputMode="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
            <Button variant="secondary" busy={busy} disabled={testPhone.replace(/\D/g, '').length < 8 || !s.url} onClick={() => void test()}>
              <Send size={15} /> Турших
            </Button>
          </div>
        </div>
      </Card>
      <div className="space-y-5">
        <Card title="Автомат мессежүүд">
          <p className="mb-3 text-xs text-muted">
            Хувьсагч: <code>{'{clinic}'}</code> <code>{'{name}'}</code> <code>{'{date}'}</code> <code>{'{time}'}</code> <code>{'{service}'}</code> <code>{'{doctor}'}</code> <code>{'{phone}'}</code> <code>{'{link}'}</code>
          </p>
          <div className="space-y-4">
            <div>
              <Toggle checked={s.reminderEnabled} onChange={(v) => setS({ ...s, reminderEnabled: v })} label="Маргаашийн цагийн сануулга" />
              <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
                <Textarea value={s.reminderTemplate} onChange={(e) => setS({ ...s, reminderTemplate: e.target.value })} className="[&_textarea]:min-h-20" />
                <Input type="number" label="Илгээх цаг" min={6} max={21} value={s.reminderHour} onChange={(e) => setS({ ...s, reminderHour: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Toggle checked={s.bookingEnabled} onChange={(v) => setS({ ...s, bookingEnabled: v })} label="Онлайн захиалга хүлээн авсан" />
              <Textarea value={s.bookingTemplate} onChange={(e) => setS({ ...s, bookingTemplate: e.target.value })} className="mt-2 [&_textarea]:min-h-20" />
            </div>
            <div>
              <Toggle checked={s.recallEnabled} onChange={(v) => setS({ ...s, recallEnabled: v })} label="Давтан үзлэгийн сануулга" hint="Эмчилгээнээс хойш тохируулсан хугацааны дараа" />
              <div className="mt-2 grid grid-cols-[1fr_120px] gap-2">
                <Textarea value={s.recallTemplate} onChange={(e) => setS({ ...s, recallTemplate: e.target.value })} className="[&_textarea]:min-h-20" />
                <Input type="number" label="Сарын дараа" min={1} max={24} value={s.recallMonths} onChange={(e) => setS({ ...s, recallMonths: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </Card>
        <Button busy={busy} className="w-full" onClick={() => void save()}>
          Хадгалах
        </Button>
      </div>
    </div>
  )
}

type Audit = { id: number; user_name: string | null; action: string; entity: string; entity_id: number | null; detail: string; created_at: string }
const ACTION: Record<string, string> = {
  login: 'Нэвтэрсэн',
  create: 'Үүсгэсэн',
  update: 'Зассан',
  delete: 'Устгасан',
  view: 'Үзсэн',
  upload: 'Файл нэмсэн',
  export: 'Татаж авсан',
  password_change: 'Нууц үг сольсон',
  password_reset: 'Нууц үг шинэчилсэн',
  link: 'Холбосон',
  approve: 'Баталсан',
  reject: 'Татгалзсан',
  publish: 'Нийтэлсэн',
  sms: 'SMS илгээсэн',
  ai_generate: 'AI пост үүсгэсэн',
  ai_learn: 'AI хэв маяг сургасан',
}
const ENTITY: Record<string, string> = {
  patient: 'үйлчлүүлэгч',
  appointment: 'цаг',
  visit: 'эмчилгээ',
  payment: 'төлбөр',
  user: 'ажилтан',
  service: 'үйлчилгээ',
  settings: 'тохиргоо',
  post: 'пост',
  media: 'зураг',
  patient_file: 'файл',
  payments: 'төлбөр',
  visits: 'эмчилгээ',
}

function AuditTab() {
  const [page, setPage] = useState(1)
  const data = useLoad(() => api.get<{ items: Audit[] }>(`/api/audit?page=${page}`), [page])
  if (data.error) return <ErrorBox message={data.error} onRetry={data.reload} />
  if (!data.data) return <Spinner />
  return (
    <Card title="Үйлдлийн түүх" action={<span className="text-xs text-muted">Хэн, хэзээ, юуг өөрчилсөн</span>}>
      <ul className="divide-y divide-line text-sm">
        {data.data.items.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span>
              <b>{a.user_name ?? 'Систем'}</b> {ACTION[a.action] ?? a.action} · {ENTITY[a.entity] ?? a.entity}
              {a.entity_id ? ` #${a.entity_id}` : ''} {a.detail && <span className="text-muted">({a.detail})</span>}
            </span>
            <span className="text-xs tabular-nums text-muted">{a.created_at}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Шинэ
        </Button>
        <Button size="sm" variant="secondary" disabled={data.data.items.length < 100} onClick={() => setPage(page + 1)}>
          Хуучин
        </Button>
      </div>
    </Card>
  )
}
