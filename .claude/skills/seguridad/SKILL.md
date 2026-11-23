---
name: seguridad
description: Audita y protege los datos de especialistas y pacientes de MiConsulta (Supabase + páginas estáticas). Úsalo cuando pidan "revisa la seguridad", "que no se puedan robar los datos", "¿esto es seguro?", antes de crear una tabla, columna, función RPC, bucket o función edge nueva, y antes de publicar cualquier cambio que lea o guarde datos personales.
---

# Seguridad de MiConsulta

Objetivo: que nadie pueda leer, cambiar o borrar datos que no son suyos. Los datos de pacientes (expedientes, notas,
teléfonos, citas, encuestas, comprobantes) son **datos sensibles de salud** (LFPDPPP); una fuga es el peor fallo posible.

## Modelo de amenaza (piensa siempre en estos tres atacantes)

1. **Cualquier persona en internet** con la clave pública (`config.js` trae la clave `anon`: es pública por diseño y está
   bien que esté ahí). Puede llamar directo a `https://<proyecto>.supabase.co/rest/v1/...` sin pasar por las páginas.
2. **Un especialista con sesión iniciada** que intenta ver datos de otro especialista o de pacientes ajenos.
3. **Alguien con un enlace de paciente** (cita, encuesta, evento) que intenta adivinar o reutilizar otros enlaces.

La página nunca es la defensa: todo lo que se esconde solo en el HTML/JS se puede leer desde la API. La defensa está en
la base de datos (RLS, permisos por columna y funciones).

## Reglas que ya cumple el proyecto (no las rompas)

- **RLS encendido en todas las tablas de `public`.** Tablas nuevas: `alter table ... enable row level security` en la
  misma migración, con políticas `owner_id = (select auth.uid())` y lectura del admin con `(select public.is_admin())`.
- Las escrituras de especialistas llevan además la política *restrictiva* `has_access(auth.uid())` (suscripción vigente).
- **Pacientes no tienen cuenta**: entran con tokens aleatorios (`gen_random_bytes(12–18)`, 96–144 bits) a funciones
  `SECURITY DEFINER` con `set search_path = ''` que solo devuelven lo de *ese* token. Nunca uses ids secuenciales ni
  uuid del registro como enlace público.
- **`profiles` tiene permisos por columna**: `anon` y `authenticated` solo pueden leer las columnas públicas. Las
  privadas (`payment_info`, `notify_email`) se leen con `my_private_profile()` (solo el dueño) o dentro de funciones
  con token (`get_appointment` da los datos de pago solo al paciente de esa cita). Si agregas una columna a `profiles`:
  decide si es pública; si lo es, agrégala al `grant select (...)` y a `PCOLS` en `panel.html`; si no, déjala fuera.
- `profiles_guard` impide que un especialista se cambie `is_active`, `license_verified` o `is_demo`.
- Funciones de admin: comprueban `is_admin()` al inicio y no se pueden ejecutar como `anon` (`revoke execute ... from anon`).
- Storage: `receipts` es privado (sube solo quien tiene el token de una cita sin pagar; lee el especialista de esa cita
  o el admin). `avatars` y `event-images` son públicos para lectura, pero cada quien solo escribe en su carpeta `uid/`.
  Todos los buckets tienen límite de tamaño y tipos de imagen permitidos.
- Funciones edge: `notify`, `event-reminders` y `geocode` exigen el secreto compartido `x-notify-secret` (guardado en
  vault); `admin-users` y `maps-link` exigen sesión (`verify_jwt`) y `admin-users` además revisa que sea admin.
  `maps-link` solo sigue redirecciones a dominios de Google (evita SSRF).
- Claves de servicios (Brevo, CallMeBot, service role) **solo** en los secretos de Supabase, nunca en el repositorio ni
  en el chat.
- En el HTML todo dato de usuario se pinta con `PA.esc()` (evita XSS). Nunca metas texto de usuario en `innerHTML` sin
  escapar, ni en atributos `href` sin validar `https://`.

## Auditoría paso a paso

1. **Asesor de Supabase**: `get_advisors` tipo `security`. Esperado y aceptado: avisos de `SECURITY DEFINER` ejecutable
   por `anon` en las funciones públicas con token (listadas abajo), tablas `admins` y `event_reminders_log` sin
   políticas (nadie las lee desde la API: correcto), `pg_net` en `public`. Cualquier otro aviso nuevo se corrige.
2. **RLS y políticas**:
   ```sql
   select c.relname, c.relrowsecurity, p.polname, p.polcmd, array_to_string(p.polroles::regrole[]::text[],',') roles,
          pg_get_expr(p.polqual,p.polrelid) q
   from pg_class c left join pg_policy p on p.polrelid=c.oid
   where c.relnamespace='public'::regnamespace and c.relkind='r' order by 1;
   ```
   Busca: tablas sin RLS, políticas con `true` para `anon`, políticas de lectura que no filtren por dueño.
3. **Columnas expuestas** (qué puede leer `anon` de cada tabla):
   ```sql
   select table_name, string_agg(column_name, ',') from information_schema.column_privileges
   where grantee='anon' and privilege_type='SELECT' and table_schema='public' group by 1;
   ```
   Cruza con las políticas: una tabla con política pública de lectura no debe exponer columnas privadas.
4. **Prueba real como atacante** (sin sesión), con la clave pública:
   ```bash
   curl -s "$URL/rest/v1/profiles?select=payment_info" -H "apikey: $ANON"      # debe dar error 401/permiso
   curl -s "$URL/rest/v1/clients?select=*" -H "apikey: $ANON"                   # debe dar []
   curl -s "$URL/rest/v1/appointments?select=*" -H "apikey: $ANON"              # debe dar []
   curl -s "$URL/rest/v1/rpc/get_appointment" -H "apikey: $ANON" -H 'content-type: application/json' -d '{"p_token":"x"}'  # null
   ```
   Repite las de `clients`/`appointments` con la sesión de un especialista de prueba pidiendo `owner_id` de otro.
5. **Funciones**: lista las que `anon` puede ejecutar y revisa cada una nueva:
   ```sql
   select proname, prosecdef, has_function_privilege('anon', oid, 'execute') from pg_proc
   where pronamespace='public'::regnamespace order by 3 desc, 1;
   ```
   Públicas aceptadas (con token o datos ya públicos): `available_slots`, `search_availability`, `book_appointment`,
   `get_appointment`, `cancel_appointment`, `reschedule_appointment`, `report_payment`, `receipt_upload_ok`,
   `submit_review`, `public_reviews`, `public_ratings`, `get_event`, `event_register`, `event_rsvp`, `public_events`,
   `public_upcoming_events`, `open_survey`, `submit_survey`, `open_public_survey`, `submit_public_survey`,
   `public_privacy`, `is_admin`, `has_access`, `is_public_profile`. Cada función `SECURITY DEFINER` nueva debe:
   `set search_path = ''`, validar entradas, filtrar por token o `auth.uid()`, y devolver solo lo necesario.
   Las que no son para pacientes: `revoke execute ... from public, anon`.
6. **Storage**: `select * from storage.buckets` y las políticas de `storage.objects`. Ningún bucket con datos de
   pacientes puede ser `public = true`.
7. **Repositorio**: `git grep -nE "service_role|sk_|xkeysib|BEGIN PRIVATE|password\s*="` no debe encontrar secretos
   (la clave `anon` de `config.js` es la única permitida).
8. **Páginas**: busca `innerHTML` con datos sin `esc(`; enlaces externos con `rel="noopener"`.

## Abuso y límites

- `book_appointment` limita a 3 citas activas por teléfono y especialista; `open_survey` limita intentos de teléfono.
  Si aparece spam de citas, agrega un límite por especialista por hora dentro de la función (no en la página).
- Recomendado en el panel de Supabase (lo hace el dueño, no se puede por SQL): **Auth → Protección de contraseñas
  filtradas** (si el plan lo permite), longitud mínima de contraseña 8+, confirmación de correo encendida,
  CAPTCHA en registro si hay altas falsas.

## Al terminar

Resume en español sencillo: qué se revisó, qué se encontró (gravedad: crítico / medio / bajo), qué se corrigió y qué
tiene que hacer el dueño a mano en el panel de Supabase. Actualiza `LEEME.md` (sección Seguridad) si cambió algo.
Si el cambio toca textos legales o el aviso de privacidad, usa también el skill `abogado`.
