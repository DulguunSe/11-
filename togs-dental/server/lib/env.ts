import './tz.ts'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const dataDir = resolve(process.env.DATA_DIR ?? 'data')
mkdirSync(dataDir, { recursive: true })

// Render.com зэрэг хостинг RENDER_EXTERNAL_URL-ийг автоматаар өгнө
const publicUrl = (process.env.PUBLIC_URL ?? process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/+$/, '')

export const env = {
  port: Number(process.env.PORT ?? 3000),
  dataDir,
  dbPath: process.env.DB_PATH ?? resolve(dataDir, 'togs.db'),
  uploadsDir: resolve(dataDir, 'uploads'),
  backupsDir: resolve(dataDir, 'backups'),
  /** Сайтын бүтэн хаяг: пост дахь холбоос, Instagram-д зураг өгөхөд хэрэгтэй */
  publicUrl,
  secureCookies: publicUrl.startsWith('https://'),
  isProd: process.env.NODE_ENV === 'production',
  /** Тест хийхэд Graph API-г орлуулах боломж */
  graphApiBase: (process.env.GRAPH_API_BASE ?? 'https://graph.facebook.com').replace(/\/+$/, ''),
  claudeModel: process.env.CLAUDE_MODEL ?? 'claude-opus-5-5',
  schedulerEnabled: process.env.SCHEDULER !== 'off',
  seedDemo: process.env.SEED_DEMO === '1',
}

/** Claude API түлхүүр тохируулсан эсэх (ANTHROPIC_API_KEY орчны хувьсагч) */
export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
