import { fileURLToPath, URL } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: path.join(
            process.cwd(),
            'node_modules',
            'mediainfo.js',
            'dist',
            'MediaInfoModule.wasm'
          ),
          dest: '',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**', 'backend/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.spec.js',
        '**/*.test.js',
        'backend/**'
      ]
    }
  }
})
