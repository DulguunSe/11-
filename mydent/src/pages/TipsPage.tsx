import { CalendarCheck, CheckCircle2, Clock, Lightbulb } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { tips } from '../config/content'
import { PageHero } from '../components/sections/PageHero'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { CTA } from '../components/sections/CTA'

export default function TipsPage() {
  const { t } = useLang()
  usePageMeta(t.meta.pages.tips)
  return (
    <>
      <PageHero eyebrow={t.tips.eyebrow} title={t.tips.pageTitle} text={t.tips.pageText} />
      <section className="pb-16">
        <Container className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
          <nav aria-label={t.tips.contents} className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.tips.contents}</p>
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
              {tips.map((tip) => (
                <li key={tip.slug} className="shrink-0">
                  <a
                    href={`#${tip.slug}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(tip.slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      history.replaceState(null, '', `#${tip.slug}`)
                    }}
                    className="block rounded-full bg-brand-50 px-4 py-2 text-sm font-medium whitespace-nowrap text-ink transition hover:text-brand-700 lg:rounded-xl lg:bg-transparent lg:whitespace-normal lg:hover:bg-brand-50"
                  >
                    {t.tips.items[tip.slug].title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-8">
            {tips.map((tip) => {
              const a = t.tips.items[tip.slug]
              return (
                <article key={tip.slug} id={tip.slug} className="scroll-mt-28 overflow-hidden rounded-[2rem] bg-white ring-1 ring-ink/[0.06]">
                  <div className="grid md:grid-cols-[1fr_1.3fr]">
                    <div className="aspect-[16/10] bg-brand-100 md:aspect-auto">
                      <img src={tip.image} alt="" className="h-full w-full object-cover" loading="lazy" width={800} height={500} />
                    </div>
                    <div className="p-6 sm:p-8">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Clock size={13} />
                        {tip.minutes} {t.common.minutesRead}
                      </span>
                      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{a.title}</h2>
                      <p className="mt-3 leading-relaxed text-muted">{a.intro}</p>
                      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-700">{a.pointsTitle}</h3>
                      <ul className="mt-3 space-y-2">
                        {a.points.map((p) => (
                          <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-4">
                        <Lightbulb size={20} className="mt-0.5 shrink-0 text-brand-600" />
                        <p className="text-[15px] text-ink">
                          <span className="font-semibold">{t.tips.adviceLabel}: </span>
                          {a.advice}
                        </p>
                      </div>
                      {tip.slug === 'checkup' && (
                        <ButtonLink to="/book" className="mt-6">
                          <CalendarCheck size={18} />
                          {t.common.bookNow}
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </Container>
      </section>
      <CTA />
    </>
  )
}
