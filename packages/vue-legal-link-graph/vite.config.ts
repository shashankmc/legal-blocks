import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueLegalLinkGraph',
      fileName: (format: string) =>
        format === 'es' ? 'vue-legal-link-graph.js' : 'vue-legal-link-graph.umd.cjs',
    },
    rollupOptions: {
      // Vue is the host's; the component is mounted into the platform's app.
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
