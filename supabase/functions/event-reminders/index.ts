// Recordatorios de conferencias: un día antes y una hora antes.
// - Al especialista: WhatsApp con CallMeBot (si lo activó) y correo (si hay servicio de correo).
// - A los asistentes confirmados con correo: correo un día antes.
// Además: WhatsApp al especialista unos minutos antes de cada sesión confirmada.
// La llama la base de datos cada 5 minutos con la clave compartida x-notify-secret.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SITE = (Deno.env.get('SITE_URL') || 'https://romeror2402.github.io/psicoagenda/').replace(/\/?$/, '/');
const FROM = Deno.env.get('EMAIL_FROM') || '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function when(iso: string, tz: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('es-MX', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });
  return `${day[0].toUpperCase()}${day.slice(1)} a las ${d.toLocaleTimeString('es-MX', { timeZone: tz, hour: 'numeric', minute: '2-digit' })}`;
}

async function whatsapp(phone: string, key: string, text: string) {
  const d = phone.replace(/\D/g, ''), num = d.length === 10 ? '52' + d : d;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${num}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  return r.ok;
}

async function email(to: string, subject: string, html: string) {
  const brevo = Deno.env.get('BREVO_API_KEY'), resend = Deno.env.get('RESEND_API_KEY');
  if (!FROM || (!brevo && !resend)) return false;
  const r = brevo
    ? await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': brevo, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: { email: FROM, name: 'MiConsulta' }, to: [{ email: to }], subject, htmlContent: html }) })
    : await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `MiConsulta <${FROM}>`, to: [to], subject, html }) });
  return r.ok;
}

const card = (title: string, body: string, btn: [string, string]) => `<!doctype html><html><body style="margin:0;background:#f8f9fb;font-family:Arial,Helvetica,sans-serif;color:#0b3558">
  <div style="max-width:560px;margin:0 auto;padding:28px 18px"><div style="font-size:20px;font-weight:800;margin-bottom:18px"><img src="${SITE}assets/logo-64.png" width="30" height="30" alt="" style="vertical-align:middle;border-radius:8px;margin-right:8px">MiConsulta</div>
  <div style="background:#fff;border-radius:18px;padding:24px"><h1 style="font-size:22px;margin:0 0 10px">${esc(title)}</h1><p style="color:#476788;line-height:1.5;margin:0">${body}</p>
  <a href="${esc(btn[1])}" style="display:block;margin-top:20px;background:#006bff;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:8px;font-weight:bold">${esc(btn[0])}</a></div></div></body></html>`;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const { data: ok } = await db.rpc('notify_secret_ok', { p: req.headers.get('x-notify-secret') || '' });
  if (!ok) return json({ ok: false, error: 'forbidden' }, 403);
  const now = Date.now(), out: unknown[] = [];
  const windows: [string, number, number][] = [['dia', 22 * 3600e3, 26 * 3600e3], ['hora', 30 * 60e3, 90 * 60e3]];
  for (const [kind, from, to] of windows) {
    const { data: events } = await db.from('events').select('*')
      .gte('starts_at', new Date(now + from).toISOString()).lte('starts_at', new Date(now + to).toISOString());
    for (const e of events || []) {
      const { error: dup } = await db.from('event_reminders_log').insert({ event_id: e.id, kind });
      if (dup) continue; // ya se avisó
      const [{ data: p }, { data: st }, { data: att }, { data: u }] = await Promise.all([
        db.from('profiles').select('full_name,timezone,whatsapp').eq('id', e.owner_id).single(),
        db.from('professional_settings').select('*').eq('user_id', e.owner_id).maybeSingle(),
        db.from('event_attendees').select('name,email,token,status').eq('event_id', e.id),
        db.auth.admin.getUserById(e.owner_id),
      ]);
      const tz = p?.timezone || 'America/Mexico_City', cuando = when(e.starts_at, tz);
      const conf = (att || []).filter((a: any) => a.status === 'confirmado');
      const url = String(e.online_url || '');
      const lugar = e.mode !== 'en_linea' ? e.place || 'Presencial'
        : /^https:\/\/chat\.whatsapp\.com\//i.test(url) ? 'En línea por grupo de WhatsApp'
        : /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(url) ? 'En línea por videollamada de WhatsApp' : 'En línea';
      const msg = `MiConsulta: tu conferencia "${e.title}" es ${kind === 'dia' ? 'mañana' : 'en una hora'} (${cuando}). ${lugar}. Asistentes confirmados: ${conf.length}.`;
      let wa = false, mail = false;
      const phone = st?.wa_phone || p?.whatsapp;
      if (st?.callmebot_key && phone) { try { wa = await whatsapp(phone, st.callmebot_key, msg); } catch (_) { wa = false; } }
      if (u?.user?.email) mail = await email(u.user.email, `Recordatorio: ${e.title}`, card(`Tu conferencia es ${kind === 'dia' ? 'mañana' : 'en una hora'}`, esc(msg), ['Ver asistentes', `${SITE}panel.html#conferencias`]));
      if (kind === 'dia') for (const a of conf) if (a.email) await email(a.email, `Recordatorio: ${e.title}`,
        card(`Hola ${String(a.name).split(' ')[0]}, la conferencia es mañana`, `${esc(e.title)} · ${esc(cuando)} · ${esc(lugar)}.`, ['Ver detalles', `${SITE}evento.html?i=${a.token}`]));
      out.push({ event: e.id, kind, wa, mail, attendees: conf.length });
    }
  }
  // Sesiones por empezar: WhatsApp al especialista (CallMeBot) entre 5 y 15 minutos antes, una sola vez.
  const { data: soon } = await db.from('appointments').select('id,psychologist_id,starts_at,mode,location_id,patient_name,patient_phone')
    .eq('status', 'confirmed').is('psych_soon_at', null)
    .gte('starts_at', new Date(now).toISOString()).lte('starts_at', new Date(now + 16 * 60e3).toISOString());
  for (const a of soon || []) {
    await db.from('appointments').update({ psych_soon_at: new Date().toISOString() }).eq('id', a.id);
    const [{ data: p }, { data: st }, { data: loc }] = await Promise.all([
      db.from('profiles').select('full_name,timezone,whatsapp').eq('id', a.psychologist_id).single(),
      db.from('professional_settings').select('*').eq('user_id', a.psychologist_id).maybeSingle(),
      a.location_id ? db.from('locations').select('name,kind').eq('id', a.location_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const phone = st?.wa_phone || p?.whatsapp;
    if (!st?.callmebot_key || !phone) continue;
    const tz = p?.timezone || 'America/Mexico_City';
    const hora = new Date(a.starts_at).toLocaleTimeString('es-MX', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
    const mins = Math.max(1, Math.round((new Date(a.starts_at).getTime() - now) / 60e3));
    const lugar = a.mode === 'en_linea' ? 'En línea' : (loc?.name || 'Presencial');
    const msg = `MiConsulta: tu sesión con ${a.patient_name} empieza en ${mins} min (${hora}). ${lugar}.${a.patient_phone ? ` Tel. del paciente: ${a.patient_phone}.` : ''} Ver: ${SITE}panel.html#citas`;
    let wa = false;
    try { wa = await whatsapp(phone, st.callmebot_key, msg); } catch (_) { wa = false; }
    await db.from('notifications').insert({ psychologist_id: a.psychologist_id, appointment_id: a.id, event: 'soon', recipient: 'psychologist', channel: 'whatsapp',
      to_address: phone, status: wa ? 'sent' : 'failed', detail: wa ? null : 'CallMeBot no respondió' });
    out.push({ appointment: a.id, soon: true, wa });
  }
  return json({ ok: true, sent: out });
});
