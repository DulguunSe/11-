/**
 * Facebook постер дээрх хар ногоон муруй хээг санагдуулах чимэглэл.
 * Decorative swirl inspired by the dark-green curves on the clinic's post banners.
 */
export function SwirlDivider({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={`block w-full ${className}`}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M0 64c160-40 320-52 480-28s300 70 480 62 300-58 480-74v96H0Z" fill="var(--color-brand-500)" opacity="0.25" />
      <path d="M0 84c200-30 380-34 560-10s340 46 520 34 260-40 360-48v60H0Z" fill="var(--color-brand-500)" />
    </svg>
  )
}

/** Булан дахь том муруй зураас — CTA, footer-т ашиглана */
export function SwirlLines({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 300" fill="none" aria-hidden>
      <path
        d="M-40 250C20 170 90 150 130 190s10 110-50 90-40-130 60-170 190 10 200 90-60 120-120 90"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path d="M250 -30c40 60 120 70 180 30" stroke="currentColor" strokeWidth="26" strokeLinecap="round" />
    </svg>
  )
}
