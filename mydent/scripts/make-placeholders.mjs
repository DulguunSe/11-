/**
 * Түр (placeholder) зургуудыг public/images руу үүсгэнэ.
 * Generates the placeholder images in public/images.
 *
 *   npm run images            → зөвхөн байхгүй файлуудыг үүсгэнэ (бодит зургийг ДАРЖ БИЧИХГҮЙ)
 *   npm run images -- --force → бүгдийг дахин үүсгэнэ
 *
 * Бодит зургаа оруулахдаа ижил нэртэй .jpg файлаар солиход хангалттай.
 * To use real photos, just overwrite the .jpg with the same name.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Playwright: төсөлд суулгаагүй бол глобал суулгацыг ашиглана (npm i -D playwright)
const { chromium } = createRequire(import.meta.url)('playwright')

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')
const force = process.argv.includes('--force')

const ICONS = {
  camera:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
  school: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  tooth:
    '<path d="M7 3C4 3 2.5 5.5 3 9c.5 3 2 4.5 2.5 7.5S6.5 22 8 22s1.5-3 2.5-5.5c.5-1.5 2.5-1.5 3 0 1 2.5 1 5.5 2.5 5.5s2-2.5 2.5-5.5S20.5 12 21 9c.5-3.5-1-6-4-6-2 0-3 1-5 1s-3-1-5-1Z"/>',
}

const swirl = (color, opacity) => `
<svg viewBox="0 0 400 300" fill="none" style="position:absolute;right:-8%;bottom:-12%;width:62%;opacity:${opacity}">
  <path d="M-40 250C20 170 90 150 130 190s10 110-50 90-40-130 60-170 190 10 200 90-60 120-120 90" stroke="${color}" stroke-width="26" stroke-linecap="round"/>
  <path d="M250 -30c40 60 120 70 180 30" stroke="${color}" stroke-width="26" stroke-linecap="round"/>
</svg>`

function placeholderHtml({ w, h, title, file, icon = 'camera', tone = 'green', label }) {
  const bg =
    tone === 'before'
      ? 'linear-gradient(135deg,#eceae2,#ddd8c8)'
      : tone === 'after'
        ? 'linear-gradient(135deg,#f2f9ec,#d7efc4)'
        : 'linear-gradient(135deg,#f2f9ec 0%,#e2f2d4 55%,#c7e5ad 100%)'
  const s = Math.min(w, h)
  const iconSize = Math.round(s * 0.13)
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Montserrat:wght@700;800&display=block&subset=cyrillic,cyrillic-ext" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;font-family:Inter,sans-serif;background:${bg};position:relative;display:grid;place-items:center}
  .card{position:relative;text-align:center;padding:${Math.round(s * 0.05)}px ${Math.round(s * 0.06)}px;max-width:82%}
  .ic{width:${iconSize * 1.9}px;height:${iconSize * 1.9}px;border-radius:${iconSize * 0.55}px;background:rgba(255,255,255,.75);display:grid;place-items:center;margin:0 auto;box-shadow:0 10px 30px -12px rgba(27,80,32,.35)}
  .ic svg{width:${iconSize}px;height:${iconSize}px;stroke:${tone === 'before' ? '#8a8473' : '#3b8224'}}
  h1{font-family:Montserrat,sans-serif;font-weight:800;color:${tone === 'before' ? '#5e5a4c' : '#1b5020'};font-size:${Math.max(16, Math.round(s * 0.052))}px;line-height:1.2;margin-top:${Math.round(s * 0.04)}px}
  .file{display:inline-block;margin-top:${Math.round(s * 0.025)}px;font-weight:600;font-size:${Math.max(12, Math.round(s * 0.03))}px;color:${tone === 'before' ? '#6f6a5a' : '#2f6f22'};background:rgba(255,255,255,.7);padding:.35em .9em;border-radius:999px}
  .size{margin-top:${Math.round(s * 0.015)}px;font-size:${Math.max(11, Math.round(s * 0.024))}px;color:rgba(20,38,26,.5)}
  .label{position:absolute;left:50%;top:${Math.round(s * 0.06)}px;transform:translateX(-50%);font-family:Montserrat;font-weight:800;letter-spacing:.2em;font-size:${Math.max(12, Math.round(s * 0.035))}px;color:${tone === 'before' ? '#8a8473' : '#3b8224'}}
</style></head><body>
${swirl(tone === 'before' ? '#a9a28c' : '#5bb531', tone === 'before' ? 0.18 : 0.16)}
${label ? `<div class="label">${label}</div>` : ''}
<div class="card">
  <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg></div>
  <h1>${title}</h1>
  <div class="file">${file}</div>
  <div class="size">${w} × ${h}</div>
</div></body></html>`
}

function ogHtml() {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Montserrat:wght@700;800&display=block&subset=cyrillic,cyrillic-ext" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;background:linear-gradient(135deg,#f2f9ec,#ffffff 60%);position:relative}
.band{position:absolute;left:0;right:0;bottom:0;height:150px;background:#5bb531}
.wrap{position:absolute;left:80px;top:70px;right:80px}
.logo{display:flex;align-items:center;gap:18px}
.mark{width:84px;height:84px;border-radius:24px;background:#5bb531;display:grid;place-items:center}
.word{font-family:Montserrat;font-weight:800;font-size:54px;color:#14261a;line-height:1}
.word span{color:#5bb531}
.sub{font-weight:600;letter-spacing:.16em;font-size:15px;color:#56665b;margin-top:6px;text-transform:uppercase}
h1{font-family:Montserrat;font-weight:800;font-size:52px;line-height:1.12;color:#1b5020;margin-top:46px;max-width:880px}
p{font-size:24px;color:#56665b;margin-top:16px}
.foot{position:absolute;left:80px;right:80px;bottom:44px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-weight:700;font-size:26px}
.pill{background:#1b5020;border-radius:999px;padding:14px 28px}
</style></head><body>
<svg viewBox="0 0 400 300" fill="none" style="position:absolute;right:-60px;top:-40px;width:520px;opacity:.12"><path d="M-40 250C20 170 90 150 130 190s10 110-50 90-40-130 60-170 190 10 200 90-60 120-120 90" stroke="#1b5020" stroke-width="26" stroke-linecap="round"/></svg>
<div class="band"></div>
<svg viewBox="0 0 400 300" fill="none" style="position:absolute;left:-60px;bottom:-120px;width:420px;opacity:.9"><path d="M-40 250C20 170 90 150 130 190s10 110-50 90-40-130 60-170 190 10 200 90-60 120-120 90" stroke="#1b5020" stroke-width="26" stroke-linecap="round"/></svg>
<div class="wrap">
  <div class="logo">
    <div class="mark"><svg width="58" height="58" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6C8 6 5 11 6 18c1 6 4 9 5 15 1 6 2 11 5 11s3-6 5-11c1-3 5-3 6 0 2 5 2 11 5 11s4-5 5-11c1-6 4-9 5-15 1-7-2-12-8-12-4 0-6 2-10 2s-6-2-10-2Z"/><path d="M24 26c-6-4-7.5-7.5-5.2-10 1.7-1.8 4.2-1.2 5.2.8 1-2 3.5-2.6 5.2-.8 2.3 2.5.8 6-5.2 10Z" fill="#fff" stroke-width="2"/></svg></div>
    <div><div class="word">My<span>Dent</span></div><div class="sub">Professional Dental Clinic</div></div>
  </div>
  <h1>Гэр бүлийн шүд, гажиг заслын эмнэлэг</h1>
  <p>Нарны зам, Алтан-Орд төв 2 давхар · Улаанбаатар</p>
</div>
<div class="foot"><span class="pill">Онлайнаар цаг захиалах</span><span>7744-0077 · 11-480090</span></div>
</body></html>`
}

function touchIconHtml() {
  return `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:#5bb531;display:grid;place-items:center">
<svg width="120" height="120" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6C8 6 5 11 6 18c1 6 4 9 5 15 1 6 2 11 5 11s3-6 5-11c1-3 5-3 6 0 2 5 2 11 5 11s4-5 5-11c1-6 4-9 5-15 1-7-2-12-8-12-4 0-6 2-10 2s-6-2-10-2Z"/><path d="M24 26c-6-4-7.5-7.5-5.2-10 1.7-1.8 4.2-1.2 5.2.8 1-2 3.5-2.6 5.2-.8 2.3 2.5.8 6-5.2 10Z" fill="#fff" stroke-width="2"/></svg></body></html>`
}

const services = {
  general: 'Ерөнхий эмчилгээ',
  orthodontics: 'Гажиг засал',
  whitening: 'Шүд цайруулалт',
  pediatric: 'Хүүхдийн шүдний эмчилгээ',
  cleaning: 'Шүдний цэвэрлэгээ',
  sealants: 'Шүдний силант',
  dentures: 'Шүдэлбэр',
  xray: 'Рентген зураг',
  cosmetic: 'Гоо заслын эмчилгээ',
  rootCanal: 'Сувгийн эмчилгээ',
}
const tipsList = {
  'yellow-teeth': 'Шүд яагаад шарладаг вэ?',
  coffee: 'Кофе ба шүд',
  toothbrush: 'Шүдний сойз сонгох',
  'baby-teeth': 'Хүүхдийн сүүн шүд',
  'bad-breath': 'Амны эвгүй үнэр',
  smoking: 'Тамхи ба шүд',
  checkup: '6 сар тутмын үзлэг',
}

const jobs = [
  { file: 'hero-clinic.jpg', w: 960, h: 1200, title: 'Эмнэлгийн дотор тал / эмч үйлчлүүлэгчтэй' },
  { file: 'about-clinic.jpg', w: 1200, h: 960, title: 'Эмнэлгийн орчин, хүлээлгийн өрөө' },
  { file: 'about-team.jpg', w: 1200, h: 900, title: 'Эмч нарын хамтын зураг', icon: 'user' },
  { file: 'community-school-visit-1.jpg', w: 720, h: 960, title: 'Сургуулийн сургалт 1', icon: 'school' },
  { file: 'community-school-visit-2.jpg', w: 600, h: 600, title: 'Сургуулийн сургалт 2', icon: 'school' },
  ...[1, 2, 3, 4].map((n) => ({ file: `dentist-${n}.jpg`, w: 800, h: 1000, title: `Эмчийн зураг ${n}`, icon: 'user' })),
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
    { file: `result-${n}-before.jpg`, w: 1000, h: 750, title: `Тохиолдол ${n}`, icon: 'smile', tone: 'before', label: 'ӨМНӨ' },
    { file: `result-${n}-after.jpg`, w: 1000, h: 750, title: `Тохиолдол ${n}`, icon: 'smile', tone: 'after', label: 'ДАРАА' },
  ]),
  ...Object.entries(services).map(([slug, title]) => ({ file: `service-${slug}.jpg`, w: 1200, h: 900, title, icon: 'tooth' })),
  ...Object.entries(tipsList).map(([slug, title]) => ({ file: `tip-${slug}.jpg`, w: 800, h: 500, title })),
]

mkdirSync(OUT, { recursive: true })
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {})
const page = await browser.newPage()

async function render(file, html, w, h) {
  const path = join(OUT, file)
  if (existsSync(path) && !force) {
    console.log('skip (exists)', file)
    return
  }
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path, type: file.endsWith('.png') ? 'png' : 'jpeg', quality: file.endsWith('.png') ? undefined : 82 })
  console.log('made', file)
}

for (const j of jobs) await render(j.file, placeholderHtml(j), j.w, j.h)
await render('og-image.jpg', ogHtml(), 1200, 630)
await page.setViewportSize({ width: 180, height: 180 })
const touch = join(OUT, '..', 'apple-touch-icon.png')
if (!existsSync(touch) || force) {
  await page.setContent(touchIconHtml())
  await page.screenshot({ path: touch })
  console.log('made apple-touch-icon.png')
}
await browser.close()
