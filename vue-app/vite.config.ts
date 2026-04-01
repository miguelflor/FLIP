import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
  },
  // Produce assets relative to the index.html
  base: './',
  build: {
    outDir: 'dist',
  },
})
