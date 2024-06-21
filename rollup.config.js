import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import swc from '@rollup/plugin-swc'

const swcConfig = {
    minify: true,
    jsc: {
        target: "esnext"
    }
}

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/bundle.js',
        name: "schedulr",
        format: 'iife',
    },
    plugins: [
        resolve(),
        typescript({
          tsconfig: 'tsconfig.json',
        }),
        swc({
          swc: swcConfig
        })
    ]
}
