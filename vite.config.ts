import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Open the browser automatically when the dev server starts.
    open: true,
  },
})
