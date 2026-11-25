import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { STATUS_LABEL, type AppointmentStatus } from '../shared/types.ts'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark'
const btnVariants: Record<BtnVariant, string> = {
  primary: 'brand-grad text-white shadow-[0_10px_20px_-12px_rgba(20,102,214,0.9)] hover:brightness-105',
  secondary: 'bg-white text-ink ring-1 ring-line hover:ring-blue/40 hover:text-blue',
  ghost: 'text-blue hover:bg-sky',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50',
  success: 'bg-lime-dark text-white hover:brightness-110',
  dark: 'bg-ink text-white hover:bg-ink/90',
}
export function Button({
  variant = 'primary',
  size = 'md',
  busy,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; busy?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-[15px]'
      } ${btnVariants[variant]} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold sm:text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const fieldBase = 'block w-full rounded-xl border-0 bg-white px-3.5 text-ink ring-1 ring-line transition placeholder:text-muted/60 focus:ring-2 focus:ring-cyan focus:outline-none disabled:bg-soft'

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

export function Input({ label, hint, className = '', id, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; hint?: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fid} hint={hint}>
          {label}
        </Label>
      )}
      <input id={fid} className={`${fieldBase} h-11`} {...rest} />
    </div>
  )
}

export function Textarea({ label, hint, className = '', id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode; hint?: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fid} hint={hint}>
          {label}
        </Label>
      )}
      <textarea id={fid} className={`${fieldBase} min-h-24 py-2.5`} {...rest} />
    </div>
  )
}

export function Select({ label, hint, className = '', children, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode; hint?: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fid} hint={hint}>
          {label}
        </Label>
      )}
      <select id={fid} className={`${fieldBase} h-11 pr-8`} {...rest}>
        {children}
      </select>
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-blue peer-focus-visible:ring-2 peer-focus-visible:ring-cyan" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[94dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-soft" aria-label="Хаах">
            <X size={20} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/35" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-soft" aria-label="Хаах">
            <X size={20} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  )
}

const statusStyle: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-sky text-blue ring-blue/20',
  arrived: 'bg-violet-50 text-violet-700 ring-violet-200',
  completed: 'bg-leaf text-lime-dark ring-lime/30',
  cancelled: 'bg-soft text-muted ring-line line-through',
  no_show: 'bg-red-50 text-red-600 ring-red-200',
}
export const statusColor: Record<AppointmentStatus, string> = {
  pending: '#d97706',
  confirmed: '#1466d6',
  arrived: '#7c3aed',
  completed: '#3f8f0c',
  cancelled: '#94a3b8',
  no_show: '#dc2626',
}
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusStyle[status]}`}>{STATUS_LABEL[status]}</span>
}

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet' }) {
  const tones = {
    gray: 'bg-soft text-muted ring-line',
    blue: 'bg-sky text-blue ring-blue/20',
    green: 'bg-leaf text-lime-dark ring-lime/30',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-600 ring-red-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sky text-blue">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ label = 'Ачаалж байна…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
      <LoaderCircle size={18} className="animate-spin" />
      {label}
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Дахин оролдох
        </Button>
      )}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="scroll-thin -mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            value === it.value ? 'bg-ink text-white' : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          {it.label}
          {it.count ? <span className={`rounded-full px-1.5 text-xs ${value === it.value ? 'bg-white/20' : 'bg-line'}`}>{it.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Stat({ label, value, sub, icon, tone = 'blue' }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  const tones = { blue: 'bg-sky text-blue', green: 'bg-leaf text-lime-dark', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' }
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}
