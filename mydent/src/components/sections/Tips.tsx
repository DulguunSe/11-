import { ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n/LanguageContext'
import { tips } from '../../config/content'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'

export function TipCard({ index }: { index: number }) {
  const { t } = useLang()
  const tip = tips[index]
  const text = t.tips.items[tip.slug]
  return (
    <Link
      to={`/tips#${tip.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(27,80,32,0.45)]"
    >
      <div className="aspect-[16/10] overflow-hidden bg-brand-100">
        <img src={tip.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" width={800} height={500} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <Clock size={13} />
          {tip.minutes} {t.common.minutesRead}
        </span>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">{text.title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{text.excerpt}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
          {t.tips.readMore}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

/** Нүүр хуудсанд харуулах зөвлөгөө (эхний 3) */
export function Tips() {
  const { t } = useLang()
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={t.tips.eyebrow} title={t.tips.title} text={t.tips.text} align="left" />
          <ButtonLink to="/tips" variant="secondary" className="shrink-0">
            {t.tips.viewAll}
            <ArrowRight size={17} />
          </ButtonLink>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[0, 2, 6].map((i, n) => (
            <Reveal key={i} delay={n * 70}>
              <TipCard index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
