import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  define: {
    'import.meta.env.VITE_BASE44_APP_ID': JSON.stringify('69ba95c18661f95ce8612deb'),
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true
    }),
    react(),
  ]
});
