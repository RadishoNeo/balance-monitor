import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.APP_NAME': JSON.stringify(packageJson.name)
    }
  }
})
