/**
 * ТАНИЛЦУУЛГЫН ХУВИЛБАР: серверийг хөтөч дотор дууриана (жишээ өгөгдөл, санах ойд).
 * Бодит систем server/ хавтсанд. Энд AI, SMS, Facebook холболт ажиллахгүй.
 */
import { addDays, fromMin, parseYmd, toMin, todayYmd } from '../shared/format.ts'
import imgPhoto from './img/post-photo.jpg?inline'
import imgTip from './img/post-tip.jpg?inline'
import imgPromo from './img/post-promo.jpg?inline'
import imgQuote from './img/post-quote.jpg?inline'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any

const now = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${todayYmd()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const T = todayYmd()

const clinic: Any = {
  name: 'Төгс шүдний эмнэлэг',
  shortName: 'ТӨГС',
  tagline: 'Нүүр ам, шүдний тусламж үйлчилгээг стандартын дагуу чанартай, түргэн шуурхай үзүүлнэ.',
  phone1: '9980 2103',
  phone2: '8870 2103',
  email: '',
  address: 'Өвөрхангай аймаг, Арвайхээр хот, 5-р баг, 52 айл, хойд 1-р орц',
  addressShort: 'Арвайхээр, 5-р баг, 52 айл',
  city: 'Арвайхээр',
  mapsQuery: 'Төгс шүдний эмнэлэг, Арвайхээр',
  facebook: 'https://www.facebook.com/profile.php?id=61574180873843',
  messenger: 'https://m.me/61574180873843',
  instagram: '',
  fbFollowers: '716+',
  hours: { '0': null, '1': ['09:00', '18:00'], '2': ['09:00', '18:00'], '3': ['09:00', '18:00'], '4': ['09:00', '18:00'], '5': ['09:00', '18:00'], '6': ['10:00', '15:00'] },
  lunch: ['13:00', '14:00'],
  slotMinutes: 30,
  daysAhead: 14,
  leadMinutes: 30,
  bookingEnabled: true,
  autoConfirm: false,
}

const svc = (id: number, name: string, description: string, icon: string, duration: number, tag = '', show = 1, price = 0) => ({
  id,
  name,
  description,
  icon,
  price,
  price_note: 'Үзлэгийн дараа тодорхойлно',
  duration,
  tag,
  show_on_site: show,
  online_booking: 1,
  sort: id,
  active: 1,
})
const services: Any[] = [
  svc(1, 'Япон шүд цайруулалт', 'Японд патентлагдсан WHITE ESSENCE цайруулалт. Өвдөлтгүй, пааланг гэмтээхгүй, багадаа 4–6 түвшин цайрна.', 'spark', 60, 'Онцлох'),
  svc(2, 'Шүдний ломбо', 'Цоорсон, хагарсан шүдийг шүдний өнгөтэй материалаар нөхөж, хэлбэр, зажлах чадварыг нь сэргээнэ.', 'tooth', 45),
  svc(3, 'Зай нөхөлт', 'Алдсан шүдний зайг нөхөж, инээмсэглэл, зажлах чадварыг тань буцаан сэргээнэ.', 'bridge', 60),
  svc(4, 'Риббонд', 'Риббонд эслэг туузаар сул шүдийг бэхлэх, нэг шүдний зайг нөхөх орчин үеийн арга.', 'link', 45),
  svc(5, 'Ёзоор сэргээлт', 'Титэм нь их хэмжээгээр эвдэрсэн шүдийг ёзоороос нь сэргээж, шүдээ авахгүйгээр хадгалах боломж олгоно.', 'root', 60),
  svc(6, 'Хүүхдийн шүдний эмчилгээ', 'Хүүхдэд ээлтэй орчинд сүүн шүдний үзлэг, эмчилгээ, урьдчилан сэргийлэлт.', 'baby', 30),
  svc(7, 'Шүд авах', 'Эмчилгээ боломжгүй болсон шүдийг мэдээ алдуулалттайгаар авах.', 'tooth', 30, '', 0),
  svc(8, 'Үзлэг, зөвлөгөө', 'Шүдний ерөнхий үзлэг, эмчилгээний төлөвлөгөө, зөвлөгөө.', 'steth', 30, '', 0),
]

const users: Any[] = [
  { id: 1, username: 'admin', name: 'Админ', role: 'admin', is_doctor: 0, phone: '', specialty: '', bio: '', color: '#0c1a2c', online_booking: 0, show_on_site: 0, active: 1, must_change_password: 0 },
  { id: 2, username: 'emch1', name: 'Жишээ эмч Б. Болор', role: 'doctor', is_doctor: 1, phone: '', specialty: 'Ерөнхий шүдний эмч', bio: '', color: '#1466d6', online_booking: 1, show_on_site: 1, active: 1, must_change_password: 0 },
  { id: 3, username: 'emch2', name: 'Жишээ эмч Д. Тэмүүлэн', role: 'doctor', is_doctor: 1, phone: '', specialty: 'Хүүхдийн шүдний эмч', bio: '', color: '#3fae12', online_booking: 1, show_on_site: 1, active: 1, must_change_password: 0 },
  { id: 4, username: 'reception', name: 'Жишээ ресепшн', role: 'reception', is_doctor: 0, phone: '', specialty: '', bio: '', color: '#a8833a', online_booking: 0, show_on_site: 0, active: 1, must_change_password: 0 },
]
const doctors = () => users.filter((u) => u.active && u.is_doctor)

const patients: Any[] = [
  ['Бат', 'Жишээ-Оюун', '99110001', '1990-04-12', ''],
  ['Дорж', 'Жишээ-Сарнай', '99110002', '1985-09-03', ''],
  ['Ганаа', 'Жишээ-Тэмүүжин', '99110003', '2016-02-20', ''],
  ['Нараа', 'Жишээ-Мөнх', '99110004', '1978-12-01', 'Пенициллин'],
  ['Сүх', 'Жишээ-Ану', '99110005', '2001-06-18', ''],
  ['Очир', 'Жишээ-Билгүүн', '99110006', '2012-11-30', ''],
].map(([last, first, phone, birth, allergies], i) => ({
  id: i + 1,
  card_no: String(i + 1).padStart(5, '0'),
  last_name: last,
  first_name: first,
  phone,
  phone2: '',
  register_no: '',
  birth_date: birth,
  gender: null,
  address: '',
  allergies,
  medical_notes: '',
  notes: '',
  source: 'walk_in',
  sms_opt_out: 0,
  recall_due: null,
  created_at: `${addDays(T, -60)} 10:00:00`,
}))

let seq = 100
const ref = () => Math.random().toString(36).slice(2, 8).toUpperCase()
const appts: Any[] = []
function addAppt(a: Any) {
  const start = toMin(a.start_time)
  const row = {
    id: ++seq,
    ref: ref(),
    patient_id: null,
    service_id: null,
    status: 'pending',
    source: 'staff',
    utm: '',
    teeth: '',
    contact_name: '',
    contact_phone: '',
    patient_note: '',
    staff_note: '',
    created_at: now(),
    updated_at: now(),
    ...a,
    start_min: start,
    end_min: start + a.duration,
  }
  appts.push(row)
  return row
}
const sid = (name: string) => services.find((s) => s.name === name)!
const seedAppt = (pid: number | null, doc: number, service: string, date: string, time: string, status: string, source: string, contact?: [string, string], utm = '') => {
  const s = sid(service)
  const p = patients.find((x) => x.id === pid)
  addAppt({ patient_id: pid, doctor_id: doc, service_id: s.id, service_name: s.name, date, start_time: time, duration: s.duration, status, source, utm, contact_name: contact?.[0] ?? p?.first_name ?? '', contact_phone: contact?.[1] ?? p?.phone ?? '' })
}
seedAppt(1, 2, 'Шүдний ломбо', T, '10:00', 'confirmed', 'phone')
seedAppt(3, 3, 'Хүүхдийн шүдний эмчилгээ', T, '11:00', 'arrived', 'walk_in')
seedAppt(2, 2, 'Япон шүд цайруулалт', T, '15:00', 'confirmed', 'online')
seedAppt(null, 3, 'Үзлэг, зөвлөгөө', addDays(T, 1), '09:30', 'pending', 'online', ['Жишээ-Хулан', '99110009'], 'facebook:post-1')
seedAppt(5, 2, 'Ёзоор сэргээлт', addDays(T, 1), '14:00', 'confirmed', 'phone')

const visits: Any[] = []
const payments: Any[] = []
const chart: Any[] = [
  { patient_id: 1, tooth: 36, status: 'filled', note: '', updated_at: now() },
  { patient_id: 1, tooth: 46, status: 'caries', note: '', updated_at: now() },
]
function addVisit(pid: number, doc: number, date: string, data: Any, items: Any[], paid = 0, method = 'cash') {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0)
  const v = { id: ++seq, patient_id: pid, appointment_id: null, doctor_id: doc, date, complaint: '', diagnosis: '', treatment: '', teeth: '', notes: '', next_visit: '', discount: 0, created_by: doc, ...data, total, items }
  visits.push(v)
  if (paid) payments.push({ id: ++seq, patient_id: pid, visit_id: v.id, doctor_id: doc, amount: paid, method, paid_at: date, note: '', received_by: doc, created_at: now() })
  return v
}
addVisit(1, 2, addDays(T, -40), { diagnosis: 'Цоорол (K02.1)', treatment: 'Цоорол цэвэрлэж, гэрлийн ломбо тавьсан', teeth: '36' }, [{ service_id: 2, name: 'Шүдний ломбо', tooth: '36', qty: 1, price: 80000 }], 80000, 'card')
addVisit(4, 2, addDays(T, -12), { diagnosis: 'Шүдний чулуу', treatment: 'Чулуу авч, өнгөлгөө хийсэн' }, [{ service_id: 8, name: 'Үзлэг, зөвлөгөө', tooth: '', qty: 1, price: 20000 }, { service_id: null, name: 'Шүдний чулуу авах', tooth: '', qty: 1, price: 60000 }], 50000, 'cash')
addVisit(6, 3, addDays(T, -3), { diagnosis: 'Сүүн шүдний цоорол', treatment: 'Ломбо тавьсан, эцэг эхэд зөвлөгөө өгсөн', teeth: '75' }, [{ service_id: 6, name: 'Хүүхдийн шүдний эмчилгээ', tooth: '75', qty: 1, price: 45000 }], 45000, 'transfer')

const smsLog: Any[] = [
  { id: 1, phone: '99110001', message: 'TUGS: Sain baina uu Jishee-Oyun! Margaash 11/27 10:00-d tsag zahialsan baina. Utas: 9980 2103', kind: 'reminder', status: 'sent', error: null, created_at: `${addDays(T, -1)} 10:00:12` },
]
const audit: Any[] = [{ id: 1, user_name: 'Админ', action: 'login', entity: 'user', entity_id: 1, detail: '', created_at: now() }]

let smsCfg: Any = {
  enabled: false, method: 'GET', url: '', body: '', headers: '', contentType: 'application/json', successMatch: '', latin: true,
  reminderEnabled: true, reminderHour: 10, reminderTemplate: '{clinic}: Sain baina uu {name}! Margaash {date} {time}-d tsag zahialsan baina. Utas: {phone}',
  bookingEnabled: true, bookingTemplate: '{clinic}: {name}, tany {date} {time}-iin tsagiin huselt irlee. Bid zalgaj batalgaajuulna. {phone}',
  recallEnabled: false, recallMonths: 6, recallTemplate: '{clinic}: {name}, shudnii 6 sar tutmiin uzlegiin hugatsaa bolloo. Tsag avah: {link} Utas: {phone}',
}
let brand: Any = {
  about: 'Төгс шүдний эмнэлэг нь Өвөрхангай аймгийн Арвайхээр хотод байрладаг нүүр ам, шүдний эмнэлэг.',
  audience: 'Арвайхээр болон Өвөрхангай аймгийн гэр бүлүүд, хүүхэдтэй эцэг эхчүүд.',
  tone: 'Найрсаг, халамжтай, ойлгомжтой, мэргэжлийн.',
  emoji: 'light',
  hashtags: '#ТөгсШүднийЭмнэлэг #Арвайхээр #ШүднийЭмнэлэг #ЭрүүлШүд',
  rules: 'Эмчилгээний үр дүнг 100% баталгаа гэж амлахгүй. Үнэ, урамшууллыг зөвхөн энд өгсөн мэдээллээс бичнэ.',
  promos: '',
  samples: '',
  styleGuide: '',
}
let autopilot: Any = { enabled: false, frequency: 'every2', weekdays: [1, 3, 5], time: '19:00', platforms: ['facebook', 'instagram'], requireApproval: true, keepAhead: 4 }
const media: Any[] = [
  { id: 1, url: '/img/mark.png', kind: 'logo', description: 'Төгс шүдний эмнэлгийн лого', width: 200, height: 204 },
  { id: 2, url: '/img/sign.jpg', kind: 'photo', description: 'Эмнэлгийн үүдний "ТӨГС Dental Clinic" алтан үсэгтэй хаяг', width: 1180, height: 770 },
  { id: 3, url: '/img/cover.jpg', kind: 'photo', description: 'Хүлээн авах ширээ, эмчилгээний өрөө', width: 1121, height: 412 },
]
// '#' нь апп дээр нэмэгдэх '?v=' параметрийг data URI-г эвдэхгүй болгоно
const TPL_IMG: Record<string, string> = { photo: `${imgPhoto}#`, tip: `${imgTip}#`, promo: `${imgPromo}#`, quote: `${imgQuote}#` }

function slotsFrom(count: number) {
  const out: string[] = []
  let last: string | null = null
  const taken = new Set(posts.filter((p) => p.scheduled_at && p.status !== 'rejected').map((p) => p.scheduled_at.slice(0, 10)))
  for (let i = 0, d = T; out.length < count && i < 120; i++, d = addDays(d, 1)) {
    const at = `${d} ${autopilot.time}`
    if (at <= now().slice(0, 16) || taken.has(d)) continue
    if (autopilot.frequency === 'weekdays' && !autopilot.weekdays.includes(parseYmd(d).getDay())) continue
    if (autopilot.frequency === 'every2' && last && (parseYmd(d).getTime() - parseYmd(last).getTime()) / 864e5 < 2) continue
    out.push(at)
    last = d
  }
  return out
}
const posts: Any[] = []
function addPost(p: Any) {
  const row = { id: ++seq, status: 'draft', source: 'ai', kind: '', topic: '', caption: '', hashtags: brand.hashtags, template: 'photo', platforms: 'facebook,instagram', scheduled_at: null, published_at: null, fb_post_id: null, ig_media_id: null, error: null, updated_at: now(), ...p }
  row.image_url = TPL_IMG[row.template]
  posts.push(row)
  return row
}
;(() => {
  const s = slotsFrom(3)
  addPost({ kind: 'whitening', topic: 'Япон шүд цайруулалт', template: 'photo', scheduled_at: s[0], design: { headline: 'Япон шүд цайруулалт — өвдөлтгүй', subline: 'WHITE ESSENCE системээр шүдээ 4–6 түвшин цайруулаарай.', points: [], badge: 'Онцлох үйлчилгээ', media_id: 2 }, caption: '[Жишээ пост] Инээмсэглэлээ илүү гэрэлтүүлмээр байна уу? ✨\n\nМанай эмнэлэгт Японд патентлагдсан WHITE ESSENCE цайруулалтыг хийдэг. Өвдөлтгүй, шүдний пааланг гэмтээхгүй.\n\nЦагаа онлайнаар захиалаарай!' })
  addPost({ kind: 'tip', topic: 'Шүдээ зөв угаах', template: 'tip', scheduled_at: s[1], design: { headline: 'Шүдээ зөв угаах 4 дүрэм', subline: 'Өдөр бүрийн жижиг зуршил том ялгаа гаргана.', points: ['Өдөрт 2 удаа, 2 минут', 'Зөөлөн үстэй сойз', 'Шүдний утас хэрэглэх', '6 сар тутам үзлэг'], badge: 'Зөвлөгөө', media_id: null }, caption: '[Жишээ пост] Шүдээ зөв угааж байна уу? 🪥\n\nӨдөрт 2 удаа, 2 минутын турш зөөлөн сойзоор угааж, шүдний утсаар завсраа цэвэрлээрэй. 6 сар тутам үзлэгт хамрагдвал цоорлыг эрт илрүүлнэ.' })
  addPost({ kind: 'kids', topic: 'Хүүхдийн шүдний үзлэг', template: 'promo', status: 'approved', scheduled_at: s[2], design: { headline: 'Хүүхдийн шүдний үзлэг', subline: 'Хүүхдэд ээлтэй орчинд сүүн шүдний үзлэг, эмчилгээ.', points: [], badge: 'Хүүхдэд', media_id: 3 }, caption: '[Жишээ пост] Хүүхдийнхээ анхны шүдний үзлэгийг хэзээ хийлгэх вэ? 👶\n\nАнхны шүд ургамагц буюу 1 наснаас эхлэн жилд 1–2 удаа үзүүлэхийг зөвлөдөг.' })
  addPost({ kind: 'seasonal', topic: 'Мэндчилгээ', template: 'quote', status: 'published', published_at: `${addDays(T, -2)} 19:00:00`, scheduled_at: `${addDays(T, -2)} 19:00`, fb_post_id: 'demo', design: { headline: 'Эрүүл шүд — гэрэлтсэн инээмсэглэл', subline: 'Төгс шүдний эмнэлэг таны гэр бүлийн инээмсэглэлийг хамгаална.', points: [], badge: '', media_id: null }, caption: '[Жишээ пост] Эрүүл шүд — гэрэлтсэн инээмсэглэл 😊' })
})()

/* ---------------- туслахууд ---------------- */
class E extends Error {
  status: number
  constructor(status: number, msg: string) {
    super(msg)
    this.status = status
  }
}
const ACTIVE = ['pending', 'confirmed', 'arrived', 'completed']
const conflict = (doc: number | null, date: string, s: number, e: number, ex = 0) =>
  appts.find((a) => a.id !== ex && a.date === date && ACTIVE.includes(a.status) && (a.doctor_id ?? null) === (doc ?? null) && a.start_min < e && a.end_min > s)
function slots(date: string, doc: number | null, duration: number, lead = true) {
  const h = clinic.hours[String(parseYmd(date).getDay())]
  if (!h) return []
  const open = toMin(h[0])
  const close = toMin(h[1])
  const lunch = clinic.lunch ? [toMin(clinic.lunch[0]), toMin(clinic.lunch[1])] : null
  const d = new Date()
  const nowMin = d.getHours() * 60 + d.getMinutes() + clinic.leadMinutes
  const docs = doctors().filter((x) => x.online_booking)
  const out = []
  for (let m = open; m + duration <= close; m += clinic.slotMinutes) {
    const e = m + duration
    if (lunch && m < lunch[1] && e > lunch[0]) continue
    if (lead && date === todayYmd() && m < nowMin) continue
    const free = doc ? !conflict(doc, date, m, e) : docs.some((x) => !conflict(x.id, date, m, e))
    out.push({ time: fromMin(m), free })
  }
  return out
}
const pName = (p: Any) => (p ? `${p.last_name} ${p.first_name}` : '')
function view(a: Any) {
  const p = patients.find((x) => x.id === a.patient_id)
  const u = users.find((x) => x.id === a.doctor_id)
  return { ...a, duration: a.end_min - a.start_min, p_last_name: p?.last_name ?? null, p_first_name: p?.first_name ?? null, p_phone: p?.phone ?? null, p_card_no: p?.card_no ?? null, p_allergies: p?.allergies || null, doctor_name: u?.name ?? null, doctor_color: u?.color ?? null }
}
const balance = (pid: number) =>
  visits.filter((v) => v.patient_id === pid).reduce((s, v) => s + v.total - v.discount, 0) - payments.filter((y) => y.patient_id === pid).reduce((s, y) => s + y.amount, 0)
const sortAppt = (a: Any, b: Any) => (a.date + fromMin(a.start_min)).localeCompare(b.date + fromMin(b.start_min))
const phoneDigits = (p: string) => {
  let d = String(p ?? '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('976')) d = d.slice(3)
  return d
}
const DEMO = 'Танилцуулгын хувилбарт энэ үйлдэл идэвхгүй. Бодит системд ажиллана.'

let me: Any = null
try {
  const saved = sessionStorage.getItem('togs.demo.user')
  if (saved) me = users.find((u) => u.username === saved) ?? null
} catch {
  /* ignore */
}
const need = (...roles: string[]) => {
  if (!me) throw new E(401, 'Нэвтэрнэ үү')
  if (roles.length && !roles.includes(me.role)) throw new E(403, 'Танд энэ хэсэгт хандах эрх байхгүй')
  return me
}

/* ---------------- маршрутууд ---------------- */
type H = (m: RegExpMatchArray, q: URLSearchParams, b: Any) => Any
const routes: [string, RegExp, H][] = []
const on = (method: string, path: string, h: H) => routes.push([method, new RegExp(`^${path.replace(/:\w+/g, '([^/]+)')}$`), h])

on('GET', '/api/public/site', () => ({ clinic, services: services.filter((s) => s.active), doctors: doctors().filter((d) => d.show_on_site), today: todayYmd() }))
on('GET', '/api/public/slots', (_m, q) => {
  const s = services.find((x) => x.id === Number(q.get('service')))
  return { date: q.get('date'), slots: slots(q.get('date')!, Number(q.get('doctor')) || null, s?.duration ?? 30) }
})
on('POST', '/api/public/bookings', (_m, _q, b) => {
  const s = services.find((x) => x.id === b.service_id)
  if (!s) throw new E(400, 'Үйлчилгээ олдсонгүй')
  const phone = phoneDigits(b.phone)
  if (!/^\d{8}$/.test(phone)) throw new E(400, 'Утасны дугаар 8 оронтой байна')
  const slot = slots(b.date, b.doctor_id ?? null, s.duration).find((x: Any) => x.time === b.time)
  if (!slot?.free) throw new E(409, 'Энэ цагийг саяхан өөр хүн авчихлаа. Өөр цаг сонгоно уу.')
  const st = toMin(b.time)
  const doc = b.doctor_id ?? doctors().find((d) => d.online_booking && !conflict(d.id, b.date, st, st + s.duration))?.id ?? null
  const a = addAppt({ doctor_id: doc, service_id: s.id, service_name: s.name, date: b.date, start_time: b.time, duration: s.duration, status: 'pending', source: 'online', utm: b.utm ?? '', teeth: (b.teeth ?? []).join(','), contact_name: b.name, contact_phone: phone, patient_note: b.note ?? '' })
  return { ref: a.ref, date: a.date, time: a.start_time, service: a.service_name, doctor: users.find((u) => u.id === doc)?.name ?? null, status: a.status }
})
on('POST', '/api/public/bookings/status', (_m, _q, b) => ({
  items: (b.items ?? [])
    .map((i: Any) => appts.find((a) => a.ref === i.ref && a.contact_phone === phoneDigits(i.phone)))
    .filter(Boolean)
    .map((a: Any) => ({ ref: a.ref, date: a.date, time: a.start_time, service: a.service_name, status: a.status })),
}))
on('POST', '/api/public/bookings/([^/]+)/cancel', (m, _q, b) => {
  const a = appts.find((x) => x.ref === m[1] && x.contact_phone === phoneDigits(b.phone))
  if (!a) throw new E(404, 'Захиалга олдсонгүй')
  a.status = 'cancelled'
  return { ok: true }
})

const pub = (u: Any) => u && { id: u.id, username: u.username, name: u.name, role: u.role, is_doctor: u.is_doctor, must_change_password: 0 }
on('GET', '/api/auth/me', () => ({ user: pub(me) }))
on('POST', '/api/auth/login', (_m, _q, b) => {
  const u = users.find((x) => x.username === String(b.username).toLowerCase() && x.active)
  if (!u || b.password !== 'demo12345') throw new E(401, 'Нэвтрэх нэр эсвэл нууц үг буруу (демо: admin / demo12345)')
  me = u
  try {
    sessionStorage.setItem('togs.demo.user', u.username)
  } catch {
    /* ignore */
  }
  return { user: pub(u) }
})
on('POST', '/api/auth/logout', () => {
  me = null
  try {
    sessionStorage.removeItem('togs.demo.user')
  } catch {
    /* ignore */
  }
  return { ok: true }
})
on('POST', '/api/auth/password', () => ({ ok: true }))

on('GET', '/api/doctors', () => (need(), { items: doctors() }))
on('GET', '/api/services', () => (need(), { items: services }))
on('POST', '/api/services', (_m, _q, b) => (need('admin'), services.push({ ...b, id: ++seq }), { id: seq }))
on('PATCH', '/api/services/(\\d+)', (m, _q, b) => (need('admin'), Object.assign(services.find((s) => s.id === Number(m[1])), b), { ok: true }))

on('GET', '/api/dashboard', () => {
  const u = need()
  const own = (a: Any) => u.role !== 'doctor' || !a.doctor_id || a.doctor_id === u.id
  const today = appts.filter((a) => a.date === T && a.status !== 'cancelled' && own(a)).sort(sortAppt).map(view)
  const pending = appts.filter((a) => a.status === 'pending' && a.date >= T && own(a)).sort(sortAppt).map(view)
  const pay = payments.filter((y) => u.role !== 'doctor' || y.doctor_id === u.id)
  return {
    date: T,
    today,
    pending,
    stats: {
      total: today.length,
      arrived: today.filter((a) => a.status === 'arrived').length,
      completed: today.filter((a) => a.status === 'completed').length,
      pending: pending.length,
      tomorrow: appts.filter((a) => a.date === addDays(T, 1) && ['pending', 'confirmed'].includes(a.status) && own(a)).length,
      revenueToday: pay.filter((y) => y.paid_at === T).reduce((s, y) => s + y.amount, 0),
      revenueMonth: pay.filter((y) => y.paid_at.slice(0, 7) === T.slice(0, 7)).reduce((s, y) => s + y.amount, 0),
    },
    marketing: { drafts: posts.filter((p) => p.status === 'draft').length, failed: 0, next: posts.find((p) => p.status === 'approved') ?? null },
    sms: { enabled: smsCfg.enabled, sent: 1, failed: 0 },
    warnings: u.role === 'admin' ? ['Энэ бол танилцуулгын хувилбар: өгөгдөл зөвхөн энэ төхөөрөмж дээр, хуудсыг дахин ачаалахад анхны байдалдаа орно.'] : [],
  }
})

on('GET', '/api/appointments', (_m, q) => {
  need()
  const from = q.get('from') ?? T
  const to = q.get('to') ?? from
  const doc = Number(q.get('doctor')) || 0
  return { items: appts.filter((a) => a.date >= from && a.date <= to && (!doc || a.doctor_id === doc)).sort(sortAppt).map(view) }
})
on('GET', '/api/appointments/pending', () => (need(), { items: appts.filter((a) => a.status === 'pending' && a.date >= T).sort(sortAppt).map(view) }))
on('GET', '/api/appointments/slots', (_m, q) => (need(), { date: q.get('date'), slots: slots(q.get('date')!, Number(q.get('doctor')) || null, Number(q.get('duration')) || 30, false) }))
on('POST', '/api/appointments', (_m, _q, b) => {
  const u = need()
  const st = toMin(b.start_time)
  const c = conflict(b.doctor_id ?? null, b.date, st, st + b.duration)
  if (c) throw new E(409, `Энэ цаг давхцаж байна (${c.start_time}–${fromMin(c.end_min)} захиалгатай)`)
  const s = services.find((x) => x.id === b.service_id)
  const p = patients.find((x) => x.id === b.patient_id)
  const a = addAppt({ ...b, service_name: s?.name ?? 'Үзлэг', contact_name: b.contact_name || p?.first_name || '', contact_phone: phoneDigits(b.contact_phone) || p?.phone || '', created_by: u.id })
  return { item: view(a) }
})
on('PATCH', '/api/appointments/(\\d+)', (m, _q, b) => {
  need()
  const a = appts.find((x) => x.id === Number(m[1]))
  if (!a) throw new E(404, 'Цаг олдсонгүй')
  const date = b.date ?? a.date
  const st = toMin(b.start_time ?? a.start_time)
  const dur = b.duration ?? a.end_min - a.start_min
  const doc = b.doctor_id === undefined ? a.doctor_id : b.doctor_id
  const status = b.status ?? a.status
  if (ACTIVE.includes(status)) {
    const c = conflict(doc, date, st, st + dur, a.id)
    if (c) throw new E(409, `Энэ цаг давхцаж байна (${c.start_time}–${fromMin(c.end_min)})`)
  }
  Object.assign(a, b, { date, start_time: fromMin(st), start_min: st, end_min: st + dur, doctor_id: doc, updated_at: now() })
  delete a.duration
  return { item: view(a) }
})
on('POST', '/api/appointments/(\\d+)/link', (m, _q, b) => {
  const u = need()
  const a = appts.find((x) => x.id === Number(m[1]))
  let pid = b.patient_id
  if (!pid) pid = createPatient({ ...b.create, source: 'online' }, u)
  a.patient_id = pid
  a.updated_at = now()
  return { item: view(a) }
})
on('GET', '/api/appointments/(\\d+)/matches', (m) => {
  const a = appts.find((x) => x.id === Number(m[1]))
  return { items: patients.filter((p) => a?.contact_phone && p.phone === a.contact_phone) }
})

function createPatient(b: Any, u: Any) {
  const id = ++seq
  patients.push({ id, card_no: String(patients.length + 1).padStart(5, '0'), last_name: '', phone2: '', register_no: '', birth_date: null, gender: null, address: '', allergies: '', medical_notes: '', notes: '', source: 'walk_in', sms_opt_out: 0, recall_due: null, created_at: now(), ...b, phone: phoneDigits(b.phone ?? '') })
  audit.unshift({ id: ++seq, user_name: u.name, action: 'create', entity: 'patient', entity_id: id, detail: '', created_at: now() })
  return id
}
on('GET', '/api/patients', (_m, q) => {
  need()
  const s = (q.get('q') ?? '').trim().toLowerCase()
  const digits = s.replace(/\D/g, '')
  const list = patients
    .filter((p) => !s || `${p.last_name} ${p.first_name}`.toLowerCase().includes(s) || (digits.length >= 3 && (p.phone.includes(digits) || p.card_no.includes(digits))))
    .map((p) => ({
      ...p,
      last_visit: visits.filter((v) => v.patient_id === p.id).map((v) => v.date).sort().at(-1) ?? null,
      next_appointment: appts.filter((a) => a.patient_id === p.id && a.date >= T && ['pending', 'confirmed'].includes(a.status)).map((a) => `${a.date} ${a.start_time}`).sort()[0] ?? null,
      balance: balance(p.id),
    }))
  return { items: list.slice(0, 30), total: list.length, page: 1, limit: 30 }
})
on('POST', '/api/patients', (_m, _q, b) => ({ id: createPatient(b, need()) }))
on('GET', '/api/patients/(\\d+)', (m) => {
  need()
  const id = Number(m[1])
  const p = patients.find((x) => x.id === id)
  if (!p) throw new E(404, 'Үйлчлүүлэгч олдсонгүй')
  return {
    patient: { ...p, balance: balance(id) },
    visits: visits.filter((v) => v.patient_id === id).sort((a, b) => b.date.localeCompare(a.date)).map((v) => ({ ...v, doctor_name: users.find((u) => u.id === v.doctor_id)?.name ?? null })),
    payments: payments.filter((y) => y.patient_id === id).map((y) => ({ ...y, received_by_name: users.find((u) => u.id === y.received_by)?.name ?? null })),
    appointments: appts.filter((a) => a.patient_id === id).sort(sortAppt).reverse().map(view),
    chart: chart.filter((c) => c.patient_id === id),
    files: [],
  }
})
on('PATCH', '/api/patients/(\\d+)', (m, _q, b) => (need(), Object.assign(patients.find((p) => p.id === Number(m[1])), b), { ok: true }))
on('POST', '/api/patients/(\\d+)/visits', (m, _q, b) => {
  const u = need('admin', 'doctor')
  const pid = Number(m[1])
  const v = addVisit(pid, b.doctor_id ?? u.id, b.date, { ...b, items: undefined, created_by: u.id }, b.items ?? [])
  if (b.appointment_id) {
    const a = appts.find((x) => x.id === b.appointment_id)
    if (a) Object.assign(a, { patient_id: pid, status: 'completed' })
  }
  for (const c of b.chart ?? []) {
    const i = chart.findIndex((x) => x.patient_id === pid && x.tooth === c.tooth)
    if (i >= 0) chart.splice(i, 1)
    if (c.status !== 'healthy') chart.push({ patient_id: pid, tooth: c.tooth, status: c.status, note: '', updated_at: now() })
  }
  return { id: v.id }
})
on('PATCH', '/api/patients/visits/(\\d+)', (m, _q, b) => {
  need('admin', 'doctor')
  const v = visits.find((x) => x.id === Number(m[1]))
  Object.assign(v, b)
  if (b.items) v.total = b.items.reduce((s: number, i: Any) => s + i.qty * i.price, 0)
  return { ok: true }
})
on('POST', '/api/patients/(\\d+)/payments', (m, _q, b) => {
  const u = need()
  const v = visits.find((x) => x.id === b.visit_id)
  payments.push({ id: ++seq, patient_id: Number(m[1]), visit_id: b.visit_id ?? null, doctor_id: v?.doctor_id ?? null, amount: b.amount, method: b.method, paid_at: b.paid_at ?? T, note: b.note ?? '', received_by: u.id, created_at: now() })
  return { id: seq }
})
on('DELETE', '/api/patients/payments/(\\d+)', (m) => {
  need('admin')
  payments.splice(payments.findIndex((y) => y.id === Number(m[1])), 1)
  return { ok: true }
})
on('PUT', '/api/patients/(\\d+)/chart', (m, _q, b) => {
  need('admin', 'doctor')
  const pid = Number(m[1])
  const i = chart.findIndex((x) => x.patient_id === pid && x.tooth === b.tooth)
  if (i >= 0) chart.splice(i, 1)
  if (b.status !== 'healthy') chart.push({ patient_id: pid, tooth: b.tooth, status: b.status, note: '', updated_at: now() })
  return { ok: true }
})

on('GET', '/api/reports', (_m, q) => {
  const u = need()
  const from = q.get('from') ?? `${T.slice(0, 7)}-01`
  const to = q.get('to') ?? T
  let doc = Number(q.get('doctor')) || 0
  if (u.role === 'doctor') doc = u.id
  const pays = payments.filter((y) => y.paid_at >= from && y.paid_at <= to && (!doc || y.doctor_id === doc))
  const vis = visits.filter((v) => v.date >= from && v.date <= to && (!doc || v.doctor_id === doc))
  const ap = appts.filter((a) => a.date >= from && a.date <= to && (!doc || a.doctor_id === doc))
  const sum = (xs: Any[], f: (x: Any) => number) => xs.reduce((s, x) => s + f(x), 0)
  const group = (xs: Any[], key: (x: Any) => string, val: (x: Any) => number) => {
    const m = new Map<string, Any>()
    for (const x of xs) {
      const k = key(x)
      const g = m.get(k) ?? { k, amount: 0, n: 0 }
      g.amount += val(x)
      g.n++
      m.set(k, g)
    }
    return [...m.values()].sort((a, b) => b.amount - a.amount)
  }
  const items = vis.flatMap((v) => v.items)
  const svcMap = new Map<string, Any>()
  for (const i of items) {
    const g = svcMap.get(i.name) ?? { name: i.name, qty: 0, amount: 0 }
    g.qty += i.qty
    g.amount += i.qty * i.price
    svcMap.set(i.name, g)
  }
  const debtors = patients.map((p) => ({ ...p, balance: balance(p.id) })).filter((p) => p.balance > 0)
  return {
    from,
    to,
    doctor: doc,
    collected: { s: sum(pays, (y) => y.amount), n: pays.length },
    billed: { s: sum(vis, (v) => v.total - v.discount), n: vis.length, d: sum(vis, (v) => v.discount) },
    byMethod: group(pays, (y) => y.method, (y) => y.amount).map((g) => ({ method: g.k, amount: g.amount, n: g.n })),
    byDoctor: doctors()
      .filter((d) => !doc || d.id === doc)
      .map((d) => ({ id: d.id, name: d.name, color: d.color, collected: sum(pays.filter((y) => y.doctor_id === d.id), (y) => y.amount), billed: sum(vis.filter((v) => v.doctor_id === d.id), (v) => v.total - v.discount), visits: vis.filter((v) => v.doctor_id === d.id).length, completed: 0 }))
      .sort((a, b) => b.collected - a.collected),
    byService: [...svcMap.values()].sort((a, b) => b.amount - a.amount),
    daily: group(pays, (y) => y.paid_at, (y) => y.amount).map((g) => ({ day: g.k, amount: g.amount })),
    appointments: group(ap, (a) => a.status, () => 1).map((g) => ({ status: g.k, n: g.n })),
    online: { n: ap.filter((a) => a.source === 'online').length, social: ap.filter((a) => /post-|facebook|instagram/.test(a.utm)).length },
    newPatients: patients.filter((p) => p.created_at.slice(0, 10) >= from && p.created_at.slice(0, 10) <= to).length,
    receivables: u.role === 'doctor' ? null : { total: sum(debtors, (p) => p.balance), top: debtors },
  }
})
on('GET', '/api/reports/export', () => {
  throw new E(400, DEMO)
})

on('GET', '/api/settings/clinic', () => (need(), clinic))
on('PUT', '/api/settings/clinic', (_m, _q, b) => (need('admin'), Object.assign(clinic, b), clinic))
on('GET', '/api/settings/sms', () => (need('admin'), smsCfg))
on('PUT', '/api/settings/sms', (_m, _q, b) => (need('admin'), (smsCfg = { ...smsCfg, ...b }), smsCfg))
on('POST', '/api/settings/sms/test', () => ({ ok: false, error: DEMO }))
on('GET', '/api/sms/log', () => (need('admin', 'reception'), { items: smsLog, total: smsLog.length, page: 1 }))
on('POST', '/api/sms/send', () => ({ ok: false, error: DEMO }))
on('GET', '/api/audit', () => (need('admin'), { items: audit, page: 1 }))

on('GET', '/api/staff', () => (need('admin'), { items: users }))
on('POST', '/api/staff', (_m, _q, b) => (need('admin'), users.push({ ...b, id: ++seq, is_doctor: b.role === 'doctor' || b.is_doctor ? 1 : 0, active: 1, must_change_password: 1 }), { id: seq }))
on('PATCH', '/api/staff/(\\d+)', (m, _q, b) => (need('admin'), Object.assign(users.find((u) => u.id === Number(m[1])), b), { ok: true }))
on('POST', '/api/staff/(\\d+)/password', () => (need('admin'), { ok: true }))

const postView = (p: Any) => ({ ...p, preview_caption: p.caption, overdue: false })
on('GET', '/api/marketing/overview', () => {
  need('admin', 'reception')
  const counts: Any = {}
  for (const p of posts) counts[p.status] = (counts[p.status] ?? 0) + 1
  return { aiConfigured: false, model: 'claude-opus-5-5', publicUrl: 'https://togsdental.mn', httpsReady: true, social: { connected: false, pageName: '', igUsername: '', hasInstagram: false }, autopilot, counts, bookingsFromPosts: appts.filter((a) => /post-/.test(a.utm)).length, nextSlots: slotsFrom(3) }
})
on('GET', '/api/marketing/posts', (_m, q) => {
  need('admin', 'reception')
  const hist = q.get('status') === 'history'
  return { items: posts.filter((p) => (hist ? ['published', 'failed', 'rejected'] : ['draft', 'approved']).includes(p.status)).map(postView) }
})
on('POST', '/api/marketing/posts', (_m, _q, b) => (need('admin', 'reception'), { item: postView(addPost({ ...b, source: 'manual', topic: b.design.headline, platforms: b.platforms.join(','), scheduled_at: b.scheduled_at ?? slotsFrom(1)[0] })) }))
on('PATCH', '/api/marketing/posts/(\\d+)', (m, _q, b) => {
  need('admin', 'reception')
  const p = posts.find((x) => x.id === Number(m[1]))
  Object.assign(p, b, b.platforms ? { platforms: b.platforms.join(',') } : {}, { updated_at: now() })
  p.image_url = TPL_IMG[p.template]
  return { item: postView(p) }
})
on('POST', '/api/marketing/posts/(\\d+)/(approve|unapprove|reject|publish)', (m) => {
  need('admin', 'reception')
  const p = posts.find((x) => x.id === Number(m[1]))
  if (m[2] === 'publish') throw new E(400, 'Танилцуулгын хувилбарт Facebook холбогдоогүй. Бодит системд товлосон цагтаа автоматаар нийтлэгдэнэ.')
  p.status = { approve: 'approved', unapprove: 'draft', reject: 'rejected' }[m[2]]
  if (m[2] === 'approve' && !p.scheduled_at) p.scheduled_at = slotsFrom(1)[0]
  return { item: postView(p) }
})
on('DELETE', '/api/marketing/posts/(\\d+)', (m) => (posts.splice(posts.findIndex((p) => p.id === Number(m[1])), 1), { ok: true }))
on('POST', '/api/marketing/posts/generate', () => {
  throw new E(503, 'Танилцуулгын хувилбарт AI холбогдоогүй. Бодит системд Claude таны брэндээр пост бичиж, зураг бүтээнэ. Дээрх “[Жишээ пост]”-ууд үр дүн ямар харагдахыг харуулна.')
})
on('GET', '/api/marketing/brand', () => brand)
on('PUT', '/api/marketing/brand', (_m, _q, b) => ((brand = { ...brand, ...b }), brand))
on('POST', '/api/marketing/brand/learn', () => {
  throw new E(503, DEMO)
})
on('GET', '/api/marketing/media', () => ({ items: media }))
on('POST', '/api/marketing/media', () => {
  throw new E(400, DEMO)
})
on('PATCH', '/api/marketing/media/(\\d+)', (m, _q, b) => (Object.assign(media.find((x) => x.id === Number(m[1])), b), { ok: true }))
on('DELETE', '/api/marketing/media/(\\d+)', () => {
  throw new E(400, DEMO)
})
on('GET', '/api/marketing/autopilot', () => ({ ...autopilot, nextSlots: slotsFrom(5) }))
on('PUT', '/api/marketing/autopilot', (_m, _q, b) => ((autopilot = { ...autopilot, ...b }), { ...autopilot, nextSlots: slotsFrom(5) }))
on('GET', '/api/marketing/social', () => ({ pageId: '', pageToken: '', hasToken: false, igUserId: '', graphVersion: 'v26.0', pageName: '', igUsername: '' }))
on('PUT', '/api/marketing/social', () => {
  throw new E(400, DEMO)
})

/** window.fetch-ийг /api/* хүсэлтэд дууриамал хариугаар солино */
export function installMockApi() {
  const real = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://demo.local')
    if (!url.pathname.startsWith('/api/')) return real(input, init)
    const method = (init?.method ?? 'GET').toUpperCase()
    let body: Any = {}
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = {}
      }
    }
    await new Promise((r) => setTimeout(r, 120))
    for (const [m, re, h] of routes) {
      if (m !== method) continue
      const match = url.pathname.match(re)
      if (!match) continue
      try {
        return new Response(JSON.stringify(h(match, url.searchParams, body) ?? {}), { status: 200, headers: { 'content-type': 'application/json' } })
      } catch (e) {
        const status = e instanceof E ? e.status : 500
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Алдаа' }), { status, headers: { 'content-type': 'application/json' } })
      }
    }
    return new Response(JSON.stringify({ error: DEMO }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
}

export { pName }
