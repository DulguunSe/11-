import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { Hero } from '../components/sections/Hero'
import { Services } from '../components/sections/Services'
import { WhyUs } from '../components/sections/WhyUs'
import { Dentists } from '../components/sections/Dentists'
import { Results } from '../components/sections/Results'
import { Testimonials } from '../components/sections/Testimonials'
import { Tips } from '../components/sections/Tips'
import { Community } from '../components/sections/Community'
import { CTA } from '../components/sections/CTA'
import { Contact } from '../components/sections/Contact'

export default function HomePage() {
  const { t } = useLang()
  usePageMeta(t.meta.pages.home)
  return (
    <>
      <Hero />
      <Services />
      <WhyUs />
      <Dentists />
      <Results />
      <Testimonials />
      <Tips />
      <Community />
      <CTA />
      <Contact />
    </>
  )
}
