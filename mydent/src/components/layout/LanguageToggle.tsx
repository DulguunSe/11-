import { useLang } from '../../i18n/LanguageContext'
import type { Lang } from '../../i18n/translations'

const options: { value: Lang; label: string }[] = [
  { value: 'mn', label: 'МН' },
  { value: 'en', label: 'EN' },
]

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t.nav.language} className={`inline-flex rounded-full bg-brand-50 p-1 ring-1 ring-brand-100 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          lang={o.value}
          className={`h-8 min-w-10 rounded-full px-2.5 text-xs font-bold transition-colors ${
            lang === o.value ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-brand-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
