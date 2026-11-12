// Retires the service worker of the old Pro Metronome at /metronome/. The app now lives at
// /linear-grooves-app/metronome/ and keeps the same "pro-metronome-" cache prefix on this origin,
// so only the caches this old copy made (v26 and earlier) are deleted: the new app's cache is left alone.
// Phones that still have the old app fetch this file on their next visit: it cleans up, unregisters itself
// and reloads the open pages, which then land on the page that points to the new address.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter((k) => { const m = /^pro-metronome-v(\d+)$/.exec(k); return m && Number(m[1]) <= 26; });
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const pages = await self.clients.matchAll({ type: 'window' });
    pages.forEach((c) => c.navigate(c.url));
  })());
});
