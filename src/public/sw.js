// Pro Metronome service worker: app shell and the built JS/CSS cached on install, fonts cached on first use.
const VERSION = 'pro-metronome-v19';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon-180.png'];

self.addEventListener('install', e => {
  // the build gives JS/CSS hashed names, so read them from the fresh index.html and cache them too
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})));
    const html = await (await c.match('./index.html')).text();
    const built = [...new Set(html.match(/\.\/assets\/[^"']+/g) || [])];
    await c.addAll(built);
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
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
