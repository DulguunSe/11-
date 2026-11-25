// Хөгжүүлэлтийн горим: API сервер (node --watch) + Vite (http://localhost:5173)
import { spawn } from 'node:child_process'

const run = (cmd, args, env = {}) =>
  spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } }).on('exit', (code) => process.exit(code ?? 0))

run(process.execPath, ['--disable-warning=ExperimentalWarning', '--watch', 'server/index.ts'], { NODE_ENV: 'development' })
run('npx', ['vite'], {})
