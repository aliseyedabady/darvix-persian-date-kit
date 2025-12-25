import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        'react-hook-form': path.resolve(__dirname, 'src/react-hook-form.tsx'),
      },
      name: 'DarvixPersianDateKit',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const base = entryName === 'index' ? 'index' : entryName
        return `${base}.${format === 'es' ? 'mjs' : 'cjs'}`
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-hook-form'],
      output: {
        // Prevent unnecessary code splitting
        // Chunks will only be created if code can't be inlined
        manualChunks: undefined,
      },
    },
    // Ensure we don't minify in a way that creates extra chunks
    minify: 'esbuild',
  },
})
