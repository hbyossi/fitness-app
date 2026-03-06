import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'אפליקציית כושר',
        short_name: 'כושר',
        description: 'ניהול ומעקב אחר תוכניות אימון',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        dir: 'rtl',
        lang: 'he',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ]
});
