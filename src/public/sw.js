// Pro Metronome service worker: app shell and the built JS/CSS cached on install, fonts cached on first use.
const VERSION = 'pro-metronome-v26';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon-180.png'];

self.addEventListener('install', e => {
  // the build gives JS/CSS hashed names (and splits off chunks loaded only when needed); assets/files.json lists them all
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})));
    const files = await (await fetch('./assets/files.json', {cache: 'reload'})).json();
    await c.addAll(files);
  }).then(() => self.skipWaiting()));
});
// The drum apps share this origin and keep their own caches: only clean up ours.
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pro-metronome-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page: network first so updates arrive, cache when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Same-origin assets and Google Fonts: cache first
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
