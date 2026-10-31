import { Check } from 'lucide-react'

type Props = { steps: string[]; current: number; onGo: (i: number) => void; stepOf: string }

export function Stepper({ steps, current, onGo, stepOf }: Props) {
  return (
    <ol className="flex items-center" aria-label={`${stepOf} ${current + 1} / ${steps.length}`}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <button
              type="button"
              disabled={!done}
              onClick={() => onGo(i)}
              aria-current={active ? 'step' : undefined}
              className="group flex flex-col items-center gap-1.5 disabled:cursor-default sm:flex-row sm:gap-2.5"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                  done
                    ? 'bg-brand-500 text-white group-hover:bg-brand-600'
                    : active
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-white text-muted ring-1 ring-ink/15'
                }`}
              >
                {done ? <Check size={17} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-[11px] font-semibold whitespace-nowrap sm:text-sm ${active ? 'text-ink' : done ? 'text-brand-700' : 'text-muted'}`}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={`mx-2 mb-5 h-0.5 flex-1 rounded-full sm:mb-0 sm:mx-3 ${done ? 'bg-brand-400' : 'bg-ink/10'}`} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
