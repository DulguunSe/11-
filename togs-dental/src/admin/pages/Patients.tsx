import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Plus, Search, Users } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { age, formatPhone, money, shortDate } from '../../shared/format.ts'
import { useDebounced, useLoad } from '../lib.tsx'
import { Button, Empty, ErrorBox, PageHeader, Spinner } from '../ui.tsx'
import { PatientForm } from '../components/PatientForm.tsx'

type Row = {
  id: number
  card_no: string
  last_name: string
  first_name: string
  phone: string
  birth_date: string | null
  gender: string | null
  allergies: string
  last_visit: string | null
  next_appointment: string | null
  balance: number
}

export default function Patients() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const dq = useDebounced(q, 300)
  const [creating, setCreating] = useState(false)
  const { data, error, loading, reload } = useLoad(
    () => api.get<{ items: Row[]; total: number; limit: number }>(`/api/patients?page=${page}&q=${encodeURIComponent(dq.trim())}`),
    [dq, page],
  )
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div>
      <PageHeader
        title="Үйлчлүүлэгчид"
        subtitle={data ? `Нийт ${data.total} бүртгэл` : undefined}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> Шинэ үйлчлүүлэгч
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 ring-1 ring-line focus:ring-2 focus:ring-cyan focus:outline-none"
          placeholder="Нэр, утас, регистр эсвэл картын дугаараар хайх…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          autoFocus
        />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? (
        <Spinner />
      ) : data && data.items.length === 0 ? (
        <Empty icon={<Users size={22} />} title={dq ? 'Илэрц олдсонгүй' : 'Бүртгэл алга'} text={dq ? 'Өөр үгээр хайж үзнэ үү' : 'Эхний үйлчлүүлэгчээ бүртгээрэй'} />
      ) : (
        data && (
          <>
            <div className="hidden overflow-hidden rounded-2xl bg-white ring-1 ring-line md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-soft text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Карт</th>
                    <th className="px-4 py-3 font-semibold">Овог нэр</th>
                    <th className="px-4 py-3 font-semibold">Нас</th>
                    <th className="px-4 py-3 font-semibold">Утас</th>
                    <th className="px-4 py-3 font-semibold">Сүүлд ирсэн</th>
                    <th className="px-4 py-3 font-semibold">Дараагийн цаг</th>
                    <th className="px-4 py-3 text-right font-semibold">Үлдэгдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-soft/70" onClick={() => navigate(`/patients/${p.id}`)}>
                      <td className="px-4 py-3 tabular-nums text-muted">{p.card_no}</td>
                      <td className="px-4 py-3 font-semibold">
                        <Link to={`/patients/${p.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-blue">
                          {p.last_name} {p.first_name}
                        </Link>
                        {p.allergies && <AlertTriangle size={14} className="ml-1.5 inline text-red-500" aria-label="Харшилтай" />}
                      </td>
                      <td className="px-4 py-3">{age(p.birth_date) ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{formatPhone(p.phone)}</td>
                      <td className="px-4 py-3">{p.last_visit ? shortDate(p.last_visit) : '—'}</td>
                      <td className="px-4 py-3">{p.next_appointment ? `${shortDate(p.next_appointment.slice(0, 10))} ${p.next_appointment.slice(11)}` : '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${p.balance > 0 ? 'text-red-600' : 'text-muted'}`}>{p.balance > 0 ? money(p.balance) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 md:hidden">
              {data.items.map((p) => (
                <li key={p.id}>
                  <Link to={`/patients/${p.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {p.last_name} {p.first_name} {p.allergies && <AlertTriangle size={14} className="inline text-red-500" />}
                      </span>
                      <span className="block text-xs text-muted">
                        №{p.card_no} · {formatPhone(p.phone)}
                        {age(p.birth_date) !== null ? ` · ${age(p.birth_date)} нас` : ''}
                      </span>
                    </span>
                    {p.balance > 0 && <span className="shrink-0 text-sm font-semibold text-red-600">{money(p.balance)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Өмнөх
                </Button>
                <span className="text-sm text-muted">
                  {page} / {pages}
                </span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Дараах
                </Button>
              </div>
            )}
          </>
        )
      )}
      <PatientForm open={creating} onClose={() => setCreating(false)} onSaved={(id) => navigate(`/patients/${id}`)} />
    </div>
  )
}
