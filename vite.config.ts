import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: './'` makes the build work on GitHub Pages under any repo name
// (https://<user>.github.io/<repo>/) without extra configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
})
