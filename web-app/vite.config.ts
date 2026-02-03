import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import tspCompiler from 'ts-patch/compiler'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    typescript({
      typescript: tspCompiler,
      compilerOptions: {
        outDir: 'dist',
      },
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to FastAPI during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@models': resolve(__dirname, 'src/models'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@guidr/shared': resolve(__dirname, '../shared/src/tokens'),
      '@guidr/shared/': resolve(__dirname, '../shared/src/')
    }
  }
})
