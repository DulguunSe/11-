/**
 * Танилцуулгын нэг файлтай хувилбар: вэбсайт + удирдлагын систем, сервергүйгээр утсан дээр нээгдэнэ.
 * Бүтээх: npm run build:demo  →  dist/demo/togs-demo.html
 */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { installMockApi } from './mock.ts'
import siteCss from '../site/demo.css?inline'
import extraCss from '../site/extra.css?inline'
import adminCss from '../admin/admin.css?inline'
import { Site } from '../site/Site.tsx'
import { App } from '../admin/App.tsx'

installMockApi()

type Mode = 'site' | 'admin'
const BAR = `
.demo-bar{position:relative;z-index:60;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;
  padding:8px 12px;background:#0c1a2c;color:#fff;font:500 13px/1.35 system-ui,-apple-system,sans-serif;text-align:center}
.demo-bar b{color:#f5c76a;font-weight:700}
.demo-bar .tabs{display:inline-flex;background:rgba(255,255,255,.1);border-radius:999px;padding:3px}
.demo-bar button{all:unset;cursor:pointer;padding:5px 12px;border-radius:999px;font-weight:600}
.demo-bar button[aria-pressed=true]{background:#fff;color:#0c1a2c}
.demo-bar small{flex-basis:100%;opacity:.75;font-size:12px}`

function Demo() {
  const [mode, setMode] = useState<Mode>(() => (location.hash === '#admin' ? 'admin' : 'site'))

  useEffect(() => {
    let el = document.getElementById('mode-css') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'mode-css'
      document.head.appendChild(el)
    }
    el.textContent = BAR + (mode === 'site' ? siteCss + extraCss : adminCss)
    document.title = mode === 'site' ? 'Төгс шүдний эмнэлэг — танилцуулга' : 'Төгс — удирдлагын систем (танилцуулга)'
    window.scrollTo(0, 0)
  }, [mode])

  // Вэбсайт ↔ систем хоорондын холбоосыг энэ файл дотор шилжүүлнэ
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a')
      const href = a?.getAttribute('href')
      if (href === '/admin' || href === '/') {
        e.preventDefault()
        setMode(href === '/admin' ? 'admin' : 'site')
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <>
      <div className="demo-bar" role="note">
        <span>
          <b>Танилцуулга</b> · жишээ өгөгдөл
        </span>
        <span className="tabs">
          <button type="button" aria-pressed={mode === 'site'} onClick={() => setMode('site')}>
            Вэбсайт
          </button>
          <button type="button" aria-pressed={mode === 'admin'} onClick={() => setMode('admin')}>
            Эмнэлгийн систем
          </button>
        </span>
        {mode === 'admin' && <small>Нэвтрэх: admin / demo12345 · эмч: emch1 · ресепшн: reception (нууц үг ижил)</small>}
      </div>
      {mode === 'site' ? (
        <Site key="site" />
      ) : (
        <MemoryRouter key="admin">
          <App />
        </MemoryRouter>
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
