// Acciones del super administrador sobre cuentas de psicólogos.
// Solo responde si quien llama está en la tabla public.admins.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json({ ok: false, error: 'no_session' }, 401);
    const { data: isAdmin } = await admin.from('admins').select('user_id').eq('user_id', who.user.id).maybeSingle();
    if (!isAdmin) return json({ ok: false, error: 'forbidden' }, 403);

    const body = await req.json();
    const userId = String(body.user_id || '');
    if (!/^[0-9a-f-]{36}$/.test(userId)) return json({ ok: false, error: 'user_id' }, 400);

    if (body.action === 'set_password') {
      const pw = String(body.password || '');
      if (pw.length < 8) return json({ ok: false, error: 'weak_password' }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password: pw });
      return error ? json({ ok: false, error: error.message }, 400) : json({ ok: true });
    }
    if (body.action === 'confirm_email') {
      const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
      return error ? json({ ok: false, error: error.message }, 400) : json({ ok: true });
    }
    return json({ ok: false, error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
