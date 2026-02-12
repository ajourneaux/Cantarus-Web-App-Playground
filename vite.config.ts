import { defineConfig } from 'vite'
import react from '@vitejs/react-swc'

export default defineConfig({
  base: '/Cantarus-Web-App-Playground/',
  plugins: [react()],
})
