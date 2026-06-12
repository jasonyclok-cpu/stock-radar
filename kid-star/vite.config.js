import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 部署到子路徑(例如 GitHub Pages 嘅 /stock-radar/)時,
// 用環境變數 BASE_PATH 指定;本地開發同 Vercel 預設用 '/'
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: '星星學園',
        short_name: '星星學園',
        description: '小二中英數遊戲化學習',
        lang: 'zh-HK',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        background_color: '#bae6fd',
        theme_color: '#38bdf8',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      },
    }),
  ],
})
