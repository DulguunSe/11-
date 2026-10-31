import { Home } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { ToothHeartIcon } from '../components/icons/DentalIcons'

export default function NotFoundPage() {
  const { t } = useLang()
  usePageMeta(t.meta.pages.notFound)
  return (
    <section className="py-24 sm:py-32">
      <Container className="text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-500">
          <ToothHeartIcon size={44} />
        </span>
        <p className="mt-6 font-display text-6xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{t.notFound.title}</h1>
        <p className="mt-3 text-muted">{t.notFound.text}</p>
        <ButtonLink to="/" className="mt-8">
          <Home size={18} />
          {t.notFound.home}
        </ButtonLink>
      </Container>
    </section>
  )
}
