import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '../../i18n/LanguageContext'
import { homeServices, serviceIcons } from '../../config/content'
import type { ServiceSlug } from '../../i18n/translations'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'

export function ServiceCard({ slug }: { slug: ServiceSlug }) {
  const { t } = useLang()
  const s = t.services.items[slug]
  const Icon = serviceIcons[slug]
  return (
    <Link
      to={`/services#${slug}`}
      className="group flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-ink/[0.06] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(27,80,32,0.45)] hover:ring-brand-200"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white">
        <Icon size={26} />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold leading-snug text-ink">{s.title}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{s.short}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
        {t.common.learnMore}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

export function Services() {
  const { t } = useLang()
  return (
    <section id="services" className="bg-brand-50/50 py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t.services.eyebrow} title={t.services.title} text={t.services.text} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {homeServices.map((slug, i) => (
            <Reveal key={slug} delay={(i % 4) * 60}>
              <ServiceCard slug={slug} />
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink to="/services" variant="secondary">
            {t.services.viewAll}
            <ArrowRight size={17} />
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
