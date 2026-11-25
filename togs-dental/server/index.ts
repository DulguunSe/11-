import './lib/tz.ts'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { bodyLimit } from 'hono/body-limit'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { migrate } from './db.ts'
import { env } from './lib/env.ts'
import { csrfGuard, loadUser } from './auth.ts'
import { HttpError, type AppEnv } from './http.ts'
import { seed } from './seed.ts'
import { publicRoutes } from './routes/public.ts'
import { authRoutes } from './routes/auth.ts'
import { staffRoutes } from './routes/staff.ts'
import { appointmentRoutes } from './routes/appointments.ts'
import { patientRoutes } from './routes/patients.ts'
import { adminRoutes } from './routes/admin.ts'
import { marketingRoutes } from './routes/marketing.ts'
import { renderOgImage } from './services/render.ts'
import { startScheduler } from './services/scheduler.ts'

migrate()
seed()

export const app = new Hono<AppEnv>()

/* ---------------- Аюулгүй байдлын толгойнууд ---------------- */
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-Frame-Options', 'SAMEORIGIN')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (env.secureCookies) c.header('Strict-Transport-Security', 'max-age=15552000')
})

/* ---------------- API ---------------- */
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 25 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Файл эсвэл өгөгдөл хэт том байна' }, 413),
  }),
)
app.use('/api/*', loadUser)
app.use('/api/*', csrfGuard)
app.use('/api/*', async (c, next) => {
  await next()
  if (!c.res.headers.get('Cache-Control')) c.header('Cache-Control', 'no-store')
})

app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))
app.route('/api/public', publicRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/appointments', appointmentRoutes)
app.route('/api/patients', patientRoutes)
app.route('/api/marketing', marketingRoutes)
app.route('/api', staffRoutes)
app.route('/api', adminRoutes)
app.all('/api/*', (c) => c.json({ error: 'API олдсонгүй' }, 404))

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 400)
  console.error(err)
  return c.json({ error: 'Серверийн алдаа гарлаа. Дахин оролдоно уу.' }, 500)
})

/* ---------------- Маркетингийн зураг (нийтэд нээлттэй) ---------------- */
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const mediaRoot = resolve(env.uploadsDir, 'media')
app.get('/media/*', (c) => {
  let rel: string
  try {
    rel = decodeURIComponent(c.req.path.slice('/media/'.length))
  } catch {
    return c.notFound()
  }
  const abs = resolve(mediaRoot, rel)
  if (!abs.startsWith(mediaRoot + sep) || !existsSync(abs) || !MIME[extname(abs).toLowerCase()]) return c.notFound()
  c.header('Content-Type', MIME[extname(abs).toLowerCase()])
  c.header('Content-Length', String(statSync(abs).size))
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(Readable.toWeb(createReadStream(abs)) as ReadableStream)
})

/* ---------------- Open Graph зураг ---------------- */
const ogPath = resolve(env.dataDir, 'og.jpg')
app.get('/og.jpg', async (c) => {
  if (!existsSync(ogPath)) await renderOgImage(ogPath)
  c.header('Content-Type', 'image/jpeg')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(readFileSync(ogPath))
})

/* ---------------- Вэбсайт ба админ (build хийсэн файлууд) ---------------- */
const clientDir = resolve('dist/client')
if (existsSync(clientDir)) {
  const root = relative(process.cwd(), clientDir) || '.'
  app.use('/assets/*', async (c, next) => {
    await next()
    if (c.res.status === 200) c.header('Cache-Control', 'public, max-age=31536000, immutable')
  })
  app.use('*', serveStatic({ root }))
  const html = (file: string) => readFileSync(resolve(clientDir, file), 'utf8').replaceAll('%PUBLIC_URL%', env.publicUrl)
  const siteHtml = html('index.html')
  const adminHtml = html('admin.html')
  app.get('/admin', (c) => (c.header('Cache-Control', 'no-store'), c.html(adminHtml)))
  app.get('/admin/*', (c) => (c.header('Cache-Control', 'no-store'), c.html(adminHtml)))
  app.get('*', (c) => (c.header('Cache-Control', 'no-cache'), c.html(siteHtml)))
}

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: env.port }, (info) => {
    console.log(`Төгс шүдний эмнэлгийн систем: http://localhost:${info.port}  (сайт: ${env.publicUrl})`)
  })
  if (env.schedulerEnabled) startScheduler()
  if (!existsSync(ogPath)) renderOgImage(ogPath).catch((e) => console.error('OG зураг:', e))
}
