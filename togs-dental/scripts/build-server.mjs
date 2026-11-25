// Сервер талын TypeScript-ийг dist/server руу хөрвүүлнэ (npm хамааралууд гадна үлдэнэ)
import { build } from 'esbuild'

await build({
  entryPoints: ['server/index.ts', 'server/backup.ts', 'server/create-admin.ts'],
  outdir: 'dist/server',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
})
