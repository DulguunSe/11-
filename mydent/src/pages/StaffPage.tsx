import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { clearStored, getStoredBookings, getStoredMessages } from '../lib/submissions'
import { formatDate } from '../lib/dates'

/** Түр ажилтны хуудас: backend холбогдох хүртэл энэ хөтөч дээрх туршилтын өгөгдлийг харуулна */
export default function StaffPage() {
  const { t, lang } = useLang()
  const s = t.staff
  usePageMeta(t.meta.pages.staff)
  const [bookings, setBookings] = useState(getStoredBookings)
  const [messages, setMessages] = useState(getStoredMessages)

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <div className="flex items-start gap-4 rounded-3xl bg-brand-50 p-6 ring-1 ring-brand-100">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-600">
            <Lock size={22} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{s.title}</h1>
            <p className="mt-1 text-muted">{s.text}</p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">{s.bookingsTitle}</h2>
          {(bookings.length > 0 || messages.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearStored()
                setBookings([])
                setMessages([])
              }}
            >
              <Trash2 size={15} />
              {s.clear}
            </Button>
          )}
        </div>
        {bookings.length === 0 ? (
          <p className="mt-3 text-muted">{s.empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-ink/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-brand-50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  {['#', t.booking.date, t.booking.time, t.booking.service, t.booking.dentist, t.booking.name, t.booking.phone].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                    <td className="px-4 py-3">{formatDate(b.date, lang, t, false)}</td>
                    <td className="px-4 py-3">{b.time}</td>
                    <td className="px-4 py-3">{b.serviceTitle}</td>
                    <td className="px-4 py-3">{b.dentistName}</td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3">{b.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-10 font-display text-xl font-bold text-ink">{s.messagesTitle}</h2>
        {messages.length === 0 ? (
          <p className="mt-3 text-muted">{s.empty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-2xl p-4 ring-1 ring-ink/10">
                <p className="text-sm font-semibold text-ink">
                  {m.name} · {m.phone} {m.email && `· ${m.email}`}
                </p>
                <p className="mt-1 text-sm text-muted">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
