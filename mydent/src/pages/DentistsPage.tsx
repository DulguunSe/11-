import { Users } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { dentists } from '../config/content'
import { PageHero } from '../components/sections/PageHero'
import { Container } from '../components/ui/Container'
import { DentistCard } from '../components/sections/Dentists'
import { Reveal } from '../components/ui/Reveal'
import { WhyUs } from '../components/sections/WhyUs'
import { CTA } from '../components/sections/CTA'

export default function DentistsPage() {
  const { t } = useLang()
  const p = t.dentistsPage
  usePageMeta(t.meta.pages.dentists)
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} text={p.text} />
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dentists.map((d, i) => (
              <Reveal key={d.id} delay={i * 60}>
                <DentistCard index={i} detailed />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex items-start gap-4 rounded-3xl bg-brand-50 p-6 ring-1 ring-brand-100">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600">
              <Users size={21} />
            </span>
            <div>
              <h2 className="font-display font-bold text-ink">{p.teamTitle}</h2>
              <p className="mt-1 text-[15px] text-muted">{p.teamText}</p>
            </div>
          </div>
        </Container>
      </section>
      <WhyUs />
      <CTA />
    </>
  )
}
