import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Custom plugin to mock the Vercel /api/upload serverless function locally during development
const apiUploadMock = () => {
  return {
    name: 'api-upload-mock',
    configureServer(server: any) {
      server.middlewares.use('/api/upload', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const { image } = parsed;
            
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1] || 'jpg';
            
            const buffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([buffer], { type: mimeType });
            
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', blob, `file.${extension}`);
            
            const response = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) throw new Error('Catbox API error');
            const url = await response.text();
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, url: url.trim() }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    apiUploadMock(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'vite.svg'],
      manifest: {
        name: 'Evolux Pay',
        short_name: 'Evolux',
        description: 'Plataforma de Pagamentos Evolux',
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
})
