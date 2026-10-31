import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLang } from '../../i18n/LanguageContext'
import { clinic } from '../../config/clinic'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { ContactForm } from './ContactForm'
import { MessengerIcon } from '../icons/DentalIcons'

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <div className="mt-1 text-[15px] text-ink">{children}</div>
      </div>
    </div>
  )
}

export function ContactDetails() {
  const { t } = useLang()
  const c = t.contact
  return (
    <div className="space-y-6">
      <InfoRow icon={<MapPin size={20} />} label={c.addressLabel}>
        <p>{c.address}</p>
        <a href={clinic.mapLinkUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          {c.directions}
          <ExternalLink size={13} />
        </a>
      </InfoRow>
      <InfoRow icon={<Phone size={20} />} label={c.phoneLabel}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {clinic.phones.map((p) => (
            <a key={p.href} href={p.href} className="font-display text-lg font-bold text-ink hover:text-brand-700">
              {p.display}
            </a>
          ))}
        </div>
      </InfoRow>
      <InfoRow icon={<Mail size={20} />} label={c.emailLabel}>
        <a href={`mailto:${clinic.email}`} className="break-all hover:text-brand-700">
          {clinic.email}
        </a>
      </InfoRow>
      <InfoRow icon={<Clock size={20} />} label={c.hoursLabel}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {c.hours.map((h) => (
            <div key={h.days} className="contents">
              <dt className="text-muted">{h.days}</dt>
              <dd className="font-semibold">{h.time}</dd>
            </div>
          ))}
        </dl>
      </InfoRow>
      <a
        href={clinic.messenger}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-2xl bg-[#0866FF]/[0.06] p-4 text-sm font-semibold text-[#0657d6] ring-1 ring-[#0866FF]/15 transition hover:bg-[#0866FF]/10"
      >
        <MessengerIcon size={22} />
        {t.common.writeMessenger}
      </a>
    </div>
  )
}

export function MapEmbed({ className = '' }: { className?: string }) {
  const { t } = useLang()
  return (
    <div className={`overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-ink/5 ${className}`}>
      <iframe
        title={t.contact.mapTitle}
        src={clinic.mapEmbedUrl}
        className="h-full min-h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}

export function Contact() {
  const { t } = useLang()
  const c = t.contact
  return (
    <section id="contact" className="py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow={c.eyebrow} title={c.title} text={c.text} />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/[0.06] sm:p-8">
              <ContactDetails />
            </div>
            <MapEmbed className="min-h-72 flex-1" />
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(27,80,32,0.45)] ring-1 ring-ink/[0.06] sm:p-8">
            <h3 className="font-display text-2xl font-bold text-ink">{c.form.title}</h3>
            <p className="mt-1 mb-6 text-muted">{c.form.text}</p>
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  )
}
