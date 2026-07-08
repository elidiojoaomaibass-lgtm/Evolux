import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rlxToken = env.VITE_RLX_API_TOKEN || env.RLX_API_TOKEN || '';

  return {
    server: {
      watch: {
        ignored: ['**/_archive/**', '**/node_modules/**'],
      },
      proxy: {
        '/api/catbox': {
          target: 'https://catbox.moe',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/catbox/, '/user/api.php')
        },
        '/api/lowtrack-proxy': {
          target: 'https://lowtrack.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/lowtrack-proxy/, '/sales')
        },
        '/api/rlx-pay': {
          target: 'https://checkout.rlxl.ink',
          changeOrigin: true,
          rewrite: () => '/api.php',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (rlxToken) {
                proxyReq.setHeader('Authorization', `Bearer ${rlxToken}`);
              }
            });
          }
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-charts': ['recharts'],
            'vendor-motion': ['framer-motion'],
          }
        }
      }
    },
    plugins: [

      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'vite.svg'],
        manifest: {
          name: 'Evolux Prod',
          short_name: 'Evolux Prod',
          description: 'Plataforma de Pagamentos Evolux Prod',
          theme_color: '#0d0d17',
          background_color: '#0d0d17',
          display: 'standalone',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
  };
})
