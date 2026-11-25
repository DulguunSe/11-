import { useState } from 'react'

export const TOOTH_STATUS = {
  healthy: { label: 'Эрүүл', color: '#ffffff', text: '#5b6b7f' },
  caries: { label: 'Цоорол', color: '#ef4444', text: '#fff' },
  filled: { label: 'Ломбо', color: '#1466d6', text: '#fff' },
  root_canal: { label: 'Сувгийн эмчилгээ', color: '#7c3aed', text: '#fff' },
  crown: { label: 'Бүрээс', color: '#a8833a', text: '#fff' },
  bridge: { label: 'Гүүр', color: '#0ea5e9', text: '#fff' },
  implant: { label: 'Суулгац', color: '#3f8f0c', text: '#fff' },
  extract: { label: 'Авах шаардлагатай', color: '#f97316', text: '#fff' },
  missing: { label: 'Байхгүй', color: '#cbd5e1', text: '#475569' },
} as const
export type ToothStatus = keyof typeof TOOTH_STATUS

const ADULT_UP = [18, 17, 16, 15, 14, 13, 12, 11, 0, 21, 22, 23, 24, 25, 26, 27, 28]
const ADULT_LO = [48, 47, 46, 45, 44, 43, 42, 41, 0, 31, 32, 33, 34, 35, 36, 37, 38]
const CHILD_UP = [55, 54, 53, 52, 51, 0, 61, 62, 63, 64, 65]
const CHILD_LO = [85, 84, 83, 82, 81, 0, 71, 72, 73, 74, 75]

/** FDI дугаарлалттай шүдний диаграм */
export function ToothChart({
  chart,
  onToothClick,
  selected,
  child: childDefault = false,
}: {
  chart: { tooth: number; status: string }[]
  onToothClick?: (tooth: number) => void
  selected?: Set<number>
  child?: boolean
}) {
  const [child, setChild] = useState(childDefault)
  const byTooth = new Map(chart.map((c) => [c.tooth, c.status as ToothStatus]))
  const row = (teeth: number[], upper: boolean) => (
    <div className="flex justify-center gap-1">
      {teeth.map((n, i) => {
        if (n === 0) return <span key={`gap${i}`} className="w-2 sm:w-3" />
        const st = TOOTH_STATUS[byTooth.get(n) ?? 'healthy']
        const isSel = selected?.has(n)
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToothClick?.(n)}
            disabled={!onToothClick}
            title={`${n} · ${st.label}`}
            className={`relative h-10 w-7 text-[10px] font-semibold tabular-nums ring-1 transition sm:h-12 sm:w-9 sm:text-xs ${upper ? 'rounded-t-md rounded-b-xl' : 'rounded-t-xl rounded-b-md'} ${
              isSel ? 'ring-2 ring-ink' : 'ring-line'
            } ${onToothClick ? 'hover:scale-105' : ''}`}
            style={{ background: st.color, color: st.text }}
          >
            {n}
            {byTooth.get(n) === 'missing' && <span className="absolute inset-0 grid place-items-center text-lg text-slate-500">×</span>}
          </button>
        )
      })}
    </div>
  )
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex rounded-lg bg-soft p-0.5 text-xs font-semibold">
          <button type="button" onClick={() => setChild(false)} className={`rounded-md px-2.5 py-1 ${!child ? 'bg-white shadow-sm' : 'text-muted'}`}>
            Байнгын шүд
          </button>
          <button type="button" onClick={() => setChild(true)} className={`rounded-md px-2.5 py-1 ${child ? 'bg-white shadow-sm' : 'text-muted'}`}>
            Сүүн шүд
          </button>
        </div>
      </div>
      <div className="scroll-thin overflow-x-auto pb-1">
        <div className="mx-auto w-max space-y-1.5 rounded-2xl bg-soft p-3">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted">Дээд эрүү</p>
          {row(child ? CHILD_UP : ADULT_UP, true)}
          {row(child ? CHILD_LO : ADULT_LO, false)}
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted">Доод эрүү</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {Object.entries(TOOTH_STATUS).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="h-3 w-3 rounded-sm ring-1 ring-line" style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  )
}
