import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type Base = { label: string; error?: string; hint?: ReactNode; id: string }

const inputCls = (error?: string) =>
  `mt-1.5 block w-full rounded-xl bg-white px-4 text-[16px] text-ink shadow-sm ring-1 transition placeholder:text-ink/35 focus:outline-none focus:ring-2 ${
    error ? 'ring-red-400 focus:ring-red-500' : 'ring-ink/12 focus:ring-brand-500'
  }`

function Label({ id, label, hint }: { id: string; label: string; hint?: ReactNode }) {
  return (
    <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
      {label}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
      {error}
    </p>
  )
}

export function TextField({ label, error, hint, id, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} />
      <input id={id} className={`${inputCls(error)} h-12`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      <ErrorText id={id} error={error} />
    </div>
  )
}

export function TextAreaField({ label, error, hint, id, ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label id={id} label={label} hint={hint} />
      <textarea id={id} className={`${inputCls(error)} min-h-28 py-3`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      <ErrorText id={id} error={error} />
    </div>
  )
}
