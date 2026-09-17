import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ravdipeda-crypto.github.io/hi/ (a repo subpath),
  // so asset URLs must be rooted at /hi/ rather than /.
  base: '/hi/',
  plugins: [react()],
})
