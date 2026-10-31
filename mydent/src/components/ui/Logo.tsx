import { Link } from 'react-router-dom'
import { ToothHeartIcon } from '../icons/DentalIcons'

/**
 * Логоны түр хувилбар (шүд + зүрх тэмдэг, MyDent бичиг).
 * Албан ёсны логоны файл байвал public/images/logo.png болгон хуулж, доорх
 * OFFICIAL_LOGO-г '/images/logo.png' болгоно уу.
 * Temporary logo. To use the official logo file, put it in public/images and set OFFICIAL_LOGO.
 */
const OFFICIAL_LOGO: string | null = null

export function Logo({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="My Dent — нүүр хуудас">
      {OFFICIAL_LOGO ? (
        <img src={OFFICIAL_LOGO} alt="My Dent" className="h-10 w-auto" />
      ) : (
        <>
          <span
            className={`grid h-10 w-10 place-items-center rounded-2xl transition-transform group-hover:-rotate-6 ${
              light ? 'bg-white/10 text-brand-300' : 'bg-brand-50 text-brand-500'
            }`}
          >
            <ToothHeartIcon size={28} />
          </span>
          <span className="flex flex-col leading-none">
            <span className={`font-display text-[22px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
              My<span className={light ? 'text-brand-300' : 'text-brand-500'}>Dent</span>
            </span>
            <span className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] ${light ? 'text-brand-200' : 'text-muted'}`}>
              Professional Dental Clinic
            </span>
          </span>
        </>
      )}
    </Link>
  )
}
