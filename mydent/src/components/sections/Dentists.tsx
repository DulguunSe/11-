import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n/LanguageContext'
import { dentists } from '../../config/content'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'

export function DentistCard({ index, detailed = false }: { index: number; detailed?: boolean }) {
  const { t } = useLang()
  const d = dentists[index]
  const text = t.dentists.items[index]
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/[0.06] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(27,80,32,0.45)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-100">
        <img
          src={d.image}
          alt={text.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          width={800}
          height={1000}
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
          {t.dentists.experience}: {text.experience}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-ink">{text.name}</h3>
        <p className="mt-0.5 text-sm font-medium text-brand-600">{text.role}</p>
        {detailed && <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{text.bio}</p>}
        <Link
          to={`/book?dentist=${d.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <CalendarCheck size={16} />
          {t.dentists.bookWith}
        </Link>
      </div>
    </article>
  )
}

export function Dentists() {
  const { t } = useLang()
  return (
    <section className="bg-brand-50/50 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={t.dentists.eyebrow} title={t.dentists.title} text={t.dentists.text} align="left" />
          <ButtonLink to="/dentists" variant="secondary" className="shrink-0">
            {t.dentists.viewAll}
            <ArrowRight size={17} />
          </ButtonLink>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {dentists.map((d, i) => (
            <Reveal key={d.id} delay={i * 60}>
              <DentistCard index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
