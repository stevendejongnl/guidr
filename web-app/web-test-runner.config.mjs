import { playwrightLauncher } from '@web/test-runner-playwright'
import { esbuildPlugin } from '@web/dev-server-esbuild'
import { fromRollup } from '@web/dev-server-rollup'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sharedSrc = resolve(__dirname, '../shared/src')

const pathAliasPlugin = {
  name: 'resolve-path-aliases',
  setup(build) {
    const aliases = {
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@models': resolve(__dirname, 'src/models'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@guidr/shared': sharedSrc,
    }

    build.onResolve(
      { filter: /^(@components|@services|@models|@styles|@guidr\/shared)/ },
      (args) => {
        for (const [prefix, dir] of Object.entries(aliases)) {
          if (args.path === prefix || args.path.startsWith(prefix + '/')) {
            const relative = args.path.slice(prefix.length)
            return { path: resolve(dir, '.' + relative) }
          }
        }
      }
    )
  },
}

export default {
  files: 'src/**/*.test.ts',
  browsers: [playwrightLauncher({ product: 'chromium' })],
  plugins: [
    fromRollup(nodeResolvePlugin)({
      browser: true,
      exportConditions: ['browser', 'module', 'import', 'default'],
      extensions: ['.ts', '.js', '.mjs'],
    }),
    esbuildPlugin({
      ts: true,
      target: 'es2022',
      tsconfig: './tsconfig.json',
      plugins: [pathAliasPlugin],
    }),
  ],
  coverage: true,
  coverageConfig: {
    reportDir: 'coverage',
    reporters: ['lcov', 'text'],
    threshold: {
      statements: 95,
      branches: 84,
      functions: 95,
      lines: 95,
    },
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/main.ts'],
  },
  browserStartTimeout: 30000,
  testsStartTimeout: 10000,
  testsFinishTimeout: 60000,
}
