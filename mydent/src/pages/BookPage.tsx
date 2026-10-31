import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { BookingWizard } from '../components/booking/BookingWizard'

export default function BookPage() {
  const { t } = useLang()
  usePageMeta(t.meta.pages.book)
  return (
    <section className="bg-gradient-to-b from-brand-50 via-brand-50/30 to-white pt-10 pb-20 sm:pt-14 sm:pb-24">
      <Container>
        <SectionHeading as="h1" eyebrow={t.booking.eyebrow} title={t.booking.title} text={t.booking.text} />
        <div className="mt-10">
          <BookingWizard />
        </div>
      </Container>
    </section>
  )
}
