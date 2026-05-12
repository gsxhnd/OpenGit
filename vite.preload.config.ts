import { defineConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'module'

export default defineConfig({
  build: {
    outDir: 'dist/preload',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/preload/index.ts'),
      },
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
      },
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
})
