import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@hanieldaniel/img-marker': resolve(__dirname, '../dist/index.js'),
    },
  },
})
