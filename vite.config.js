import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Source lives in src/; the build is written to the repo root, which GitHub Pages serves as is.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '..', emptyOutDir: false, assetsDir: 'assets', chunkSizeWarningLimit: 1500,
    // one JS file, so the service worker can precache everything it finds in index.html
    rollupOptions: {output: {inlineDynamicImports: true}},
  },
});
