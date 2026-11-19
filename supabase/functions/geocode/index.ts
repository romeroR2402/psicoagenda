// Ubica automáticamente en el mapa los consultorios que tienen dirección pero no coordenadas,
// y obtiene su estado y alcaldía o municipio (para buscar por zona) a partir de las coordenadas.
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

// Estado y alcaldía/municipio de un punto (búsqueda inversa en OpenStreetMap)
const plainName = (t: string) => String(t || '').replace(/^(Alcaldía|Municipio( de)?|Delegación)\s+/i, '').trim();
async function zone(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=es&lat=${lat}&lon=${lng}`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://romeror2402.github.io/psicoagenda/' }, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const a = (await r.json()).address || {};
      const district = a.borough || a.city_district || a.municipality || a.county || a.city || a.town || a.village || null;
      if (a.state || district) return { state: a.state || null, district: district ? plainName(district) : null };
    }
  } catch (e) { console.log('reverse error', String(e)); }
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=default`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const p = ((await r.json()).features || [])[0]?.properties || {};
      const district = p.district || p.county || p.city || null;
      if (p.state || district) return { state: p.state || null, district: district ? plainName(district) : null };
    }
  } catch (e) { console.log('photon reverse error', String(e)); }
  return null;
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
    // zone: recalcular solo estado y alcaldía; backfill: todos los que tienen coordenadas pero no zona
    let q = db.from('locations').select('*').eq('kind', 'presencial');
    if (body.location_id) q = q.eq('id', String(body.location_id));
    else if (body.backfill) q = q.not('lat', 'is', null).is('district', null);
    else q = q.is('lat', null);
    const { data: locs } = await q.limit(25);
    const out: unknown[] = [];
    for (const l of locs || []) {
      let pos = l.lat != null ? { lat: l.lat, lng: l.lng } : null, found = !!pos;
      if (!pos) { pos = await locate(l); found = !!pos; await wait(1100); }
      const z = pos ? await zone(pos.lat, pos.lng) : null;
      const upd: Record<string, unknown> = {};
      if (pos && l.lat == null) { upd.lat = pos.lat; upd.lng = pos.lng; }
      if (z) { upd.state = z.state; upd.district = z.district; }
      if (Object.keys(upd).length) await db.from('locations').update(upd).eq('id', l.id);
      out.push({ id: l.id, found, zone: z });
      await wait(1100);
    }
    return json({ ok: true, results: out });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
