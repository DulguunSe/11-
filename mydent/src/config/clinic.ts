/**
 * Эмнэлгийн үндсэн мэдээлэл (орчуулга шаардлагагүй утгууд).
 * Clinic data that doesn't need translation. Text lives in src/i18n/translations.ts
 */
export const clinic = {
  name: 'My Dent',
  phones: [
    { display: '7744-0077', href: 'tel:+97677440077' },
    { display: '11-480090', href: 'tel:+97611480090' },
  ],
  email: 'care.mydent@gmail.com',
  facebook: 'https://www.facebook.com/MyDent77440077/',
  /** Messenger-ийн шууд чат / opens a Messenger chat with the page */
  messenger: 'https://m.me/MyDent77440077',

  /**
   * Google газрын зураг. Яг байршлыг тааруулах бол Google Maps дээр эмнэлгээ олоод
   * "Share → Embed a map" хэсгээс src="..." холбоосыг энд тавина уу.
   * To pin the exact spot: find the clinic on Google Maps → Share → Embed a map → paste the src URL here.
   */
  mapEmbedUrl:
    'https://www.google.com/maps?q=' +
    encodeURIComponent('Алтан-Орд төв, Нарны зам, Улаанбаатар') +
    '&z=16&output=embed',
  mapLinkUrl:
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Алтан-Орд төв, Нарны зам, Улаанбаатар'),
} as const

/**
 * Онлайн захиалгын цагийн тохиргоо — БОДИТ ЦАГИЙН ХУВААРЬТАЙ ТААРУУЛНА УУ.
 * Booking slot settings — MAKE THESE MATCH THE REAL OPENING HOURS.
 */
export const bookingSettings = {
  /** Хэдэн хоногийн өмнөөс захиалж болох / how many days ahead patients can book */
  daysAhead: 21,
  /** Цаг хоорондын зай (минут) / minutes between slots */
  slotMinutes: 30,
  /**
   * Гараг бүрийн ажлын цаг. 0 = Ням ... 6 = Бямба. null = амарна.
   * Opening hours per weekday (0 = Sunday). null = closed.
   */
  hours: {
    0: { open: '10:00', close: '16:00' },
    1: { open: '09:00', close: '18:00' },
    2: { open: '09:00', close: '18:00' },
    3: { open: '09:00', close: '18:00' },
    4: { open: '09:00', close: '18:00' },
    5: { open: '09:00', close: '18:00' },
    6: { open: '10:00', close: '16:00' },
  } as Record<number, { open: string; close: string } | null>,
  /** Өдрийн завсарлага / lunch break — slots inside it are hidden */
  lunch: { start: '13:00', end: '14:00' } as { start: string; end: string } | null,
}
