/* 离线缓存：首次打开后，断网也能用。更新页面的办法：把下面的 VER 数字加 1 */
const VER = '2';
const CACHE = 'jtaq-quiz-v' + VER;
const ASSETS = ['./', './index.html', './manifest.webmanifest',
                './icon-180.png', './icon-192.png', './icon-512.png'].map((u) => u + '?v=' + VER);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === location.origin; } catch (err) { sameOrigin = false; }
  if (!sameOrigin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }));
    })
  );
});
