import { CalendarCheck, CheckCircle2, ReceiptText } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { extraServices, homeServices, serviceIcons, serviceImage } from '../config/content'
import type { ServiceSlug } from '../i18n/translations'
import { PageHero } from '../components/sections/PageHero'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { Results } from '../components/sections/Results'
import { CTA } from '../components/sections/CTA'

function ServiceDetail({ slug, index }: { slug: ServiceSlug; index: number }) {
  const { t } = useLang()
  const s = t.services.items[slug]
  const Icon = serviceIcons[slug]
  const flip = index % 2 === 1
  return (
    <Reveal>
      <article id={slug} className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={`aspect-[4/3] overflow-hidden rounded-[2rem] bg-brand-100 ring-1 ring-ink/5 ${flip ? 'lg:order-2' : ''}`}>
          <img src={serviceImage(slug)} alt={s.title} className="h-full w-full object-cover" loading="lazy" width={1200} height={900} />
        </div>
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon size={26} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{s.title}</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">{s.description}</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {s.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] font-medium text-ink">
                <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-brand-500" />
                {p}
              </li>
            ))}
          </ul>
          <ButtonLink to={`/book?service=${slug}`} className="mt-8">
            <CalendarCheck size={18} />
            {t.servicesPage.bookThis}
          </ButtonLink>
        </div>
      </article>
    </Reveal>
  )
}

export default function ServicesPage() {
  const { t } = useLang()
  const p = t.servicesPage
  usePageMeta(t.meta.pages.services)
  const all = [...homeServices, ...extraServices]

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} text={p.text}>
        <nav aria-label={p.eyebrow} className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
          {all.map((slug) => (
            <a
              key={slug}
              href={`#${slug}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                history.replaceState(null, '', `#${slug}`)
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition hover:text-brand-700 hover:ring-brand-300"
            >
              {t.services.items[slug].title}
            </a>
          ))}
        </nav>
      </PageHero>

      <section className="py-16 sm:py-20">
        <Container className="space-y-20 sm:space-y-24">
          {homeServices.map((slug, i) => (
            <ServiceDetail key={slug} slug={slug} index={i} />
          ))}
        </Container>
      </section>

      <section className="bg-brand-50/50 py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow={p.extraTitle} title={`${t.services.items.cosmetic.title} · ${t.services.items.rootCanal.title}`} />
          <div className="mt-14 space-y-20">
            {extraServices.map((slug, i) => (
              <ServiceDetail key={slug} slug={slug} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow={p.processEyebrow} title={p.processTitle} />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {p.process.map((step, i) => (
              <Reveal key={step.title} delay={i * 60}>
                <li className="relative h-full rounded-3xl bg-white p-6 ring-1 ring-ink/[0.06]">
                  <span className="font-display text-5xl font-extrabold text-brand-100">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-3xl bg-brand-50 p-6 ring-1 ring-brand-100">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600">
              <ReceiptText size={21} />
            </span>
            <div>
              <h3 className="font-display font-bold text-ink">{p.pricesTitle}</h3>
              <p className="mt-1 text-[15px] text-muted">{p.pricesText}</p>
            </div>
          </div>
        </Container>
      </section>

      <Results limit={6} />
      <CTA />
    </>
  )
}
