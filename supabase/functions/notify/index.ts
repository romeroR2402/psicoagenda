// Avisos por correo de PsicoAgenda. La llama la base de datos (trigger y recordatorios)
// con la clave compartida en el encabezado x-notify-secret.
// Proveedor de correo: BREVO_API_KEY o RESEND_API_KEY, y EMAIL_FROM (remitente verificado).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SITE = (Deno.env.get('SITE_URL') || 'https://romeror2402.github.io/psicoagenda/').replace(/\/?$/, '/');
const FROM = Deno.env.get('EMAIL_FROM') || '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const MODE: Record<string, string> = { presencial: 'Presencial', en_linea: 'En línea' };

// Ruta en Google Maps hacia el consultorio (coordenadas exactas si las hay).
const gdir = (l: any) => 'https://www.google.com/maps/dir/?api=1&destination=' +
  (l.lat != null ? `${l.lat},${l.lng}` : encodeURIComponent([l.address, l.city, 'México'].filter(Boolean).join(', ')));

function when(a: any, tz: string) {
  const d = new Date(a.starts_at);
  const day = d.toLocaleDateString('es-MX', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });
  const t = d.toLocaleTimeString('es-MX', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
  return `${day[0].toUpperCase()}${day.slice(1)} a las ${t}`;
}

function layout(title: string, intro: string, rows: [string, string][], button?: [string, string], foot = '') {
  return `<!doctype html><html><body style="margin:0;background:#f7f6fb;font-family:Arial,Helvetica,sans-serif;color:#1e1c2f">
  <div style="max-width:560px;margin:0 auto;padding:28px 18px">
    <div style="font-size:20px;font-weight:800;margin-bottom:18px"><span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:9px;background:#f4621f;color:#fff;margin-right:8px">Ψ</span>PsicoAgenda</div>
    <div style="background:#fff;border-radius:18px;padding:24px">
      <h1 style="font-size:22px;margin:0 0 8px">${esc(title)}</h1>
      <p style="color:#6f6d88;margin:0 0 18px;line-height:1.5">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6f6d88">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${v}</td></tr>`).join('')}</table>
      ${button ? `<a href="${esc(button[1])}" style="display:block;margin-top:20px;background:#f4621f;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:14px;font-weight:bold">${esc(button[0])}</a>` : ''}
      ${foot ? `<p style="color:#6f6d88;font-size:12px;margin:16px 0 0;line-height:1.5">${foot}</p>` : ''}
    </div></div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!FROM) return { status: 'skipped', detail: 'Falta configurar el remitente (EMAIL_FROM)' };
  const brevo = Deno.env.get('BREVO_API_KEY'), resend = Deno.env.get('RESEND_API_KEY');
  let r: Response;
  if (brevo) {
    r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'api-key': brevo, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { email: FROM, name: 'PsicoAgenda' }, to: [{ email: to }], subject, htmlContent: html, ...(replyTo ? { replyTo: { email: replyTo } } : {}) }),
    });
  } else if (resend) {
    r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `PsicoAgenda <${FROM}>`, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
  } else return { status: 'skipped', detail: 'Falta conectar un servicio de correo' };
  if (r.ok) return { status: 'sent', detail: null };
  return { status: 'failed', detail: (await r.text()).slice(0, 300) };
}

async function handle(event: string, appointmentId: string) {
  const { data: a } = await db.from('appointments').select('*').eq('id', appointmentId).maybeSingle();
  if (!a) return;
  const { data: p } = await db.from('profiles').select('*').eq('id', a.psychologist_id).single();
  const loc = a.location_id ? (await db.from('locations').select('*').eq('id', a.location_id).maybeSingle()).data : null;
  const { data: u } = await db.auth.admin.getUserById(a.psychologist_id);
  const psyEmail = u?.user?.email || null;
  const tz = p.timezone || 'America/Mexico_City';
  const citaUrl = `${SITE}cita.html?t=${a.patient_token}`, panelUrl = `${SITE}panel.html#citas`;
  const first = String(a.patient_name).split(' ')[0];
  const rows: [string, string][] = [
    ['Cuándo', esc(when(a, tz))], ['Modalidad', MODE[a.mode] || a.mode],
    ...(loc && loc.kind !== 'en_linea' ? [['Lugar', esc([loc.name, loc.address, loc.city].filter(Boolean).join(', '))] as [string, string],
      ['Cómo llegar', `<a href="${esc(gdir(loc))}" style="color:#4f63e8">Abrir en Google Maps</a>`] as [string, string]] : []),
    ['Psicólogo', esc(p.full_name)],
  ];
  const psyRows: [string, string][] = [['Paciente', esc(a.patient_name)], ['Teléfono', esc(a.patient_phone)], ['Cuándo', esc(when(a, tz))], ['Modalidad', MODE[a.mode] || a.mode]];
  const out: { recipient: 'patient' | 'psychologist'; to: string | null; subject: string; html: string }[] = [];
  const toPatient = (subject: string, html: string) => out.push({ recipient: 'patient', to: a.patient_email, subject, html });
  const toPsy = (subject: string, html: string) => out.push({ recipient: 'psychologist', to: p.notify_email ? psyEmail : null, subject, html });

  if (event === 'booked') {
    toPatient('Tu horario está apartado', layout(`Hola ${first}, tu horario está apartado`, 'Para confirmar tu cita, haz tu pago y sube tu comprobante desde tu link de cita.', rows, ['Ver mi cita y pagar', citaUrl], 'Guarda este correo: el botón te lleva a tu cita para pagar o cancelar.'));
    toPsy(`Nueva cita solicitada: ${a.patient_name}`, layout('Tienes una nueva solicitud de cita', `${esc(a.patient_name)} apartó un horario contigo. Se confirmará cuando revises su pago.`, [...psyRows, ...(a.patient_note ? [['Motivo', esc(a.patient_note)] as [string, string]] : [])], ['Abrir mi panel', panelUrl]));
  } else if (event === 'review') {
    toPsy(`${a.patient_name} subió su comprobante`, layout('Hay un pago por revisar', `${esc(a.patient_name)} subió su comprobante de pago. Revísalo y aprueba la cita para apartarla.`, [...psyRows, ['Referencia', esc(a.payment_ref || '—')]], ['Revisar el pago', panelUrl]));
  } else if (event === 'confirmed') {
    toPatient('Tu cita está confirmada', layout(`¡Listo, ${first}! Tu cita está confirmada`, `${esc(p.full_name)} verificó tu pago. Te esperamos.`, rows, ['Ver mi cita', citaUrl], 'Si no puedes asistir, cancela desde tu link para liberar el horario.'));
  } else if (event === 'rejected') {
    toPatient('Tu cita no fue aprobada', layout('Tu cita no fue aprobada', `${esc(p.full_name)} no pudo aprobar tu cita y el horario quedó libre. Puedes elegir otro horario.`, rows, ['Buscar otro horario', `${SITE}perfil.html?p=${p.slug}`]));
  } else if (event === 'cancelled') {
    if (a.cancelled_by === 'patient') toPsy(`${a.patient_name} canceló su cita`, layout('Una cita fue cancelada', `${esc(a.patient_name)} canceló su cita. El horario quedó libre en tu agenda.`, psyRows, ['Abrir mi panel', panelUrl]));
    else toPatient('Tu cita fue cancelada', layout('Tu cita fue cancelada', `${esc(p.full_name)} canceló tu cita. Si quieres, elige otro horario.`, rows, ['Buscar otro horario', `${SITE}perfil.html?p=${p.slug}`]));
  } else if (event === 'reminder') {
    toPatient('Recordatorio: tu cita es mañana', layout(`Hola ${first}, tu cita es mañana`, 'Te recordamos tu cita. Si no puedes asistir, cancélala para liberar el horario.', rows, ['Ver mi cita', citaUrl]));
  }

  for (const m of out) {
    const r = m.to ? await sendEmail(m.to, m.subject, m.html, m.recipient === 'patient' ? psyEmail || undefined : undefined)
      : { status: 'skipped', detail: m.recipient === 'patient' ? 'El paciente no dejó correo' : 'Avisos por correo desactivados' };
    await db.from('notifications').insert({ psychologist_id: a.psychologist_id, appointment_id: a.id, event, recipient: m.recipient, to_address: m.to, status: r.status, detail: r.detail });
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const { data: ok } = await db.rpc('notify_secret_ok', { p: req.headers.get('x-notify-secret') || '' });
  if (!ok) return json({ ok: false, error: 'forbidden' }, 403);
  try {
    const body = await req.json();
    if (body.event === 'reminders') {
      const now = Date.now();
      const { data: due } = await db.from('appointments').select('id').eq('status', 'confirmed').is('reminder_sent_at', null)
        .gte('starts_at', new Date(now + 20 * 3600e3).toISOString()).lte('starts_at', new Date(now + 26 * 3600e3).toISOString());
      for (const a of due || []) {
        await db.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', a.id);
        await handle('reminder', a.id);
      }
      return json({ ok: true, reminders: (due || []).length });
    }
    if (typeof body.appointment_id !== 'string') return json({ ok: false, error: 'appointment_id' }, 400);
    await handle(String(body.event), body.appointment_id);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
