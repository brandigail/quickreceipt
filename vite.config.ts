import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Prompt mode: a new version waits until the user taps "Reload" in the update banner.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'QuickReceipt: Receipt Scanner',
        short_name: 'QuickReceipt',
        description: 'Scan receipts on your device, sort them into tax categories and export a monthly CSV and ZIP. Works offline.',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The OCR engine is about 6 MB, so it is cached the first time it is used (or when the user asks to prepare
        // offline scanning) instead of being downloaded on every install. Sample receipts are only used once, at first launch.
        globIgnores: ['tesseract/**', 'samples/**'],
        navigateFallback: '/index.html',
        // Take control on the very first visit, so the scanner files fetched by the first scan go through the cache.
        // Updates still wait for the user to tap Reload (no skipWaiting).
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/tesseract/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ocr-assets', cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 12 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
