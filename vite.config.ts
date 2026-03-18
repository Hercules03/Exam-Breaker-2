import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Exam-Breaker-2/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
