import { defineConfig } from 'vite'
import unpluginTypia from '@ryoppippi/unplugin-typia/vite'

export default defineConfig({
  plugins: [
    unpluginTypia(),
  ],
  build: {
    lib: {
      entry: {
        'index': './src/index.ts',
        'tokens/index': './src/tokens/index.ts',
        'styles/react-native/index': './src/styles/react-native/index.ts',
        'styles/adapters/react-native/index': './src/styles/adapters/react-native/index.ts',
        'styles/definitions/index': './src/styles/definitions/index.ts',
        'api/definitions/index': './src/api/definitions/index.ts',
        'api/adapters/fetch/index': './src/api/adapters/fetch/index.ts',
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.mjs`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['react-native', 'typia'],
      output: {
        preserveModules: false,
      },
    },
  },
})
