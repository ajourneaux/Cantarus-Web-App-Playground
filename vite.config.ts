import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This line is the key for GitHub Pages
  base: '/Cantarus-Web-App-Playground/', 
})
