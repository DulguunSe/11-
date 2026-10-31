import { Quote, ThumbsUp } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clinic } from '../../config/clinic'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { FacebookIcon } from '../icons/DentalIcons'

export function Testimonials() {
  const { t } = useLang()
  const s = t.testimonials
  return (
    <section className="bg-brand-50/50 py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow={s.eyebrow} title={s.title} />
        <div className="mt-6 flex justify-center">
          <a
            href={clinic.facebook}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 text-left text-sm shadow-sm ring-1 ring-ink/5 transition hover:ring-brand-200"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1877F2] text-white">
              <FacebookIcon size={17} />
            </span>
            <span className="flex flex-col leading-tight sm:flex-row sm:gap-1.5">
              <span className="font-semibold text-ink">{s.summary}</span>
              <span className="text-xs text-muted sm:text-sm">
                <span className="hidden sm:inline">· </span>
                {s.summarySub}
              </span>
            </span>
          </a>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {s.items.map((item, i) => (
            <Reveal key={i} delay={i * 70}>
              <figure className="relative flex h-full flex-col rounded-3xl bg-white p-7 ring-1 ring-ink/[0.06]">
                <Quote size={36} className="text-brand-200" aria-hidden />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/80">“{item.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/5 pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-display font-bold text-brand-700">
                    {item.name.trim().charAt(0)}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-ink">{item.name}</span>
                    <span className="block text-xs text-muted">{item.meta}</span>
                  </span>
                  <ThumbsUp size={18} className="text-brand-500" aria-hidden />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
