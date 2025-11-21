import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  // Frontend entry point - Vite automatically uses public/index.html
  // which loads /src/main.jsx as the React entry point
  root: '.', // Root directory for the frontend project
  
  plugins: [react()],
  
  server: {
    port: 3000,
    host: '0.0.0.0', // Listen on all network interfaces
    strictPort: true, // Fail if port 3000 is not available
    open: false, // Don't auto-open browser
    proxy: {
      '/api': {
        target:'http://localhost:3001',//https://artisyscorporation.sharepoint.com/:v:/r/sites/synapseai/Shared%20Documents/DevOps/ComplyForm/Demos%20and%20Prototypes/ComplianceOpportunitiesSection.mp4?csf=1&web=1&e=uzclm7
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  },
  
  // Ensure SPA routing works - serve index.html for all routes
  appType: 'spa',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
