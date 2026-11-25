import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { db, one, run } from '../db.ts'
import { env } from '../lib/env.ts'
import { today } from '../lib/time.ts'
import { cleanupSessions } from '../auth.ts'
import { autopilotTick, publishDue } from './posts.ts'
import { runRecalls, runReminders } from './sms.ts'

/** SQLite өгөгдлийн сангийн хуулбар (сүүлийн 14 хоногийг хадгална) */
export function backupDb() {
  mkdirSync(env.backupsDir, { recursive: true })
  const file = resolve(env.backupsDir, `togs-${today()}.db`)
  if (existsSync(file)) unlinkSync(file)
  db.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`)
  const old = readdirSync(env.backupsDir)
    .filter((f) => /^togs-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .slice(0, -14)
  for (const f of old) unlinkSync(resolve(env.backupsDir, f))
  return file
}

/** Ажил сүүлд хэзээ ажилласныг шалгана */
function due(name: string, everyMs: number) {
  const row = one<{ last_run: string }>('SELECT last_run FROM jobs WHERE name = ?', name)
  if (row && Date.now() - Number(row.last_run) < everyMs) return false
  run('INSERT INTO jobs (name, last_run) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET last_run = excluded.last_run', name, String(Date.now()))
  return true
}
function dueDaily(name: string, afterHour: number) {
  if (new Date().getHours() < afterHour) return false
  const row = one<{ last_run: string }>('SELECT last_run FROM jobs WHERE name = ?', name)
  if (row?.last_run === today()) return false
  run('INSERT INTO jobs (name, last_run) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET last_run = excluded.last_run', name, today())
  return true
}

const log = (msg: string) => console.log(`[scheduler] ${new Date().toISOString()} ${msg}`)

let running = false
export async function tick() {
  if (running) return
  running = true
  const step = async (name: string, fn: () => Promise<unknown> | unknown) => {
    try {
      const r = await fn()
      if (typeof r === 'number' && r > 0) log(`${name}: ${r}`)
    } catch (e) {
      log(`${name} алдаа: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  try {
    await step('нийтлэсэн пост', publishDue)
    if (due('reminders', 10 * 60_000)) await step('сануулга SMS', () => runReminders())
    if (dueDaily('recalls', 11)) await step('давтан үзлэгийн SMS', runRecalls)
    if (due('autopilot', 3 * 60 * 60_000)) await step('AI пост бэлтгэсэн', autopilotTick)
    if (dueDaily('backup', 3)) await step('нөөц хуулбар', () => (backupDb(), 0))
    if (dueDaily('sessions', 4)) await step('сесс цэвэрлэгээ', () => (cleanupSessions(), 0))
  } finally {
    running = false
  }
}

export function startScheduler() {
  setTimeout(() => void tick(), 5_000)
  setInterval(() => void tick(), 60_000)
  log('эхэллээ')
}
