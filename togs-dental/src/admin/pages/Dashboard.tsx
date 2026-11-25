import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, CalendarDays, CircleDollarSign, Clock, Megaphone, Plus, TrendingUp, UserCheck } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { humanDate, money, shortDate } from '../../shared/format.ts'
import type { Appointment, Service } from '../../shared/types.ts'
import { useAction, useLoad, useUser } from '../lib.tsx'
import { Badge, Button, Card, Empty, ErrorBox, PageHeader, Spinner, Stat, StatusBadge } from '../ui.tsx'
import { AppointmentDrawer, AppointmentForm, patientName, sourceBadge, type Doctor } from '../components/appointments.tsx'

type Dash = {
  date: string
  today: Appointment[]
  pending: Appointment[]
  stats: { total: number; arrived: number; completed: number; pending: number; tomorrow: number; revenueToday: number; revenueMonth: number }
  marketing: { drafts: number; failed: number; next: { id: number; scheduled_at: string; topic: string } | null }
  sms: { enabled: boolean; sent: number | null; failed: number | null }
  warnings: string[]
}

export default function Dashboard() {
  const user = useUser()
  const { data, error, loading, reload } = useLoad(() => api.get<Dash>('/api/dashboard'), [])
  const meta = useLoad(
    () => Promise.all([api.get<{ items: Doctor[] }>('/api/doctors'), api.get<{ items: Service[] }>('/api/services')]),
    [],
  )
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [creating, setCreating] = useState(false)
  const { busy, run } = useAction()
  const doctors = meta.data?.[0].items ?? []
  const services = meta.data?.[1].items ?? []

  const confirm = (a: Appointment) =>
    run(async () => {
      await api.patch(`/api/appointments/${a.id}`, { status: 'confirmed' })
      await reload()
    }, 'Баталгаажлаа')

  const hello = new Date().getHours() < 12 ? 'Өглөөний мэнд' : 'Сайн байна уу'
  return (
    <div>
      <PageHeader
        title={`${hello}, ${user.name.split(' ').at(-1)}`}
        subtitle={data ? humanDate(data.date) : undefined}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Шинэ цаг
          </Button>
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && (
        <div className="space-y-5">
          {data.warnings.length > 0 && (
            <div className="space-y-2">
              {data.warnings.map((w) => (
                <div key={w} className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Өнөөдрийн цаг" value={data.stats.total} sub={`${data.stats.arrived} ирсэн · ${data.stats.completed} дууссан`} icon={<CalendarDays size={17} />} />
            <Stat label="Баталгаажаагүй" value={data.stats.pending} sub="онлайн захиалга" icon={<Clock size={17} />} tone="amber" />
            <Stat label="Өнөөдрийн орлого" value={money(data.stats.revenueToday)} sub={user.role === 'doctor' ? 'таны' : 'нийт төлөгдсөн'} icon={<CircleDollarSign size={17} />} tone="green" />
            <Stat label="Энэ сарын орлого" value={money(data.stats.revenueMonth)} sub={`Маргааш ${data.stats.tomorrow} цаг`} icon={<TrendingUp size={17} />} tone="violet" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card
              title="Өнөөдрийн хуваарь"
              action={
                <Link to="/schedule" className="text-sm font-semibold text-blue">
                  Бүгдийг харах →
                </Link>
              }
            >
              {data.today.length === 0 ? (
                <Empty icon={<CalendarDays size={22} />} title="Өнөөдөр цаг алга" text="Шинэ цаг бүртгэх эсвэл онлайн захиалга хүлээх" />
              ) : (
                <ul className="divide-y divide-line">
                  {data.today.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => setSelected(a)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-soft/60">
                        <span className="w-14 shrink-0 font-display text-[15px] font-bold tabular-nums">{a.start_time}</span>
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: a.doctor_color ?? '#94a3b8' }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{patientName(a)}</span>
                          <span className="block truncate text-xs text-muted">
                            {a.service_name}
                            {a.doctor_name ? ` · ${a.doctor_name}` : ''}
                          </span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-5">
              <Card title={<span className="flex items-center gap-2">Онлайн захиалга <Badge tone="amber">{data.pending.length}</Badge></span>}>
                {data.pending.length === 0 ? (
                  <p className="text-sm text-muted">Баталгаажуулах захиалга алга.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.pending.map((a) => (
                      <li key={a.id} className="rounded-xl bg-soft p-3">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" className="min-w-0 text-left" onClick={() => setSelected(a)}>
                            <span className="block truncate font-semibold">{patientName(a)}</span>
                            <span className="block text-xs text-muted">
                              {shortDate(a.date)} {a.start_time} · {a.service_name}
                            </span>
                          </button>
                          {sourceBadge(a)}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <a href={`tel:+976${a.contact_phone}`} className="inline-flex h-9 items-center rounded-xl bg-white px-3 text-sm font-semibold text-blue ring-1 ring-line">
                            Залгах
                          </a>
                          <Button size="sm" variant="success" busy={busy} onClick={() => void confirm(a)}>
                            <CalendarCheck size={15} /> Баталгаажуулах
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              {user.role !== 'doctor' && (
                <Card title="AI маркетинг">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Батлах хүлээж буй пост</span>
                      <b>{data.marketing.drafts}</b>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-muted">Дараагийн пост</span>
                      <b>{data.marketing.next ? data.marketing.next.scheduled_at : '—'}</b>
                    </p>
                    {data.marketing.failed > 0 && <p className="font-semibold text-red-600">{data.marketing.failed} пост нийтлэгдээгүй</p>}
                    <Link to="/marketing" className="mt-2 inline-flex items-center gap-2 font-semibold text-blue">
                      <Megaphone size={16} /> Пост удирдах →
                    </Link>
                  </div>
                </Card>
              )}
              <Card title="Товч мэдээ">
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <UserCheck size={16} className="text-lime-dark" /> SMS сануулга: <b>{data.sms.enabled ? 'идэвхтэй' : 'идэвхгүй'}</b>
                  </p>
                  {data.sms.enabled && (
                    <p className="text-muted">
                      Сүүлийн 30 хоногт {data.sms.sent ?? 0} илгээсэн{data.sms.failed ? `, ${data.sms.failed} амжилтгүй` : ''}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
      <AppointmentDrawer
        appt={selected}
        doctors={doctors}
        onClose={() => setSelected(null)}
        onChanged={(a) => {
          setSelected(a)
          void reload()
        }}
      />
      <AppointmentForm open={creating} onClose={() => setCreating(false)} onCreated={() => void reload()} doctors={doctors} services={services} />
    </div>
  )
}
