import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { one } from '../db.ts'
import { env } from '../lib/env.ts'
import { getSettings } from '../lib/settings.ts'

/** Постын зургийн загварууд (Төгс брэндийн өнгө: цэнхэр→хөх, ногоон, алтлаг) */
export const TEMPLATES = ['photo', 'tip', 'promo', 'quote'] as const
export type Template = (typeof TEMPLATES)[number]
export type Design = {
  headline: string
  subline?: string
  points?: string[]
  badge?: string
  media_id?: number | null
}

const C = {
  ink: '#0c1a2c',
  muted: '#5b6b7f',
  blue: '#1466d6',
  cyan: '#14b9e6',
  lime: '#62c71b',
  limeDark: '#3f8f0c',
  sky: '#e6f6fd',
  leaf: '#eefae4',
  gold: '#a8833a',
  white: '#ffffff',
}
const GRAD = `linear-gradient(135deg, ${C.cyan}, ${C.blue})`

const fontsDir = resolve(process.env.FONTS_DIR ?? 'assets/fonts')
let fontCache: Parameters<typeof satori>[1]['fonts'] | null = null
function fonts() {
  if (fontCache) return fontCache
  const f = (file: string) => readFileSync(resolve(fontsDir, file))
  fontCache = [
    { name: 'Onest', data: f('Onest-700.ttf'), weight: 700, style: 'normal' },
    { name: 'Onest', data: f('Onest-800.ttf'), weight: 800, style: 'normal' },
    { name: 'Onest', data: f('Onest-900.ttf'), weight: 900, style: 'normal' },
    { name: 'Golos', data: f('GolosText-400.ttf'), weight: 400, style: 'normal' },
    { name: 'Golos', data: f('GolosText-500.ttf'), weight: 500, style: 'normal' },
    { name: 'Golos', data: f('GolosText-600.ttf'), weight: 600, style: 'normal' },
    { name: 'Golos', data: f('GolosText-700.ttf'), weight: 700, style: 'normal' },
    { name: 'Forum', data: f('Forum-400.ttf'), weight: 400, style: 'normal' },
  ]
  return fontCache
}

type Node = { type: string; props: Record<string, unknown> } | string | null
const h = (type: string, style: Record<string, unknown>, ...children: Node[]): Node => {
  const kids = children.filter((x) => x !== null && x !== '')
  return { type, props: { style: { display: 'flex', boxSizing: 'border-box', ...style }, children: kids.length === 1 ? kids[0] : kids } }
}
const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } })

/** Зурган дээрх текстийг цэвэрлэх: эможи, ₮ тэмдэг (фонтод байхгүй) */
export function cleanText(s = '') {
  return s
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/₮/g, ' төг')
    .replace(/\s+/g, ' ')
    .trim()
}

const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const ICON_PHONE = (color: string) =>
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`,
  )
const ICON_CAL = (color: string) =>
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>`,
  )
const ICON_CHECK = (color: string) =>
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  )

const publicDir = resolve(process.env.PUBLIC_DIR ?? (existsSync('dist/client/img') ? 'dist/client' : 'public'))
let logoCache: string | null = null
function logo() {
  if (logoCache) return logoCache
  const row = one<{ path: string }>(`SELECT path FROM media WHERE kind = 'logo' ORDER BY id DESC LIMIT 1`)
  const file = row ? resolve(env.uploadsDir, row.path) : resolve(publicDir, 'img/mark.png')
  logoCache = existsSync(file) ? `data:image/png;base64,${readFileSync(file).toString('base64')}` : ''
  return logoCache
}
export function resetLogoCache() {
  logoCache = null
}

async function photoData(mediaId?: number | null, fallback = 'img/sign.jpg') {
  let file = resolve(publicDir, fallback)
  if (mediaId) {
    const row = one<{ path: string }>('SELECT path FROM media WHERE id = ?', mediaId)
    if (row && existsSync(resolve(env.uploadsDir, row.path))) file = resolve(env.uploadsDir, row.path)
  }
  if (!existsSync(file)) return ''
  const buf = await sharp(file).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

const headlineSize = (s: string, big: number, mid: number, small: number) => (s.length <= 22 ? big : s.length <= 40 ? mid : small)

function brandChip(dark = false): Node {
  const clinic = getSettings('clinic')
  return h(
    'div',
    { alignItems: 'center', gap: 14, padding: '12px 26px 12px 14px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.12)' : C.white },
    logo() ? img(logo(), { width: 56, height: 57, borderRadius: 999, background: C.white }) : null,
    h(
      'div',
      { flexDirection: 'column' },
      h('div', { fontFamily: 'Forum', fontSize: 38, letterSpacing: 4, color: dark ? C.white : C.ink, lineHeight: 1 }, clinic.shortName || 'ТӨГС'),
      h('div', { fontFamily: 'Golos', fontWeight: 600, fontSize: 15, letterSpacing: 4, color: dark ? '#b8c6d8' : C.muted, marginTop: 4 }, 'ШҮДНИЙ ЭМНЭЛЭГ'),
    ),
  )
}

function badge(text: string, bg = C.lime, color = C.white): Node {
  if (!text) return null
  return h(
    'div',
    { padding: '10px 24px', borderRadius: 999, background: bg, color, fontFamily: 'Golos', fontWeight: 700, fontSize: 24, letterSpacing: 3, alignSelf: 'flex-start' },
    cleanText(text).toUpperCase().slice(0, 24),
  )
}

function ctaRow(dark = false): Node {
  const clinic = getSettings('clinic')
  const phones = [clinic.phone1, clinic.phone2].filter(Boolean).join(' · ')
  return h(
    'div',
    { alignItems: 'center', justifyContent: 'space-between', gap: 20, width: '100%' },
    h(
      'div',
      { alignItems: 'center', gap: 14, padding: '20px 34px', borderRadius: 999, backgroundImage: dark ? 'none' : GRAD, background: dark ? C.lime : undefined, color: dark ? C.ink : C.white, fontFamily: 'Onest', fontWeight: 800, fontSize: 30 },
      img(ICON_CAL(dark ? C.ink : C.white), { width: 34, height: 34 }),
      'Онлайнаар цаг захиалах',
    ),
    h(
      'div',
      { alignItems: 'center', gap: 12, fontFamily: 'Onest', fontWeight: 800, fontSize: 30, color: dark ? C.white : C.ink },
      img(ICON_PHONE(dark ? C.lime : C.blue), { width: 34, height: 34 }),
      phones,
    ),
  )
}

async function photoTemplate(d: Design): Promise<Node> {
  const photo = await photoData(d.media_id)
  const head = cleanText(d.headline)
  return h(
    'div',
    { width: 1080, height: 1350, flexDirection: 'column', background: C.white },
    h(
      'div',
      { position: 'relative', width: 1080, height: 790 },
      photo ? img(photo, { width: 1080, height: 790, objectFit: 'cover' }) : h('div', { width: 1080, height: 790, backgroundImage: GRAD }),
      h('div', { position: 'absolute', left: 0, top: 0, width: 1080, height: 790, backgroundImage: 'linear-gradient(180deg, rgba(12,26,44,0.35) 0%, rgba(12,26,44,0) 30%, rgba(12,26,44,0) 70%, rgba(12,26,44,0.25) 100%)' }),
      h('div', { position: 'absolute', left: 48, top: 48 }, brandChip()),
    ),
    h(
      'div',
      { flexDirection: 'column', flexGrow: 1, padding: '44px 56px 50px', justifyContent: 'space-between' },
      h(
        'div',
        { flexDirection: 'column', gap: 18 },
        badge(d.badge ?? ''),
        h('div', { fontFamily: 'Onest', fontWeight: 900, fontSize: headlineSize(head, 78, 64, 52), lineHeight: 1.05, color: C.ink, letterSpacing: -1 }, head),
        d.subline ? h('div', { fontFamily: 'Golos', fontWeight: 500, fontSize: 32, lineHeight: 1.35, color: C.muted }, cleanText(d.subline)) : null,
      ),
      ctaRow(),
    ),
  )
}

async function tipTemplate(d: Design): Promise<Node> {
  const head = cleanText(d.headline)
  const points = (d.points ?? []).map(cleanText).filter(Boolean).slice(0, 4)
  return h(
    'div',
    { width: 1080, height: 1350, flexDirection: 'column', padding: 56, backgroundImage: `linear-gradient(160deg, ${C.sky}, #ffffff 55%, ${C.leaf})` },
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, brandChip(), badge(d.badge || 'Зөвлөгөө', C.blue)),
    h(
      'div',
      { flexDirection: 'column', flexGrow: 1, justifyContent: 'center', gap: 34, marginTop: 30 },
      h('div', { fontFamily: 'Onest', fontWeight: 900, fontSize: headlineSize(head, 86, 70, 58), lineHeight: 1.05, color: C.ink, letterSpacing: -1 }, head),
      d.subline ? h('div', { fontFamily: 'Golos', fontWeight: 500, fontSize: 32, lineHeight: 1.35, color: C.muted }, cleanText(d.subline)) : null,
      h(
        'div',
        { flexDirection: 'column', gap: 20, marginTop: 6 },
        ...points.map((p, i) =>
          h(
            'div',
            { alignItems: 'center', gap: 24, padding: '22px 28px', borderRadius: 28, background: C.white, boxShadow: '0 18px 40px -26px rgba(12,26,44,0.35)' },
            h(
              'div',
              { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundImage: i % 2 ? `linear-gradient(135deg, #7bd431, #3fae12)` : GRAD, flexShrink: 0 },
              img(ICON_CHECK(C.white), { width: 32, height: 32 }),
            ),
            h('div', { fontFamily: 'Golos', fontWeight: 600, fontSize: 32, lineHeight: 1.3, color: C.ink, flexShrink: 1 }, p),
          ),
        ),
      ),
    ),
    h('div', { marginTop: 30 }, ctaRow()),
  )
}

async function promoTemplate(d: Design): Promise<Node> {
  const photo = await photoData(d.media_id, 'img/cover.jpg')
  const head = cleanText(d.headline)
  return h(
    'div',
    {
      width: 1080,
      height: 1350,
      flexDirection: 'column',
      padding: 56,
      backgroundImage: `radial-gradient(circle at 100% 0%, rgba(20,185,230,0.45), rgba(20,185,230,0) 55%), linear-gradient(140deg, ${C.ink}, #0f2c55)`,
    },
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, brandChip(true), badge(d.badge || 'Онцлох', C.lime, C.ink)),
    h(
      'div',
      { flexDirection: 'column', gap: 22, marginTop: 50 },
      h('div', { fontFamily: 'Onest', fontWeight: 900, fontSize: headlineSize(head, 92, 74, 60), lineHeight: 1.02, color: C.white, letterSpacing: -1 }, head),
      d.subline ? h('div', { fontFamily: 'Golos', fontWeight: 500, fontSize: 34, lineHeight: 1.35, color: '#c9d5e3' }, cleanText(d.subline)) : null,
    ),
    h(
      'div',
      { flexGrow: 1, marginTop: 40, marginBottom: 40, borderRadius: 36, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)' },
      photo ? img(photo, { width: 968, height: '100%', objectFit: 'cover' }) : h('div', { width: 968, backgroundImage: GRAD }),
    ),
    ctaRow(true),
  )
}

async function quoteTemplate(d: Design): Promise<Node> {
  const head = cleanText(d.headline)
  return h(
    'div',
    { width: 1080, height: 1350, flexDirection: 'column', padding: 56, backgroundImage: `linear-gradient(150deg, ${C.cyan}, ${C.blue} 60%, #0f4aa8)` },
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, brandChip(true), badge(d.badge ?? '', 'rgba(255,255,255,0.18)')),
    h(
      'div',
      { flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 30, textAlign: 'center', padding: '0 20px' },
      logo() ? img(logo(), { width: 150, height: 153, borderRadius: 999, background: C.white, padding: 16 }) : null,
      h('div', { fontFamily: 'Onest', fontWeight: 900, fontSize: headlineSize(head, 96, 78, 62), lineHeight: 1.05, color: C.white, textAlign: 'center', letterSpacing: -1 }, head),
      d.subline ? h('div', { fontFamily: 'Golos', fontWeight: 500, fontSize: 36, lineHeight: 1.4, color: '#e2f2ff', textAlign: 'center' }, cleanText(d.subline)) : null,
    ),
    ctaRow(true),
  )
}

const builders: Record<Template, (d: Design) => Promise<Node>> = {
  photo: photoTemplate,
  tip: tipTemplate,
  promo: promoTemplate,
  quote: quoteTemplate,
}

async function toJpeg(tree: Node, width: number, height: number) {
  const svg = await satori(tree as Parameters<typeof satori>[0], { width, height, fonts: fonts() })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } }).render().asPng()
  return sharp(png).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
}

/** Постын зургийг (1080×1350 JPEG) бэлтгэж файлд хадгална */
export async function renderPostImage(template: string, design: Design, outPath: string) {
  const t = (TEMPLATES as readonly string[]).includes(template) ? (template as Template) : 'photo'
  const jpeg = await toJpeg(await builders[t](design), 1080, 1350)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, jpeg)
  return jpeg.length
}

/** Вэбсайтын Open Graph зураг (1200×630) — Facebook-т линк хуваалцахад */
export async function renderOgImage(outPath: string) {
  const clinic = getSettings('clinic')
  const photo = await photoData(null, 'img/sign.jpg')
  const tree = h(
    'div',
    { width: 1200, height: 630, background: C.white },
    photo ? img(photo, { width: 560, height: 630, objectFit: 'cover' }) : null,
    h(
      'div',
      { flexDirection: 'column', justifyContent: 'center', gap: 26, padding: '0 56px', width: 640, backgroundImage: `linear-gradient(160deg, ${C.sky}, #ffffff 60%, ${C.leaf})` },
      brandChip(),
      h('div', { fontFamily: 'Onest', fontWeight: 900, fontSize: 58, lineHeight: 1.05, color: C.ink, letterSpacing: -1 }, cleanText(clinic.name)),
      h('div', { fontFamily: 'Golos', fontWeight: 500, fontSize: 28, lineHeight: 1.35, color: C.muted }, cleanText(clinic.addressShort || clinic.city)),
      h(
        'div',
        { alignItems: 'center', gap: 12, padding: '16px 28px', borderRadius: 999, backgroundImage: GRAD, color: C.white, fontFamily: 'Onest', fontWeight: 800, fontSize: 28, alignSelf: 'flex-start' },
        img(ICON_CAL(C.white), { width: 30, height: 30 }),
        'Онлайнаар цаг захиалах',
      ),
      h('div', { fontFamily: 'Onest', fontWeight: 800, fontSize: 30, color: C.ink }, [clinic.phone1, clinic.phone2].filter(Boolean).join(' · ')),
    ),
  )
  const jpeg = await toJpeg(tree, 1200, 630)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, jpeg)
}
