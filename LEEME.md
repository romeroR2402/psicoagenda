# MiConsulta

Plataforma tipo directorio para encontrar psicólogos, psicoterapeutas, tanatólogos, médicos y dentistas, y agendar citas con pago verificado.

## Páginas
| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Pacientes | Buscador por tema, nombre, ciudad o en línea |
| `perfil.html?p=…` | Pacientes | Perfil público del psicólogo, horarios libres y reserva |
| `cita.html?t=…` | Pacientes | Link privado de su cita: ver estado, pagar (subir comprobante) o cancelar |
| `responder.html?t=…` | Pacientes | Contestar una encuesta (se verifica con su teléfono) |
| `panel.html` | Psicólogos | Registro, perfil, horario semanal, días de descanso, ubicaciones, citas, pacientes y encuestas |
| `admin.html` | Super administrador | Lista de especialistas y pacientes, detalle de solo lectura, restablecer contraseñas, activar o desactivar perfiles, acceso y pagos, eliminar especialistas o pacientes |
| `demo.html` | — | Prototipo anterior de demostración |

Archivos compartidos: `assets/app.css`, `assets/common.js` y `config.js` (conexión pública a Supabase).

**Estilo visual:** texto azul marino (`#0b3558`) sobre gris frío (`#f8f9fb`), un solo azul vivo (`#006bff`) para las acciones,
tarjetas blancas con borde fino y sombras azuladas, botones con esquinas de 8 px y letra Manrope. Los colores están en `assets/app.css`
(con modo oscuro); `responder.html` tiene su propia copia porque no carga ese archivo.

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
- Función `admin-users` (`supabase/functions/admin-users`): asignar contraseña, confirmar correo o eliminar la cuenta de un especialista (con todos sus datos y archivos), solo para administradores.
- `admin_delete_client`: el administrador elimina un paciente con su expediente; sus citas pasadas se conservan.

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

## Expediente del paciente
En **Pacientes** cada paciente tiene su expediente con pestañas:
- **Datos:** nombre, teléfono, correo, nacimiento, sexo, ocupación, dirección, contacto de emergencia,
  origen (particular, empresa, referido, redes, buscador, encuesta) y detalle (por ejemplo, el nombre de la empresa).
- **Expediente clínico:** campos según la especialidad del profesional (psicología, psicoterapia, tanatología, medicina u odontología).
- **Notas de evolución** con fecha y tipo (sesión, consulta, llamada, nota).
- **Encuestas** enviadas a ese paciente, con sus respuestas.
- **Citas** del paciente.

El expediente clínico y las notas solo los ve el profesional (`clinical_records`, `clinical_notes`); el administrador no tiene acceso.

## Encuestas con link abierto
Cada encuesta puede tener un **link abierto** (`responder.html?s=…`) para personas que aún no son pacientes:
escriben su nombre y teléfono, contestan y quedan registradas como pacientes con origen "Encuesta".
Si el teléfono ya es de un paciente, la respuesta se agrega a su expediente.

## Conferencias
En **Conferencias** (menú "Más" en celular) cada especialista crea conferencias presenciales o en línea con imagen,
descripción, fecha, horario y cupo. Aparecen en su **Calendario** y, si son públicas, en su perfil.
- **Invitar pacientes:** se eligen de la lista y a cada uno se le manda por WhatsApp su link personal (`evento.html?i=…`), donde responde "Asistiré" o "No podré".
- **Link abierto** (`evento.html?e=…`): cualquiera aparta su lugar con nombre y teléfono y queda como paciente.
- En línea puede ser por **link de videollamada** (Zoom, Meet, Teams…), por **grupo de WhatsApp** (link `chat.whatsapp.com/…`)
  o por **videollamada de WhatsApp** al número del especialista (los asistentes ven un botón para escribirle).
  El acceso solo lo ven quienes confirmaron.
- **Alertas por WhatsApp al especialista** un día y una hora antes, con CallMeBot (se activa en **Mi perfil**).
  La función `event-reminders` corre cada 15 minutos; si hay servicio de correo, también avisa por correo al especialista y a los asistentes.

## Opiniones, cambios de horario y confianza
Inspirado en lo que más le critican a Doctoralia (ver `investigacion/doctoralia.md`):
- **Opiniones verificadas** (`reviews`): solo quien tuvo cita confirmada opina, desde su link de cita, una vez por cita.
  Se publican todas las calificaciones; el especialista responde en **Opiniones** de su panel pero no puede borrarlas.
  El administrador puede ocultar una opinión ofensiva dando el motivo. Al día siguiente de la cita se pide la opinión por correo.
- **Cambiar de horario** desde `cita.html`, hasta el plazo que fije el especialista (Mi perfil → "Puedes cambiar o cancelar hasta"). El pago se conserva.
- **Política de cancelación** visible antes de agendar y en la cita.
- **Cédula verificada**: el administrador la marca en el detalle del especialista; si cambia la cédula, vuelve a revisión.
- **Agregar al calendario** (Google Calendar o archivo .ics).
- El buscador ordena por el horario libre más cercano; nadie paga por aparecer primero.

El skill `.claude/skills/investigar-competencia` repite esta investigación con cualquier competidor.
