import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, LayoutGrid } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { addDays, fromMin, humanDate, parseYmd, todayYmd, toMin } from '../../shared/format.ts'
import type { Appointment, Clinic, Service } from '../../shared/types.ts'
import { useLoad, useMedia, useUser } from '../lib.tsx'
import { Button, Empty, ErrorBox, PageHeader, Select, Spinner, StatusBadge, statusColor } from '../ui.tsx'
import { AppointmentDrawer, AppointmentForm, patientName, sourceBadge, type Doctor } from '../components/appointments.tsx'

const ROW = 30 // минут
const ROW_PX = 44

export default function Schedule() {
  const user = useUser()
  const wide = useMedia('(min-width: 1024px)')
  const [date, setDate] = useState(todayYmd())
  const [doctorFilter, setDoctorFilter] = useState<string>(user.role === 'doctor' ? String(user.id) : '')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [creating, setCreating] = useState<null | { date: string; start_time?: string; doctor_id?: number | null }>(null)

  const meta = useLoad(
    () => Promise.all([api.get<{ items: Doctor[] }>('/api/doctors'), api.get<{ items: Service[] }>('/api/services'), api.get<Clinic>('/api/settings/clinic')]),
    [],
  )
  const appts = useLoad(
    () => api.get<{ items: Appointment[] }>(`/api/appointments?from=${date}&to=${date}${doctorFilter ? `&doctor=${doctorFilter}` : ''}`),
    [date, doctorFilter],
  )
  const doctors = meta.data?.[0].items ?? []
  const services = meta.data?.[1].items ?? []
  const clinic = meta.data?.[2]
  const items = (appts.data?.items ?? []).filter((a) => a.status !== 'cancelled')
  const cancelled = (appts.data?.items ?? []).filter((a) => a.status === 'cancelled')

  // Сонгосон өдөр шинэчлэгдэх үед drawer-ийн мэдээллийг шинэчлэх
  useEffect(() => {
    if (selected && appts.data) {
      const fresh = appts.data.items.find((a) => a.id === selected.id)
      if (fresh && fresh.updated_at !== selected.updated_at) setSelected(fresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appts.data])

  const columns = useMemo(() => {
    const docs = doctorFilter ? doctors.filter((d) => String(d.id) === doctorFilter) : doctors
    const cols: { id: number | null; name: string; color: string }[] = docs.map((d) => ({ id: d.id, name: d.name, color: d.color }))
    if (!doctorFilter && (items.some((a) => !a.doctor_id) || cols.length === 0)) cols.push({ id: null, name: 'Оноогоогүй', color: '#94a3b8' })
    return cols
  }, [doctors, doctorFilter, items])

  const hours = clinic?.hours[String(parseYmd(date).getDay()) as '0']
  const dayStart = Math.min(toMin(hours?.[0] ?? '09:00'), ...items.map((a) => a.start_min)) - 60
  const dayEnd = Math.max(toMin(hours?.[1] ?? '18:00'), ...items.map((a) => a.end_min)) + 30
  const start = Math.max(7 * 60, Math.floor(dayStart / 60) * 60)
  const end = Math.min(22 * 60, Math.ceil(dayEnd / 60) * 60)
  const rows: number[] = []
  for (let m = start; m < end; m += ROW) rows.push(m)
  const lunch = clinic?.lunch ? [toMin(clinic.lunch[0]), toMin(clinic.lunch[1])] : null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const showGrid = wide && view === 'grid'

  return (
    <div>
      <PageHeader
        title="Цагийн хуваарь"
        subtitle={humanDate(date)}
        actions={
          <Button onClick={() => setCreating({ date })}>
            <Plus size={18} /> Шинэ цаг
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl bg-white ring-1 ring-line">
          <button type="button" className="grid h-11 w-11 place-items-center text-muted hover:text-ink" onClick={() => setDate(addDays(date, -1))} aria-label="Өмнөх өдөр">
            <ChevronLeft size={20} />
          </button>
          <input type="date" className="h-11 border-0 bg-transparent px-1 text-[15px] font-semibold focus:outline-none" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button type="button" className="grid h-11 w-11 place-items-center text-muted hover:text-ink" onClick={() => setDate(addDays(date, 1))} aria-label="Дараагийн өдөр">
            <ChevronRight size={20} />
          </button>
        </div>
        <Button variant="secondary" onClick={() => setDate(todayYmd())}>
          Өнөөдөр
        </Button>
        <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="min-w-44">
          <option value="">Бүх эмч</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        {wide && (
          <div className="ml-auto flex rounded-xl bg-white p-1 ring-1 ring-line">
            <button type="button" onClick={() => setView('grid')} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${view === 'grid' ? 'bg-ink text-white' : 'text-muted'}`}>
              <LayoutGrid size={15} /> Хүснэгт
            </button>
            <button type="button" onClick={() => setView('list')} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${view === 'list' ? 'bg-ink text-white' : 'text-muted'}`}>
              <List size={15} /> Жагсаалт
            </button>
          </div>
        )}
      </div>

      {appts.error && <ErrorBox message={appts.error} onRetry={appts.reload} />}
      {appts.loading && !appts.data ? (
        <Spinner />
      ) : !hours && items.length === 0 ? (
        <Empty icon={<CalendarDays size={22} />} title="Амралтын өдөр" text="Энэ өдөр эмнэлэг ажиллахгүй. Шаардлагатай бол гараар цаг бүртгэж болно." action={<Button variant="secondary" onClick={() => setCreating({ date })}>Цаг бүртгэх</Button>} />
      ) : showGrid ? (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <div className="grid min-w-fit" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(200px, 1fr))` }}>
            <div className="sticky left-0 z-10 border-b border-line bg-white" />
            {columns.map((c) => (
              <div key={String(c.id)} className="flex items-center gap-2 border-b border-l border-line px-3 py-3 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
                <span className="ml-auto text-xs font-normal text-muted">{items.filter((a) => a.doctor_id === c.id).length}</span>
              </div>
            ))}
            <div className="relative">
              {rows.map((m) => (
                <div key={m} className="border-b border-line/70 pr-2 text-right text-xs tabular-nums text-muted" style={{ height: ROW_PX }}>
                  <span className="relative -top-2 bg-white">{m % 60 === 0 ? fromMin(m) : ''}</span>
                </div>
              ))}
            </div>
            {columns.map((c) => (
              <div key={String(c.id)} className="relative border-l border-line">
                {rows.map((m) => {
                  const inLunch = lunch && m >= lunch[0] && m < lunch[1]
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-label={`${fromMin(m)} цаг бүртгэх`}
                      onClick={() => setCreating({ date, start_time: fromMin(m), doctor_id: c.id })}
                      className={`block w-full border-b border-line/70 transition hover:bg-sky/60 ${inLunch ? 'bg-[repeating-linear-gradient(45deg,#f4f8fb,#f4f8fb_6px,#fff_6px,#fff_12px)]' : ''}`}
                      style={{ height: ROW_PX }}
                    />
                  )
                })}
                {date === todayYmd() && nowMin >= start && nowMin <= end && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500" style={{ top: ((nowMin - start) / ROW) * ROW_PX }} />
                )}
                {items
                  .filter((a) => a.doctor_id === c.id)
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      className="absolute inset-x-1 z-[5] overflow-hidden rounded-lg bg-white p-1.5 text-left text-xs shadow-sm ring-1 ring-line transition hover:shadow-md"
                      style={{
                        top: ((a.start_min - start) / ROW) * ROW_PX + 1,
                        height: Math.max(((a.end_min - a.start_min) / ROW) * ROW_PX - 3, 26),
                        borderLeft: `4px solid ${statusColor[a.status]}`,
                      }}
                    >
                      <span className="block truncate font-semibold">
                        {a.start_time} {patientName(a)}
                      </span>
                      <span className="block truncate text-muted">{a.service_name}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <Empty icon={<CalendarDays size={22} />} title="Энэ өдөр цаг алга" action={<Button variant="secondary" onClick={() => setCreating({ date })}>Цаг бүртгэх</Button>} />
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setSelected(a)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-line hover:ring-blue/40">
                <span className="w-16 shrink-0 text-center">
                  <span className="block font-display text-lg font-bold tabular-nums">{a.start_time}</span>
                  <span className="block text-xs text-muted">{fromMin(a.end_min)}</span>
                </span>
                <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: statusColor[a.status] }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{patientName(a)}</span>
                  <span className="block truncate text-xs text-muted">
                    {a.service_name}
                    {a.doctor_name ? ` · ${a.doctor_name}` : ''}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">{sourceBadge(a)}</span>
                </span>
                <StatusBadge status={a.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {cancelled.length > 0 && <p className="mt-3 text-xs text-muted">Цуцлагдсан: {cancelled.length} (хүснэгтэд харагдахгүй)</p>}

      <AppointmentDrawer
        appt={selected}
        doctors={doctors}
        onClose={() => setSelected(null)}
        onChanged={(a) => {
          setSelected(a)
          void appts.reload()
        }}
      />
      <AppointmentForm
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        onCreated={(a) => {
          if (a.date !== date) setDate(a.date)
          void appts.reload()
        }}
        doctors={doctors}
        services={services}
        initial={creating ?? undefined}
      />
    </div>
  )
}
