import { z } from 'zod'
import { one, run } from '../db.ts'
import { decrypt, encrypt } from './crypto.ts'

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const dayHours = z.tuple([hm, hm]).nullable()

/* ---------------- Эмнэлгийн мэдээлэл ---------------- */
export const clinicSchema = z.object({
  name: z.string().min(1).max(120),
  shortName: z.string().max(40),
  tagline: z.string().max(300),
  phone1: z.string().max(40),
  phone2: z.string().max(40),
  email: z.string().max(120),
  address: z.string().max(300),
  addressShort: z.string().max(120),
  city: z.string().max(60),
  mapsQuery: z.string().max(200),
  facebook: z.string().max(300),
  messenger: z.string().max(300),
  instagram: z.string().max(300),
  fbFollowers: z.string().max(20),
  /** 0=Ням ... 6=Бямба */
  hours: z.record(z.enum(['0', '1', '2', '3', '4', '5', '6']), dayHours),
  lunch: z.tuple([hm, hm]).nullable(),
  slotMinutes: z.number().int().min(10).max(120),
  daysAhead: z.number().int().min(1).max(60),
  leadMinutes: z.number().int().min(0).max(1440),
  bookingEnabled: z.boolean(),
  autoConfirm: z.boolean(),
})
export type ClinicSettings = z.infer<typeof clinicSchema>

export const clinicDefaults: ClinicSettings = {
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
  hours: {
    '0': null,
    '1': ['09:00', '18:00'],
    '2': ['09:00', '18:00'],
    '3': ['09:00', '18:00'],
    '4': ['09:00', '18:00'],
    '5': ['09:00', '18:00'],
    '6': ['10:00', '15:00'],
  },
  lunch: ['13:00', '14:00'],
  slotMinutes: 30,
  daysAhead: 14,
  leadMinutes: 30,
  bookingEnabled: true,
  autoConfirm: false,
}

/* ---------------- SMS ---------------- */
export const smsSchema = z.object({
  enabled: z.boolean(),
  method: z.enum(['GET', 'POST']),
  /** {phone} {message} орлуулагдана. Жишээ: https://api.sms.mn/send?key=XXX&to={phone}&text={message} */
  url: z.string().max(1000),
  body: z.string().max(2000),
  headers: z.string().max(2000),
  contentType: z.string().max(100),
  successMatch: z.string().max(100),
  latin: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(6).max(21),
  reminderTemplate: z.string().max(400),
  bookingEnabled: z.boolean(),
  bookingTemplate: z.string().max(400),
  recallEnabled: z.boolean(),
  recallMonths: z.number().int().min(1).max(24),
  recallTemplate: z.string().max(400),
})
export type SmsSettings = z.infer<typeof smsSchema>

export const smsDefaults: SmsSettings = {
  enabled: false,
  method: 'GET',
  url: '',
  body: '',
  headers: '',
  contentType: 'application/json',
  successMatch: '',
  latin: true,
  reminderEnabled: true,
  reminderHour: 10,
  reminderTemplate: '{clinic}: Sain baina uu {name}! Margaash {date} {time}-d tsag zahialsan baina. Utas: {phone}',
  bookingEnabled: true,
  bookingTemplate: '{clinic}: {name}, tany {date} {time}-iin tsagiin huselt irlee. Bid zalgaj batalgaajuulna. {phone}',
  recallEnabled: false,
  recallMonths: 6,
  recallTemplate: '{clinic}: {name}, shudnii 6 sar tutmiin uzlegiin hugatsaa bolloo. Tsag avah: {link} Utas: {phone}',
}

/* ---------------- Facebook / Instagram ---------------- */
export const socialSchema = z.object({
  pageId: z.string().max(60),
  pageToken: z.string().max(2000),
  igUserId: z.string().max(60),
  graphVersion: z.string().regex(/^v\d+\.\d+$/),
  pageName: z.string().max(200),
  igUsername: z.string().max(200),
})
export type SocialSettings = z.infer<typeof socialSchema>
export const socialDefaults: SocialSettings = {
  pageId: '',
  pageToken: '',
  igUserId: '',
  graphVersion: 'v26.0',
  pageName: '',
  igUsername: '',
}

/* ---------------- Брэнд (AI-д зориулсан) ---------------- */
export const brandSchema = z.object({
  about: z.string().max(3000),
  audience: z.string().max(1000),
  tone: z.string().max(500),
  emoji: z.enum(['none', 'light', 'moderate']),
  hashtags: z.string().max(500),
  rules: z.string().max(2000),
  promos: z.string().max(2000),
  samples: z.string().max(8000),
  styleGuide: z.string().max(4000),
})
export type BrandSettings = z.infer<typeof brandSchema>
export const brandDefaults: BrandSettings = {
  about:
    'Төгс шүдний эмнэлэг нь Өвөрхангай аймгийн Арвайхээр хотод байрладаг нүүр ам, шүдний эмнэлэг. Япон шүд цайруулалт (WHITE ESSENCE), шүдний ломбо, зай нөхөлт, риббонд, ёзоор сэргээлт, хүүхдийн шүдний эмчилгээ, шүд авах үйлчилгээ үзүүлдэг. Онлайнаар цаг захиалах боломжтой.',
  audience: 'Арвайхээр болон Өвөрхангай аймгийн гэр бүлүүд, хүүхэдтэй эцэг эхчүүд, инээмсэглэлээ сайжруулахыг хүссэн залуучууд.',
  tone: 'Найрсаг, халамжтай, ойлгомжтой, мэргэжлийн. Айдас төрүүлэхгүй, итгэл төрүүлсэн.',
  emoji: 'light',
  hashtags: '#ТөгсШүднийЭмнэлэг #Арвайхээр #ШүднийЭмнэлэг #ЭрүүлШүд',
  rules:
    'Эмчилгээний үр дүнг 100% баталгаа гэж амлахгүй. Үнэ, урамшууллыг зөвхөн энд өгсөн мэдээллээс бичнэ. Өрсөлдөгчийг муулахгүй. Эрүүл мэндийн зөвлөгөө үнэн зөв, энгийн байна.',
  promos: '',
  samples: '',
  styleGuide: '',
}

/* ---------------- Автомат пост (autopilot) ---------------- */
export const autopilotSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['daily', 'every2', 'weekdays']),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  time: hm,
  platforms: z.array(z.enum(['facebook', 'instagram'])).min(1),
  requireApproval: z.boolean(),
  keepAhead: z.number().int().min(1).max(14),
})
export type AutopilotSettings = z.infer<typeof autopilotSchema>
export const autopilotDefaults: AutopilotSettings = {
  enabled: false,
  frequency: 'every2',
  weekdays: [1, 3, 5],
  time: '19:00',
  platforms: ['facebook', 'instagram'],
  requireApproval: true,
  keepAhead: 4,
}

/* ---------------- Хадгалах / унших ---------------- */
const registry = {
  clinic: { schema: clinicSchema, defaults: clinicDefaults, secret: [] as string[] },
  sms: { schema: smsSchema, defaults: smsDefaults, secret: ['url', 'body', 'headers'] },
  social: { schema: socialSchema, defaults: socialDefaults, secret: ['pageToken'] },
  brand: { schema: brandSchema, defaults: brandDefaults, secret: [] as string[] },
  autopilot: { schema: autopilotSchema, defaults: autopilotDefaults, secret: [] as string[] },
}
type Registry = typeof registry
export type SettingsKey = keyof Registry
type ValueOf<K extends SettingsKey> = z.infer<Registry[K]['schema']>

export function getSettings<K extends SettingsKey>(key: K): ValueOf<K> {
  const entry = registry[key]
  const row = one<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)
  let stored: Record<string, unknown> = {}
  if (row) {
    try {
      stored = JSON.parse(row.value)
    } catch {
      stored = {}
    }
  }
  const merged: Record<string, unknown> = { ...(entry.defaults as Record<string, unknown>), ...stored }
  for (const f of entry.secret) if (typeof merged[f] === 'string') merged[f] = decrypt(merged[f] as string)
  const parsed = entry.schema.safeParse(merged)
  return (parsed.success ? parsed.data : entry.defaults) as ValueOf<K>
}

export function saveSettings<K extends SettingsKey>(key: K, value: unknown): ValueOf<K> {
  const entry = registry[key]
  const data = entry.schema.parse(value) as Record<string, unknown>
  const toStore = { ...data }
  for (const f of entry.secret) if (typeof toStore[f] === 'string') toStore[f] = encrypt(toStore[f] as string)
  run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(toStore),
  )
  return data as ValueOf<K>
}

/** Хэсэгчлэн шинэчлэх (бусад талбарыг хадгална) */
export function patchSettings<K extends SettingsKey>(key: K, patch: Partial<ValueOf<K>>): ValueOf<K> {
  return saveSettings(key, { ...getSettings(key), ...patch })
}
