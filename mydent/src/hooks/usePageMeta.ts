import { useEffect } from 'react'
import { useLang } from '../i18n/LanguageContext'

/** Хуудас бүрийн гарчиг, тайлбарыг тохируулна (SEO) */
export function usePageMeta(title: string, description?: string) {
  const { t } = useLang()
  useEffect(() => {
    document.title = `${title} | ${t.meta.siteName}`
    const desc = description ?? t.meta.description
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc)
  }, [title, description, t])
}
