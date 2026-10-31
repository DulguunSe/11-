/**
 * Үйлчилгээ, эмч, зураг зэрэг агуулгын бүтэц (дараалал, дүрс, зургийн зам).
 * Content structure: order, icons and image paths. Text is in src/i18n/translations.ts.
 *
 * ЗУРАГ СОЛИХ: public/images доторх ижил нэртэй файлыг өөрийн зургаар солиход л хангалттай.
 * TO SWAP PHOTOS: overwrite the file with the same name in public/images.
 */
import {
  Baby,
  BrushCleaning,
  Gem,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import type { ServiceSlug, TipSlug } from '../i18n/translations'
import { BracesIcon, DentureIcon } from '../components/icons/DentalIcons'
import type { ComponentType, SVGProps } from 'react'

export type IconType = LucideIcon | ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

export const images = {
  hero: '/images/hero-clinic.jpg',
  about: '/images/about-clinic.jpg',
  aboutTeam: '/images/about-team.jpg',
  community: ['/images/community-school-visit-1.jpg', '/images/community-school-visit-2.jpg'],
  ogImage: '/images/og-image.jpg',
}

/** Нүүр хуудсанд харагдах 8 үйлчилгээ (дарааллаар) / the 8 services shown on the home page */
export const homeServices: ServiceSlug[] = [
  'general',
  'orthodontics',
  'whitening',
  'pediatric',
  'cleaning',
  'sealants',
  'dentures',
  'xray',
]

/** Үйлчилгээний хуудсанд нэмэлтээр / extra services on the Services page */
export const extraServices: ServiceSlug[] = ['cosmetic', 'rootCanal']

export const serviceIcons: Record<ServiceSlug, IconType> = {
  general: Stethoscope,
  orthodontics: BracesIcon,
  whitening: Sparkles,
  pediatric: Baby,
  cleaning: BrushCleaning,
  sealants: ShieldCheck,
  dentures: DentureIcon,
  xray: ScanLine,
  cosmetic: Gem,
  rootCanal: Activity,
}

export const serviceImage = (slug: ServiceSlug) => `/images/service-${slug}.jpg`

/**
 * Эмч нар — нэр, мэргэшлийг translations.ts-ийн dentists.items-д бичнэ.
 * id нь захиалгад хадгалагдана. Зураг: public/images/dentist-1.jpg ...
 */
export const dentists = [
  { id: 'dentist-1', image: '/images/dentist-1.jpg' },
  { id: 'dentist-2', image: '/images/dentist-2.jpg' },
  { id: 'dentist-3', image: '/images/dentist-3.jpg' },
  { id: 'dentist-4', image: '/images/dentist-4.jpg' },
]

/** Өмнө / дараа зургууд — results.items-ийн дарааллаар */
export const results = [1, 2, 3, 4, 5, 6].map((n) => ({
  before: `/images/result-${n}-before.jpg`,
  after: `/images/result-${n}-after.jpg`,
}))

export const tips: { slug: TipSlug; minutes: number; image: string }[] = [
  { slug: 'yellow-teeth', minutes: 2, image: '/images/tip-yellow-teeth.jpg' },
  { slug: 'coffee', minutes: 2, image: '/images/tip-coffee.jpg' },
  { slug: 'toothbrush', minutes: 2, image: '/images/tip-toothbrush.jpg' },
  { slug: 'baby-teeth', minutes: 3, image: '/images/tip-baby-teeth.jpg' },
  { slug: 'bad-breath', minutes: 2, image: '/images/tip-bad-breath.jpg' },
  { slug: 'smoking', minutes: 2, image: '/images/tip-smoking.jpg' },
  { slug: 'checkup', minutes: 2, image: '/images/tip-checkup.jpg' },
]

