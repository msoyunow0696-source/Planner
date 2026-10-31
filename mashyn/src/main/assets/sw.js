/* =====================================================
   Service worker веб-версии (iPhone, Windows, браузер).
   Сначала сеть — обновления приходят сразу; без сети приложение
   открывается из сохранённой копии. Запросы к Supabase, фото и шрифты
   (другие адреса) не трогаем. В Android-приложении не используется.
   ===================================================== */
const CACHE = 'alpha-drive-1.4';
// './', а не 'index.html': на сайте index.html отвечает переадресацией на ./
const SHELL = ['./', 'supabase.js', 'i18n.js', 'features.js', 'features-plus.js', 'pwa.js', 'refresh.js',
  'manifest.webmanifest', 'app-192.png', 'app-512.png', 'logo.png'];

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
    self.registration.showNotification(d.title || 'Alpha Drive', {body: d.body || '', icon: 'app-192.png', badge: 'app-192.png', tag: d.tag, data: {open: d.open || 'notifs'}}),
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
