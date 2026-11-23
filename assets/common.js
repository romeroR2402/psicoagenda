// MiConsulta · utilidades compartidas por todas las páginas
window.PA = (() => {
  const cfg = window.PSICO_CONFIG || {};
  const sb = window.supabase && cfg.url ? window.supabase.createClient(cfg.url, cfg.key) : null;
  const TZ = 'America/Mexico_City';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COLORS = ['#e8743b', '#5162e0', '#1f9a70', '#c74f8e', '#b88a12', '#7a58ea'];
  const avc = n => COLORS[[...String(n || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const ini = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const av = (n, cls = '', photo = null) => photo
    ? `<img class="av ${cls}" src="${esc(photo)}" alt="" loading="lazy">`
    : `<span class="av ${cls}" style="--c:${avc(n)}" aria-hidden="true">${esc(ini(n))}</span>`;
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slugify = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

  const fmtDay = (d, tz = TZ) => cap(new Date(d).toLocaleDateString('es-MX', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }));
  const fmtShort = (d, tz = TZ) => new Date(d).toLocaleDateString('es-MX', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (d, tz = TZ) => new Date(d).toLocaleTimeString('es-MX', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
  const fmtDT = (d, tz = TZ) => `${fmtShort(d, tz)} · ${fmtTime(d, tz)}`;
  const dayKey = (d, tz = TZ) => new Date(d).toLocaleDateString('en-CA', { timeZone: tz });
  const todayKey = (tz = TZ) => dayKey(new Date(), tz);
  const money = n => n == null ? 'Precio a consultar' : '$' + Number(n).toLocaleString('es-MX') + ' MXN';
  // Precios del especialista: presencial (price), en línea (price_online, opcional) u oculto con leyenda (price_hidden + price_note)
  const priceNote = p => (p && p.price_note) || 'Precio a consultar con el especialista';
  const priceOf = (p, mode) => !p || p.price_hidden ? null : mode === 'en_linea' && p.price_online != null ? p.price_online : (p.price ?? p.price_online ?? null);
  const priceText = (p, mode) => p && p.price_hidden ? priceNote(p) : money(priceOf(p, mode));
  const priceLabel = p => {
    if (!p) return money(null);
    if (p.price_hidden) return priceNote(p);
    if (p.price != null && p.price_online != null && p.price !== p.price_online) return `Presencial ${money(p.price)} · En línea ${money(p.price_online)}`;
    return money(p.price ?? p.price_online);
  };
  const priceShort = p => p && !p.price_hidden && (p.price ?? p.price_online) != null ? '$' + Number(p.price ?? p.price_online).toLocaleString('es-MX') : 'Consultar';

  const STATUS = {
    unpaid: ['Pago pendiente', 'p-warn'], review: ['Pago por revisar', 'p-calm'], confirmed: ['Confirmada', 'p-ok'],
    rejected: ['No aprobada', 'p-bad'], cancelled: ['Cancelada', 'p-bad'],
  };
  const pill = st => `<span class="pill ${STATUS[st][1]}">${STATUS[st][0]}</span>`;
  const MODE = { presencial: 'Presencial', en_linea: 'En línea' };
  const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const IC = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    form: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    week: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 13h2M14 13h2M8 17h2"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 5.8 5.8L15 13l4.5 1.5V18a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    pay: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>',
    star: '<path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.1 6-.7z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  const ic = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  let tt;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3400);
  }

  // Modal sencillo: openModal(html) / closeModal(). Conserva el scroll si se redibuja el mismo modal.
  function openModal(html, wide = false) {
    let w = document.getElementById('modal');
    const prev = w && w.querySelector('.modal'), top = prev ? prev.scrollTop : 0;
    if (!w) { w = document.createElement('div'); w.id = 'modal'; w.className = 'modal-wrap'; document.body.appendChild(w); }
    w.innerHTML = `<button class="scrim" data-close aria-label="Cerrar"></button><div class="modal ${wide === true ? 'wide' : wide || ''}" role="dialog" aria-modal="true"><button class="x" data-close aria-label="Cerrar">✕</button>${html}</div>`;
    w.hidden = false; w.querySelector('.modal').scrollTop = top;
  }
  function closeModal() { const w = document.getElementById('modal'); if (w) { w.hidden = true; w.innerHTML = ''; } }
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Menú de cuenta: la foto y el nombre abren un menú con acciones; "Cerrar sesión" va al final, separado.
  // En pantallas angostas se abre como hoja desde abajo.
  // opts: { name, email, photo, items: [{ text, icon, href?, target?, action? }], onLogout }
  function accountMenu(el, opts) {
    const chev = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const list = () => `<div class="acc-head">${av(opts.name, 'lg', opts.photo)}<div><b>${esc(opts.name)}</b><small>${esc(opts.email || '')}</small></div></div>
      <div class="acc-items">${opts.items.map((it, i) => it.href ? `<a class="acc-it" role="menuitem" href="${esc(it.href)}" ${it.target ? `target="${it.target}" rel="noopener"` : ''} data-acc-close>${ic(it.icon, 18)}<span>${esc(it.text)}</span></a>`
        : `<button class="acc-it" role="menuitem" data-acc-i="${i}">${ic(it.icon, 18)}<span>${esc(it.text)}</span></button>`).join('')}</div>
      <div class="acc-sep"></div><button class="acc-it out" role="menuitem" data-acc-out>${ic('out', 18)}<span>Cerrar sesión</span></button>`;
    el.innerHTML = `<div class="acc"><button class="acc-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Mi cuenta">${av(opts.name, 'sm', opts.photo)}<b>${esc(opts.name.split(' ')[0])}</b>${chev}</button><div class="acc-menu" role="menu" hidden></div></div>`;
    const btn = el.querySelector('.acc-btn'), menu = el.querySelector('.acc-menu');
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    const run = async t => {
      if (t.closest('[data-acc-out]')) { close(); closeModal(); return opts.onLogout(); }
      const i = t.closest('[data-acc-i]'); if (i) { close(); closeModal(); return opts.items[+i.dataset.accI].action(); }
      if (t.closest('[data-acc-close]')) { close(); closeModal(); }
    };
    btn.onclick = e => {
      e.stopPropagation();
      if (matchMedia('(max-width:700px)').matches) { openModal(`<div class="acc-sheet">${list()}</div>`); document.querySelector('.acc-sheet').onclick = e => run(e.target); return; }
      if (!menu.hidden) return close();
      menu.innerHTML = list(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      menu.querySelector('.acc-it')?.focus();
    };
    menu.onclick = e => run(e.target);
    menu.onkeydown = e => {
      const its = [...menu.querySelectorAll('.acc-it')], k = its.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); its[(k + 1) % its.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); its[(k - 1 + its.length) % its.length].focus(); }
      if (e.key === 'Escape') { close(); btn.focus(); }
    };
    if (!accountMenu.bound) { accountMenu.bound = true; document.addEventListener('click', e => { if (!e.target.closest('.acc')) document.querySelectorAll('.acc-menu').forEach(m => { m.hidden = true; m.previousElementSibling.setAttribute('aria-expanded', 'false'); }); }); }
  }

  // ---------- MiConsulta como app (se instala en el celular, como Los Ponpones) ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  let installEvt = null;
  const isApp = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  // Muestra una tarjeta "Instala la app" (una vez cerrada, no vuelve a salir en 30 días)
  function offerInstall(text) {
    const draw = () => {
      document.getElementById('inst')?.remove();
      if (isApp() || (!installEvt && !isIOS()) || +lsGet('mc_inst_no') > Date.now()) return;
      const d = document.createElement('div'); d.id = 'inst'; d.className = 'inst'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Instalar la app');
      d.innerHTML = `<img src="assets/favicon-192.png" alt="" width="40" height="40"><span><b>Instala MiConsulta</b><small>${esc(text || 'Ábrela desde tu pantalla de inicio, como una app.')}</small></span>
        <button class="btn pri sm" data-inst="go">Instalar</button><button class="inst-x" data-inst="no" aria-label="Ahora no">✕</button>`;
      document.body.appendChild(d);
    };
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; draw(); });
    window.addEventListener('appinstalled', () => { installEvt = null; draw(); toast('¡Listo! MiConsulta quedó en tu pantalla de inicio'); });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-inst]'); if (!b) return;
      if (b.dataset.inst === 'no') { lsSet('mc_inst_no', Date.now() + 30 * 864e5); return draw(); }
      if (installEvt) { const ev = installEvt; installEvt = null; ev.prompt(); ev.userChoice.finally(draw); return; }
      openModal(`<h3>Instalar en iPhone o iPad</h3><p class="sub">Así queda MiConsulta en tu pantalla de inicio, como una app.</p>
        <ol class="inst-steps"><li>En <b>Safari</b>, toca el botón <b>Compartir</b> (el cuadro con una flecha hacia arriba).</li><li>Elige <b>«Agregar a inicio»</b>.</li><li>Toca <b>Agregar</b>. ¡Listo!</li></ol>`);
    });
    setTimeout(draw, 1200);
  }

  // ---------- Página propia del especialista (perfil.html?sitio=slug) ----------
  // Se ve como la página del especialista: su nombre arriba y sin enlaces al buscador de MiConsulta.
  // Se conserva al pasar a la cita o a un taller (?sitio=slug, o lo recuerda la pestaña).
  function siteSlug(owner) {
    const q = new URLSearchParams(location.search).get('sitio');
    if (q) { try { sessionStorage.setItem('mc_sitio', q); } catch (e) {} return q; }
    let s = null; try { s = sessionStorage.getItem('mc_sitio'); } catch (e) {}
    return s && (!owner || owner === s) ? s : null;
  }
  const siteQS = slug => slug ? '&sitio=' + encodeURIComponent(slug) : '';
  function siteBrand(pro) {
    const home = 'perfil.html?sitio=' + encodeURIComponent(pro.slug);
    const b = document.querySelector('.topbar .brand');
    if (b) { b.href = home; b.classList.add('site-brand'); b.innerHTML = `${av(pro.name, 'sm', pro.photo)}<span><b>${esc(pro.name)}</b>${pro.title ? `<small>${esc(pro.title)}</small>` : ''}</span>`; }
    document.querySelectorAll('.topbar .top-links').forEach(n => n.remove());
    document.querySelector('link[rel="manifest"]')?.remove();
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', pro.name.split(' ')[0]);
    if (pro.photo) document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(l => { l.href = pro.photo; l.removeAttribute('type'); l.removeAttribute('sizes'); });
    document.body.classList.add('site-mode');
  }

  function copy(text, el) {
    const ok = () => toast('Copiado');
    const fallback = () => { if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast('Texto seleccionado: cópialo con Ctrl+C o manteniendo presionado'); };
    try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
  }

  function compress(file, max = 1600) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }

  // Google Maps: abre el lugar exacto (enlace del psicólogo o coordenadas) y la ruta para llegar.
  const placeText = l => [l.address, l.city, 'México'].filter(Boolean).join(', ');
  const gmaps = l => l.maps_url || `https://www.google.com/maps/search/?api=1&query=${l.lat != null ? l.lat + ',' + l.lng : encodeURIComponent(placeText(l))}`;
  const gdir = l => `https://www.google.com/maps/dir/?api=1&destination=${l.lat != null ? l.lat + ',' + l.lng : encodeURIComponent(placeText(l))}`;
  const MAPS_RE = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
  const waLink = (phone, text) => { const d = String(phone).replace(/\D/g, ''); return `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}`; };
  const pageUrl = p => new URL(p, location.href).href;

  return { sb, TZ, gmaps, gdir, MAPS_RE, esc, av, avc, ini, cap, norm, slugify, fmtDay, fmtShort, fmtTime, fmtDT, dayKey, todayKey, money, priceOf, priceText, priceLabel, priceNote, priceShort, STATUS, pill, MODE, DOW, ic, toast, openModal, closeModal, accountMenu, offerInstall, isApp, siteSlug, siteQS, siteBrand, copy, compress, waLink, pageUrl };
})();
