import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: ReactNode
  text?: ReactNode
  align?: 'center' | 'left'
  as?: 'h1' | 'h2'
  light?: boolean
  className?: string
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${
        light ? 'bg-white/10 text-brand-100 ring-1 ring-white/20' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${light ? 'bg-brand-300' : 'bg-brand-500'}`} aria-hidden />
      {children}
    </span>
  )
}

export function SectionHeading({ eyebrow, title, text, align = 'center', as = 'h2', light = false, className = '' }: Props) {
  const Tag = as
  return (
    <div className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <Tag
        className={`mt-4 font-display font-bold tracking-tight text-balance ${
          as === 'h1' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
        } ${light ? 'text-white' : 'text-ink'}`}
      >
        {title}
      </Tag>
      {text && <p className={`mt-4 text-base sm:text-lg text-pretty ${light ? 'text-brand-100' : 'text-muted'}`}>{text}</p>}
    </div>
  )
}
