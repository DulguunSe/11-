import { ArrowRight, Baby, CalendarCheck, Star } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { images } from '../../config/content'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Eyebrow } from '../ui/SectionHeading'
import { SwirlLines } from '../ui/Swirl'

export function Hero() {
  const { t } = useLang()
  const h = t.hero

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-white">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-brand-100/60 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-72 w-72 rounded-full bg-brand-50 blur-3xl" aria-hidden />

      <Container className="relative grid items-center gap-12 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div className="min-w-0 animate-fade-up">
          <Eyebrow>{h.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-[2.35rem] leading-[1.1] font-extrabold tracking-tight text-ink text-balance sm:text-5xl lg:text-[3.6rem]">
            {h.titleStart}{' '}
            <span className="relative text-brand-600 sm:whitespace-nowrap">
              <span className="relative z-10">{h.titleHighlight}</span>
              <svg className="absolute -bottom-1.5 left-0 z-0 h-3 w-full text-brand-200" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                <path d="M2 9c40-7 120-9 196-3" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
              </svg>
            </span>{' '}
            {h.titleEnd}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{h.text}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/book" size="lg">
              <CalendarCheck size={19} />
              {h.primary}
            </ButtonLink>
            <ButtonLink to="/services" size="lg" variant="secondary">
              {h.secondary}
              <ArrowRight size={18} />
            </ButtonLink>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {h.stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white px-3 py-4 text-center shadow-[0_10px_30px_-18px_rgba(19,38,26,0.35)] ring-1 ring-ink/5 sm:px-4">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl font-extrabold text-brand-600 sm:text-[1.7rem]">{s.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full min-w-0 max-w-md animate-fade-up [animation-delay:120ms] lg:max-w-none">
          <SwirlLines className="pointer-events-none absolute -right-10 -bottom-10 w-72 text-brand-500/15" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-brand-100 shadow-[0_30px_60px_-30px_rgba(27,80,32,0.45)] ring-1 ring-ink/5">
            <img src={images.hero} alt={h.imageAlt} className="h-full w-full object-cover" width={960} height={1200} fetchPriority="high" />
          </div>

          <div className="absolute -bottom-6 left-3 flex max-w-[260px] items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-xl shadow-brand-900/10 ring-1 ring-ink/5 backdrop-blur sm:-left-8">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
              <CalendarCheck size={22} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{h.floatTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">{h.floatText}</p>
            </div>
          </div>

          <div className="absolute top-5 -right-2 flex items-center gap-2 rounded-full bg-white/95 py-2 pr-4 pl-2 shadow-lg shadow-brand-900/10 ring-1 ring-ink/5 sm:-right-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Baby size={17} />
            </span>
            <span className="text-sm font-semibold text-ink">{h.floatBadge}</span>
          </div>

          <div className="absolute top-24 -left-3 hidden items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-lg shadow-brand-900/10 ring-1 ring-ink/5 sm:flex lg:-left-8">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-ink">90%</span>
            <span className="text-xs text-muted">{h.stats[1].label}</span>
          </div>
        </div>
      </Container>
    </section>
  )
}
