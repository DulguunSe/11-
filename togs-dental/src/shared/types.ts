export type Hours = Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', [string, string] | null>

export type Clinic = {
  name: string
  shortName: string
  tagline: string
  phone1: string
  phone2: string
  email: string
  address: string
  addressShort: string
  city: string
  mapsQuery: string
  facebook: string
  messenger: string
  instagram: string
  fbFollowers: string
  hours: Hours
  lunch: [string, string] | null
  slotMinutes: number
  daysAhead: number
  leadMinutes: number
  bookingEnabled: boolean
  autoConfirm: boolean
}

export type Service = {
  id: number
  name: string
  description: string
  icon: string
  price: number
  price_note: string
  duration: number
  tag: string
  show_on_site: number
  online_booking: number
  sort?: number
  active?: number
}

export type PublicDoctor = { id: number; name: string; specialty: string; bio: string; online_booking: number }
export type SiteData = { clinic: Clinic; services: Service[]; doctors: PublicDoctor[]; today: string }

export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled' | 'no_show'
export type Appointment = {
  id: number
  ref: string
  patient_id: number | null
  doctor_id: number | null
  service_id: number | null
  service_name: string
  date: string
  start_time: string
  start_min: number
  end_min: number
  duration: number
  status: AppointmentStatus
  source: 'online' | 'phone' | 'walk_in' | 'staff'
  utm: string
  teeth: string
  contact_name: string
  contact_phone: string
  patient_note: string
  staff_note: string
  p_last_name: string | null
  p_first_name: string | null
  p_phone: string | null
  p_card_no: string | null
  p_allergies: string | null
  doctor_name: string | null
  doctor_color: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Баталгаажаагүй',
  confirmed: 'Баталгаажсан',
  arrived: 'Ирсэн',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
  no_show: 'Ирээгүй',
}
export const SOURCE_LABEL: Record<string, string> = {
  online: 'Онлайн',
  phone: 'Утсаар',
  walk_in: 'Биеэр ирсэн',
  staff: 'Ажилтан',
  referral: 'Танилаар',
  facebook: 'Facebook',
  other: 'Бусад',
}
