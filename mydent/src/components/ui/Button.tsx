import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'white' | 'outlineLight' | 'ghost'
type Size = 'md' | 'lg' | 'sm'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(59,130,36,0.7)] hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary: 'bg-white text-ink ring-1 ring-ink/10 hover:ring-brand-500 hover:text-brand-700 focus-visible:outline-brand-600',
  white: 'bg-white text-brand-800 hover:bg-brand-50 focus-visible:outline-white',
  outlineLight: 'text-white ring-1 ring-white/50 hover:bg-white/10 focus-visible:outline-white',
  ghost: 'text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-14 px-7 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${extra}`
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode }

export function Button({ variant, size, className, children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}

export function ButtonA({ variant, size, className, children, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </a>
  )
}
