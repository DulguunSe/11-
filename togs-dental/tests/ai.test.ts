/**
 * AI маркетингийн интеграцийн тест: Claude API-д илгээх хүсэлтийн бүтэц (model, structured output,
 * fallbacks) болон хариуг пост болгох бүх урсгалыг (зураг бүтээх, хуваарьт оруулах) шалгана.
 * Туршилтын сервер ашигладаг тул Claude-ийн бодит бичих чанарыг ЭНЭ тест шалгахгүй.
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dataDir = mkdtempSync(join(tmpdir(), 'togs-ai-'))
type Hit = { url: string; headers: IncomingMessage['headers']; body: any }
const hits: Hit[] = []
let mode: 'plan' | 'refusal' | 'text' = 'plan'

const plan = {
  posts: [
    {
      kind: 'tip',
      topic: 'Шүдээ зөв угаах',
      caption: 'Шүдээ өдөрт 2 удаа, 2 минут угаах нь эрүүл инээмсэглэлийн үндэс. Зөөлөн сойз хэрэглээрэй!',
      hashtags: ['#ТөгсШүднийЭмнэлэг', 'Арвайхээр'],
      template: 'tip',
      headline: 'Шүдээ зөв угаах 3 дүрэм',
      subline: '',
      points: ['Өдөрт 2 удаа', '2 минут', 'Зөөлөн сойз'],
      badge: 'Зөвлөгөө',
      media_id: null,
    },
    {
      kind: 'whitening',
      topic: 'Япон цайруулалт',
      caption: 'WHITE ESSENCE Япон цайруулалтаар шүдээ өвдөлтгүй цайруулаарай.',
      hashtags: ['#ЯпонЦайруулалт'],
      template: 'photo',
      headline: 'Япон шүд цайруулалт',
      subline: 'Өвдөлтгүй, пааланг гэмтээхгүй',
      points: [],
      badge: 'Онцлох',
      media_id: 999, // санд байхгүй ID → null болох ёстой
    },
  ],
}

const mock = createServer(async (req, res) => {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  hits.push({ url: req.url!, headers: req.headers, body })
  const text = mode === 'text' ? '- Найрсаг, товч өгүүлбэр\n- 1-2 эможи' : JSON.stringify(plan)
  res.setHeader('content-type', 'application/json')
  res.end(
    JSON.stringify({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      model: body.model,
      content: mode === 'refusal' ? [] : [{ type: 'text', text }],
      stop_reason: mode === 'refusal' ? 'refusal' : 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    }),
  )
})
await new Promise<void>((r) => mock.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${(mock.address() as { port: number }).port}`

process.env.DATA_DIR = dataDir
process.env.NODE_ENV = 'test'
process.env.SCHEDULER = 'off'
process.env.INITIAL_ADMIN_PASSWORD = 'admin-pass-123'
process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
process.env.ANTHROPIC_BASE_URL = base
process.env.NO_PROXY = '127.0.0.1,localhost'

after(() => {
  mock.close()
  rmSync(dataDir, { recursive: true, force: true })
})

const { app } = await import('../server/index.ts')
const login = async () => {
  const r = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-togs': '1' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass-123' }),
  })
  return r.headers.get('set-cookie')!.split(';')[0]
}
const post = async (cookie: string, path: string, body: unknown) => {
  const r = await app.request(path, { method: 'POST', headers: { cookie, 'x-togs': '1', 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: r.status, data: (await r.json()) as any }
}

test('AI пост үүсгэх: хүсэлтийн бүтэц ба бүх урсгал', async () => {
  const cookie = await login()
  const r = await post(cookie, '/api/marketing/posts/generate', { count: 2, focus: 'Хүүхдийн шүдний эрүүл мэнд' })
  assert.equal(r.status, 201, JSON.stringify(r.data))
  assert.equal(r.data.items.length, 2)
  const [a, b] = r.data.items
  assert.equal(a.source, 'ai')
  assert.equal(a.status, 'draft')
  assert.equal(a.template, 'tip')
  assert.deepEqual(a.design.points, ['Өдөрт 2 удаа', '2 минут', 'Зөөлөн сойз'])
  assert.equal(a.hashtags, '#ТөгсШүднийЭмнэлэг #Арвайхээр')
  assert.equal(b.design.media_id, null, 'байхгүй зургийн ID-г хаяна')
  assert.ok(a.scheduled_at && b.scheduled_at && a.scheduled_at < b.scheduled_at, 'дараалсан хуваарьт цаг')
  for (const p of r.data.items) {
    const img = await app.request(p.image_url)
    assert.equal(img.status, 200)
    assert.equal(img.headers.get('content-type'), 'image/jpeg')
  }
  const hit = hits.at(-1)!
  assert.match(hit.url, /^\/v1\/messages/)
  assert.ok(String(hit.headers['anthropic-beta']).includes('server-side-fallback-2026-07-01'))
  // SDK 1.x нь API түлхүүрийг Authorization: Bearer толгойгоор илгээдэг
  assert.equal(hit.headers.authorization, 'Bearer sk-ant-test')
  assert.equal(hit.body.model, 'claude-opus-5-5')
  assert.equal(hit.body.fallbacks, 'default')
  assert.equal(hit.body.output_config.effort, 'medium')
  assert.equal(hit.body.output_config.format.type, 'json_schema')
  assert.ok(hit.body.output_config.format.schema.properties.posts, 'JSON schema-д posts талбар байна')
  const userMsg = hit.body.messages[0].content as string
  assert.ok(userMsg.includes('Төгс шүдний эмнэлэг'))
  assert.ok(userMsg.includes('Create exactly 2 posts'))
  assert.ok(userMsg.includes('Хүүхдийн шүдний эрүүл мэнд'))
  assert.ok(userMsg.includes('id 2:'), 'зургийн сангийн тайлбар дамжина')
})

test('AI татгалзвал ойлгомжтой алдаа', async () => {
  mode = 'refusal'
  const cookie = await login()
  const r = await post(cookie, '/api/marketing/posts/generate', { count: 1 })
  assert.equal(r.status, 422)
  assert.match(r.data.error, /татгалзлаа/)
})

test('хэв маяг сургах', async () => {
  mode = 'text'
  const cookie = await login()
  const samples = 'Сайн байна уу! Манай эмнэлэгт шинэ Япон цайруулалт ирлээ 😊 Цагаа урьдчилан захиалаарай.\n\nХүүхдийнхээ шүдийг 6 сар тутам үзүүлээрэй. Эрт илрүүлэх нь хамгийн чухал.'
  const r = await post(cookie, '/api/marketing/brand/learn', { samples })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  assert.ok(r.data.styleGuide.includes('Найрсаг'))
  assert.equal(hits.at(-1)!.body.output_config.effort, 'low')
})
