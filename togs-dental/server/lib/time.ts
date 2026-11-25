import './tz.ts'

const pad = (n: number) => String(n).padStart(2, '0')

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const today = () => ymd(new Date())
/** 'YYYY-MM-DD HH:MM:SS' эмнэлгийн цагаар */
export const nowStamp = (d = new Date()) => `${ymd(d)} ${hm(d)}:${pad(d.getSeconds())}`
/** 'YYYY-MM-DD HH:MM' эмнэлгийн цагаар */
export const nowMinute = (d = new Date()) => `${ymd(d)} ${hm(d)}`

export function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const addMonths = (s: string, n: number) => {
  const d = parseYmd(s)
  d.setMonth(d.getMonth() + n)
  return ymd(d)
}
export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const isYmd = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(parseYmd(s)) === s
export const isHm = (s: unknown): s is string => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

export const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']
export const humanDate = (s: string) => {
  const d = parseYmd(s)
  return `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${WEEKDAYS[d.getDay()]}`
}
export const shortDate = (s: string) => {
  const d = parseYmd(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
