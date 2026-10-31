import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { PageHero } from '../components/sections/PageHero'
import { Container } from '../components/ui/Container'
import { ContactDetails, MapEmbed } from '../components/sections/Contact'
import { ContactForm } from '../components/sections/ContactForm'

export default function ContactPage() {
  const { t } = useLang()
  const c = t.contact
  usePageMeta(t.meta.pages.contact)
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.pageTitle} text={c.pageText} />
      <section className="pb-20 sm:pb-24">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/[0.06] sm:p-8">
            <ContactDetails />
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(27,80,32,0.45)] ring-1 ring-ink/[0.06] sm:p-8">
            <h2 className="font-display text-2xl font-bold text-ink">{c.form.title}</h2>
            <p className="mt-1 mb-6 text-muted">{c.form.text}</p>
            <ContactForm />
          </div>
          <MapEmbed className="h-[380px] lg:col-span-2 lg:h-[440px]" />
        </Container>
      </section>
    </>
  )
}
