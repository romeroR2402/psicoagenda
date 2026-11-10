// Ubica automáticamente en el mapa los consultorios que tienen dirección pero no coordenadas.
// La llama la base de datos (trigger en locations) con la clave compartida x-notify-secret.
// Usa el servicio gratuito de OpenStreetMap (Nominatim), máximo una consulta por segundo.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
const UA = 'MiConsulta/1.0 (https://romeror2402.github.io/psicoagenda/)';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nominatim(q: string) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=mx&accept-language=es&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://romeror2402.github.io/psicoagenda/' }, signal: AbortSignal.timeout(8000) });
  console.log('nominatim', r.status, q);
  if (!r.ok) return null;
  const j = await r.json();
  return j.length ? { lat: +j[0].lat, lng: +j[0].lon } : null;
}

// Respaldo: Photon (también basado en OpenStreetMap), limitado a la zona de México.
async function photon(q: string) {
  const url = 'https://photon.komoot.io/api/?limit=1&bbox=-118.6,14.3,-86.5,32.8&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
  console.log('photon', r.status, q);
  if (!r.ok) return null;
  const j = await r.json();
  const f = j.features && j.features[0];
  return f ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null;
}

async function search(q: string) {
  try { const hit = await nominatim(q); if (hit) return hit; } catch (e) { console.log('nominatim error', String(e)); }
  try { return await photon(q); } catch (e) { console.log('photon error', String(e)); return null; }
}

// Prueba de la búsqueda más precisa a la más general.
async function locate(l: any) {
  // "México" o "Mexico" como ciudad es el país: no ayuda a ubicar y confunde la búsqueda.
  const plain = (t: string) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const city = ['mexico', 'mx', 'republica mexicana'].includes(plain(l.city)) ? null : l.city;
  const tries = [
    [l.address, l.name, city],
    [l.address, city],
    [l.address, l.name],
    [l.name, city],
    [l.address],
    [city],
  ].map((parts) => parts.filter(Boolean).join(', ')).filter((q, i, a) => q && a.indexOf(q) === i);
  for (const q of tries) {
    const hit = await search(q + ', México');
    if (hit) return hit;
    await wait(1100);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const { data: ok } = await db.rpc('notify_secret_ok', { p: req.headers.get('x-notify-secret') || '' });
  if (!ok) return json({ ok: false, error: 'forbidden' }, 403);
  try {
    const body = await req.json();
    let q = db.from('locations').select('*').eq('kind', 'presencial').is('lat', null);
    if (body.location_id) q = q.eq('id', String(body.location_id));
    const { data: locs } = await q.limit(25);
    const out: unknown[] = [];
    for (const l of locs || []) {
      const hit = await locate(l);
      if (hit) await db.from('locations').update({ lat: hit.lat, lng: hit.lng }).eq('id', l.id).is('lat', null);
      out.push({ id: l.id, found: !!hit });
      await wait(1100);
    }
    return json({ ok: true, results: out });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
