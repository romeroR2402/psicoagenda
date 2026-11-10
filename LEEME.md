# PsicoAgenda

Plataforma tipo directorio para encontrar psicólogos y agendar citas con pago verificado.

## Páginas
| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Pacientes | Buscador por tema, nombre, ciudad o en línea |
| `perfil.html?p=…` | Pacientes | Perfil público del psicólogo, horarios libres y reserva |
| `cita.html?t=…` | Pacientes | Link privado de su cita: ver estado, pagar (subir comprobante) o cancelar |
| `responder.html?t=…` | Pacientes | Contestar una encuesta (se verifica con su teléfono) |
| `panel.html` | Psicólogos | Registro, perfil, horario semanal, días de descanso, ubicaciones, citas, pacientes y encuestas |
| `admin.html` | Super administrador | Lista de psicólogos registrados, detalle de solo lectura, restablecer contraseñas, activar o desactivar perfiles |
| `demo.html` | — | Prototipo anterior de demostración |

Archivos compartidos: `assets/app.css`, `assets/common.js` y `config.js` (conexión pública a Supabase).

## Cómo funciona una cita
1. El paciente elige día y hora libres. El horario queda **apartado** (pago pendiente).
2. El paciente sube la foto de su comprobante en su link de cita, y la cita pasa a **pago por revisar**.
3. El psicólogo revisa el comprobante en su panel y la **aprueba** (o la rechaza, y el horario se libera).
4. Quien agenda se agrega automáticamente a la lista de pacientes del psicólogo.

Los horarios libres salen del horario semanal, menos los días de descanso y las citas ya apartadas.

## Base de datos (Supabase, proyecto `psicoagenda`)
- `profiles`, `locations`, `schedules`, `time_off`, `appointments`: plataforma de citas.
- `clients`, `surveys`, `survey_links`: pacientes y encuestas de cada psicólogo.
- `admins`: cuentas de super administrador.
- Bucket privado `receipts`: comprobantes de pago.
- Función `admin-users` (`supabase/functions/admin-users`): asignar contraseña o confirmar correo, solo para administradores.

Cada psicólogo solo ve sus datos. El administrador puede ver los de todos, pero las contraseñas
están cifradas y nadie puede verlas: el administrador puede asignar una nueva o enviar un correo de restablecimiento.

## Configuración de Supabase (una sola vez)
En https://supabase.com/dashboard/project/welweahxizjuufjyzbkj/auth/url-configuration:
- **Site URL**: `https://romeror2402.github.io/psicoagenda/`
- **Redirect URLs**: `https://romeror2402.github.io/psicoagenda/**`

El correo integrado de Supabase envía pocos correos por hora. Para recibir muchos registros,
configura un SMTP propio en Authentication → Emails. Mientras tanto, el administrador puede confirmar cuentas a mano.

## Avisos automáticos por correo
La función `notify` (`supabase/functions/notify`) envía correos cuando:
- un paciente agenda (al paciente y al psicólogo),
- sube su comprobante (al psicólogo),
- se confirma o rechaza la cita (al paciente),
- alguien cancela (a la otra parte),
- falta un día para una cita confirmada (recordatorio al paciente, revisado cada 30 minutos).

Cada aviso queda registrado en `notifications` y el psicólogo lo ve en su Inicio.
Además hay botones de WhatsApp con el mensaje ya escrito (paciente → psicólogo y psicólogo → paciente).
El envío automático por WhatsApp necesita la API de WhatsApp Business de Meta y no está incluido.

### Activar el envío de correos (una sola vez)
1. Crea una cuenta gratis en https://www.brevo.com (300 correos al día).
2. En Brevo, agrega y verifica tu correo como remitente (Senders).
3. En Brevo, crea una clave en **SMTP & API → API Keys**.
4. En https://supabase.com/dashboard/project/welweahxizjuufjyzbkj/functions/secrets agrega:
   - `BREVO_API_KEY` = la clave de Brevo
   - `EMAIL_FROM` = el correo que verificaste como remitente
Con un dominio propio verificado en Brevo los correos llegan mejor y no caen en spam.
También funciona con Resend: usa `RESEND_API_KEY` en lugar de `BREVO_API_KEY`.

## Foto de perfil y calendario
- Cada psicólogo sube su foto en **Mi perfil**; se guarda en el bucket público `avatars`.
- **Calendario** muestra la semana con horario disponible, citas por estado y días de descanso.

## Comprobantes en Google Drive (opcional)
`drive-pagos.gs` es un Apps Script que guarda imágenes en una carpeta "Pagos" de Drive.
Hoy los comprobantes se guardan en Supabase (`receipts`); el script queda como opción futura.
