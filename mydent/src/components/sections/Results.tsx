import { ExternalLink } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { results } from '../../config/content'
import { clinic } from '../../config/clinic'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonA } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { BeforeAfter } from './BeforeAfter'

export function Results({ limit = 3 }: { limit?: number }) {
  const { t } = useLang()
  const r = t.results
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow={r.eyebrow} title={r.title} text={r.text} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.slice(0, limit).map((img, i) => (
            <Reveal key={img.before} delay={(i % 3) * 70}>
              <figure className="rounded-3xl bg-white p-3 ring-1 ring-ink/[0.06]">
                <BeforeAfter
                  before={img.before}
                  after={img.after}
                  beforeLabel={r.before}
                  afterLabel={r.after}
                  sliderLabel={`${r.sliderLabel} — ${r.items[i].title}`}
                  alt={r.items[i].title}
                />
                <figcaption className="flex items-center justify-between gap-3 px-2 pt-3 pb-1">
                  <span className="font-display font-bold text-ink">{r.items[i].title}</span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{r.items[i].treatment}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-muted">{r.consentNote}</p>
          <ButtonA href={clinic.facebook} target="_blank" rel="noreferrer" variant="secondary">
            {t.common.seeOnFacebook}
            <ExternalLink size={16} />
          </ButtonA>
        </div>
      </Container>
    </section>
  )
}
