import { Link } from 'react-router-dom'
import { Lock, Mail, MapPin, Phone } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clinic } from '../../config/clinic'
import { homeServices } from '../../config/content'
import { Container } from '../ui/Container'
import { Logo } from '../ui/Logo'
import { SwirlDivider, SwirlLines } from '../ui/Swirl'
import { FacebookIcon, MessengerIcon } from '../icons/DentalIcons'

export function Footer() {
  const { t } = useLang()
  const links = [
    { to: '/', label: t.nav.home },
    { to: '/services', label: t.nav.services },
    { to: '/dentists', label: t.nav.dentists },
    { to: '/about', label: t.nav.about },
    { to: '/tips', label: t.nav.tips },
    { to: '/contact', label: t.nav.contact },
    { to: '/book', label: t.nav.book },
  ]

  return (
    <footer className="relative mt-auto">
      <SwirlDivider className="h-12 sm:h-20 -mb-px text-brand-900 [&_path:last-child]:fill-brand-900" />
      <div className="relative overflow-hidden bg-brand-900 pb-24 text-brand-100 md:pb-0">
        <SwirlLines className="pointer-events-none absolute -right-24 -bottom-16 w-[480px] text-brand-800/70" />
        <Container className="relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.4fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-100/80">{t.footer.description}</p>
            <div className="mt-6 flex gap-3">
              <a
                href={clinic.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-500"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                href={clinic.messenger}
                target="_blank"
                rel="noreferrer"
                aria-label="Messenger"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-500"
              >
                <MessengerIcon size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.linksTitle}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-brand-100/80 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.servicesTitle}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {homeServices.map((slug) => (
                <li key={slug}>
                  <Link to={`/services#${slug}`} className="text-brand-100/80 transition hover:text-white">
                    {t.services.items[slug].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{t.footer.contactTitle}</h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-300" />
                <a href={clinic.mapLinkUrl} target="_blank" rel="noreferrer" className="text-brand-100/80 hover:text-white">
                  {t.contact.address}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-brand-300" />
                <span className="flex flex-wrap gap-x-3">
                  {clinic.phones.map((p) => (
                    <a key={p.href} href={p.href} className="font-semibold text-white hover:text-brand-200">
                      {p.display}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-brand-300" />
                <a href={`mailto:${clinic.email}`} className="break-all text-brand-100/80 hover:text-white">
                  {clinic.email}
                </a>
              </li>
            </ul>
          </div>
        </Container>

        <div className="relative border-t border-white/10">
          <Container className="flex flex-col items-start justify-between gap-3 py-6 text-xs text-brand-100/60 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} {t.meta.siteName}. {t.footer.rights}
            </p>
            <Link to="/staff" className="inline-flex items-center gap-1.5 hover:text-white">
              <Lock size={13} />
              {t.footer.staffLogin}
            </Link>
          </Container>
        </div>
      </div>
    </footer>
  )
}
