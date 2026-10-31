import { ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { images } from '../../config/content'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ButtonLink } from '../ui/Button'
import { Reveal } from '../ui/Reveal'

export function Community() {
  const { t } = useLang()
  const c = t.community
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-50 to-white p-6 ring-1 ring-brand-100 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <Reveal className="grid grid-cols-5 gap-3">
            <div className="col-span-3 aspect-[3/4] overflow-hidden rounded-2xl bg-brand-100">
              <img src={images.community[0]} alt={c.imageAlt} className="h-full w-full object-cover" loading="lazy" width={720} height={960} />
            </div>
            <div className="col-span-2 flex flex-col gap-3">
              <div className="aspect-square overflow-hidden rounded-2xl bg-brand-100">
                <img src={images.community[1]} alt={c.imageAlt} className="h-full w-full object-cover" loading="lazy" width={600} height={600} />
              </div>
              <div className="grid flex-1 place-items-center rounded-2xl bg-brand-600 p-4 text-white">
                <GraduationCap size={44} strokeWidth={1.6} />
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHeading eyebrow={c.eyebrow} title={c.title} text={c.text} align="left" />
            <ul className="mt-6 space-y-3">
              {c.points.map((p) => (
                <li key={p} className="flex items-center gap-3 font-medium text-ink">
                  <CheckCircle2 size={20} className="shrink-0 text-brand-500" />
                  {p}
                </li>
              ))}
            </ul>
            <ButtonLink to="/contact" variant="secondary" className="mt-8">
              {c.cta}
              <ArrowRight size={17} />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
