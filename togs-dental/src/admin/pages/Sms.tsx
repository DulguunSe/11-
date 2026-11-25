import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Send } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { formatPhone } from '../../shared/format.ts'
import { useAction, useLoad, useUser } from '../lib.tsx'
import { Badge, Button, Card, Empty, ErrorBox, Input, PageHeader, Spinner, Textarea } from '../ui.tsx'

type Log = { id: number; phone: string; message: string; kind: string; status: 'sent' | 'failed' | 'skipped'; error: string | null; created_at: string }
const KIND: Record<string, string> = { reminder: 'Сануулга', booking: 'Захиалга', recall: 'Давтан үзлэг', manual: 'Гараар', test: 'Туршилт' }

export default function Sms() {
  const user = useUser()
  const [page, setPage] = useState(1)
  const log = useLoad(() => api.get<{ items: Log[]; total: number }>(`/api/sms/log?page=${page}`), [page])
  const { busy, run } = useAction()
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState('')
  const send = () =>
    run(async () => {
      const r = await api.post<{ ok: boolean; error?: string }>('/api/sms/send', { phone, message: msg })
      if (!r.ok) throw new Error(r.error ?? 'Илгээгдсэнгүй')
      setMsg('')
      void log.reload()
    }, 'SMS илгээгдлээ')
  return (
    <div>
      <PageHeader
        title="SMS"
        subtitle="Цагийн сануулга, захиалгын баталгаа, давтан үзлэгийн мессежүүд"
        actions={
          user.role === 'admin' && (
            <Link to="/settings?tab=sms" className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-[15px] font-semibold ring-1 ring-line hover:text-blue">
              SMS тохиргоо
            </Link>
          )
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Card title="Мессеж илгээх">
          <div className="space-y-3">
            <Input label="Утасны дугаар" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9911 2233" />
            <Textarea label="Мессеж" hint={`${msg.length} тэмдэгт`} value={msg} onChange={(e) => setMsg(e.target.value)} />
            <Button busy={busy} disabled={phone.replace(/\D/g, '').length < 8 || msg.trim().length < 2} onClick={() => void send()}>
              <Send size={16} /> Илгээх
            </Button>
          </div>
        </Card>
        <Card title="Илгээсэн түүх">
          {log.error && <ErrorBox message={log.error} onRetry={log.reload} />}
          {log.loading && !log.data ? (
            <Spinner />
          ) : !log.data?.items.length ? (
            <Empty icon={<MessageSquare size={22} />} title="SMS илгээгээгүй байна" />
          ) : (
            <>
              <ul className="divide-y divide-line">
                {log.data.items.map((l) => (
                  <li key={l.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="tabular-nums">{formatPhone(l.phone)}</b>
                      <Badge tone={l.status === 'sent' ? 'green' : l.status === 'failed' ? 'red' : 'gray'}>
                        {l.status === 'sent' ? 'Илгээсэн' : l.status === 'failed' ? 'Амжилтгүй' : 'Алгассан'}
                      </Badge>
                      <Badge>{KIND[l.kind] ?? l.kind}</Badge>
                      <span className="ml-auto text-xs text-muted">{l.created_at}</span>
                    </div>
                    <p className="mt-1 text-muted">{l.message}</p>
                    {l.error && <p className="mt-0.5 text-xs text-red-600">{l.error}</p>}
                  </li>
                ))}
              </ul>
              {log.data.total > 50 && (
                <div className="mt-3 flex justify-center gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Шинэ
                  </Button>
                  <Button size="sm" variant="secondary" disabled={page * 50 >= log.data.total} onClick={() => setPage(page + 1)}>
                    Хуучин
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
