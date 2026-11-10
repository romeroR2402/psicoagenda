// PsicoAgenda · utilidades compartidas por todas las páginas
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

  const waLink = (phone, text) => { const d = String(phone).replace(/\D/g, ''); return `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}`; };
  const pageUrl = p => new URL(p, location.href).href;

  return { sb, TZ, esc, av, avc, ini, cap, norm, slugify, fmtDay, fmtShort, fmtTime, fmtDT, dayKey, todayKey, money, STATUS, pill, MODE, DOW, ic, toast, openModal, closeModal, copy, compress, waLink, pageUrl };
})();
