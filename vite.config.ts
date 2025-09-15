import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  // Base path for GitHub Pages deployment at https://dr-harper.github.io/jsonpaths
  base: '/jsonpaths/',
})
