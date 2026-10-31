# Солих шаардлагатай placeholder-ууд / Placeholders to replace

Сайтыг нийтлэхээс өмнө доорх зүйлсийг бодит мэдээллээр солино уу.
Бүх текст `src/i18n/translations.ts`-д (монгол `mn` ба англи `en` хоёуланд нь) байгаа.

## 1. Текст — `src/i18n/translations.ts`

| Юу | Хаана (түлхүүр) | Одоогийн утга |
|---|---|---|
| Ажлын цагийн хуваарь | `contact.hours` | `[цаг оруулах]` (Даваа–Баасан, Бямба, Ням) |
| Эмч нарын нэр (4) | `dentists.items[].name` | `Эмчийн нэр` |
| Эмчийн мэргэшил | `dentists.items[].role` | `Мэргэшил` |
| Эмчийн туршлага | `dentists.items[].experience` | `[__] жил` |
| Эмчийн товч танилцуулга | `dentists.items[].bio` | `[Эмчийн товч танилцуулга…]` |
| Туслах багийн тайлбар | `dentistsPage.teamText` | `[Сувилагч, ресепшн…]` |
| Үйлчлүүлэгчийн сэтгэгдэл (3) | `testimonials.items[].quote / name / meta` | `Сэтгэгдэл энд`, `Үйлчлүүлэгчийн нэр` |
| Өмнө/дараа тохиолдлын эмчилгээ (6) | `results.items[].treatment` | `[Эмчилгээний төрөл]` |
| Эмнэлгийн түүх | `about.story` | `[Эмнэлгийн түүх энд…]` |
| Байгуулагдсан он | `about.foundedYear` | `[он]` |
| Үнийн мэдээлэл | `servicesPage.pricesText` | `[Үнийн мэдээлэл энд…]` |

Мөн шалгаж, хүсвэл засах (бичсэн боловч баталгаажуулаагүй):
- `about.mission`, `about.values` — эрхэм зорилго, үнэт зүйлсийн жишээ текст.
- `whyUs.items` — «Туршлагатай баг», «Ил тод үнэ» гэх мэт амлалтууд үнэн эсэх.
- `services.items` — үйлчилгээ бүрийн дэд жагсаалт (жш: «Ил тод хэвлэг», «Бүрэн авагддаг шүдэлбэр») эмнэлэгт байгаа эсэх.
- `hero.floatBadge` («Хүүхдэд ээлтэй»).

## 2. Тохиргоо — `src/config/clinic.ts`

| Юу | Тайлбар |
|---|---|
| `bookingSettings.hours` | Онлайн захиалгын цагууд. **Одоо таамгаар** Да–Ба 09:00–18:00, Бя–Ня 10:00–16:00, үдийн завсарлага 13:00–14:00 гэж тавьсан. Бодит хуваарьтай тааруулна (амардаг өдрийг `null`). |
| `mapEmbedUrl` | Google газрын зураг «Алтан-Орд төв, Нарны зам» гэсэн хайлтаар гарч байна. Яг цэгийг тааруулахын тулд Google Maps → Share → Embed a map → `src` холбоосыг тавина. |
| `messenger` | `https://m.me/MyDent77440077` — Messenger чат зөв нээгдэж байгааг шалгана. |

## 3. Зургууд — `public/images/`

Ижил нэртэй `.jpg` файлаар солиход хангалттай (кодыг өөрчлөх шаардлагагүй).
Placeholder зураг бүр дээр файлын нэр, хэмжээ нь бичигдсэн байгаа.

| Файл | Хаана харагдах | Санал болгох хэмжээ |
|---|---|---|
| `hero-clinic.jpg` | Нүүр хуудасны том зураг | 960×1200 (босоо) |
| `about-clinic.jpg` | «Яагаад My Dent» хэсэг | 1200×960 |
| `about-team.jpg` | Бидний тухай хуудас | 1200×900 |
| `dentist-1.jpg` … `dentist-4.jpg` | Эмч нарын зураг | 800×1000 (босоо) |
| `result-1-before.jpg`, `result-1-after.jpg` … `result-6-*` | Өмнө / дараа | 1000×750 (өмнө, дараах зураг ижил өнцгөөс) |
| `service-general.jpg`, `service-orthodontics.jpg`, `service-whitening.jpg`, `service-pediatric.jpg`, `service-cleaning.jpg`, `service-sealants.jpg`, `service-dentures.jpg`, `service-xray.jpg`, `service-cosmetic.jpg`, `service-rootCanal.jpg` | Үйлчилгээний хуудас | 1200×900 |
| `tip-yellow-teeth.jpg`, `tip-coffee.jpg`, `tip-toothbrush.jpg`, `tip-baby-teeth.jpg`, `tip-bad-breath.jpg`, `tip-smoking.jpg`, `tip-checkup.jpg` | Зөвлөгөө | 800×500 (Facebook постерын зургийг ашиглаж болно) |
| `community-school-visit-1.jpg`, `community-school-visit-2.jpg` | Сургуулийн сургалт | 720×960, 600×600 |
| `og-image.jpg` | Facebook/Messenger-т линк хуваалцахад гарах зураг | 1200×630 (бэлэн брэнд зураг байгаа) |

Өмнө/дараа зураг, сэтгэгдлийг **үйлчлүүлэгчийн зөвшөөрөлтэй** нийтлээрэй.

## 4. Лого

`src/components/ui/Logo.tsx` — одоогийн лого нь түр зурсан хувилбар (шүд + зүрх + «MyDent»).
Албан ёсны лого файлаа `public/images/logo.png` болгож хуулаад `OFFICIAL_LOGO = '/images/logo.png'` гэж өөрчилнө.
`public/favicon.svg`, `public/apple-touch-icon.png`-ыг мөн солиж болно.

## 5. Домэйн ба захиалга

- `.env` → `VITE_SITE_URL` — сайтын бодит хаяг (Facebook-т хуваалцах зурагт хэрэгтэй).
- **Захиалга, зурвас одоогоор эмнэлэгт ОЧИХГҮЙ** — зөвхөн тухайн хүний хөтчид хадгалагдана.
  Нийтлэхээс өмнө README.md → «Захиалгыг холбох» хэсгийн дагуу webhook тохируулна уу.
