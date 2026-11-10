// Lee un enlace de Google Maps (incluidos los cortos maps.app.goo.gl) y devuelve sus coordenadas.
// Solo para psicólogos con sesión iniciada (verify_jwt) y solo hacia dominios de Google Maps.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const ALLOWED = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

function coords(u: string) {
  const s = decodeURIComponent(u);
  const pick = (re: RegExp) => { const m = s.match(re); return m ? { lat: +m[1], lng: +m[2] } : null; };
  return pick(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) // punto exacto del lugar
    || pick(/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    || pick(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false }, 405);
  try {
    let url = String((await req.json()).url || '').trim();
    if (!ALLOWED.test(url)) return json({ ok: false, error: 'not_google_maps' }, 400);
    for (let i = 0; i < 6; i++) {
      const hit = coords(url);
      if (hit) return json({ ok: true, ...hit, url });
      const r = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 PsicoAgenda' }, signal: AbortSignal.timeout(8000) });
      const next = r.headers.get('location');
      if (!next) {
        // Algunas páginas traen la ubicación dentro del HTML.
        const html = r.status === 200 ? await r.text() : '';
        const m = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/) || html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        return m ? json({ ok: true, lat: +m[1], lng: +m[2], url }) : json({ ok: false, error: 'no_coords' }, 422);
      }
      url = new URL(next, url).href;
      if (!/^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl)\//i.test(url)) return json({ ok: false, error: 'redirect_outside' }, 400);
    }
    return json({ ok: false, error: 'too_many_redirects' }, 422);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
