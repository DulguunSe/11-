import { useState } from 'react'
import { MoveHorizontal } from 'lucide-react'

type Props = { before: string; after: string; beforeLabel: string; afterLabel: string; sliderLabel: string; alt: string }

/** Өмнө / дараах зургийг гулсуураар харьцуулах */
export function BeforeAfter({ before, after, beforeLabel, afterLabel, sliderLabel, alt }: Props) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-2xl bg-brand-100 select-none">
      <img src={after} alt={`${alt} — ${afterLabel}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={`${alt} — ${beforeLabel}`} className="h-full w-full object-cover" loading="lazy" draggable={false} />
      </div>

      <span className="absolute top-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{beforeLabel}</span>
      <span className="absolute top-3 right-3 rounded-full bg-brand-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{afterLabel}</span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.25)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-700 shadow-lg">
          <MoveHorizontal size={20} />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={sliderLabel}
        className="ba-range absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}
