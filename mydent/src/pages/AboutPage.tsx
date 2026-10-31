import { Eye, HandHeart, Microscope, ShieldCheck, Target } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { images } from '../config/content'
import { PageHero } from '../components/sections/PageHero'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { WhyUs } from '../components/sections/WhyUs'
import { Community } from '../components/sections/Community'
import { CTA } from '../components/sections/CTA'

const valueIcons = [HandHeart, Microscope, Eye, ShieldCheck]

export default function AboutPage() {
  const { t } = useLang()
  const a = t.about
  usePageMeta(t.meta.pages.about)

  const stats = [
    { value: '32K+', label: t.hero.stats[0].label },
    { value: '90%', label: t.hero.stats[1].label },
    { value: a.foundedYear, label: a.statsFounded },
  ]

  return (
    <>
      <PageHero eyebrow={a.eyebrow} title={a.title} text={a.intro} />

      <section className="pb-16 sm:pb-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="aspect-[4/3] overflow-hidden rounded-[2rem] bg-brand-100 ring-1 ring-ink/5">
              <img src={images.aboutTeam} alt={t.meta.siteName} className="h-full w-full object-cover" loading="lazy" width={1200} height={900} />
            </div>
          </Reveal>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{a.storyTitle}</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">{a.story}</p>
            <div className="mt-8 flex items-start gap-4 rounded-3xl bg-brand-900 p-6 text-white">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">
                <Target size={22} />
              </span>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-200">{a.missionTitle}</h3>
                <p className="mt-1 font-display text-lg font-bold">{a.mission}</p>
              </div>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-brand-50 px-3 py-4 text-center">
                  <dd className="font-display text-2xl font-extrabold text-brand-600">{s.value}</dd>
                  <dt className="mt-1 text-xs text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section className="bg-brand-50/50 py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow={a.eyebrow} title={a.valuesTitle} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.values.map((v, i) => {
              const Icon = valueIcons[i] ?? HandHeart
              return (
                <Reveal key={v.title} delay={i * 60}>
                  <div className="h-full rounded-3xl bg-white p-6 ring-1 ring-ink/[0.06]">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-ink">{v.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.text}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      <WhyUs />
      <Community />
      <CTA />
    </>
  )
}
