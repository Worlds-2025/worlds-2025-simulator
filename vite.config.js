import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/worlds-2025-simulator/', // 替换为你的仓库名
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
