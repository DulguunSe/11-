import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleDollarSign, Download, Receipt, Stethoscope, UserPlus, Megaphone, CalendarCheck } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { addDays, money, shortDate, todayYmd } from '../../shared/format.ts'
import { STATUS_LABEL, type AppointmentStatus } from '../../shared/types.ts'
import { useLoad, useUser } from '../lib.tsx'
import { Card, ErrorBox, Input, PageHeader, Select, Spinner, Stat, StatusBadge } from '../ui.tsx'
import type { Doctor } from '../components/appointments.tsx'

type Report = {
  from: string
  to: string
  collected: { s: number; n: number }
  billed: { s: number; n: number; d: number }
  byMethod: { method: string; amount: number; n: number }[]
  byDoctor: { id: number; name: string; color: string; collected: number; billed: number; visits: number; completed: number }[]
  byService: { name: string; qty: number; amount: number }[]
  daily: { day: string; amount: number }[]
  appointments: { status: AppointmentStatus; n: number }[]
  online: { n: number; social: number | null }
  newPatients: number
  receivables: { total: number; top: { id: number; card_no: string; last_name: string; first_name: string; phone: string; balance: number }[] } | null
}

const METHOD: Record<string, string> = { cash: 'Бэлэн', card: 'Карт', transfer: 'Шилжүүлэг', qpay: 'QPay', other: 'Бусад' }
const BAR = '#1466d6'

function presets() {
  const t = todayYmd()
  const monthStart = `${t.slice(0, 7)}-01`
  const prevMonthEnd = addDays(monthStart, -1)
  return [
    { key: 'today', label: 'Өнөөдөр', from: t, to: t },
    { key: '7', label: 'Сүүлийн 7 хоног', from: addDays(t, -6), to: t },
    { key: 'month', label: 'Энэ сар', from: monthStart, to: t },
    { key: 'prev', label: 'Өмнөх сар', from: `${prevMonthEnd.slice(0, 7)}-01`, to: prevMonthEnd },
    { key: '90', label: 'Сүүлийн 90 хоног', from: addDays(t, -89), to: t },
  ]
}

const compact = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))

export default function Reports() {
  const user = useUser()
  const ps = useMemo(presets, [])
  const [range, setRange] = useState({ key: 'month', from: ps[2].from, to: ps[2].to })
  const [doctor, setDoctor] = useState('')
  const doctors = useLoad(() => api.get<{ items: Doctor[] }>('/api/doctors'), [])
  const { data, error, loading, reload } = useLoad(
    () => api.get<Report>(`/api/reports?from=${range.from}&to=${range.to}${doctor ? `&doctor=${doctor}` : ''}`),
    [range.from, range.to, doctor],
  )
  const days = useMemo(() => {
    if (!data) return []
    const map = new Map(data.daily.map((d) => [d.day, d.amount]))
    const out: { label: string; day: string; value: number }[] = []
    for (let d = data.from; d <= data.to && out.length < 120; d = addDays(d, 1)) out.push({ day: d, label: shortDate(d), value: map.get(d) ?? 0 })
    return out
  }, [data])
  const totalAppts = data?.appointments.reduce((s, a) => s + a.n, 0) ?? 0
  const noShow = data?.appointments.find((a) => a.status === 'no_show')?.n ?? 0

  return (
    <div>
      <PageHeader
        title="Тайлан"
        subtitle={user.role === 'doctor' ? 'Таны эмчилгээ, орлогын тайлан' : 'Эмнэлгийн орлого, үйл ажиллагаа'}
        actions={
          user.role !== 'doctor' && (
            <>
              <a href={`/api/reports/export?type=payments&from=${range.from}&to=${range.to}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-semibold ring-1 ring-line hover:text-blue">
                <Download size={17} /> Төлбөр (CSV)
              </a>
              <a href={`/api/reports/export?type=visits&from=${range.from}&to=${range.to}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-semibold ring-1 ring-line hover:text-blue">
                <Download size={17} /> Эмчилгээ (CSV)
              </a>
            </>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-2">
        <div className="scroll-thin flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-line">
          {ps.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setRange({ key: p.key, from: p.from, to: p.to })}
              className={`h-9 shrink-0 rounded-lg px-3 text-sm font-semibold ${range.key === p.key ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Input type="date" aria-label="Эхлэх огноо" value={range.from} onChange={(e) => e.target.value && setRange({ key: 'custom', from: e.target.value, to: range.to < e.target.value ? e.target.value : range.to })} />
        <Input type="date" aria-label="Дуусах огноо" value={range.to} onChange={(e) => e.target.value && setRange({ key: 'custom', from: range.from > e.target.value ? e.target.value : range.from, to: e.target.value })} />
        {user.role !== 'doctor' && (
          <Select value={doctor} onChange={(e) => setDoctor(e.target.value)} aria-label="Эмч">
            <option value="">Бүх эмч</option>
            {(doctors.data?.items ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Орлого (төлөгдсөн)" value={money(data.collected.s)} sub={`${data.collected.n} төлбөр`} icon={<CircleDollarSign size={17} />} tone="green" />
            <Stat label="Эмчилгээний дүн" value={money(data.billed.s)} sub={data.billed.d ? `хөнгөлөлт ${money(data.billed.d)}` : `${data.billed.n} эмчилгээ`} icon={<Receipt size={17} />} />
            <Stat label="Цаг захиалга" value={totalAppts} sub={noShow ? `${noShow} ирээгүй (${Math.round((noShow / Math.max(1, totalAppts)) * 100)}%)` : 'ирээгүй алга'} icon={<CalendarCheck size={17} />} tone="violet" />
            <Stat
              label="Онлайн захиалга"
              value={data.online.n}
              sub={`${data.online.social ?? 0} нь FB/IG постоос · ${data.newPatients} шинэ үйлчлүүлэгч`}
              icon={<Megaphone size={17} />}
              tone="amber"
            />
          </div>

          <Card title="Өдөр тутмын орлого">
            <ColumnChart data={days} />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-blue">Хүснэгтээр харах</summary>
              <div className="mt-2 max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-line">
                    {days
                      .filter((d) => d.value > 0)
                      .map((d) => (
                        <tr key={d.day}>
                          <td className="py-1.5 text-muted">{d.day}</td>
                          <td className="py-1.5 text-right font-semibold tabular-nums">{money(d.value)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Эмч бүрийн орлого">
              {data.byDoctor.length === 0 ? (
                <p className="text-sm text-muted">Эмч бүртгэгдээгүй.</p>
              ) : (
                <BarList
                  items={data.byDoctor.map((d) => ({
                    key: String(d.id),
                    label: d.name,
                    value: d.collected,
                    sub: `${d.visits} эмчилгээ · дүн ${money(d.billed)}`,
                  }))}
                />
              )}
            </Card>
            <Card title="Төлбөрийн хэлбэр">
              {data.byMethod.length === 0 ? (
                <p className="text-sm text-muted">Энэ хугацаанд төлбөр алга.</p>
              ) : (
                <BarList
                  items={data.byMethod.map((m) => ({
                    key: m.method,
                    label: METHOD[m.method] ?? m.method,
                    value: m.amount,
                    sub: `${m.n} гүйлгээ · ${Math.round((m.amount / Math.max(1, data.collected.s)) * 100)}%`,
                  }))}
                />
              )}
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <Card title={<span className="flex items-center gap-2"><Stethoscope size={18} /> Үйлчилгээгээр</span>}>
              {data.byService.length === 0 ? (
                <p className="text-sm text-muted">Энэ хугацаанд бүртгэсэн эмчилгээ алга.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th className="pb-2 font-semibold">Үйлчилгээ</th>
                      <th className="pb-2 text-right font-semibold">Тоо</th>
                      <th className="pb-2 text-right font-semibold">Дүн</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.byService.map((s) => (
                      <tr key={s.name}>
                        <td className="py-2">{s.name}</td>
                        <td className="py-2 text-right tabular-nums">{s.qty}</td>
                        <td className="py-2 text-right font-semibold tabular-nums">{money(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="Цагийн төлөв">
              {data.appointments.length === 0 ? (
                <p className="text-sm text-muted">Цаг алга.</p>
              ) : (
                <ul className="space-y-2">
                  {(Object.keys(STATUS_LABEL) as AppointmentStatus[])
                    .map((s) => ({ s, n: data.appointments.find((a) => a.status === s)?.n ?? 0 }))
                    .filter((x) => x.n > 0)
                    .map(({ s, n }) => (
                      <li key={s} className="flex items-center justify-between">
                        <StatusBadge status={s} />
                        <span className="font-semibold tabular-nums">{n}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>

          {data.receivables && (
            <Card title={<span className="flex items-center gap-2"><UserPlus size={18} /> Авлага (нийт {money(data.receivables.total)})</span>}>
              {data.receivables.top.length === 0 ? (
                <p className="text-sm text-muted">Үлдэгдэлтэй үйлчлүүлэгч алга.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.receivables.top.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <a href={`/admin/patients/${r.id}`} className="font-semibold hover:text-blue">
                        {r.last_name} {r.first_name} <span className="font-normal text-muted">№{r.card_no}</span>
                      </a>
                      <span className="font-semibold tabular-nums text-red-600">{money(r.balance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

/** Нэг цуваа баганан график: ≤24px багана, дээд үзүүр 4px дугуйрсан, hover/focus дээр утга */
function ColumnChart({ data }: { data: { label: string; day: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  // Картын өргөнд багтаана (урт хугацааны тайланд ч бүх өдөр харагдана)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = 200
  const max = Math.max(...data.map((d) => d.value), 0)
  if (max === 0) return <p className="py-10 text-center text-sm text-muted">Энэ хугацаанд орлого бүртгэгдээгүй байна.</p>
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const n = data.length
  const W = Math.max(280, width || 640)
  const band = (W - 48) / n
  const bw = Math.min(24, Math.max(2, band - 2))
  const y = (v: number) => H - (v / top) * H
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - 48) / 56))))
  return (
    <div className="relative" ref={ref}>
      <div>
        <svg width={W} height={H + 28} role="img" aria-label="Өдөр тутмын орлогын график" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={44} x2={W} y1={y(t) + 4} y2={y(t) + 4} stroke="#e3ebf2" strokeWidth={1} />
              <text x={38} y={y(t) + 8} textAnchor="end" fontSize={11} fill="#5b6b7f">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = 48 + i * band + (band - bw) / 2
            const h = (d.value / top) * H
            const r = Math.min(4, h / 2, bw / 2)
            const y0 = H + 4
            return (
              <g key={d.day}>
                {h > 0 && (
                  <path
                    d={`M${x},${y0} V${y0 - h + r} Q${x},${y0 - h} ${x + r},${y0 - h} H${x + bw - r} Q${x + bw},${y0 - h} ${x + bw},${y0 - h + r} V${y0} Z`}
                    fill={BAR}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                )}
                <rect
                  x={48 + i * band}
                  y={0}
                  width={band}
                  height={H + 4}
                  fill="transparent"
                  tabIndex={d.value > 0 ? 0 : -1}
                  aria-label={`${d.day}: ${money(d.value)}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
                {i % labelEvery === 0 && (
                  <text x={48 + i * band + band / 2} y={H + 22} textAnchor="middle" fontSize={11} fill="#5b6b7f">
                    {d.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: Math.min(Math.max(48 + hover * band + band / 2, 60), W - 60) }}
        >
          <p className="font-display text-sm font-bold tabular-nums">{money(data[hover].value)}</p>
          <p className="text-white/70">{data[hover].day}</p>
        </div>
      )}
    </div>
  )
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow
  return 10 * pow
}

/** Хэвтээ баганууд: нэг өнгө, утга үзүүрт */
function BarList({ items }: { items: { key: string; label: string; value: number; sub?: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-3.5">
      {items.map((it) => (
        <li key={it.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{it.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{money(it.value)}</span>
          </div>
          <div className="h-3 rounded-full bg-soft">
            <div className="h-3 rounded-full" style={{ width: `${Math.max(it.value > 0 ? 2 : 0, (it.value / max) * 100)}%`, background: BAR }} />
          </div>
          {it.sub && <p className="mt-1 text-xs text-muted">{it.sub}</p>}
        </li>
      ))}
    </ul>
  )
}
