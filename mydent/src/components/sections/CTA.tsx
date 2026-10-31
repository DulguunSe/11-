import { CalendarCheck, Phone } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clinic } from '../../config/clinic'
import { Container } from '../ui/Container'
import { ButtonA, ButtonLink } from '../ui/Button'
import { SwirlLines } from '../ui/Swirl'
import { ToothHeartIcon } from '../icons/DentalIcons'

export function CTA() {
  const { t } = useLang()
  return (
    <section className="py-10 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <SwirlLines className="pointer-events-none absolute -bottom-20 -left-16 w-[420px] text-brand-800/60" />
          <SwirlLines className="pointer-events-none absolute -top-24 -right-20 w-[380px] rotate-180 text-brand-500/50" />
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
              <ToothHeartIcon size={32} />
            </span>
            <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{t.cta.title}</h2>
            <p className="mt-4 text-lg text-brand-50">{t.cta.text}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/book" variant="white" size="lg">
                <CalendarCheck size={19} />
                {t.cta.book}
              </ButtonLink>
              <ButtonA href={clinic.phones[0].href} variant="outlineLight" size="lg">
                <Phone size={18} />
                {clinic.phones[0].display}
              </ButtonA>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
