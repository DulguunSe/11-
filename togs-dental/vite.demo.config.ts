import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'node:path'

// Сервергүй, нэг HTML файлтай танилцуулга (утсан дээр шууд нээгдэнэ)
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: 'dist/demo',
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'demo.html') },
  },
})
