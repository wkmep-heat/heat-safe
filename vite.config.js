import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['222.png'],
      manifest: {
        name: 'ระบบติดตามสภาพแวดล้อม จังหวัดขอนแก่น',
        short_name: 'Heat Safe KhonKaen',
        description: 'ติดตามสภาพอากาศ ฝุ่น PM2.5 และแผนที่ความร้อน อำเภอเมืองขอนแก่น แบบ Real-time',
        lang: 'th',
        theme_color: '#f8faff',
        background_color: '#f8faff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '222.png', sizes: '192x192', type: 'image/png' },
          { src: '222.png', sizes: '512x512', type: 'image/png' },
          { src: '222.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
  server: {
    proxy: {
      '/tmd-api': {
        target: 'http://www.aws-observation.tmd.go.th',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tmd-api/, ''),
      },
      '/tmd-weather': {
        target: 'https://data.tmd.go.th',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.path = '/api/Weather3Hours/v2/?uid=api&ukey=api12345';
          });
        },
      },
    },
  },
})
