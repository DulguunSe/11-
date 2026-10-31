import { bookingSettings } from '../config/clinic'
import { monthsEn, type Dict, type Lang } from '../i18n/translations'

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`

/** Захиалж болох өдрүүд (өнөөдрөөс эхлэн) */
export function getBookableDays(now = new Date()) {
  const days: { iso: string; date: Date; open: boolean }[] = []
  for (let i = 0; i < bookingSettings.daysAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const open = !!bookingSettings.hours[date.getDay()] && getSlots(toISODate(date), now).length > 0
    days.push({ iso: toISODate(date), date, open })
  }
  return days
}

/** Тухайн өдрийн сул цагууд (өнгөрсөн цаг, үдийн завсарлагыг хасна) */
export function getSlots(iso: string, now = new Date()) {
  const date = fromISODate(iso)
  const hours = bookingSettings.hours[date.getDay()]
  if (!hours) return []
  const step = bookingSettings.slotMinutes
  const lunch = bookingSettings.lunch
  const isToday = iso === toISODate(now)
  const nowMins = now.getHours() * 60 + now.getMinutes() + 60 // хамгийн багадаа 1 цагийн өмнө
  const slots: string[] = []
  for (let m = toMinutes(hours.open); m + step <= toMinutes(hours.close); m += step) {
    if (lunch && m + step > toMinutes(lunch.start) && m < toMinutes(lunch.end)) continue
    if (isToday && m < nowMins) continue
    slots.push(fromMinutes(m))
  }
  return slots
}

export function formatDate(iso: string, lang: Lang, t: Dict, withWeekday = true) {
  const date = fromISODate(iso)
  const text = t.booking.dateFormat
    .replace('{m}', String(date.getMonth() + 1))
    .replace('{mon}', monthsEn[date.getMonth()])
    .replace('{d}', String(date.getDate()))
  if (!withWeekday) return text
  const weekday = t.booking.weekdays[date.getDay()]
  return lang === 'mn' ? `${text}, ${weekday}` : `${weekday}, ${text}`
}
