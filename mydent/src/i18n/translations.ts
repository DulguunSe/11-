/**
 * ============================================================================
 *  ВЭБСАЙТЫН БҮХ ТЕКСТ / ALL WEBSITE TEXT
 * ============================================================================
 *  Монгол (mn) нь үндсэн хэл. Англи (en) орчуулга нь яг ижил бүтэцтэй байх
 *  ёстой (TypeScript шалгана).
 *
 *  Mongolian (mn) is the primary language. The English (en) object must have
 *  exactly the same shape (TypeScript enforces this).
 *
 *  PLACEHOLDER-ууд [дөрвөлжин хаалтад] эсвэл "Эмчийн нэр", "Сэтгэгдэл энд"
 *  гэх мэтээр тэмдэглэгдсэн. Бодит мэдээллээр солиорой. Бүрэн жагсаалт:
 *  PLACEHOLDERS.md
 *
 *  Phone numbers, email, map and image paths live in src/config/clinic.ts
 * ============================================================================
 */

export type ServiceSlug =
  | 'general'
  | 'orthodontics'
  | 'whitening'
  | 'pediatric'
  | 'cleaning'
  | 'sealants'
  | 'dentures'
  | 'xray'
  | 'cosmetic'
  | 'rootCanal'

export type TipSlug =
  | 'yellow-teeth'
  | 'coffee'
  | 'toothbrush'
  | 'baby-teeth'
  | 'bad-breath'
  | 'smoking'
  | 'checkup'

type ServiceText = {
  title: string
  short: string
  description: string
  points: string[]
}

type TipText = {
  title: string
  excerpt: string
  intro: string
  pointsTitle: string
  points: string[]
  advice: string
}

const mn = {
  meta: {
    siteName: 'My Dent гэр бүлийн шүдний эмнэлэг',
    description:
      'My Dent — гэр бүлийн шүд, гажиг заслын эмнэлэг. Шүдний эмчилгээ, гажиг засал, шүд цайруулалт, хүүхдийн шүдний эмчилгээ. Нарны зам, Алтан-Орд төв 2 давхар, Улаанбаатар. Утас: 7744-0077.',
    pages: {
      home: 'Гэр бүлийн шүд, гажиг заслын эмнэлэг · Улаанбаатар',
      services: 'Үйлчилгээ',
      dentists: 'Эмч нар',
      about: 'Бидний тухай',
      contact: 'Холбоо барих',
      book: 'Цаг захиалах',
      tips: 'Зөвлөгөө',
      staff: 'Ажилтны хэсэг',
      notFound: 'Хуудас олдсонгүй',
    },
  },

  nav: {
    home: 'Нүүр',
    services: 'Үйлчилгээ',
    dentists: 'Эмч нар',
    about: 'Бидний тухай',
    tips: 'Зөвлөгөө',
    contact: 'Холбоо барих',
    book: 'Цаг захиалах',
    openMenu: 'Цэс нээх',
    closeMenu: 'Цэс хаах',
    language: 'Хэл солих',
    skipToContent: 'Үндсэн агуулга руу шилжих',
  },

  common: {
    learnMore: 'Дэлгэрэнгүй',
    bookNow: 'Цаг захиалах',
    call: 'Залгах',
    messenger: 'Messenger',
    writeMessenger: 'Messenger-ээр бичих',
    viewAll: 'Бүгдийг үзэх',
    back: 'Буцах',
    next: 'Үргэлжлүүлэх',
    optional: 'заавал биш',
    minutesRead: 'мин унших',
    seeOnFacebook: 'Facebook хуудсаас илүүг үзэх',
    imagePlaceholder: 'Зураг удахгүй',
  },

  hero: {
    eyebrow: 'Гэр бүлийн шүд, гажиг заслын эмнэлэг',
    titleStart: 'Таны гэр бүлийн',
    titleHighlight: 'эрүүл инээмсэглэл',
    titleEnd: 'энд эхэлнэ',
    text: 'Хүүхдийн анхны үзлэгээс эхлээд гажиг засал, шүд цайруулалт, шүдэлбэр хүртэл — гэр бүлийн бүх гишүүнд зориулсан мэргэжлийн шүдний тусламжийг нэг дороос, тав тухтай орчинд үзүүлнэ.',
    primary: 'Цаг захиалах',
    secondary: 'Үйлчилгээ үзэх',
    stats: [
      { value: '32K+', label: 'Facebook дагагч' },
      { value: '90%', label: 'санал болгодог' },
      { value: '8+', label: 'төрлийн үйлчилгээ' },
    ],
    floatTitle: 'Онлайнаар цаг захиалаарай',
    floatText: 'Хэдхэн алхам — бид утсаар баталгаажуулна',
    floatBadge: 'Хүүхдэд ээлтэй',
    imageAlt: 'My Dent эмнэлгийн дотор тал',
  },

  services: {
    eyebrow: 'Үйлчилгээ',
    title: 'Бүх төрлийн шүдний тусламж нэг дор',
    text: 'Урьдчилан сэргийлэх үзлэгээс гоо заслын эмчилгээ хүртэл — нас бүрт тохирсон эмчилгээ.',
    viewAll: 'Бүх үйлчилгээ',
    items: {
      general: {
        title: 'Шүдний ерөнхий эмчилгээ',
        short: 'Урьдчилан сэргийлэх үзлэг, цоорол ломбодох, эрт оношилгоо.',
        description:
          'Тогтмол үзлэгээр шүдний цоорол, буйлны өвчнийг эрт илрүүлж, бага зардлаар эмчилнэ. Цоорсон шүдийг шүдний өнгөтэй, бат бөх материалаар ломбодно.',
        points: ['Иж бүрэн үзлэг, зөвлөгөө', 'Цоорол эмчилгээ, ломбо', 'Буйлны өвчний эмчилгээ'],
      },
      orthodontics: {
        title: 'Гажиг засал',
        short: 'Брекет болон ил тод хэвлэгээр шүдний гажиг засна.',
        description:
          'Шүдний байрлал, хазалтын гажгийг хүүхэд, насанд хүрэгчдийн аль алинд нь засна. Эмчилгээний өмнө рентген зураг авч, нарийвчилсан төлөвлөгөө гаргана.',
        points: ['Брекет систем', 'Ил тод хэвлэг (aligner)', 'Эмчилгээний дараах бэхэлгээ'],
      },
      whitening: {
        title: 'Шүд цайруулалт',
        short: 'Японы №1 цайруулалтын системээр аюулгүй, мэдэгдэхүйц үр дүн.',
        description:
          'Эмнэлэгт хийх мэргэжлийн цайруулалт нь кофе, цай, тамхинаас үүссэн толбыг арилгаж, шүдийг илт цайруулна. Цайруулахаас өмнө шүд, буйлыг шалгаж, танд тохирох аргыг сонгоно.',
        points: ['Японы цайруулалтын систем', 'Цайруулалтын өмнөх үзлэг', 'Үр дүнг удаан хадгалах зөвлөгөө'],
      },
      pediatric: {
        title: 'Хүүхдийн шүдний эмчилгээ',
        short: 'Хүүхдэд ээлтэй орчинд сүүн шүдний эмчилгээ, урьдчилан сэргийлэлт.',
        description:
          'Хүүхэд бүрт айдасгүй, тааламжтай анхны туршлага өгөхийг зорьдог. Сүүн шүдний цоорол эмчилж, силант тавьж, эцэг эхчүүдэд гэрийн арчилгааны зөвлөгөө өгнө.',
        points: [
          'Сүүн шүдний цоорол эмчилгээ',
          'Шүдний силант',
          'Эцэг эхэд зориулсан арчилгааны зөвлөгөө',
          'Сургуулиудад эрүүл шүдний сургалт',
        ],
      },
      cleaning: {
        title: 'Шүдний чулуу авах, цэвэрлэгээ',
        short: 'Мэргэжлийн цэвэрлэгээ, өнгөлгөөгөөр шүдний чулуу, өнгөрийг арилгана.',
        description:
          'Шүд угаахад арилдаггүй шүдний чулуу нь буйлны үрэвсэл, амны эвгүй үнэрийн гол шалтгаан болдог. Шүдний чулууг авч, өнгөлгөө хийснээр шүд гөлгөр, цэвэрхэн болно.',
        points: ['Шүдний чулуу авах', 'Өнгөлгөө цэвэрлэгээ', '6 сар тутмын урьдчилан сэргийлэх үзлэг'],
      },
      sealants: {
        title: 'Шүдний силант',
        short: 'Хүүхдийн араа шүдний ховилыг битүүлж, цооролоос хамгаална.',
        description:
          'Араа шүдний зажлах гадаргуу дээрх гүн ховилд хоол хүнс, бактери амархан тогтдог. Силант нь эдгээр ховилыг нимгэн хамгаалалтын давхаргаар битүүлж, цоорох эрсдэлийг бууруулна.',
        points: ['Байнгын араа шүд ургамагц хийхэд тохиромжтой', 'Өвдөлтгүй, хурдан', 'Цооролоос урьдчилан сэргийлнэ'],
      },
      dentures: {
        title: 'Авагддаг болон суурин шүдэлбэр',
        short: 'Дутуу шүдийг нөхөж, зажлах чадвар, инээмсэглэлийг сэргээнэ.',
        description:
          'Алдагдсан шүдийг нөхөх авагддаг болон суурин шүдэлбэрийг таны амны онцлогт тохируулан хийнэ. Металл суурьтай хэсэгчилсэн авагддаг шүдэлбэр нь нимгэн, бат бөх бөгөөд зүүхэд эвтэйхэн.',
        points: ['Металл суурьтай хэсэгчилсэн шүдэлбэр', 'Бүрэн авагддаг шүдэлбэр', 'Суурин шүдэлбэр (бүрээс, гүүр)'],
      },
      xray: {
        title: 'Рентген зураг',
        short: 'Дэлгэмэл болон толгойн хажуугийн рентген зургаар нарийн оношилно.',
        description:
          'Дэлгэмэл (панорам) зураг нь бүх шүд, эрүүний ясыг нэг зурагт харуулж, нүдэнд харагдахгүй асуудлыг илрүүлнэ. Толгойн хажуугийн (цефалометр) зураг нь гажиг заслын эмчилгээг төлөвлөхөд зайлшгүй шаардлагатай.',
        points: ['Дэлгэмэл (панорам) рентген', 'Толгойн хажуугийн рентген', 'Эмчилгээний төлөвлөлт, хяналт'],
      },
      cosmetic: {
        title: 'Гоо заслын эмчилгээ, инээмсэглэлийн дизайн',
        short: '“Холливуд инээмсэглэл” маягийн цогц гоо заслын шийдэл.',
        description:
          'Шүдний хэлбэр, өнгө, жигд байдлыг сайжруулж, таны нүүрний онцлогт тохирсон инээмсэглэлийг төлөвлөнө. Цайруулалт, гоо сайхны ломбо, бүрээс зэрэг аргуудыг хослуулан хэрэглэнэ.',
        points: ['Инээмсэглэлийн шинжилгээ, төлөвлөлт', 'Шүдний хэлбэр, өнгө засах', 'Цайруулалттай хослуулах'],
      },
      rootCanal: {
        title: 'Шүдний сувгийн эмчилгээ',
        short: 'Үрэвссэн, өвдөлттэй шүдийг авахгүйгээр хадгалж үлдэнэ.',
        description:
          'Цоорол гүнзгийрч мэдрэлд хүрэхэд өвдөлт, хавдар үүсдэг. Сувгийн эмчилгээгээр үрэвссэн мэдрэлийг цэвэрлэж, сувгийг битүүмжилснээр өөрийн шүдээ хадгалж үлдэх боломжтой.',
        points: ['Мэдээ алдуулалттай, өвдөлт багатай', 'Рентгенээр хянах', 'Эмчилгээний дараах сэргээлт'],
      },
    } satisfies Record<ServiceSlug, ServiceText>,
  },

  servicesPage: {
    eyebrow: 'Үйлчилгээ',
    title: 'Гэр бүлийн бүх гишүүнд зориулсан шүдний тусламж',
    text: 'Хүүхдийн анхны үзлэгээс гажиг засал, шүдэлбэр хүртэл — бүх үйлчилгээг нэг эмнэлгээс авна.',
    extraTitle: 'Мөн бид',
    bookThis: 'Энэ үйлчилгээнд цаг авах',
    processEyebrow: 'Эмчилгээний явц',
    processTitle: 'Эмчилгээ хэрхэн явагддаг вэ?',
    process: [
      { title: 'Цаг захиалах', text: 'Онлайнаар, утсаар эсвэл Messenger-ээр цагаа захиална.' },
      { title: 'Үзлэг, оношилгоо', text: 'Эмч таны шүдийг үзэж, шаардлагатай бол рентген зураг авна.' },
      { title: 'Төлөвлөгөө ба үнэ', text: 'Эмчилгээний сонголт, хугацаа, зардлыг ойлгомжтой тайлбарлана.' },
      { title: 'Эмчилгээ ба хяналт', text: 'Эмчилгээг хийж, дараа нь тогтмол хяналтад хамруулна.' },
    ],
    pricesTitle: 'Үнийн мэдээлэл',
    pricesText: '[Үнийн мэдээлэл энд — үйлчилгээ бүрийн үнэ эсвэл “үзлэгийн дараа тодорхойлно” гэсэн тайлбар оруулна.]',
  },

  whyUs: {
    eyebrow: 'Яагаад My Dent гэж?',
    title: 'Гэр бүлүүдийн итгэлийг хүлээсэн эмнэлэг',
    text: 'Бид эмчилгээ бүрийг ойлгомжтой, тав тухтай, найдвартай байлгахыг зорьдог.',
    items: [
      {
        title: 'Туршлагатай баг',
        text: 'Ерөнхий шүд, хүүхдийн шүд, гажиг заслын чиглэлээр ажилладаг мэргэжлийн эмч нар.',
      },
      {
        title: 'Орчин үеийн технологи',
        text: 'Дэлгэмэл болон толгойн хажуугийн рентген зэрэг оношилгоог эмнэлэг дотроо хийнэ.',
      },
      {
        title: 'Тав тухтай орчин',
        text: 'Хүүхэд, том хүн хэн бүхэн тайван, айдасгүй байх тааламжтай орчин.',
      },
      {
        title: 'Хувь хүнд тохирсон төлөвлөгөө',
        text: 'Үзлэгийн дараа таны хэрэгцээнд нийцсэн эмчилгээний төлөвлөгөөг тайлбарлана.',
      },
      {
        title: 'Ил тод үнэ',
        text: 'Эмчилгээ эхлэхээс өмнө зардлыг тодорхой хэлнэ — гэнэтийн төлбөргүй.',
      },
    ],
    statValue: '90%',
    statLabel: 'Facebook дээрх үйлчлүүлэгчид санал болгодог',
    statSub: '32 мянга гаруй дагагчтай',
  },

  dentists: {
    eyebrow: 'Манай эмч нар',
    title: 'Мэргэжлийн эмч нартайгаа танилцаарай',
    text: 'Таны болон гэр бүлийн тань шүдний эрүүл мэндийг итгэлтэй гарт даатгаарай.',
    viewAll: 'Бүх эмч',
    experience: 'Туршлага',
    bookWith: 'Энэ эмчид цаг авах',
    items: [
      {
        name: 'Эмчийн нэр',
        role: 'Мэргэшил',
        experience: '[__] жил',
        bio: '[Эмчийн товч танилцуулга: боловсрол, мэргэшил, туршлагын талаар 1–2 өгүүлбэр.]',
      },
      {
        name: 'Эмчийн нэр',
        role: 'Мэргэшил',
        experience: '[__] жил',
        bio: '[Эмчийн товч танилцуулга: боловсрол, мэргэшил, туршлагын талаар 1–2 өгүүлбэр.]',
      },
      {
        name: 'Эмчийн нэр',
        role: 'Мэргэшил',
        experience: '[__] жил',
        bio: '[Эмчийн товч танилцуулга: боловсрол, мэргэшил, туршлагын талаар 1–2 өгүүлбэр.]',
      },
      {
        name: 'Эмчийн нэр',
        role: 'Мэргэшил',
        experience: '[__] жил',
        bio: '[Эмчийн товч танилцуулга: боловсрол, мэргэшил, туршлагын талаар 1–2 өгүүлбэр.]',
      },
    ],
  },

  dentistsPage: {
    eyebrow: 'Эмч нар',
    title: 'Таны инээмсэглэлийн ард байгаа баг',
    text: 'Манай эмч нар хүүхэд, том хүн бүрт анхааралтай, ойлгомжтой хандаж, эмчилгээ бүрийг тайлбарлан хийдэг.',
    teamTitle: 'Эмч нарын туслах ажилтнууд',
    teamText: '[Сувилагч, ресепшн зэрэг багийн бусад гишүүдийн талаар товч мэдээлэл энд.]',
  },

  results: {
    eyebrow: 'Үр дүн',
    title: 'Өмнө ба дараа',
    text: 'Манай үйлчлүүлэгчдийн эмчилгээний үр дүн. Гулсуурыг чирж харьцуулаарай.',
    before: 'Өмнө',
    after: 'Дараа',
    sliderLabel: 'Өмнө ба дараах зургийг харьцуулах гулсуур',
    consentNote: 'Зургуудыг үйлчлүүлэгчийн зөвшөөрөлтэйгөөр нийтэлсэн.',
    items: [
      { title: 'Тохиолдол 1', treatment: '[Эмчилгээний төрөл]' },
      { title: 'Тохиолдол 2', treatment: '[Эмчилгээний төрөл]' },
      { title: 'Тохиолдол 3', treatment: '[Эмчилгээний төрөл]' },
      { title: 'Тохиолдол 4', treatment: '[Эмчилгээний төрөл]' },
      { title: 'Тохиолдол 5', treatment: '[Эмчилгээний төрөл]' },
      { title: 'Тохиолдол 6', treatment: '[Эмчилгээний төрөл]' },
    ],
  },

  testimonials: {
    eyebrow: 'Сэтгэгдэл',
    title: 'Үйлчлүүлэгчид юу гэж хэлдэг вэ?',
    summary: 'Facebook дээр 90% санал болгодог',
    summarySub: '16 үнэлгээ',
    items: [
      {
        quote: 'Сэтгэгдэл энд. [Үйлчлүүлэгчийн бодит сэтгэгдлийг зөвшөөрөлтэйгөөр нь оруулна.]',
        name: 'Үйлчлүүлэгчийн нэр',
        meta: '[Эмчилгээний төрөл]',
      },
      {
        quote: 'Сэтгэгдэл энд. [Үйлчлүүлэгчийн бодит сэтгэгдлийг зөвшөөрөлтэйгөөр нь оруулна.]',
        name: 'Үйлчлүүлэгчийн нэр',
        meta: '[Эмчилгээний төрөл]',
      },
      {
        quote: 'Сэтгэгдэл энд. [Үйлчлүүлэгчийн бодит сэтгэгдлийг зөвшөөрөлтэйгөөр нь оруулна.]',
        name: 'Үйлчлүүлэгчийн нэр',
        meta: '[Эмчилгээний төрөл]',
      },
    ],
  },

  tips: {
    eyebrow: 'Зөвлөгөө',
    title: 'Шүдний эрүүл мэндийн зөвлөгөө',
    text: 'Эрүүл инээмсэглэлийг хадгалах энгийн, хэрэгтэй зөвлөмжүүд.',
    viewAll: 'Бүх зөвлөгөө',
    readMore: 'Унших',
    pageTitle: 'Шүдний эрүүл мэндийн зөвлөгөө',
    pageText: 'Манай эмч нарын Facebook хуудсанд хуваалцдаг зөвлөгөөнүүдээс. Асуулт байвал бидэнтэй холбогдоорой.',
    adviceLabel: 'Эмчийн зөвлөгөө',
    contents: 'Агуулга',
    items: {
      'yellow-teeth': {
        title: 'Шүд яагаад шарладаг вэ?',
        excerpt: 'Кофе, цай, тамхинаас гадна нас, шүдний чулуу ч шүдний өнгөнд нөлөөлдөг.',
        intro:
          'Шүдний паалан бол шүдний гадна талын тунгалаг хамгаалалтын давхарга. Түүний доор шаргал өнгөтэй дентин байдаг. Паалан нимгэрэх эсвэл гадаргуу дээр өнгөр тогтоход шүд шаргал харагдана.',
        pointsTitle: 'Түгээмэл шалтгаанууд',
        points: [
          'Кофе, хар цай, өнгөтэй ундаа',
          'Тамхи татах',
          'Шүдний өнгөр, чулуу',
          'Нас ахих тусам паалан нимгэрэх',
          'Зарим эм, бага насанд фторыг хэт их хэрэглэх',
        ],
        advice:
          'Өдөрт 2 удаа шүдээ угааж, 6 сар тутам мэргэжлийн цэвэрлэгээ хийлгээрэй. Илүү цагаан шүд хүсвэл эмчтэйгээ цайруулалтын талаар зөвлөлдөөрэй.',
      },
      coffee: {
        title: 'Кофе шүдэнд хэрхэн нөлөөлдөг вэ?',
        excerpt: 'Өдөр бүрийн аяга кофе шүдийг будаж, сахартай бол цоорох эрсдэлийг нэмэгдүүлнэ.',
        intro:
          'Кофенд агуулагдах өнгөт бодис паалангийн бичил нүхэнд шингэж, шүдийг аажмаар шарлуулдаг. Мөн кофе хүчиллэг тул паалан түр зуур зөөлөрдөг.',
        pointsTitle: 'Шүдээ хамгаалах арга',
        points: [
          'Кофе уусны дараа усаар амаа зайлах',
          'Хүйтэн кофег соруулаар уух',
          'Сахар, сироп багасгах',
          'Кофе уусны дараа 30 орчим минут хүлээгээд шүдээ угаах',
        ],
        advice: 'Кофеноос татгалзах шаардлагагүй — зөв арчилгаа, тогтмол цэвэрлэгээ хангалттай.',
      },
      toothbrush: {
        title: 'Шүдний сойзыг хэрхэн зөв сонгох вэ?',
        excerpt: 'Зөөлөн үстэй, жижиг толгойтой сойз ихэнх хүнд хамгийн тохиромжтой.',
        intro:
          'Хатуу үстэй сойз шүдийг илүү сайн цэвэрлэдэггүй, харин паалан болон буйлыг гэмтээж болзошгүй. Зөв сойз, зөв арга хоёр л хангалттай.',
        pointsTitle: 'Сонгохдоо анхаарах зүйл',
        points: [
          'Зөөлөн (soft) үстэй сойз сонгох',
          'Араа шүд хүртэл хүрэх жижиг толгойтой байх',
          '3 сар тутам эсвэл үс нь сэвсийсэн үед солих',
          'Ханиад, томуугаар өвдсөний дараа солих',
          'Хүүхдэд насанд нь тохирсон сойз',
        ],
        advice: 'Цахилгаан сойз ч сайн сонголт. Гол нь өдөрт 2 удаа, 2 минутын турш зөв угаах.',
      },
      'baby-teeth': {
        title: 'Хүүхдийн сүүн шүд хэзээ ургадаг вэ?',
        excerpt: 'Ихэнх хүүхдийн анхны шүд 6 сартайгаас ургаж эхэлдэг. Анхны үзлэгт хэзээ авчрах вэ?',
        intro:
          'Анхны сүүн шүд ихэвчлэн 6–10 сартайд доод урд шүднээс ургаж эхэлдэг ч хүүхэд бүрт харилцан адилгүй. 3 нас хүрэхэд 20 сүүн шүд бүрэн ургадаг бөгөөд 6 наснаас байнгын шүд солигдож эхэлнэ.',
        pointsTitle: 'Эцэг эхэд зориулсан зөвлөмж',
        points: [
          'Шүд ургахаас өмнө буйлыг чийгтэй зөөлөн даавуугаар арчих',
          'Анхны шүд ургамагц хүүхдийн зөөлөн сойзоор угааж эхлэх',
          'Анхны шүдний үзлэгт 1 нас хүрэхээс өмнө хамрагдах',
          'Сүү, шүүстэй лонхтой унтуулахгүй байх',
        ],
        advice: 'Хүүхдээ залхаахгүйгээр шүдийг нь угаахын тулд тоглоом, дуу ашиглаж, хамт угаагаарай.',
      },
      'bad-breath': {
        title: 'Амны эвгүй үнэр — шалтгаан ба шийдэл',
        excerpt: 'Амны эвгүй үнэрийн ихэнх нь амны хөндийн бактериас үүсдэг бөгөөд зөв арчилгаагаар засагдана.',
        intro:
          'Хэлний гадаргуу, шүд хоорондын завсарт үлдсэн хоолны үлдэгдэл дээр бактери үржиж, эвгүй үнэр ялгаруулдаг. Буйлны өвчин, шүдний чулуу, ам хуурайших, тамхи ч шалтгаан болно.',
        pointsTitle: 'Юу хийх вэ?',
        points: [
          'Шүдээ угаахдаа хэлээ цэвэрлэх',
          'Шүдний утас өдөр бүр хэрэглэх',
          'Ус хангалттай уух',
          'Шүдний чулуугаа тогтмол авахуулах',
        ],
        advice: 'Зөв арчилгаа хийгээд ч үнэр арилахгүй бол эмчид үзүүлээрэй.',
      },
      smoking: {
        title: 'Тамхи шүдэнд хэрхэн нөлөөлдөг вэ?',
        excerpt: 'Тамхи шүдийг шарлуулахаас гадна буйлны өвчин, амны хөндийн хорт хавдрын эрсдэлийг нэмэгдүүлдэг.',
        intro:
          'Тамхины давирхай, никотин шүдний гадаргууд наалдаж бараан толбо үүсгэдэг. Мөн буйлны цусан хангамжийг муутгаж, эмчилгээний дараах эдгэрэлтийг удаашруулдаг.',
        pointsTitle: 'Тамхины хор уршиг',
        points: [
          'Шүд шарлах, толбо үүсэх',
          'Буйлны өвчин, шүд суларч унах эрсдэл',
          'Амны эвгүй үнэр',
          'Амны хөндийн хорт хавдрын эрсдэл',
        ],
        advice: 'Тамхинаас татгалзах нь шүдний эрүүл мэндэд хийх хамгийн том хөрөнгө оруулалт.',
      },
      checkup: {
        title: 'Яагаад 6 сар тутам үзлэгт хамрагдах хэрэгтэй вэ?',
        excerpt: 'Цоорол, буйлны өвчин эхэн үедээ өвдөлтгүй байдаг. Тогтмол үзлэг цаг, мөнгө хоёрыг хэмнэнэ.',
        intro:
          'Шүдний ихэнх өвчин эхэн үедээ ямар ч шинж тэмдэггүй явагддаг. Өвдөж эхлэх үед эмчилгээ илүү урт, зардал өндөр болсон байдаг.',
        pointsTitle: 'Үзлэгийн ач тус',
        points: [
          'Цоорлыг жижиг үед нь илрүүлэх',
          'Шүдний чулуу, өнгөрийг мэргэжлийн аргаар арилгах',
          'Буйлны эрүүл мэндийг шалгах',
          'Хүүхдийн шүдний ургалт, хазалтыг хянах',
        ],
        advice: '6 сар тутмын үзлэгээ одоо захиалаарай.',
      },
    } satisfies Record<TipSlug, TipText>,
  },

  community: {
    eyebrow: 'Нийгэмд',
    title: 'Сургуулиудад эрүүл шүдний сургалт',
    text: 'My Dent-ийн эмч нар сургуулиудаар очиж хүүхдүүдэд шүдээ зөв угаах, эрүүл хооллох, цооролоос сэргийлэх талаар хөгжилтэй, ойлгомжтой хичээл заадаг.',
    points: ['Шүдээ зөв угаах дадал', 'Эрүүл хооллолт ба шүд', 'Цооролоос урьдчилан сэргийлэх'],
    cta: 'Сургалт зохион байгуулах хүсэлт',
    imageAlt: 'Сургуулийн ангид эрүүл шүдний сургалт',
  },

  cta: {
    title: 'Эрүүл инээмсэглэлд бэлэн үү?',
    text: 'Онлайнаар цаг захиалах эсвэл бидэн рүү шууд залгаарай.',
    book: 'Цаг захиалах',
  },

  contact: {
    eyebrow: 'Холбоо барих',
    title: 'Бидэнтэй холбогдоорой',
    text: 'Асуулт байна уу эсвэл цаг захиалах уу? Утсаар, Messenger-ээр эсвэл доорх маягтаар холбогдоорой.',
    pageTitle: 'Холбоо барих',
    pageText: 'Бид Нарны зам дагуух Алтан-Орд төвийн 2 давхарт байрладаг.',
    addressLabel: 'Хаяг',
    address: 'Нарны зам, Алтан-Орд төв 2 давхар, Улаанбаатар 17009',
    phoneLabel: 'Утас',
    emailLabel: 'И-мэйл',
    hoursLabel: 'Цагийн хуваарь',
    hours: [
      { days: 'Даваа – Баасан', time: '[цаг оруулах]' },
      { days: 'Бямба', time: '[цаг оруулах]' },
      { days: 'Ням', time: '[цаг оруулах]' },
    ],
    directions: 'Чиглэл авах',
    mapTitle: 'My Dent эмнэлгийн байршил — Google газрын зураг',
    form: {
      title: 'Зурвас илгээх',
      text: 'Бид ажлын цагаар хариу өгнө.',
      name: 'Нэр',
      phone: 'Утасны дугаар',
      email: 'И-мэйл',
      message: 'Зурвас',
      messagePlaceholder: 'Таны асуулт, хүсэлт...',
      submit: 'Илгээх',
      sending: 'Илгээж байна…',
      successTitle: 'Баярлалаа!',
      successText: 'Таны зурвасыг хүлээн авлаа. Бид удахгүй холбогдоно.',
      sendAnother: 'Өөр зурвас илгээх',
    },
  },

  validation: {
    required: 'Энэ талбарыг бөглөнө үү',
    name: 'Нэрээ бүтэн бичнэ үү',
    phone: 'Утасны дугаар буруу байна (8 оронтой)',
    email: 'И-мэйл хаяг буруу байна',
    messageShort: 'Зурвас хамгийн багадаа 10 тэмдэгт байна',
    submitError: 'Илгээхэд алдаа гарлаа. Дахин оролдох эсвэл утсаар холбогдоно уу.',
  },

  booking: {
    eyebrow: 'Онлайн захиалга',
    title: 'Цаг захиалах',
    text: 'Хэдхэн алхмаар цагаа захиалаарай. Бид утсаар холбогдож баталгаажуулна.',
    steps: ['Үйлчилгээ', 'Эмч', 'Огноо, цаг', 'Мэдээлэл'],
    stepOf: 'Алхам',
    serviceTitle: 'Ямар үйлчилгээ авах вэ?',
    consultTitle: 'Үзлэг, зөвлөгөө',
    consultText: 'Юу хэрэгтэйгээ мэдэхгүй байна уу? Эмчийн үзлэгээс эхэлье.',
    dentistTitle: 'Эмчээ сонгоно уу',
    anyDentist: 'Аль ч сул эмч',
    anyDentistText: 'Хамгийн ойрын сул цагт',
    dateTitle: 'Тохирох өдөр, цагаа сонгоно уу',
    timeTitle: 'Цаг',
    morning: 'Үдээс өмнө',
    afternoon: 'Үдээс хойш',
    today: 'Өнөөдөр',
    closed: 'Амралтын өдөр',
    noSlots: 'Энэ өдөр сул цаг алга. Өөр өдөр сонгоно уу.',
    pickDateFirst: 'Эхлээд өдрөө сонгоно уу',
    detailsTitle: 'Таны мэдээлэл',
    name: 'Овог, нэр',
    phone: 'Утасны дугаар',
    note: 'Нэмэлт тэмдэглэл',
    notePlaceholder: 'Жишээ нь: 7 настай хүүхдэдээ цаг авч байна',
    submit: 'Захиалга илгээх',
    submitting: 'Илгээж байна…',
    summaryTitle: 'Таны захиалга',
    service: 'Үйлчилгээ',
    dentist: 'Эмч',
    date: 'Огноо',
    time: 'Цаг',
    notSelected: 'Сонгоогүй',
    summaryNote: 'Захиалга илгээсний дараа бид утсаар холбогдож цагийг баталгаажуулна.',
    successTitle: 'Захиалга амжилттай илгээгдлээ!',
    successText: 'Бид таны утас руу залгаж цагийг баталгаажуулна. Яаралтай бол доорх дугаарт залгаарай.',
    reference: 'Захиалгын дугаар',
    newBooking: 'Шинэ захиалга',
    backHome: 'Нүүр хуудас',
    weekdays: ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'],
    weekdaysShort: ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'],
    /** {m} = сар, {d} = өдөр */
    dateFormat: '{m}-р сарын {d}',
  },

  about: {
    eyebrow: 'Бидний тухай',
    title: 'Гэр бүл бүрийн итгэлт шүдний эмнэлэг',
    intro:
      'My Dent нь Улаанбаатар хотын Нарны зам дагуух Алтан-Орд төвийн 2 давхарт байрлах гэр бүлийн шүд, гажиг заслын эмнэлэг юм. Хүүхдийн анхны үзлэгээс эхлээд гажиг засал, гоо заслын эмчилгээ хүртэл гэр бүлийн бүх гишүүнд нэг дороос тусламж үзүүлдэг.',
    storyTitle: 'Бидний түүх',
    story:
      '[Эмнэлгийн түүх энд: хэдэн онд байгуулагдсан, хэн үүсгэн байгуулсан, яагаад гэр бүлийн эмнэлэг болох болсон, өнөөдрийг хүртэлх замнал.]',
    missionTitle: 'Эрхэм зорилго',
    mission: 'Хүүхдээс ахмад хүртэл хүн бүрт эрүүл, итгэлтэй инээмсэглэл бэлэглэх.',
    valuesTitle: 'Бидний үнэт зүйлс',
    values: [
      { title: 'Анхаарал халамж', text: 'Үйлчлүүлэгч бүрийг гэр бүлийнхээ гишүүн шиг хүлээн авна.' },
      { title: 'Мэргэжлийн ур чадвар', text: 'Эмчилгээ бүрийг нарийн төлөвлөж, чанартай гүйцэтгэнэ.' },
      { title: 'Ил тод байдал', text: 'Эмчилгээ, зардлыг эхнээс нь ойлгомжтой тайлбарлана.' },
      { title: 'Урьдчилан сэргийлэлт', text: 'Эмчлэхээс илүү сэргийлэх нь чухал гэдэгт итгэдэг.' },
    ],
    statsFounded: 'онд байгуулагдсан',
    foundedYear: '[он]',
  },

  footer: {
    tagline: 'Professional Dental Clinic',
    description:
      'Гэр бүлийн шүд, гажиг заслын эмнэлэг. Хүүхдээс ахмад хүртэл гэр бүлийн бүх гишүүний инээмсэглэлд анхаарал тавина.',
    linksTitle: 'Холбоос',
    servicesTitle: 'Үйлчилгээ',
    contactTitle: 'Холбоо барих',
    staffLogin: 'Ажилтны нэвтрэх',
    rights: 'Бүх эрх хуулиар хамгаалагдсан.',
  },

  staff: {
    title: 'Ажилтны хэсэг',
    text: 'Ажилтны нэвтрэх систем серверт холбогдсоны дараа ажиллана. Одоогоор зөвхөн энэ төхөөрөмж дээрх туршилтын захиалгуудыг харуулж байна.',
    bookingsTitle: 'Энэ хөтөч дээр хадгалагдсан захиалгууд',
    messagesTitle: 'Энэ хөтөч дээр хадгалагдсан зурвасууд',
    empty: 'Одоогоор хоосон байна.',
    clear: 'Цэвэрлэх',
  },

  notFound: {
    title: 'Хуудас олдсонгүй',
    text: 'Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна.',
    home: 'Нүүр хуудас руу буцах',
  },
}

export type Dict = typeof mn

const en: Dict = {
  meta: {
    siteName: 'My Dent Family Dental Clinic',
    description:
      'My Dent — family dentistry and orthodontics clinic in Ulaanbaatar. General dentistry, braces and aligners, teeth whitening and children’s dentistry. Altan-Ord Center, 2nd floor, Narny Zam. Phone: 7744-0077.',
    pages: {
      home: 'Family Dentistry & Orthodontics · Ulaanbaatar',
      services: 'Services',
      dentists: 'Our Dentists',
      about: 'About Us',
      contact: 'Contact',
      book: 'Book an Appointment',
      tips: 'Dental Tips',
      staff: 'Staff Area',
      notFound: 'Page not found',
    },
  },

  nav: {
    home: 'Home',
    services: 'Services',
    dentists: 'Our Dentists',
    about: 'About Us',
    tips: 'Tips',
    contact: 'Contact',
    book: 'Book Appointment',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Change language',
    skipToContent: 'Skip to main content',
  },

  common: {
    learnMore: 'Learn more',
    bookNow: 'Book now',
    call: 'Call',
    messenger: 'Messenger',
    writeMessenger: 'Message us on Messenger',
    viewAll: 'View all',
    back: 'Back',
    next: 'Continue',
    optional: 'optional',
    minutesRead: 'min read',
    seeOnFacebook: 'See more on our Facebook page',
    imagePlaceholder: 'Photo coming soon',
  },

  hero: {
    eyebrow: 'Family dentistry & orthodontics clinic',
    titleStart: 'Your family’s',
    titleHighlight: 'healthy smile',
    titleEnd: 'starts here',
    text: 'From a child’s very first check-up to braces, whitening and dentures — professional dental care for every member of the family, under one roof, in a calm and friendly clinic.',
    primary: 'Book Appointment',
    secondary: 'Explore Services',
    stats: [
      { value: '32K+', label: 'Facebook followers' },
      { value: '90%', label: 'recommend us' },
      { value: '8+', label: 'dental services' },
    ],
    floatTitle: 'Book online in minutes',
    floatText: 'A few quick steps — we’ll call to confirm',
    floatBadge: 'Kid-friendly',
    imageAlt: 'Inside the My Dent clinic',
  },

  services: {
    eyebrow: 'Services',
    title: 'Complete care under one roof',
    text: 'From preventive check-ups to cosmetic treatments — care tailored to every age.',
    viewAll: 'All services',
    items: {
      general: {
        title: 'General Dentistry',
        short: 'Preventive check-ups, cavity fillings and early diagnosis.',
        description:
          'Regular check-ups catch cavities and gum disease early, when treatment is simpler and more affordable. We restore decayed teeth with durable, tooth-coloured fillings.',
        points: ['Full check-up and consultation', 'Cavity treatment and fillings', 'Gum disease treatment'],
      },
      orthodontics: {
        title: 'Orthodontics',
        short: 'Straighter teeth with braces or clear aligners.',
        description:
          'We correct crooked teeth and bite problems for both children and adults. Every treatment starts with X-rays and a detailed, personal plan.',
        points: ['Braces', 'Clear aligners', 'Retainers after treatment'],
      },
      whitening: {
        title: 'Teeth Whitening',
        short: 'Safe, visible results with the No.1 Japanese whitening system.',
        description:
          'Professional in-clinic whitening lifts stains from coffee, tea and smoking for a visibly brighter smile. We check your teeth and gums first and choose the right approach for you.',
        points: ['Japanese whitening system', 'Pre-whitening check-up', 'Tips to make results last'],
      },
      pediatric: {
        title: 'Children’s Dentistry',
        short: 'Gentle, kid-friendly care for baby teeth and prevention.',
        description:
          'We aim to give every child a calm, positive first experience at the dentist. We treat cavities in baby teeth, apply sealants and give parents practical home-care advice.',
        points: [
          'Treatment of cavities in baby teeth',
          'Fissure sealants',
          'Home-care advice for parents',
          'Dental-health lessons at schools',
        ],
      },
      cleaning: {
        title: 'Scaling & Cleaning',
        short: 'Professional cleaning and polishing to remove tartar and stains.',
        description:
          'Tartar can’t be removed by brushing and is a major cause of gum inflammation and bad breath. Scaling and polishing leave your teeth smooth and clean.',
        points: ['Tartar removal (scaling)', 'Polishing', 'Preventive check-ups every 6 months'],
      },
      sealants: {
        title: 'Fissure Sealants',
        short: 'Seal the grooves of children’s molars to protect against decay.',
        description:
          'The deep grooves on the chewing surfaces of molars easily trap food and bacteria. A sealant covers them with a thin protective layer and lowers the risk of cavities.',
        points: ['Ideal as soon as permanent molars appear', 'Painless and quick', 'Prevents cavities'],
      },
      dentures: {
        title: 'Removable & Fixed Dentures',
        short: 'Replace missing teeth and restore chewing and your smile.',
        description:
          'We make removable and fixed dentures fitted to your mouth. Metal-base partial dentures are thin, strong and comfortable to wear.',
        points: ['Metal-base partial dentures', 'Full removable dentures', 'Fixed prosthetics (crowns, bridges)'],
      },
      xray: {
        title: 'Dental X-rays',
        short: 'Precise diagnosis with panoramic and cephalometric X-rays.',
        description:
          'A panoramic X-ray shows all teeth and the jaw in a single image, revealing problems you can’t see with the eye. A lateral cephalometric X-ray is essential for planning orthodontic treatment.',
        points: ['Panoramic X-ray', 'Lateral cephalometric X-ray', 'Treatment planning and monitoring'],
      },
      cosmetic: {
        title: 'Cosmetic Dentistry & Smile Design',
        short: 'Complete “Hollywood smile” style cosmetic solutions.',
        description:
          'We improve the shape, colour and alignment of your teeth and design a smile that suits your face, combining whitening, cosmetic fillings and crowns as needed.',
        points: ['Smile analysis and planning', 'Correcting tooth shape and colour', 'Combined with whitening'],
      },
      rootCanal: {
        title: 'Root Canal Treatment',
        short: 'Save an inflamed, painful tooth instead of extracting it.',
        description:
          'When decay reaches the nerve it causes pain and swelling. Root canal treatment cleans out the inflamed nerve and seals the canals so you can keep your own tooth.',
        points: ['Under local anaesthetic, minimal discomfort', 'X-ray guided', 'Restoration after treatment'],
      },
    },
  },

  servicesPage: {
    eyebrow: 'Services',
    title: 'Dental care for every member of the family',
    text: 'From a child’s first check-up to orthodontics and dentures — all in one clinic.',
    extraTitle: 'We also offer',
    bookThis: 'Book this service',
    processEyebrow: 'How it works',
    processTitle: 'What to expect',
    process: [
      { title: 'Book', text: 'Book online, by phone or via Messenger.' },
      { title: 'Check-up & diagnosis', text: 'Your dentist examines your teeth and takes X-rays if needed.' },
      { title: 'Plan & price', text: 'We explain your options, timing and costs clearly.' },
      { title: 'Treatment & follow-up', text: 'We carry out treatment and keep you on regular follow-ups.' },
    ],
    pricesTitle: 'Pricing',
    pricesText: '[Pricing information here — add prices per service or a note such as “confirmed after check-up”.]',
  },

  whyUs: {
    eyebrow: 'Why My Dent?',
    title: 'A clinic families trust',
    text: 'We make every treatment clear, comfortable and reliable.',
    items: [
      {
        title: 'Experienced team',
        text: 'Professional dentists working in general, children’s dentistry and orthodontics.',
      },
      {
        title: 'Modern technology',
        text: 'Panoramic and cephalometric X-rays and other diagnostics done right in the clinic.',
      },
      {
        title: 'Comfortable environment',
        text: 'A calm, welcoming space where children and adults feel at ease.',
      },
      {
        title: 'Personalised plans',
        text: 'After your check-up we explain a treatment plan built around your needs.',
      },
      {
        title: 'Transparent pricing',
        text: 'You know the cost before treatment begins — no surprises.',
      },
    ],
    statValue: '90%',
    statLabel: 'of patients on Facebook recommend us',
    statSub: 'Over 32,000 followers',
  },

  dentists: {
    eyebrow: 'Our dentists',
    title: 'Meet the specialists',
    text: 'Trust your family’s dental health to caring, experienced hands.',
    viewAll: 'All dentists',
    experience: 'Experience',
    bookWith: 'Book with this dentist',
    items: [
      {
        name: 'Doctor’s name',
        role: 'Specialty',
        experience: '[__] years',
        bio: '[Short bio: education, specialty and experience in 1–2 sentences.]',
      },
      {
        name: 'Doctor’s name',
        role: 'Specialty',
        experience: '[__] years',
        bio: '[Short bio: education, specialty and experience in 1–2 sentences.]',
      },
      {
        name: 'Doctor’s name',
        role: 'Specialty',
        experience: '[__] years',
        bio: '[Short bio: education, specialty and experience in 1–2 sentences.]',
      },
      {
        name: 'Doctor’s name',
        role: 'Specialty',
        experience: '[__] years',
        bio: '[Short bio: education, specialty and experience in 1–2 sentences.]',
      },
    ],
  },

  dentistsPage: {
    eyebrow: 'Our dentists',
    title: 'The team behind your smile',
    text: 'Our dentists treat every child and adult with care, and explain each step of treatment.',
    teamTitle: 'Our support team',
    teamText: '[A short note about nurses, reception and other team members.]',
  },

  results: {
    eyebrow: 'Results',
    title: 'Before & after',
    text: 'Real treatment results from our patients. Drag the slider to compare.',
    before: 'Before',
    after: 'After',
    sliderLabel: 'Slider comparing before and after photos',
    consentNote: 'Photos published with patients’ consent.',
    items: [
      { title: 'Case 1', treatment: '[Treatment type]' },
      { title: 'Case 2', treatment: '[Treatment type]' },
      { title: 'Case 3', treatment: '[Treatment type]' },
      { title: 'Case 4', treatment: '[Treatment type]' },
      { title: 'Case 5', treatment: '[Treatment type]' },
      { title: 'Case 6', treatment: '[Treatment type]' },
    ],
  },

  testimonials: {
    eyebrow: 'Testimonials',
    title: 'What our patients say',
    summary: '90% recommend us on Facebook',
    summarySub: '16 reviews',
    items: [
      {
        quote: 'Review goes here. [Add a real patient review, with their permission.]',
        name: 'Patient name',
        meta: '[Treatment type]',
      },
      {
        quote: 'Review goes here. [Add a real patient review, with their permission.]',
        name: 'Patient name',
        meta: '[Treatment type]',
      },
      {
        quote: 'Review goes here. [Add a real patient review, with their permission.]',
        name: 'Patient name',
        meta: '[Treatment type]',
      },
    ],
  },

  tips: {
    eyebrow: 'Dental tips',
    title: 'Advice for healthy teeth',
    text: 'Simple, practical tips to keep your smile healthy.',
    viewAll: 'All tips',
    readMore: 'Read',
    pageTitle: 'Dental health tips',
    pageText: 'Advice our dentists share on our Facebook page. Have a question? Get in touch.',
    adviceLabel: 'Dentist’s advice',
    contents: 'Contents',
    items: {
      'yellow-teeth': {
        title: 'Why do teeth turn yellow?',
        excerpt: 'Besides coffee, tea and smoking, age and tartar also affect the colour of your teeth.',
        intro:
          'Enamel is the translucent protective outer layer of a tooth. Beneath it lies yellowish dentin. When enamel thins or stains build up on the surface, teeth look yellow.',
        pointsTitle: 'Common causes',
        points: [
          'Coffee, black tea and coloured drinks',
          'Smoking',
          'Plaque and tartar',
          'Enamel thinning with age',
          'Some medicines, or too much fluoride in early childhood',
        ],
        advice:
          'Brush twice a day and get a professional cleaning every 6 months. If you want a whiter smile, ask your dentist about whitening.',
      },
      coffee: {
        title: 'How does coffee affect your teeth?',
        excerpt: 'A daily cup of coffee stains teeth — and with sugar, it raises the risk of cavities.',
        intro:
          'Coloured compounds in coffee settle into tiny pores in the enamel and gradually stain teeth. Coffee is also acidic, which temporarily softens enamel.',
        pointsTitle: 'How to protect your teeth',
        points: [
          'Rinse with water after coffee',
          'Drink iced coffee through a straw',
          'Cut down on sugar and syrups',
          'Wait about 30 minutes after coffee before brushing',
        ],
        advice: 'You don’t need to give up coffee — good care and regular cleanings are enough.',
      },
      toothbrush: {
        title: 'How to choose the right toothbrush',
        excerpt: 'A soft-bristled brush with a small head suits most people best.',
        intro:
          'Hard bristles don’t clean better — they can damage enamel and gums. The right brush and the right technique are all you need.',
        pointsTitle: 'What to look for',
        points: [
          'Choose soft bristles',
          'A small head that reaches the back teeth',
          'Replace every 3 months or when bristles fray',
          'Replace after a cold or flu',
          'An age-appropriate brush for children',
        ],
        advice: 'Electric toothbrushes are a good choice too. What matters is brushing properly for 2 minutes, twice a day.',
      },
      'baby-teeth': {
        title: 'When do baby teeth come in?',
        excerpt: 'Most babies get their first tooth from around 6 months. When should the first check-up be?',
        intro:
          'The first baby tooth usually appears at 6–10 months, starting with the lower front teeth, though every child is different. All 20 baby teeth are usually in by age 3, and permanent teeth start coming through around age 6.',
        pointsTitle: 'Tips for parents',
        points: [
          'Before teeth appear, wipe gums with a soft damp cloth',
          'Start brushing with a soft children’s brush once the first tooth appears',
          'Have the first dental check-up before the first birthday',
          'Don’t put your child to sleep with a bottle of milk or juice',
        ],
        advice: 'To make brushing fun rather than a chore, use games and songs — and brush together.',
      },
      'bad-breath': {
        title: 'Bad breath: causes and solutions',
        excerpt: 'Most bad breath comes from bacteria in the mouth and can be fixed with good oral care.',
        intro:
          'Bacteria feed on food left on the tongue and between teeth and release unpleasant odours. Gum disease, tartar, dry mouth and smoking can also cause bad breath.',
        pointsTitle: 'What to do',
        points: [
          'Clean your tongue when you brush',
          'Floss every day',
          'Drink enough water',
          'Have tartar removed regularly',
        ],
        advice: 'If bad breath persists despite good care, see your dentist.',
      },
      smoking: {
        title: 'How smoking affects your teeth',
        excerpt: 'Smoking stains teeth and raises the risk of gum disease and oral cancer.',
        intro:
          'Tar and nicotine stick to the tooth surface and cause dark stains. Smoking also reduces blood flow to the gums and slows healing after treatment.',
        pointsTitle: 'The harm smoking does',
        points: [
          'Yellowing and stains',
          'Gum disease and risk of losing teeth',
          'Bad breath',
          'Higher risk of oral cancer',
        ],
        advice: 'Quitting smoking is the single best investment you can make in your oral health.',
      },
      checkup: {
        title: 'Why get a check-up every 6 months?',
        excerpt: 'Cavities and gum disease are painless early on. Regular check-ups save time and money.',
        intro:
          'Most dental problems cause no symptoms in their early stages. By the time it hurts, treatment is usually longer and more expensive.',
        pointsTitle: 'Benefits of a check-up',
        points: [
          'Catch cavities while they are small',
          'Professional removal of plaque and tartar',
          'Check the health of your gums',
          'Monitor how children’s teeth and bite develop',
        ],
        advice: 'Book your 6-month check-up today.',
      },
    },
  },

  community: {
    eyebrow: 'Community',
    title: 'Dental-health lessons in schools',
    text: 'My Dent’s dentists visit schools to teach children — in a fun, easy-to-follow way — how to brush properly, eat well for healthy teeth and prevent cavities.',
    points: ['Good brushing habits', 'Healthy eating and teeth', 'Preventing cavities'],
    cta: 'Invite us to your school',
    imageAlt: 'Dental-health lesson in a school classroom',
  },

  cta: {
    title: 'Ready for a healthier smile?',
    text: 'Book online or give us a call.',
    book: 'Book Appointment',
  },

  contact: {
    eyebrow: 'Contact',
    title: 'Get in touch',
    text: 'Have a question or want to book? Call us, message us on Messenger or use the form below.',
    pageTitle: 'Contact us',
    pageText: 'We’re on the 2nd floor of the Altan-Ord Center on Narny Zam.',
    addressLabel: 'Address',
    address: 'Altan-Ord Center, 2nd floor, Narny Zam, Ulaanbaatar 17009, Mongolia',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    hoursLabel: 'Opening hours',
    hours: [
      { days: 'Monday – Friday', time: '[add hours]' },
      { days: 'Saturday', time: '[add hours]' },
      { days: 'Sunday', time: '[add hours]' },
    ],
    directions: 'Get directions',
    mapTitle: 'My Dent clinic location — Google Maps',
    form: {
      title: 'Send us a message',
      text: 'We reply during opening hours.',
      name: 'Name',
      phone: 'Phone number',
      email: 'Email',
      message: 'Message',
      messagePlaceholder: 'Your question or request...',
      submit: 'Send message',
      sending: 'Sending…',
      successTitle: 'Thank you!',
      successText: 'We’ve received your message and will be in touch soon.',
      sendAnother: 'Send another message',
    },
  },

  validation: {
    required: 'Please fill in this field',
    name: 'Please enter your full name',
    phone: 'Invalid phone number (8 digits)',
    email: 'Invalid email address',
    messageShort: 'Message must be at least 10 characters',
    submitError: 'Something went wrong. Please try again or call us.',
  },

  booking: {
    eyebrow: 'Online booking',
    title: 'Book an appointment',
    text: 'Book in a few quick steps. We’ll call you to confirm.',
    steps: ['Treatment', 'Dentist', 'Date & time', 'Details'],
    stepOf: 'Step',
    serviceTitle: 'Which treatment do you need?',
    consultTitle: 'Check-up & consultation',
    consultText: 'Not sure what you need? Start with a check-up.',
    dentistTitle: 'Choose your dentist',
    anyDentist: 'Any available dentist',
    anyDentistText: 'Earliest available time',
    dateTitle: 'Pick a date and time',
    timeTitle: 'Time',
    morning: 'Morning',
    afternoon: 'Afternoon',
    today: 'Today',
    closed: 'Closed',
    noSlots: 'No times left on this day. Please pick another date.',
    pickDateFirst: 'Pick a date first',
    detailsTitle: 'Your details',
    name: 'Full name',
    phone: 'Phone number',
    note: 'Note',
    notePlaceholder: 'E.g. booking for my 7-year-old child',
    submit: 'Send booking',
    submitting: 'Sending…',
    summaryTitle: 'Your booking',
    service: 'Treatment',
    dentist: 'Dentist',
    date: 'Date',
    time: 'Time',
    notSelected: 'Not selected',
    summaryNote: 'After you send your booking, we’ll call you to confirm the time.',
    successTitle: 'Booking sent!',
    successText: 'We’ll call you to confirm your appointment. For anything urgent, call the number below.',
    reference: 'Booking reference',
    newBooking: 'New booking',
    backHome: 'Back to home',
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dateFormat: '{mon} {d}',
  },

  about: {
    eyebrow: 'About us',
    title: 'A dental clinic every family can trust',
    intro:
      'My Dent is a family dentistry and orthodontics clinic on the 2nd floor of the Altan-Ord Center on Narny Zam, Ulaanbaatar. From a child’s first check-up to orthodontics and cosmetic treatment, we care for every member of the family under one roof.',
    storyTitle: 'Our story',
    story:
      '[Clinic story here: year founded, founder, why it became a family clinic, and the journey so far.]',
    missionTitle: 'Our mission',
    mission: 'A healthy, confident smile for everyone — from children to grandparents.',
    valuesTitle: 'Our values',
    values: [
      { title: 'Care', text: 'We welcome every patient like a member of our own family.' },
      { title: 'Expertise', text: 'Every treatment is carefully planned and done to a high standard.' },
      { title: 'Transparency', text: 'We explain treatment and costs clearly from the start.' },
      { title: 'Prevention', text: 'We believe preventing problems matters more than treating them.' },
    ],
    statsFounded: 'year founded',
    foundedYear: '[year]',
  },

  footer: {
    tagline: 'Professional Dental Clinic',
    description:
      'Family dentistry and orthodontics clinic. Caring for the smiles of the whole family, from children to grandparents.',
    linksTitle: 'Links',
    servicesTitle: 'Services',
    contactTitle: 'Contact',
    staffLogin: 'Staff login',
    rights: 'All rights reserved.',
  },

  staff: {
    title: 'Staff area',
    text: 'Staff login will work once a backend is connected. For now this page only shows test bookings saved on this device.',
    bookingsTitle: 'Bookings saved in this browser',
    messagesTitle: 'Messages saved in this browser',
    empty: 'Nothing here yet.',
    clear: 'Clear',
  },

  notFound: {
    title: 'Page not found',
    text: 'The page you’re looking for doesn’t exist or has moved.',
    home: 'Back to home',
  },
}

export const translations = { mn, en }
export type Lang = keyof typeof translations

/** Англи сарын нэрс (EN огноонд) / English month names for date formatting */
export const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
