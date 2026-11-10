import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {purgeAtomicCss} from './scripts/purge-css.mjs';

// assets/files.json lists every built file, so the service worker can precache chunks index.html does not name
// (Astryx loads parts such as the phone bottom sheet with import(), so they are split off and fetched when needed).
const precacheList = {
  name: 'precache-list',
  enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => f.startsWith('assets/'));
    this.emitFile({type: 'asset', fileName: 'assets/files.json', source: JSON.stringify(files)});
  },
};

// Source lives in src/; the build is written to the repo root, which GitHub Pages serves as is.
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react(), purgeAtomicCss(), precacheList],
  build: {outDir: '..', emptyOutDir: false, assetsDir: 'assets', chunkSizeWarningLimit: 1500},
});
