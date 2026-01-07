import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import tspCompiler from 'ts-patch/compiler'

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
      '@components': '/src/components',
      '@services': '/src/services',
      '@models': '/src/models',
      '@styles': '/src/styles'
    }
  }
})
