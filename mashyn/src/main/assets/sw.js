/* =====================================================
   Service worker веб-версии (iPhone, Windows, браузер).
   Сначала сеть — обновления приходят сразу; без сети приложение
   открывается из сохранённой копии. Шрифты свои (fonts/) иконки марок (brands/) и 3D-иконки разделов (icons3d/) — тоже в копии.
   Запросы к Supabase и фото (другие адреса) не трогаем. В Android-приложении не используется.
   ===================================================== */
importScripts('brands.js');
const CACHE = 'alpha-drive-3.3';
// './', а не 'index.html': на сайте index.html отвечает переадресацией на ./
const SHELL = ['./', 'supabase.js', 'i18n.js', 'i18n-tr.js', 'features.js', 'features-plus.js', 'dealers.js', 'brands.js', 'staff.js', 'helper.js', 'pwa.js', 'refresh.js',
  'manifest.webmanifest', 'kuzov/lines.webp', 'app-192.png', 'app-512.png', 'logo.png', 'banner.webp', 'banner-sm.webp', 'dealers-banner.webp', 'dealers-banner-sm.webp', 'tech-banner.webp', 'tech-banner-sm.webp', 'cars-banner.webp', 'cars-banner-sm.webp', 'import-banner.webp', 'import-banner-sm.webp', 'moto-banner.webp', 'moto-banner-sm.webp',
  ...['parts', 'rent', 'sto', 'jobs'].flatMap(k => [`${k}-banner.webp`, `${k}-banner-sm.webp`]),
  ...['word-dark', 'word-light', 'full-dark', 'full-light', 'mark'].map(v => `logo/${v}.webp`),
  ...['onest', 'unbounded'].flatMap(f => ['latin', 'latin-ext', 'cyrillic'].map(s => `fonts/${f}-${s}.woff2`)),
  ...[...new Set(Object.values(BRAND_LOGO))].map(b => `brands/${b}.webp`),
  ...['avto', 'moto', 'abroad', 'tech', 'drivers', 'parts', 'rent', 'sto', 'all', 'dealers', 'assistant', 'price'].map(i => `icons3d/${i}.webp`)];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Уведомление от функции push: {title, body, tag, open}. Открытое приложение заодно подтягивает свежие данные
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'AlphaCars TM', {body: d.body || '', icon: 'app-192.png', badge: 'app-192.png', tag: d.tag, data: {open: d.open || 'notifs'}}),
    self.clients.matchAll({type: 'window'}).then(list => list.forEach(c => c.postMessage({refresh: 1})))
  ]));
});

// Нажали на уведомление: открытое окно — на передний план и на нужный экран, иначе открыть приложение
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const open = (e.notification.data && e.notification.data.open) || 'notifs';
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    const w = list.find(c => c.url.startsWith(self.registration.scope));
    if (w){ w.postMessage({open}); return w.focus(); }
    return self.clients.openWindow('./#' + open.replace('|', '%7C'));
  }));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, {ignoreSearch: true})
    .then(m => m || (r.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
