import { Award, BadgeCheck, ClipboardList, ReceiptText, ScanLine, Sofa } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { images } from '../../config/content'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { FacebookIcon } from '../icons/DentalIcons'

const icons = [Award, ScanLine, Sofa, ClipboardList, ReceiptText]

export function WhyUs() {
  const { t } = useLang()
  const w = t.whyUs
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-brand-100 ring-1 ring-ink/5">
            <img src={images.about} alt="" className="h-full w-full object-cover" loading="lazy" width={1200} height={960} />
          </div>
          <div className="absolute -bottom-8 right-4 max-w-[280px] rounded-3xl bg-brand-900 p-6 text-white shadow-2xl shadow-brand-900/30 sm:-right-6">
            <div className="flex items-center gap-2 text-brand-200">
              <FacebookIcon size={18} />
              <BadgeCheck size={18} />
            </div>
            <p className="mt-3 font-display text-4xl font-extrabold">{w.statValue}</p>
            <p className="mt-1 text-sm leading-snug text-brand-100">{w.statLabel}</p>
            <p className="mt-3 text-xs text-brand-200/80">{w.statSub}</p>
          </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading eyebrow={w.eyebrow} title={w.title} text={w.text} align="left" />
          <ul className="mt-10 space-y-3">
            {w.items.map((item, i) => {
              const Icon = icons[i] ?? Award
              return (
                <Reveal key={item.title} delay={i * 50}>
                  <li className="flex gap-4 rounded-2xl p-3 transition hover:bg-brand-50/70 sm:p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-ink">{item.title}</h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-muted">{item.text}</p>
                    </div>
                  </li>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </Container>
    </section>
  )
}
