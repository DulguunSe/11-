import type { ReactNode } from 'react'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { SwirlLines } from '../ui/Swirl'

/** Дотоод хуудсуудын толгой хэсэг */
export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      <SwirlLines className="pointer-events-none absolute -top-10 -right-24 w-[420px] text-brand-500/10" />
      <Container className="relative pt-14 pb-12 sm:pt-20 sm:pb-16">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} text={text} />
        {children}
      </Container>
    </section>
  )
}
