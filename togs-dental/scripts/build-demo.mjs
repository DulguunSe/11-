// Танилцуулгын файлд /img/* зургуудыг шигтгэж, нэг HTML болгоно
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, renameSync } from 'node:fs'

execSync('npx vite build -c vite.demo.config.ts', { stdio: 'inherit' })
let html = readFileSync('dist/demo/demo.html', 'utf8')
const mime = { png: 'image/png', jpg: 'image/jpeg' }
for (const f of ['mark.png', 'sign.jpg', 'cover.jpg']) {
  const uri = `data:${mime[f.split('.').pop()]};base64,${readFileSync(`public/img/${f}`).toString('base64')}`
  html = html.replaceAll(`/img/${f}`, uri)
}
writeFileSync('dist/demo/demo.html', html)
renameSync('dist/demo/demo.html', 'dist/demo/togs-demo.html')
console.log(`dist/demo/togs-demo.html  ${(html.length / 1024).toFixed(0)} KB`)
