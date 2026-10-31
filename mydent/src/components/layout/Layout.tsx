import { Outlet } from 'react-router-dom'
import { useLang } from '../../i18n/LanguageContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileActions } from './MobileActions'
import { ScrollManager } from './ScrollManager'

export function Layout() {
  const { t } = useLang()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.nav.skipToContent}
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileActions />
    </div>
  )
}
