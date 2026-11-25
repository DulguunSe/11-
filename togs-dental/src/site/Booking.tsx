import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, ApiError } from '../shared/api.ts'
import { WEEKDAYS_SHORT, addDays, humanDate, parseYmd, todayYmd } from '../shared/format.ts'
import type { SiteData } from '../shared/types.ts'
import { Icon } from './Icon.tsx'

type Slot = { time: string; free: boolean }
type Saved = { ref: string; phone: string }
type Mine = { ref: string; date: string; time: string; service: string; status: string }
type Done = { ref: string; date: string; time: string; service: string; doctor: string | null }

const STORE = 'togs.bookings'
const readSaved = (): Saved[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '[]')
  } catch {
    return []
  }
}
const writeSaved = (list: Saved[]) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(list.slice(-20)))
  } catch {
    /* хувийн горим */
  }
}

/** Фэйсбүүк/инстаграм постоос ирсэн эсэхийг тэмдэглэх */
export function captureUtm() {
  const q = new URLSearchParams(location.search)
  const src = q.get('utm_source')
  if (src) {
    try {
      sessionStorage.setItem('togs.utm', `${src}:${q.get('utm_campaign') ?? ''}`.slice(0, 120))
    } catch {
      /* ignore */
    }
  }
}
const readUtm = () => {
  try {
    return sessionStorage.getItem('togs.utm') ?? ''
  } catch {
    return ''
  }
}

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 0, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 0, 31, 32, 33, 34, 35, 36, 37, 38]

export function Booking({ site, pick, toast }: { site: SiteData; pick: number | null; toast: (m: string) => void }) {
  const { clinic } = site
  const services = site.services.filter((s) => s.online_booking)
  const doctors = site.doctors.filter((d) => d.online_booking)
  const [svc, setSvc] = useState<number | null>(null)
  const [doctor, setDoctor] = useState<number | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [teeth, setTeeth] = useState<Set<number>>(new Set())
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [honey, setHoney] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const [mine, setMine] = useState<Mine[]>([])

  useEffect(() => {
    if (pick) setSvc(pick)
  }, [pick])

  const today = site.today || todayYmd()
  const days = useMemo(() => {
    const out: { key: string; open: boolean }[] = []
    for (let i = 0; i < clinic.daysAhead; i++) {
      const key = addDays(today, i)
      out.push({ key, open: Boolean(clinic.hours[String(parseYmd(key).getDay()) as '0']) })
    }
    return out
  }, [today, clinic.daysAhead, clinic.hours])

  const loadSlots = useCallback(async () => {
    if (!date) return
    setSlotsLoading(true)
    try {
      const q = new URLSearchParams({ date, ...(svc ? { service: String(svc) } : {}), ...(doctor ? { doctor: String(doctor) } : {}) })
      const r = await api.get<{ slots: Slot[] }>(`/api/public/slots?${q}`)
      setSlots(r.slots)
      setTime((t) => (t && r.slots.some((s) => s.time === t && s.free) ? t : null))
    } catch {
      setSlots(null)
    } finally {
      setSlotsLoading(false)
    }
  }, [date, svc, doctor])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const loadMine = useCallback(async () => {
    const saved = readSaved()
    if (!saved.length) return setMine([])
    try {
      const r = await api.post<{ items: Mine[] }>('/api/public/bookings/status', { items: saved })
      setMine(r.items.filter((a) => a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)))
    } catch {
      /* сүлжээгүй үед харуулахгүй */
    }
  }, [today])
  useEffect(() => {
    void loadMine()
  }, [loadMine])

  const service = services.find((s) => s.id === svc)
  const doctorName = doctors.find((d) => d.id === doctor)?.name
  const freeCount = slots?.filter((s) => s.free).length ?? 0
  const canSubmit = Boolean(svc && date && time) && !busy

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!(svc && date && time)) return setErr('Үйлчилгээ, өдөр, цагаа сонгоно уу.')
    if (name.trim().length < 2) return setErr('Нэрээ бичнэ үү.')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8) return setErr('Утасны дугаараа 8 оронтойгоор бичнэ үү.')
    setBusy(true)
    try {
      const r = await api.post<Done & { status: string }>('/api/public/bookings', {
        service_id: svc,
        doctor_id: doctor,
        date,
        time,
        teeth: [...teeth],
        name: name.trim(),
        phone: digits,
        note: note.trim(),
        utm: readUtm(),
        ...(honey ? { website: honey } : {}),
      })
      setDone(r)
      writeSaved([...readSaved().filter((s) => s.ref !== r.ref), { ref: r.ref, phone: digits.slice(-8) }])
      setTime(null)
      setTeeth(new Set())
      setNote('')
      void loadSlots()
      void loadMine()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Захиалга илгээгдсэнгүй.'
      setErr(msg)
      if (e instanceof ApiError && e.status === 409) void loadSlots()
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (ref: string) => {
    const saved = readSaved().find((s) => s.ref === ref)
    if (!saved) return
    try {
      await api.post(`/api/public/bookings/${ref}/cancel`, { phone: saved.phone })
      toast('Цаг цуцлагдлаа')
      void loadMine()
      void loadSlots()
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Цуцалж чадсангүй')
    }
  }

  const toggleTooth = (n: number) =>
    setTeeth((cur) => {
      const next = new Set(cur)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })

  if (!clinic.bookingEnabled) {
    return (
      <div className="panel" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h3>Онлайн захиалга түр хаалттай байна</h3>
        <p className="note">
          Цаг авахыг хүсвэл <b>{clinic.phone1}</b> {clinic.phone2 && <>эсвэл <b>{clinic.phone2}</b></>} дугаарт залгаарай.
        </p>
      </div>
    )
  }

  return (
    <div className="desk">
      <form className="panel" id="bookForm" noValidate onSubmit={submit}>
        <div className="bstep">
          <div className="blabel">
            <i>1</i>Үйлчилгээ
          </div>
          <div className="chips" role="group" aria-label="Үйлчилгээ сонгох">
            {services.length === 0 && <p className="empty">Ачаалж байна…</p>}
            {services.map((s) => (
              <button key={s.id} type="button" className="chip" aria-pressed={svc === s.id} onClick={() => setSvc(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {doctors.length > 1 && (
          <div className="bstep">
            <div className="blabel">
              <i>2</i>Эмч <small>заавал биш</small>
            </div>
            <div className="chips" role="group" aria-label="Эмч сонгох">
              <button type="button" className="chip" aria-pressed={doctor === null} onClick={() => setDoctor(null)}>
                Аль ч эмч
              </button>
              {doctors.map((d) => (
                <button key={d.id} type="button" className="chip" aria-pressed={doctor === d.id} onClick={() => setDoctor(d.id)} title={d.specialty}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bstep">
          <div className="blabel">
            <i>{doctors.length > 1 ? 3 : 2}</i>Өдөр
          </div>
          <div className="days" role="group" aria-label="Өдөр сонгох">
            {days.map(({ key, open }, i) => {
              const d = parseYmd(key)
              return (
                <button
                  key={key}
                  type="button"
                  className="day"
                  aria-pressed={date === key}
                  disabled={!open}
                  aria-label={humanDate(key)}
                  onClick={() => {
                    setDate(key)
                    setTime(null)
                  }}
                >
                  <small>{i === 0 ? 'Өнөөдөр' : i === 1 ? 'Маргааш' : WEEKDAYS_SHORT[d.getDay()]}</small>
                  <b>{d.getDate()}</b>
                  <small>{d.getMonth() + 1}-р сар</small>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bstep">
          <div className="blabel">
            <i>{doctors.length > 1 ? 4 : 3}</i>Цаг <small>{date && slots && !slotsLoading ? `· ${freeCount} сул цаг` : ''}</small>
          </div>
          <div className="times" role="group" aria-label="Цаг сонгох">
            {!date ? (
              <p className="empty">Эхлээд өдрөө сонгоно уу.</p>
            ) : slotsLoading && !slots ? (
              <p className="empty">Сул цаг шалгаж байна…</p>
            ) : !slots ? (
              <p className="empty">Цагийн мэдээлэл ачаалсангүй. Утсаар холбогдоно уу.</p>
            ) : !slots.length ? (
              <p className="empty">Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.</p>
            ) : (
              slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  className="time"
                  aria-pressed={time === s.time}
                  disabled={!s.free}
                  aria-label={s.free ? s.time : `${s.time} захиалагдсан`}
                  onClick={() => setTime(s.time)}
                >
                  {s.time}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bstep">
          <div className="blabel">
            <i>{doctors.length > 1 ? 5 : 4}</i>Аль шүд? <small>заавал биш</small>
          </div>
          <div className="teeth">
            <div className="jlab">Дээд эрүү</div>
            {[UPPER, LOWER].map((row, ri) => (
              <div key={ri} className={`jaw ${ri ? 'lo' : 'up'}`}>
                {row.map((n, i) =>
                  n === 0 ? (
                    <span key={`m${i}`} className="mid" />
                  ) : (
                    <button key={n} type="button" className="tooth" aria-pressed={teeth.has(n)} aria-label={`Шүд ${n}`} onClick={() => toggleTooth(n)}>
                      {n}
                    </button>
                  ),
                )}
              </div>
            ))}
            <div className="jlab">Доод эрүү</div>
          </div>
        </div>

        <div className="bstep">
          <div className="blabel">
            <i>{doctors.length > 1 ? 6 : 5}</i>Холбоо барих
          </div>
          <div className="fields">
            <div className="field">
              <label htmlFor="fName">Овог нэр</label>
              <input id="fName" autoComplete="name" placeholder="Бат-Эрдэнэ" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="fPhone">Утасны дугаар</label>
              <input id="fPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="9911 2233" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field full">
              <label htmlFor="fNote">Нэмэлт тайлбар</label>
              <textarea id="fNote" placeholder="Жишээ: зүүн доод шүд 3 хоног өвдөж байна" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="hp" aria-hidden="true">
              <label htmlFor="fWebsite">Вэбсайт</label>
              <input id="fWebsite" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
            </div>
          </div>
          <p className="err" role="alert">
            {err}
          </p>
        </div>
      </form>

      <aside className="side">
        <div className="ticket">
          <p className="eyebrow">Таны захиалга</p>
          <dl>
            <dt>Үйлчилгээ</dt>
            <dd>{service?.name ?? '—'}</dd>
            {doctors.length > 1 && (
              <>
                <dt>Эмч</dt>
                <dd>{doctorName ?? 'Аль ч эмч'}</dd>
              </>
            )}
            <dt>Өдөр</dt>
            <dd>{date ? humanDate(date) : '—'}</dd>
            <dt>Цаг</dt>
            <dd>{time ?? '—'}</dd>
            <dt>Шүд</dt>
            <dd>{teeth.size ? [...teeth].sort((a, b) => a - b).join(', ') : '—'}</dd>
          </dl>
          <button className="btn" type="submit" form="bookForm" disabled={!canSubmit}>
            <Icon id="i-calcheck" />
            {busy ? 'Илгээж байна…' : 'Цаг захиалах'}
          </button>
        </div>
        <p className="note">Захиалга шууд эмнэлэгт бүртгэгдэнэ. Эмнэлгээс тань руу залгаж цагийг баталгаажуулна.</p>
        {done && (
          <div className="done" role="status">
            <h3>Цаг захиалагдлаа</h3>
            <p className="ref">
              Захиалгын дугаар: <b>{done.ref}</b>
            </p>
            <pre>
              {`${done.service}\n${humanDate(done.date)}, ${done.time}${done.doctor ? `\nЭмч: ${done.doctor}` : ''}`}
            </pre>
            <p className="note">Бид тантай удахгүй холбогдож баталгаажуулна. Асуух зүйл байвал {clinic.phone1} дугаарт залгаарай.</p>
          </div>
        )}
        {mine.length > 0 && (
          <div className="mine">
            <p className="eyebrow">Миний захиалсан цагууд</p>
            <div className="mine">
              {mine.map((a) => (
                <div key={a.ref} className="appt">
                  <div>
                    <b>
                      {humanDate(a.date)} · {a.time}
                    </b>
                    <div className="meta">
                      {a.service} · №{a.ref}
                    </div>
                  </div>
                  {a.status === 'cancelled' ? (
                    <span className="pill">Цуцлагдсан</span>
                  ) : a.status === 'confirmed' ? (
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="pill ok">Баталгаажсан</span>
                      <button className="mini" type="button" onClick={() => void cancel(a.ref)}>
                        Цуцлах
                      </button>
                    </span>
                  ) : a.status === 'pending' ? (
                    <button className="mini" type="button" onClick={() => void cancel(a.ref)}>
                      Цуцлах
                    </button>
                  ) : (
                    <span className="pill">{a.status === 'completed' ? 'Үйлчлүүлсэн' : 'Ирсэн'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
