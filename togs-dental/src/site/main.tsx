import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './demo.css'
import './extra.css'
import { Site } from './Site.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
)
