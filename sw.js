// MiConsulta como app: guarda las páginas en el celular para abrirlas rápido y aunque falle la conexión.
// Siempre intenta primero la red (para tener la última versión); si no hay conexión, usa la copia guardada.
// Supabase, mapas y fuentes pasan directo (no se guardan).
const C = 'miconsulta-v10', BASE = new URL('./', self.location).href;
const FILES = ['./', 'index.html', 'especialistas.html', 'perfil.html', 'cita.html', 'evento.html', 'eventos.html', 'responder.html', 'aviso-privacidad.html', 'panel.html', 'admin.html',
  'assets/app.css', 'assets/home.css', 'assets/common.js', 'config.js', 'site.webmanifest', 'assets/favicon.svg', 'assets/favicon-32.png', 'assets/favicon-192.png', 'assets/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('miconsulta-') && k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const href = r.url.split('#')[0].split('?')[0];
  if (!href.startsWith(BASE)) return;
  const rel = href.slice(BASE.length) || './';
  if (!FILES.includes(rel) && !rel.startsWith('assets/')) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(href, cp)); }
    return res;
  }).catch(() => caches.match(href).then(m => m || (r.mode === 'navigate' ? caches.match(BASE + 'index.html') : Response.error()))));
});

// Al tocar una notificación de cita, abre (o enfoca) el panel en Citas
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || BASE + 'panel.html#citas';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.includes('panel.html'));
    if (w) { w.navigate(url).catch(() => {}); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
