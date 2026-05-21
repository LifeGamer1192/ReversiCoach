import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base` must match the GitHub Pages sub-path for production builds
// (https://lifegamer1192.github.io/ReversiCoach/); dev keeps the root path.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ReversiCoach/' : '/',
  server: {
    // Open the browser automatically when the dev server starts.
    open: true,
  },
}))
