/**
 * API-ийн бүрэн тест: цаг захиалга (давхардал), эрх, түүх, төлбөр, тайлан,
 * SMS (туршилтын gateway), AI маркетингийн пост, Facebook-д нийтлэх (туршилтын Graph API).
 * Ажиллуулах: npm test
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dataDir = mkdtempSync(join(tmpdir(), 'togs-test-'))
process.env.DATA_DIR = dataDir
process.env.NODE_ENV = 'test'
process.env.SCHEDULER = 'off'
process.env.INITIAL_ADMIN_PASSWORD = 'admin-pass-123'
process.env.PUBLIC_URL = 'https://togs.example.mn'
delete process.env.ANTHROPIC_API_KEY
delete process.env.ANTHROPIC_AUTH_TOKEN

/* ---------- туршилтын SMS gateway ба Graph API ---------- */
type Hit = { method: string; url: string; body: string; ctype: string }
const smsHits: Hit[] = []
const graphHits: Hit[] = []
const readBody = (req: IncomingMessage) =>
  new Promise<string>((r) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => r(Buffer.concat(chunks).toString('latin1')))
  })
// Туршилтын сервер app-ийг импортлохоос ӨМНӨ асах ёстой (тохиргоо импорт үед уншигдана)
const mock: Server = createServer(async (req, res) => {
    const hit = { method: req.method!, url: req.url!, body: await readBody(req), ctype: req.headers['content-type'] ?? '' }
    if (req.url!.startsWith('/sms')) {
      smsHits.push(hit)
      res.end('OK sent')
      return
    }
    graphHits.push(hit)
    res.setHeader('content-type', 'application/json')
    if (req.url!.includes('/photos')) return res.end(JSON.stringify({ id: '111', post_id: '999_111' }))
    if (req.url!.includes('/media_publish')) return res.end(JSON.stringify({ id: 'ig-555' }))
    if (req.url!.includes('/media')) return res.end(JSON.stringify({ id: 'creation-1' }))
    if (req.url!.includes('fields=status_code')) return res.end(JSON.stringify({ status_code: 'FINISHED' }))
    if (req.url!.includes('fields=id%2Cname')) return res.end(JSON.stringify({ id: '999', name: 'Төгс шүдний эмнэлэг', instagram_business_account: { id: '178', username: 'togs.dental' } }))
    res.statusCode = 400
    res.end(JSON.stringify({ error: { message: 'unknown', code: 100 } }))
})
await new Promise<void>((r) => mock.listen(0, '127.0.0.1', r))
const mockBase = `http://127.0.0.1:${(mock.address() as { port: number }).port}`
process.env.GRAPH_API_BASE = `${mockBase}/graph`
process.env.NO_PROXY = '127.0.0.1,localhost'

before(() => {})
after(() => {
  mock.close()
  rmSync(dataDir, { recursive: true, force: true })
})

/* ---------- туслах функцууд ---------- */
const { app } = await import('../server/index.ts')
const { today, addDays, parseYmd } = await import('../server/lib/time.ts')
const { runReminders, transliterate } = await import('../server/services/sms.ts')
const { one } = await import('../server/db.ts')

type Res = { status: number; data: any; headers: Headers }
async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; csrf?: boolean; form?: FormData } = {}): Promise<Res> {
  const headers: Record<string, string> = {}
  if (opts.csrf !== false) headers['x-togs'] = '1'
  if (opts.cookie) headers.cookie = opts.cookie
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  const res = await app.request(path, { method, headers, body })
  const text = await res.text()
  let data: any = text
  try {
    data = JSON.parse(text)
  } catch {
    /* text */
  }
  return { status: res.status, data, headers: res.headers }
}
async function login(username: string, password: string) {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-togs': '1' },
    body: JSON.stringify({ username, password }),
  })
  assert.equal(res.status, 200, `login ${username}`)
  return res.headers.get('set-cookie')!.split(';')[0]
}
/** Ажлын өдөр (Даваа–Баасан) олох */
function nextWeekday(from: string, minDays = 1) {
  let d = addDays(from, minDays)
  while ([0, 6].includes(parseYmd(d).getDay())) d = addDays(d, 1)
  return d
}

let admin = ''
let doctorA = ''
let reception = ''
let doctorAId = 0
let doctorBId = 0
const day = nextWeekday(today(), 2)

test('нийтийн мэдээлэл ба CSRF хамгаалалт', async () => {
  const site = await call('GET', '/api/public/site')
  assert.equal(site.status, 200)
  assert.equal(site.data.clinic.name, 'Төгс шүдний эмнэлэг')
  assert.ok(site.data.services.length >= 6)
  const noCsrf = await call('POST', '/api/auth/login', { body: { username: 'admin', password: 'x' }, csrf: false })
  assert.equal(noCsrf.status, 403)
  const unauth = await call('GET', '/api/patients')
  assert.equal(unauth.status, 401)
})

test('админ нэвтрэх, буруу нууц үг, нууц үг солих', async () => {
  const wrong = await call('POST', '/api/auth/login', { body: { username: 'admin', password: 'nope' } })
  assert.equal(wrong.status, 401)
  admin = await login('admin', 'admin-pass-123')
  const meRes = await call('GET', '/api/auth/me', { cookie: admin })
  assert.equal(meRes.data.user.role, 'admin')
  assert.equal(meRes.data.user.must_change_password, 1)
  const changed = await call('POST', '/api/auth/password', { cookie: admin, body: { current: 'admin-pass-123', next: 'new-admin-pass-456' } })
  assert.equal(changed.status, 200)
  const meAfter = await call('GET', '/api/auth/me', { cookie: admin })
  assert.equal(meAfter.data.user.must_change_password, 0)
})

test('ажилтан үүсгэх ба эрхийн хязгаарлалт', async () => {
  const mk = (username: string, name: string, role: string, color = '#1466d6') =>
    call('POST', '/api/staff', {
      cookie: admin,
      body: { username, password: 'doctor-pass-1', name, role, is_doctor: role === 'doctor', phone: '', specialty: '', bio: '', color, online_booking: true, show_on_site: true },
    })
  const a = await mk('bolor', 'Б. Болор', 'doctor')
  const b = await mk('temuulen', 'Д. Тэмүүлэн', 'doctor', '#3fae12')
  const r = await mk('front', 'Ресепшн', 'reception')
  assert.equal(a.status, 201)
  assert.equal(r.status, 201)
  doctorAId = a.data.id
  doctorBId = b.data.id
  doctorA = await login('bolor', 'doctor-pass-1')
  reception = await login('front', 'doctor-pass-1')
  assert.equal((await call('GET', '/api/staff', { cookie: doctorA })).status, 403)
  assert.equal((await call('GET', '/api/doctors', { cookie: reception })).data.items.length, 2)
  assert.equal((await call('PUT', '/api/settings/clinic', { cookie: reception, body: {} })).status, 403)
})

let refA = ''
test('онлайн захиалга: сул цаг, давхардал, автоматаар эмч оноох', async () => {
  const site = await call('GET', '/api/public/site')
  const whitening = site.data.services.find((s: any) => s.name === 'Япон шүд цайруулалт')
  const slots = await call('GET', `/api/public/slots?date=${day}&service=${whitening.id}`)
  assert.equal(slots.status, 200)
  assert.ok(slots.data.slots.some((s: any) => s.time === '10:00' && s.free))
  assert.ok(!slots.data.slots.some((s: any) => s.time === '13:00'), 'үдийн завсарлагад цаг гарахгүй')

  const book = (body: object) => call('POST', '/api/public/bookings', { body })
  const base = { service_id: whitening.id, date: day, time: '10:00', teeth: [11, 21], note: 'Туршилт', utm: 'facebook:post-7' }
  const r1 = await book({ ...base, doctor_id: doctorAId, name: 'Тест Нэг', phone: '9911 2233' })
  assert.equal(r1.status, 201, JSON.stringify(r1.data))
  refA = r1.data.ref
  // Нэг эмчид давхар цаг: 10:30 (цайруулалт 60 мин) давхцана
  const clash = await book({ ...base, time: '10:30', doctor_id: doctorAId, name: 'Тест Хоёр', phone: '88112233' })
  assert.equal(clash.status, 409)
  // "Аль ч эмч": өөр эмчид оноогдоно
  const anyDoc = await book({ ...base, time: '10:00', name: 'Тест Гурав', phone: '88112234' })
  assert.equal(anyDoc.status, 201)
  assert.equal(anyDoc.data.doctor, 'Д. Тэмүүлэн')
  // Хоёр эмч хоёулаа завгүй → тэр цаг дүүрсэн
  const full = await book({ ...base, time: '10:00', name: 'Тест Дөрөв', phone: '88112235' })
  assert.equal(full.status, 409)
  const after = await call('GET', `/api/public/slots?date=${day}&service=${whitening.id}`)
  assert.equal(after.data.slots.find((s: any) => s.time === '10:00').free, false)
  // Ням гараг ажиллахгүй
  let sunday = addDays(today(), 1)
  while (parseYmd(sunday).getDay() !== 0) sunday = addDays(sunday, 1)
  assert.equal((await book({ ...base, date: sunday, name: 'Тест', phone: '88112236' })).status, 400)
  // Утасны дугаар буруу
  assert.equal((await book({ ...base, time: '15:00', name: 'Тест', phone: '123' })).status, 400)
})

test('миний захиалга: төлөв ба цуцлах', async () => {
  const st = await call('POST', '/api/public/bookings/status', { body: { items: [{ ref: refA, phone: '99112233' }, { ref: refA, phone: '00000000' }] } })
  assert.equal(st.data.items.length, 1)
  assert.equal(st.data.items[0].status, 'pending')
  const wrongPhone = await call('POST', `/api/public/bookings/${refA}/cancel`, { body: { phone: '88888888' } })
  assert.equal(wrongPhone.status, 404)
})

let patientId = 0
let apptId = 0
test('ажилтан: хүлээгдэж буй захиалга, үйлчлүүлэгчтэй холбох, давхардал', async () => {
  const pending = await call('GET', '/api/appointments/pending', { cookie: reception })
  const mine = pending.data.items.find((a: any) => a.ref === refA)
  assert.ok(mine)
  assert.equal(mine.utm, 'facebook:post-7')
  apptId = mine.id
  const linked = await call('POST', `/api/appointments/${apptId}/link`, {
    cookie: reception,
    body: { create: { last_name: 'Тест', first_name: 'Нэг', phone: '99112233' } },
  })
  assert.equal(linked.status, 200)
  patientId = linked.data.item.patient_id
  assert.ok(patientId)
  const confirmed = await call('PATCH', `/api/appointments/${apptId}`, { cookie: reception, body: { status: 'confirmed' } })
  assert.equal(confirmed.data.item.status, 'confirmed')
  // Ресепшн давхар цаг үүсгэх гэвэл 409
  const clash = await call('POST', '/api/appointments', {
    cookie: reception,
    body: { patient_id: patientId, doctor_id: doctorAId, date: day, start_time: '10:15', duration: 30 },
  })
  assert.equal(clash.status, 409)
  const ok = await call('POST', '/api/appointments', {
    cookie: reception,
    body: { patient_id: patientId, doctor_id: doctorAId, date: day, start_time: '11:00', duration: 30, source: 'phone' },
  })
  assert.equal(ok.status, 201)
  // Цагийг давхцах цаг руу шилжүүлэх гэвэл 409
  const moveClash = await call('PATCH', `/api/appointments/${ok.data.item.id}`, { cookie: reception, body: { start_time: '10:30' } })
  assert.equal(moveClash.status, 409)
  const list = await call('GET', `/api/appointments?from=${day}&to=${day}&doctor=${doctorAId}`, { cookie: doctorA })
  assert.equal(list.data.items.length, 2)
})

test('эмчилгээний түүх, шүдний диаграм, төлбөр, үлдэгдэл', async () => {
  // Ресепшн эмчилгээ бүртгэхгүй
  const denied = await call('POST', `/api/patients/${patientId}/visits`, { cookie: reception, body: { date: day } })
  assert.equal(denied.status, 403)
  const visit = await call('POST', `/api/patients/${patientId}/visits`, {
    cookie: doctorA,
    body: {
      appointment_id: apptId,
      date: today(),
      complaint: 'Шүд шарласан',
      diagnosis: 'Өнгө өөрчлөгдсөн',
      treatment: 'Япон цайруулалт хийсэн',
      teeth: '11,21',
      items: [
        { name: 'Япон шүд цайруулалт', qty: 1, price: 350000 },
        { name: 'Үзлэг', qty: 1, price: 20000 },
      ],
      discount: 20000,
      chart: [{ tooth: 36, status: 'caries' }],
    },
  })
  assert.equal(visit.status, 201)
  const pay = await call('POST', `/api/patients/${patientId}/payments`, {
    cookie: reception,
    body: { amount: 200000, method: 'card', visit_id: visit.data.id },
  })
  assert.equal(pay.status, 201)
  const card = await call('GET', `/api/patients/${patientId}`, { cookie: doctorA })
  assert.equal(card.data.visits.length, 1)
  assert.equal(card.data.visits[0].total, 370000)
  assert.equal(card.data.visits[0].items.length, 2)
  assert.equal(card.data.patient.balance, 150000)
  assert.equal(card.data.chart[0].tooth, 36)
  assert.ok(card.data.patient.recall_due > today())
  const appt = card.data.appointments.find((a: any) => a.id === apptId)
  assert.equal(appt.status, 'completed')
  // Хайлт: утас, нэрээр
  const byPhone = await call('GET', '/api/patients?q=9911', { cookie: reception })
  assert.equal(byPhone.data.items[0].id, patientId)
  const byName = await call('GET', '/api/patients?q=нэг', { cookie: reception })
  assert.equal(byName.data.total, 1)
  // Шүдний диаграм шинэчлэх
  assert.equal((await call('PUT', `/api/patients/${patientId}/chart`, { cookie: doctorA, body: { tooth: 36, status: 'filled' } })).status, 200)
  // Зөвхөн админ төлбөр устгана
  assert.equal((await call('DELETE', `/api/patients/payments/${pay.data.id}`, { cookie: reception })).status, 403)
})

test('рентген файл: зөвхөн нэвтэрсэн ажилтанд', async () => {
  const form = new FormData()
  form.set('file', new Blob([Buffer.from('%PDF-1.4 test')], { type: 'application/pdf' }), 'xray.pdf')
  form.set('kind', 'xray')
  const up = await call('POST', `/api/patients/${patientId}/files`, { cookie: doctorA, form })
  assert.equal(up.status, 201)
  const anon = await app.request(`/api/patients/files/${up.data.id}`)
  assert.equal(anon.status, 401)
  const got = await app.request(`/api/patients/files/${up.data.id}`, { headers: { cookie: doctorA } })
  assert.equal(got.status, 200)
  assert.equal(got.headers.get('content-type'), 'application/pdf')
})

test('тайлан: эмч бүрийн орлого, төлбөрийн төрөл, CSV', async () => {
  const r = await call('GET', `/api/reports?from=${addDays(today(), -1)}&to=${addDays(today(), 7)}`, { cookie: admin })
  assert.equal(r.status, 200)
  assert.equal(r.data.collected.s, 200000)
  assert.equal(r.data.billed.s, 350000)
  const a = r.data.byDoctor.find((d: any) => d.id === doctorAId)
  assert.equal(a.collected, 200000)
  assert.equal(r.data.byMethod[0].method, 'card')
  assert.equal(r.data.receivables.total, 150000)
  assert.ok(r.data.online.social >= 1, 'постоос ирсэн захиалга тоологдоно')
  // Эмч зөвхөн өөрийнхийгөө харна
  const own = await call('GET', '/api/reports', { cookie: doctorA })
  assert.equal(own.data.doctor, doctorAId)
  assert.equal(own.data.receivables, null)
  const csv = await app.request(`/api/reports/export?type=payments&from=${today()}&to=${today()}`, { headers: { cookie: admin } })
  const bytes = Buffer.from(await csv.arrayBuffer())
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'Excel-д зориулсан UTF-8 BOM')
  const text = bytes.toString('utf8')
  assert.ok(text.includes('Огноо'))
  assert.ok(text.includes('200000'))
})

test('SMS: тохиргоо, захиалгын SMS, маргаашийн сануулга, латин хөрвүүлэлт', async () => {
  assert.equal(transliterate('Төгс шүдний эмнэлэг'), 'Tugs shudnii emneleg')
  const cur = await call('GET', '/api/settings/sms', { cookie: admin })
  const saved = await call('PUT', '/api/settings/sms', {
    cookie: admin,
    body: { ...cur.data, enabled: true, method: 'GET', url: `${mockBase}/sms?to={phone}&text={message}`, successMatch: 'OK' },
  })
  assert.equal(saved.status, 200)
  const test1 = await call('POST', '/api/settings/sms/test', { cookie: admin, body: { phone: '99112233' } })
  assert.equal(test1.data.ok, true)
  // Онлайн захиалга → SMS
  const site = await call('GET', '/api/public/site')
  const svc = site.data.services.find((s: any) => s.name === 'Шүдний ломбо')
  const tomorrow = addDays(today(), 1)
  const before = smsHits.length
  let bookedTomorrow = false
  if (![0].includes(parseYmd(tomorrow).getDay())) {
    const slots = await call('GET', `/api/public/slots?date=${tomorrow}&service=${svc.id}`)
    const free = slots.data.slots.find((s: any) => s.free)
    if (free) {
      const b = await call('POST', '/api/public/bookings', { body: { service_id: svc.id, date: tomorrow, time: free.time, name: 'Сануулга Тест', phone: '95551234' } })
      assert.equal(b.status, 201)
      bookedTomorrow = true
    }
  }
  if (!bookedTomorrow) {
    // Маргааш амралтын өдөр бол ажилтан цаг үүсгэнэ
    const r = await call('POST', '/api/appointments', {
      cookie: reception,
      body: { contact_name: 'Сануулга Тест', contact_phone: '95551234', doctor_id: doctorBId, date: tomorrow, start_time: '12:00', duration: 30 },
    })
    assert.equal(r.status, 201)
  }
  await new Promise((r) => setTimeout(r, 200))
  if (bookedTomorrow) assert.ok(smsHits.length > before, 'захиалгын SMS илгээгдсэн')
  const reminderTime = new Date()
  reminderTime.setHours(12, 0, 0, 0)
  const sent = await runReminders(reminderTime)
  assert.ok(sent >= 1)
  const last = smsHits.at(-1)!
  assert.ok(decodeURIComponent(last.url).includes('Margaash'), last.url)
  assert.ok(last.url.includes('to=95551234'))
  // Давтан ажиллуулахад дахин илгээхгүй
  assert.equal(await runReminders(reminderTime), 0)
  const log = await call('GET', '/api/sms/log', { cookie: reception })
  assert.ok(log.data.items.some((l: any) => l.kind === 'reminder' && l.status === 'sent'))
})

test('AI маркетинг: түлхүүргүй үед ойлгомжтой алдаа', async () => {
  const ov = await call('GET', '/api/marketing/overview', { cookie: admin })
  assert.equal(ov.data.aiConfigured, false)
  const gen = await call('POST', '/api/marketing/posts/generate', { cookie: admin, body: { count: 2 } })
  assert.equal(gen.status, 503)
  assert.match(gen.data.error, /ANTHROPIC_API_KEY/)
  assert.equal((await call('GET', '/api/marketing/overview', { cookie: doctorA })).status, 403)
})

test('пост: гараар үүсгэх → зураг → батлах → Facebook + Instagram-д нийтлэх', async () => {
  const created = await call('POST', '/api/marketing/posts', {
    cookie: reception,
    body: {
      caption: 'Шүдээ өдөрт 2 удаа, 2 минут угааж хэвшээрэй. Онлайнаар цагаа захиалаарай!',
      hashtags: '#ТөгсШүднийЭмнэлэг #Арвайхээр',
      template: 'tip',
      design: { headline: 'Шүдээ зөв угаах 3 дүрэм', subline: '', points: ['Өдөрт 2 удаа', '2 минут', 'Зөөлөн сойз'], badge: 'Зөвлөгөө', media_id: null },
      platforms: ['facebook', 'instagram'],
    },
  })
  assert.equal(created.status, 201, JSON.stringify(created.data))
  const post = created.data.item
  assert.ok(post.image_url.startsWith('/media/posts/'))
  assert.ok(post.preview_caption.includes('utm_campaign=post-'))
  const img = await app.request(post.image_url)
  assert.equal(img.status, 200)
  assert.equal(img.headers.get('content-type'), 'image/jpeg')
  // Facebook холбох (туршилтын Graph API)
  const social = await call('PUT', '/api/marketing/social', { cookie: admin, body: { pageId: '999', pageToken: 'test-token-abcd', igUserId: '', graphVersion: 'v26.0' } })
  assert.equal(social.status, 200, JSON.stringify(social.data))
  assert.equal(social.data.pageName, 'Төгс шүдний эмнэлэг')
  assert.equal(social.data.igUserId, '178')
  assert.equal(social.data.pageToken, '••••abcd')
  const approved = await call('POST', `/api/marketing/posts/${post.id}/approve`, { cookie: reception, body: {} })
  assert.equal(approved.data.item.status, 'approved')
  const pub = await call('POST', `/api/marketing/posts/${post.id}/publish`, { cookie: reception })
  assert.equal(pub.status, 200, JSON.stringify(pub.data))
  assert.equal(pub.data.item.status, 'published')
  assert.equal(pub.data.item.fb_post_id, '999_111')
  assert.equal(pub.data.item.ig_media_id, 'ig-555')
  const fbHit = graphHits.find((h) => h.url.includes('/999/photos'))!
  assert.ok(fbHit.ctype.startsWith('multipart/form-data'))
  const igHit = graphHits.find((h) => h.url.includes('/178/media') && !h.url.includes('publish'))!
  assert.ok(decodeURIComponent(igHit.body).includes('https://togs.example.mn/media/posts/'))
  // Нийтлэгдсэн постыг засахгүй
  assert.equal((await call('PATCH', `/api/marketing/posts/${post.id}`, { cookie: reception, body: { caption: 'Шинэ текст оруулав, засвар' } })).status, 400)
  const stored = one<{ status: string }>('SELECT status FROM posts WHERE id = ?', post.id)
  assert.equal(stored?.status, 'published')
})

test('autopilot хуваарь: 2 хоног тутам', async () => {
  const cur = await call('GET', '/api/marketing/autopilot', { cookie: admin })
  const saved = await call('PUT', '/api/marketing/autopilot', { cookie: admin, body: { ...cur.data, nextSlots: undefined, frequency: 'every2', time: '19:00' } })
  assert.equal(saved.status, 200, JSON.stringify(saved.data))
  const [a, b] = saved.data.nextSlots as string[]
  const gap = (parseYmd(b.slice(0, 10)).getTime() - parseYmd(a.slice(0, 10)).getTime()) / 86_400_000
  assert.equal(gap, 2)
  assert.ok(a.endsWith('19:00'))
})
