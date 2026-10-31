/**
 * ============================================================================
 *  ЗАХИАЛГА БА ЗУРВАС ИЛГЭЭХ / BOOKING & CONTACT SUBMISSIONS
 * ============================================================================
 *  Одоогоор: бүх захиалга, зурвас хэрэглэгчийн хөтчийн localStorage-д хадгалагдана
 *  (эмнэлэгт ОЧИХГҮЙ). Серверт холбох хамгийн хялбар арга:
 *
 *  1. Webhook: .env файлд VITE_BOOKING_WEBHOOK_URL=https://... гэж тохируулна.
 *     Тэгвэл захиалга бүрийг JSON хэлбэрээр тэр хаяг руу POST хийнэ
 *     (жишээ нь Make.com / Zapier / n8n → Gmail, Telegram, Google Sheets).
 *  2. Өөрийн backend: доорх `sendToBackend` функцийг өөрчилнө.
 *
 *  Telegram bot-ын token-ийг энд (frontend) хэзээ ч бүү бичээрэй — хүн бүр харна.
 *  Serverless функц (Netlify Functions г.м.) эсвэл webhook үйлчилгээ ашиглана.
 *  Дэлгэрэнгүй: README.md → "Захиалгыг холбох".
 *
 *  Currently every booking/message is stored in the visitor's browser
 *  (localStorage) only — it does NOT reach the clinic yet. Set
 *  VITE_BOOKING_WEBHOOK_URL to POST each submission as JSON to a webhook,
 *  or replace `sendToBackend` with your own API call. Never put a Telegram
 *  bot token in frontend code.
 * ============================================================================
 */

export type BookingRequest = {
  serviceSlug: string
  serviceTitle: string
  dentistId: string | null
  dentistName: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  name: string
  phone: string
  note: string
  lang: string
}

export type ContactMessage = {
  name: string
  phone: string
  email: string
  message: string
  lang: string
}

export type Stored<T> = T & { id: string; reference: string; createdAt: string }

const BOOKINGS_KEY = 'mydent.bookings'
const MESSAGES_KEY = 'mydent.messages'
const WEBHOOK_URL = (import.meta.env.VITE_BOOKING_WEBHOOK_URL as string | undefined)?.trim() || ''

function makeReference(prefix: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${prefix}-${code}`
}

function readList<T>(key: string): Stored<T>[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Stored<T>[]) : []
  } catch {
    return []
  }
}

function saveToList<T>(key: string, item: Stored<T>) {
  try {
    const list = readList<T>(key)
    list.unshift(item)
    localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
  } catch {
    /* storage full or unavailable — submission still continues */
  }
}

/** Серверт илгээх хэсэг — webhook тохируулаагүй бол юу ч хийхгүй */
async function sendToBackend(type: 'booking' | 'contact', payload: unknown) {
  if (!WEBHOOK_URL) return
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...(payload as object), source: 'mydent-website' }),
  })
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`)
}

async function submit<T>(type: 'booking' | 'contact', key: string, prefix: string, data: T): Promise<Stored<T>> {
  const item: Stored<T> = {
    ...data,
    id: crypto.randomUUID?.() ?? String(Date.now()),
    reference: makeReference(prefix),
    createdAt: new Date().toISOString(),
  }
  await sendToBackend(type, item)
  saveToList(key, item)
  // Жижиг саатал — товчны "илгээж байна" төлөв харагдахын тулд
  await new Promise((r) => setTimeout(r, 450))
  return item
}

export const submitBooking = (data: BookingRequest) => submit('booking', BOOKINGS_KEY, 'MD', data)
export const submitContactMessage = (data: ContactMessage) => submit('contact', MESSAGES_KEY, 'MSG', data)

export const getStoredBookings = () => readList<BookingRequest>(BOOKINGS_KEY)
export const getStoredMessages = () => readList<ContactMessage>(MESSAGES_KEY)
export const clearStored = () => {
  try {
    localStorage.removeItem(BOOKINGS_KEY)
    localStorage.removeItem(MESSAGES_KEY)
  } catch {
    /* ignore */
  }
}
