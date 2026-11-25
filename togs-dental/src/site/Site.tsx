import { useEffect, useRef, useState } from 'react'
import { api } from '../shared/api.ts'
import { WEEKDAYS } from '../shared/format.ts'
import type { SiteData } from '../shared/types.ts'
import { Booking, captureUtm } from './Booking.tsx'
import { FAQ, ICONS, SHADES, TIPS, fallbackSite } from './data.ts'
import { Icon } from './Icon.tsx'

const tel = (p: string) => `tel:+976${p.replace(/\D/g, '')}`

export function Site() {
  const [site, setSite] = useState<SiteData>(fallbackSite)
  const [pick, setPick] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)
  const { clinic } = site

  useEffect(() => {
    captureUtm()
    api
      .get<SiteData>('/api/public/site')
      .then(setSite)
      .catch(() => {})
    const onScroll = () => {
      setScrolled(scrollY > 10)
      setShowTop(scrollY > 600)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Постын холбоосоор (…#book) орж ирэхэд захиалгын хэсэг рүү гүйлгэнэ
  useEffect(() => {
    if (location.hash === '#book' && site.services.length) document.getElementById('book')?.scrollIntoView()
  }, [site.services.length])

  const toast = (m: string) => {
    setToastMsg(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2200)
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Хуулагдлаа')
    } catch {
      toast(text)
    }
  }
  const choose = (id: number) => {
    setPick(id)
    document.getElementById('book')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const shownServices = site.services.filter((s) => s.show_on_site)
  const whitening = site.services.find((s) => /цайруулалт/i.test(s.name))
  const fmtHours = (v: [string, string] | null) => (v ? `${v[0]} – ${v[1]}` : 'Амарна')
  const todayDow = new Date().getDay()
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.mapsQuery || clinic.address)}`
  const phones = [clinic.phone1, clinic.phone2].filter(Boolean)

  return (
    <>
      <header className={`top${scrolled ? ' scrolled' : ''}`} id="hdr">
        <div className="wrap">
          <a className="logo" href="#home" aria-label={clinic.name}>
            <img src="/img/mark.png" alt="" width={40} height={41} />
            <span className="wm">
              <b>{clinic.shortName || 'ТӨГС'}</b>
              <small>Шүдний эмнэлэг</small>
            </span>
          </a>
          <nav className="main" aria-label="Үндсэн цэс">
            <a href="#home">Нүүр</a>
            <a href="#services">Үйлчилгээ</a>
            <a href="#about">Бидний тухай</a>
            <a href="#whitening">Цайруулалт</a>
            <a href="#tips">Зөвлөгөө</a>
            <a href="#faq">Асуулт хариулт</a>
            <a href="#contact">Холбоо барих</a>
          </nav>
          <a className="btn sm" href="#book">
            <Icon id="i-cal" />
            Цаг захиалах
          </a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="wrap">
            <div>
              <span className="badge">
                <i />
                {clinic.city} · Нүүр ам, шүдний эмнэлэг
              </span>
              <h1>
                Таны <span className="hl">төгс</span> инээмсэглэл эндээс эхлэнэ
              </h1>
              <p className="lead">{clinic.tagline} Цагаа онлайнаар урьдчилан захиалаарай.</p>
              <div className="cta">
                <a className="btn" href="#book">
                  <Icon id="i-cal" />
                  Цаг захиалах
                </a>
                <a className="btn ghost" href="#services">
                  Үйлчилгээ үзэх
                  <Icon id="i-right" />
                </a>
              </div>
              <div className="proof">
                {phones.map((p, i) => (
                  <div key={p}>
                    <b>
                      <a href={tel(p)}>{p}</a>
                    </b>
                    <small>{i ? 'Утас 2' : 'Утас'}</small>
                  </div>
                ))}
                <div>
                  <b>{clinic.city}</b>
                  <small>{clinic.addressShort.replace(`${clinic.city}, `, '')}</small>
                </div>
              </div>
            </div>
            <div className="visual">
              <div className="frame">
                <img src="/img/sign.jpg" alt="Эмнэлгийн үүдний гантиг хана дээрх “Төгс Dental Clinic” алтан үсэгтэй хаяг" width={1180} height={770} />
              </div>
              <div className="float f1">
                <span className="chip">
                  <Icon id="i-spark" />
                </span>
                <div>
                  <b>Япон цайруулалт</b>
                  <small>Өвдөлтгүй · 4–6 түвшин</small>
                </div>
              </div>
              <div className="float f2">
                <span className="chip g">
                  <Icon id="i-family" />
                </span>
                <div>
                  <b>Бүх насныханд</b>
                  <small>Хүүхэд, том хүн</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bar">
          <div className="wrap">
            <div className="inner">
              {(
                [
                  ['i-check', 'Стандартын дагуу эмчилгээ'],
                  ['i-bolt', 'Түргэн шуурхай үйлчилгээ'],
                  ['i-calclock', 'Онлайн цаг захиалга'],
                  ['i-family', 'Хүүхэд, том хүн бүгдэд'],
                ] as const
              ).map(([ic, t]) => (
                <div className="it" key={t}>
                  <span>
                    <Icon id={ic} />
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="sec" id="services">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Бидний үйлчилгээ</p>
              <h2>Шүдний бүх төрлийн эмчилгээ</h2>
              <p className="sub">Цайруулалтаас эхлээд ломбо, зай нөхөлт, ёзоор сэргээлт хүртэл нэг дороос.</p>
            </div>
            <div className="cards">
              {shownServices.length === 0 &&
                [0, 1, 2].map((i) => <article key={i} className="card skeleton" aria-hidden="true" />)}
              {shownServices.map((s) => (
                <article className="card" key={s.id}>
                  {s.tag && <span className="tag">{s.tag}</span>}
                  <span className="tile">
                    <Icon id={ICONS[s.icon] ?? 'i-tooth'} />
                  </span>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  {s.price > 0 && (
                    <p className="price">
                      {s.price.toLocaleString('en-US')}₮-өөс{s.price_note ? ` · ${s.price_note}` : ''}
                    </p>
                  )}
                  {s.online_booking ? (
                    <button type="button" className="more" onClick={() => choose(s.id)}>
                      Цаг авах
                      <Icon id="i-right" />
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec soft" id="about">
          <div className="wrap why">
            <div className="visual">
              <div className="frame">
                <img src="/img/cover.jpg" alt="Эмнэлгийн хүлээн авах ширээ болон эмчилгээний өрөө" loading="lazy" width={1121} height={412} />
              </div>
              <div className="float">
                <span className="chip">
                  <Icon id="i-pin" />
                </span>
                <div>
                  <b>{clinic.city} хот</b>
                  <small>{clinic.addressShort}</small>
                </div>
              </div>
            </div>
            <div>
              <p className="eyebrow">Бидний тухай</p>
              <h2 style={{ marginTop: 14 }}>
                {clinic.city}т байрлах <span className="hl">Төгс</span> шүдний эмнэлэг
              </h2>
              <div className="points">
                {(
                  [
                    ['i-shield', 'Стандартын дагуу, чанартай', 'Нүүр ам, шүдний тусламж үйлчилгээг мэргэжлийн стандартын дагуу үзүүлнэ.'],
                    ['i-bolt', 'Түргэн шуурхай', 'Урьдчилан цаг захиалснаар хүлээлгүй, товлосон цагтаа үзүүлнэ.'],
                    ['i-chair', 'Цэвэр, тохилог орчин', 'Шинэ тохижуулсан, гэрэлтэй эмчилгээний өрөө, тав тухтай хүлээлгийн хэсэг.'],
                    ['i-heart', 'Хүн бүрт тохирсон эмчилгээ', 'Үзлэгийн дараа таны шүдний байдалд тохирсон эмчилгээний төлөвлөгөө гаргана.'],
                  ] as const
                ).map(([ic, h, p]) => (
                  <div className="pt" key={h}>
                    <span>
                      <Icon id={ic} />
                    </span>
                    <div>
                      <h3>{h}</h3>
                      <p>{p}</p>
                    </div>
                  </div>
                ))}
              </div>
              {site.doctors.length > 0 && (
                <div className="docs">
                  <p className="eyebrow">Манай эмч нар</p>
                  <div className="doclist">
                    {site.doctors.map((d) => (
                      <div className="doc" key={d.id}>
                        <span className="av">{d.name.replace(/^.*\s/, '').charAt(0)}</span>
                        <div>
                          <b>{d.name}</b>
                          {d.specialty && <small>{d.specialty}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="callbox">
                <div>
                  <small>Лавлах утас</small>
                  <b>{phones.join(' · ')}</b>
                </div>
                <a className="btn sm" href="#book">
                  Цаг авах
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="whitening">
          <div className="wrap">
            <div className="spot">
              <div>
                <p className="eyebrow">Онцлох үйлчилгээ</p>
                <h2>
                  Япон шүд <span className="hl">цайруулалт</span>
                </h2>
                <p className="sub">Японд патентлагдсан WHITE ESSENCE цайруулалтаар шүдээ аюулгүй, өвдөлтгүйгээр цайруулаарай.</p>
                <ul className="checks">
                  {['Өвдөлтгүй', 'Шүдний пааланг гэмтээхгүй', 'Багадаа 4–6 түвшин цайрна', 'Японд патентлагдсан'].map((t) => (
                    <li key={t}>
                      <Icon id="i-check" />
                      {t}
                    </li>
                  ))}
                </ul>
                {whitening && (
                  <button className="btn" type="button" onClick={() => choose(whitening.id)}>
                    <Icon id="i-cal" />
                    Цайруулалтад цаг авах
                  </button>
                )}
              </div>
              <div className="shade">
                <h3>Шүдний өнгөний шкал</h3>
                <div className="scale">
                  {SHADES.map(([n, c]) => (
                    <div className="sw" key={n}>
                      <i style={{ background: c }} />
                      {n}
                    </div>
                  ))}
                </div>
                <div className="range">
                  <span>4–6 түвшин цайвар</span>
                </div>
                <div className="after">
                  <p>Цайруулалтын дараа анхаарах зүйлс</p>
                  <ul>
                    <li>Өнгөтэй хоол хүнс (кофе, хар цай, улаан дарс, карри гэх мэт) хэрэглэхгүй байх</li>
                    <li>Тамхи татахгүй байх</li>
                    <li>Хийжүүлсэн ундаа, хүчиллэг бүтээгдэхүүн хэрэглэхгүй байх</li>
                    <li>Хэт халуун, хэт хүйтэн хоол хүнсээс зайлсхийх</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec soft">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Энгийн үйл явц</p>
              <h2>Хэрхэн ажилладаг вэ</h2>
              <p className="sub">Эрүүл инээмсэглэлд хүрэх гурван хялбар алхам.</p>
            </div>
            <div className="steps">
              {(
                [
                  ['i-calcheck', 'Захиалах', 'Онлайнаар эсвэл утсаар хоёрхон минутад цагаа захиалаарай.'],
                  ['i-steth', 'Ирэх', 'Товлосон цагтаа ирж, эмчтэйгээ уулзан үзлэг, эмчилгээ хийлгэнэ.'],
                  ['i-smile', 'Инээмсэглэх', 'Эрүүл, гэрэлтсэн инээмсэглэлээ итгэлтэйгээр эдлээрэй.'],
                ] as const
              ).map(([ic, h, p], i) => (
                <div className="step" key={h}>
                  <div className="box">
                    <Icon id={ic} />
                    <span className="n">0{i + 1}</span>
                  </div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="book">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Онлайн цаг захиалга</p>
              <h2>
                Цагаа <span className="hl">хоёр минутад</span> захиалаарай
              </h2>
              <p className="sub">Сул цагаа сонгоод нэр, утсаа үлдээгээрэй. Эмнэлгээс тань руу залгаж баталгаажуулна.</p>
            </div>
            <Booking site={site} pick={pick} toast={toast} />
          </div>
        </section>

        <section className="sec soft" id="tips">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Эрүүл шүдний зөвлөгөө</p>
              <h2>Шүдээ хайрла</h2>
              <p className="sub">Өдөр тутмын жижиг зуршил шүдний эрүүл мэндэд хамгийн их нөлөөлдөг.</p>
            </div>
            <div className="tips">
              {TIPS.map(([n, h, p]) => (
                <div className="tip" key={n}>
                  <span className="num">{n}</span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
            <div className="fbband">
              <p>
                Илүү олон зөвлөгөө, урамшууллын мэдээг Facebook хуудаснаас
                <small>{clinic.fbFollowers ? `${clinic.fbFollowers} дагагчтай манай хуудсыг дагаарай.` : 'Манай хуудсыг дагаарай.'}</small>
              </p>
              <a className="btn light" href={clinic.facebook} target="_blank" rel="noopener">
                <Icon id="i-fb" />
                Facebook хуудас
              </a>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Асуулт хариулт</p>
              <h2>Түгээмэл асуултууд</h2>
            </div>
            <div className="faq">
              {FAQ.map(([q, a], i) => (
                <details key={q} open={i === 0}>
                  <summary>
                    {q}
                    <Icon id="i-down" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="sec soft" id="contact">
          <div className="wrap">
            <div className="head center">
              <p className="eyebrow">Холбоо барих</p>
              <h2>Биднийг хаанаас олох вэ</h2>
              <p className="sub">Асуух зүйл байвал залгаарай, эсвэл Facebook Messenger-ээр зурвас үлдээгээрэй.</p>
            </div>
            <div className="contact">
              <div className="cinfo">
                {phones.map((p, i) => (
                  <div className="ci" key={p}>
                    <span>
                      <Icon id="i-phone" />
                    </span>
                    <div>
                      <small>{i ? 'Утас 2' : 'Утас'}</small>
                      <a className="big" href={tel(p)}>
                        {p}
                      </a>
                    </div>
                    <button className="mini" type="button" onClick={() => void copy(p)}>
                      Хуулах
                    </button>
                  </div>
                ))}
                <div className="ci">
                  <span>
                    <Icon id="i-pin" />
                  </span>
                  <div>
                    <small>Хаяг</small>
                    <b>{clinic.address}</b>
                  </div>
                  <button className="mini" type="button" onClick={() => void copy(clinic.address)}>
                    Хуулах
                  </button>
                </div>
                <div className="ci">
                  <span>
                    <Icon id="i-clock" />
                  </span>
                  <div>
                    <small>Ажлын цаг</small>
                    <div className="hours">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <FragmentRow key={d} today={d === todayDow} day={WEEKDAYS[d]} value={fmtHours(clinic.hours[String(d) as '0'])} />
                      ))}
                    </div>
                  </div>
                  <span />
                </div>
              </div>
              <div className="map">
                <MapCanvas />
                <span className="city">{clinic.city.toUpperCase()}</span>
                <div className="pin">
                  <b>{clinic.name}</b>
                  <p className="note">{clinic.address}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a className="btn sm" href={mapsUrl} target="_blank" rel="noopener">
                      <Icon id="i-pin" />
                      Google Maps-д нээх
                    </a>
                    <a className="btn sm ghost" href={clinic.facebook} target="_blank" rel="noopener">
                      <Icon id="i-fb" />
                      Facebook
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="grid">
            <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <a className="logo" href="#home">
                <img src="/img/mark.png" alt="" width={48} height={49} />
                <span className="wm">
                  <b>{clinic.shortName || 'ТӨГС'}</b>
                  <small>Perfect Dental Clinic</small>
                </span>
              </a>
              <p style={{ maxWidth: '38ch' }}>{clinic.tagline}</p>
            </div>
            <div>
              <h4>Цэс</h4>
              <ul>
                <li>
                  <a href="#services">Үйлчилгээ</a>
                </li>
                <li>
                  <a href="#about">Бидний тухай</a>
                </li>
                <li>
                  <a href="#whitening">Япон цайруулалт</a>
                </li>
                <li>
                  <a href="#book">Цаг захиалах</a>
                </li>
                <li>
                  <a href="#faq">Асуулт хариулт</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Холбоо барих</h4>
              <ul>
                <li>{phones.join(', ')}</li>
                <li>{clinic.addressShort}</li>
                <li>Даваа–Баасан {fmtHours(clinic.hours['1'])}</li>
              </ul>
            </div>
          </div>
          <div className="base">
            <span>
              © {new Date().getFullYear()} {clinic.name}. Бүх эрх хуулиар хамгаалагдсан.
            </span>
            <a href="/admin" className="staff">
              Ажилтны нэвтрэх
            </a>
          </div>
        </div>
      </footer>

      <div className="fab">
        <a className="chat" href={clinic.messenger || clinic.facebook} target="_blank" rel="noopener" aria-label="Messenger-ээр бичих">
          <Icon id="i-chat" />
        </a>
        <a className="call" href={tel(clinic.phone1)} aria-label="Залгах">
          <Icon id="i-phone" />
        </a>
      </div>
      {showTop && (
        <button className="totop" type="button" aria-label="Дээш буцах" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>
          <Icon id="i-up" />
        </button>
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  )
}

function FragmentRow({ day, value, today }: { day: string; value: string; today: boolean }) {
  const cls = today ? 'today' : undefined
  return (
    <>
      <span className={cls}>{day}</span>
      <span className={cls}>{value}</span>
    </>
  )
}

/** Чимэглэлийн газрын зураг (демо хувилбарынх) */
function MapCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const draw = () => {
      const c = ref.current
      if (!c) return
      const r = c.getBoundingClientRect()
      if (!r.width) return
      const dpr = devicePixelRatio || 1
      c.width = r.width * dpr
      c.height = r.height * dpr
      const g = c.getContext('2d')!
      g.scale(dpr, dpr)
      g.clearRect(0, 0, r.width, r.height)
      let seed = 23
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
      g.fillStyle = '#dbefd0'
      for (let i = 0; i < 5; i++) {
        g.beginPath()
        g.ellipse(rnd() * r.width, rnd() * r.height * 0.6, 40 + rnd() * 50, 24 + rnd() * 30, rnd() * 3, 0, Math.PI * 2)
        g.fill()
      }
      g.strokeStyle = '#ffffff'
      for (let i = 0; i < 13; i++) {
        g.lineWidth = i % 4 === 0 ? 11 : 4
        const x = rnd() * r.width
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + (rnd() - 0.5) * 90, r.height)
        g.stroke()
      }
      for (let i = 0; i < 9; i++) {
        g.lineWidth = i % 3 === 0 ? 11 : 4
        const y = rnd() * r.height
        g.beginPath()
        g.moveTo(0, y)
        g.lineTo(r.width, y + (rnd() - 0.5) * 70)
        g.stroke()
      }
      g.strokeStyle = '#bfe3f3'
      g.lineWidth = 14
      g.beginPath()
      g.moveTo(-10, r.height * 0.18)
      g.bezierCurveTo(r.width * 0.3, r.height * 0.05, r.width * 0.5, r.height * 0.5, r.width + 10, r.height * 0.4)
      g.stroke()
      const px = r.width * 0.62
      const py = r.height * 0.3
      g.fillStyle = 'rgba(20,102,214,.18)'
      g.beginPath()
      g.arc(px, py, 32, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#1466d6'
      g.beginPath()
      g.arc(px, py, 12, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(px, py, 4.5, 0, Math.PI * 2)
      g.fill()
    }
    requestAnimationFrame(draw)
    addEventListener('resize', draw)
    return () => removeEventListener('resize', draw)
  }, [])
  return <canvas ref={ref} aria-hidden="true" />
}
