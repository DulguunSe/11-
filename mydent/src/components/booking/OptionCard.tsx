import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = { selected: boolean; onSelect: () => void; icon?: ReactNode; title: string; text?: string; name: string }

/** Радио товч шиг ажиллах сонголтын карт */
export function OptionCard({ selected, onSelect, icon, title, text, name }: Props) {
  return (
    <label
      className={`relative flex cursor-pointer items-start gap-4 rounded-2xl bg-white p-4 ring-1 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
        selected ? 'ring-2 ring-brand-500 bg-brand-50/60' : 'ring-ink/10 hover:ring-brand-300'
      }`}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      {icon && (
        <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl ${selected ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-600'}`}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 pr-6">
        <span className="block font-semibold leading-snug text-ink">{title}</span>
        {text && <span className="mt-1 block text-sm leading-snug text-muted">{text}</span>}
      </span>
      <span
        className={`absolute top-4 right-4 grid h-5 w-5 place-items-center rounded-full ring-1 ${
          selected ? 'bg-brand-500 text-white ring-brand-500' : 'ring-ink/20'
        }`}
        aria-hidden
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
    </label>
  )
}
