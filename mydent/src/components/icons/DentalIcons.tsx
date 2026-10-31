import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

const base = (size: number | string = 24): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

/** Шүдний хэлбэртэй, дотроо зүрхтэй тэмдэг (логоны mark) */
export function ToothHeartIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} viewBox="0 0 48 48" strokeWidth={4} {...props}>
      <path d="M14 6C8 6 5 11 6 18c1 6 4 9 5 15 1 6 2 11 5 11s3-6 5-11c1-3 5-3 6 0 2 5 2 11 5 11s4-5 5-11c1-6 4-9 5-15 1-7-2-12-8-12-4 0-6 2-10 2s-6-2-10-2Z" />
      <path
        d="M24 26c-6-4-7.5-7.5-5.2-10 1.7-1.8 4.2-1.2 5.2.8 1-2 3.5-2.6 5.2-.8 2.3 2.5.8 6-5.2 10Z"
        fill="currentColor"
        strokeWidth={2}
      />
    </svg>
  )
}

export function BracesIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4.5 6.5C4.5 5 5.5 4 7 4s2.5 1 2.5 2.5V15c0 2.5-1 5-2.5 5s-2.5-2.5-2.5-5Z" />
      <path d="M14.5 6.5c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5V15c0 2.5-1 5-2.5 5s-2.5-2.5-2.5-5Z" />
      <path d="M2 11h20" />
      <rect x="5.5" y="9.5" width="3" height="3" rx="0.6" />
      <rect x="15.5" y="9.5" width="3" height="3" rx="0.6" />
    </svg>
  )
}

export function DentureIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M3 13h18v1.5a5.5 5.5 0 0 1-5.5 5.5h-7A5.5 5.5 0 0 1 3 14.5Z" />
      <path d="M5.5 13V9a1.75 1.75 0 0 1 3.5 0v4" />
      <path d="M9 13V7.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M12 13V7.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M15 13V9a1.75 1.75 0 0 1 3.5 0v4" />
    </svg>
  )
}

export function FacebookIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22h3.4Z" />
    </svg>
  )
}

export function MessengerIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78a.8.8 0 0 0 1.12.71l1.98-.87a.8.8 0 0 1 .53-.04c.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
    </svg>
  )
}
