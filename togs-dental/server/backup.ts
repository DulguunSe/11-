// Гараар нөөц хуулбар авах: npm run backup
import './lib/tz.ts'
import { migrate } from './db.ts'
import { backupDb } from './services/scheduler.ts'

migrate()
console.log(`Нөөц хуулбар: ${backupDb()}`)
