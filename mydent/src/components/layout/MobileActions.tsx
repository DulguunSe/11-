import { Phone } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { clinic } from '../../config/clinic'
import { useLang } from '../../i18n/LanguageContext'
import { MessengerIcon } from '../icons/DentalIcons'

/** Гар утсанд зориулсан хөвөгч "Залгах", "Messenger" товчнууд */
export function MobileActions() {
  const { t } = useLang()
  const { pathname } = useLocation()
  if (pathname.startsWith('/book')) return null

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-3 md:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <a
        href={clinic.messenger}
        target="_blank"
        rel="noreferrer"
        aria-label={t.common.writeMessenger}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white shadow-lg shadow-blue-900/25 ring-4 ring-white transition active:scale-95"
      >
        <MessengerIcon size={26} />
      </a>
      <a
        href={clinic.phones[0].href}
        aria-label={`${t.common.call} ${clinic.phones[0].display}`}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/30 ring-4 ring-white transition active:scale-95"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40 motion-reduce:hidden" aria-hidden />
        <Phone size={24} className="relative" />
      </a>
    </div>
  )
}
