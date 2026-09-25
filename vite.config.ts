import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/kunj-skin/',
  plugins: [react()],
  build: {
    sourcemap: false,
  },
})