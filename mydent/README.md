# My Dent гэр бүлийн шүдний эмнэлэг — вэбсайт

My Dent (Нарны зам, Алтан-Орд төв 2 давхар, Улаанбаатар) эмнэлгийн вэбсайт.
React + Vite + TypeScript + Tailwind CSS v4, React Router, lucide-react.

**Солих шаардлагатай зүйлсийн жагсаалт: [PLACEHOLDERS.md](PLACEHOLDERS.md)**

## Ажиллуулах

```bash
cd mydent
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ хавтсанд бэлэн сайт
npm run preview    # build хийсэн сайтыг шалгах
```

## Хуудсууд

| Зам | Агуулга |
|---|---|
| `/` | Нүүр: hero, 8 үйлчилгээ, яагаад бид, эмч нар, өмнө/дараа, сэтгэгдэл, зөвлөгөө, нийгэмд, CTA, холбоо барих |
| `/services` | Бүх үйлчилгээ (гоо засал, сувгийн эмчилгээ орно), эмчилгээний явц, үнэ, өмнө/дараа |
| `/dentists` | Эмч нар |
| `/about` | Бидний тухай, үнэт зүйлс, сургуулийн сургалт |
| `/tips` | Шүдний эрүүл мэндийн 7 зөвлөгөө |
| `/contact` | Хаяг, утас, цагийн хуваарь, газрын зураг, зурвас илгээх маягт |
| `/book` | 4 алхамт цаг захиалга → баталгаажуулалт. `/book?service=whitening&dentist=dentist-1` гэж урьдчилан сонгож болно |
| `/staff` | Ажилтны хэсэг (түр): энэ хөтөч дээрх туршилтын захиалгуудыг харуулна |

## Хаана юу байна

```
src/
  i18n/translations.ts     ← САЙТЫН БҮХ ТЕКСТ (МН + EN)
  config/clinic.ts         ← утас, и-мэйл, Facebook, газрын зураг, захиалгын цагийн тохиргоо
  config/content.ts        ← үйлчилгээний дараалал/дүрс, эмч, зургийн замууд
  lib/submissions.ts       ← захиалга/зурвас илгээх (localStorage + webhook)
  components/layout/       ← Header, Footer, хөвөгч Залгах/Messenger товч
  components/sections/     ← Hero, Services, WhyUs, Dentists, Results, Testimonials, Tips, Community, CTA, Contact
  components/booking/      ← олон алхамт захиалгын маягт
  pages/                   ← хуудас бүр
public/images/             ← бүх зураг (ижил нэртэй файлаар солино)
```

Өнгө (`src/index.css`): үндсэн ногоон `#5BB531`, товчны ногоон `#3B8224`, хар ногоон `#1B5020`.
Фонт: Montserrat (гарчиг) + Inter (текст) — хоёулаа монгол кирилл (Ө, Ү) бүрэн дэмждэг.

## Текст засах, орчуулга

`src/i18n/translations.ts`-ийн `mn` объектыг засна. Англи `en` объект яг ижил бүтэцтэй байх ёстой —
түлхүүр дутвал `npm run build` алдаа заана. Хэрэглэгчийн сонгосон хэл хөтчид хадгалагдана.

## Зураг солих

`public/images/`-д байгаа placeholder-ийг **ижил нэртэй** `.jpg` файлаар солино. Placeholder бүр дээр
файлын нэр, санал болгох хэмжээ бичигдсэн. Placeholder-уудыг дахин үүсгэх: `npm run images`
(байгаа файлыг дарж бичихгүй; Playwright шаардлагатай: `npm i -D playwright && npx playwright install chromium`).

## Захиалгыг холбох (имэйл / Telegram / Google Sheets)

Одоогоор захиалга, зурвас **зөвхөн хэрэглэгчийн хөтчид (localStorage) хадгалагдана — эмнэлэгт очихгүй**.
Бүх илгээлт `src/lib/submissions.ts`-ээр дамждаг тул нэг газар холбоход хангалттай.

**Хялбар арга — webhook:** `.env` файлд

```
VITE_BOOKING_WEBHOOK_URL=https://hook.make.com/xxxxxxxx
```

гэж тохируулбал захиалга бүрийг JSON (`type: "booking"` эсвэл `"contact"`, нэр, утас, үйлчилгээ, огноо, цаг…)
хэлбэрээр POST хийнэ. Make.com / Zapier / n8n дээр тэр webhook-ийг Gmail, Telegram, Google Sheets руу
дамжуулах сценари үүсгэнэ.

**Telegram bot шууд:** bot token-ийг frontend кодонд хэзээ ч бүү бичээрэй (хэн ч харж болно).
Оронд нь Netlify Function ашиглана — жишээ нь `netlify/functions/booking.mjs`:

```js
export default async (req) => {
  const b = await req.json()
  const text = b.type === 'booking'
    ? `🦷 Шинэ захиалга ${b.reference}\n${b.serviceTitle}\n${b.dentistName}\n${b.date} ${b.time}\n${b.name} · ${b.phone}\n${b.note || ''}`
    : `✉️ Зурвас: ${b.name} · ${b.phone}\n${b.message}`
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  })
  return new Response(null, { status: r.ok ? 200 : 502 })
}
```

Netlify-д `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` орчны хувьсагчдыг тохируулж,
`VITE_BOOKING_WEBHOOK_URL=/.netlify/functions/booking` гэж тавина.

## Netlify дээр байрлуулах

1. app.netlify.com → **Add new site → Import an existing project** → энэ репо.
2. **Base directory:** `mydent` (build command, publish directory-г `mydent/netlify.toml`-оос уншина).
3. Deploy. Домэйн холбосны дараа `.env`-ийн `VITE_SITE_URL`-ийг шинэчилнэ.

`netlify.toml` болон `public/_redirects` нь React Router-ийн замуудыг (`/book`, `/services`…) зөв ажиллуулна.
