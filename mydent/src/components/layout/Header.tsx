import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck, MapPin, Menu, Phone, X } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { clinic } from '../../config/clinic'
import { Container } from '../ui/Container'
import { Logo } from '../ui/Logo'
import { ButtonA, ButtonLink } from '../ui/Button'
import { LanguageToggle } from './LanguageToggle'
import { FacebookIcon } from '../icons/DentalIcons'

export function Header() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/', label: t.nav.home, end: true },
    { to: '/services', label: t.nav.services },
    { to: '/dentists', label: t.nav.dentists },
    { to: '/about', label: t.nav.about },
    { to: '/tips', label: t.nav.tips },
    { to: '/contact', label: t.nav.contact },
  ]

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Дээд мэдээллийн мөр (зөвхөн том дэлгэцэнд) */}
      <div className="hidden bg-brand-900 text-[13px] text-brand-100 md:block">
        <Container className="flex h-9 items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-brand-300" />
            {t.contact.address}
          </span>
          <div className="flex items-center gap-5">
            {clinic.phones.map((p) => (
              <a key={p.href} href={p.href} className="inline-flex items-center gap-1.5 hover:text-white">
                <Phone size={13} className="text-brand-300" />
                {p.display}
              </a>
            ))}
            <a href={clinic.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
              <FacebookIcon size={15} className="text-brand-300" />
              Facebook
            </a>
          </div>
        </Container>
      </div>

      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled || open ? 'border-ink/5 bg-white/90 shadow-[0_6px_24px_-12px_rgba(19,38,26,0.18)] backdrop-blur-xl' : 'border-transparent bg-white/70 backdrop-blur'
        }`}
      >
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink/75 hover:text-brand-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <LanguageToggle />
              <ButtonLink to="/book" size="sm">
                <CalendarCheck size={16} />
                {t.nav.book}
              </ButtonLink>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              className="grid h-11 w-11 place-items-center rounded-full text-ink ring-1 ring-ink/10 transition hover:bg-brand-50 xl:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </Container>

        {/* Гар утасны цэс */}
        <div
          id="mobile-menu"
          className={`overflow-hidden border-t border-ink/5 bg-white transition-[max-height,opacity] duration-300 xl:hidden ${
            open ? 'max-h-[calc(100dvh-72px)] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <Container className="max-h-[calc(100dvh-72px)] overflow-y-auto py-4">
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  tabIndex={open ? 0 : -1}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3.5 text-lg font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-brand-50/60'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/5 pt-4">
              <span className="text-sm text-muted">{t.nav.language}</span>
              <LanguageToggle />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
              <ButtonA href={clinic.phones[0].href} variant="secondary" tabIndex={open ? 0 : -1}>
                <Phone size={17} />
                {clinic.phones[0].display}
              </ButtonA>
              <ButtonLink to="/book" tabIndex={open ? 0 : -1}>
                <CalendarCheck size={17} />
                {t.nav.book}
              </ButtonLink>
            </div>
          </Container>
        </div>
      </header>
    </>
  )
}
