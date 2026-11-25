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

**Logotipo y favicon:** un corazón con un brote (salud y bienestar), en `assets/favicon.svg`; versiones PNG en `assets/` (32, 64 para correos, 180 para iPhone, 192 y 512) y `site.webmanifest` para instalarla en el celular.

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
- `admin_delete_client`: el administrador elimina un paciente con sus encuestas; sus citas pasadas se conservan.

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

## Ficha del paciente (sin expediente clínico)
**MiConsulta no lleva expedientes clínicos** (sin diagnósticos, antecedentes, tratamientos ni notas de sesión), por decisión
del dueño para no asumir las obligaciones de la NOM-004 y la NOM-024. En **Pacientes** cada paciente tiene una ficha con pestañas:
- **Datos:** nombre, teléfono, correo, nacimiento, sexo, ocupación, dirección, contacto de emergencia,
  origen (particular, empresa, referido, redes, buscador, encuesta) y detalle (por ejemplo, el nombre de la empresa).
- **Encuestas** enviadas a ese paciente, con sus respuestas.
- **Citas** del paciente.

## Encuestas con link abierto
Cada encuesta puede tener un **link abierto** (`responder.html?s=…`) para personas que aún no son pacientes:
escriben su nombre y teléfono, contestan y quedan registradas como pacientes con origen "Encuesta".
Si el teléfono ya es de un paciente, la respuesta se agrega a su ficha.

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

## Búsqueda por zona
En el buscador, el campo de lugar tiene dos niveles: **estado** (por ejemplo Ciudad de México) y luego **alcaldía o municipio** (por ejemplo Iztacalco),
con cuántos especialistas hay en cada uno. Al elegir una zona aparece un mapa con el precio de cada consultorio; al tocarlo se abre el perfil para agendar.
El estado y la alcaldía de cada consultorio (`locations.state`, `locations.district`) se calculan solos con la función `geocode`
a partir de su punto en el mapa, y el especialista puede corregirlos en **Ubicaciones**.

## Perfil completo y talleres
- **Especialidad principal y adicionales:** en Mi perfil, "También atiendo como" (ej. tanatóloga y psicoterapeuta) hace que aparezca en varias secciones del buscador.
- **Temas por especialidad:** en tanatología se sugieren tipos de duelo (padre, madre, hijo, gestacional y perinatal, divorcio, mascota, suicidio…),
  tanatología infantil, logoterapia y prevención del suicidio. Al elegir Tanatólogos en el buscador, los temas frecuentes son de duelo.
- **Servicios con precio** (`profiles.services`): nombre, precio, duración y descripción; se muestran en el perfil.
- **Formación y certificaciones** (`profiles.credentials`): nombre, institución, año, folio y enlace de verificación (botón "Verificar" en el perfil).
- **Talleres y conferencias** (`events.kind`: conferencia, taller o grupo de apoyo; `events.price` opcional). Los públicos aparecen en el perfil
  y en la cartelera `eventos.html` (función `public_upcoming_events`).

## MiConsulta como app (se instala en el celular)
Igual que la app de Los Ponpones, MiConsulta es una app web instalable:
- `site.webmanifest`: nombre, íconos (normales y adaptables para Android) y atajos (Buscar, Mi panel, Talleres).
- `sw.js`: guarda las páginas en el celular; abre rápido y funciona aunque falle la conexión (siempre intenta la versión más reciente primero).
- En el inicio y en el panel aparece "Instala MiConsulta": en Android/Chrome instala con un toque; en iPhone muestra los pasos
  (Compartir → Agregar a inicio). Si se cierra, no vuelve a salir en 30 días.
Para publicar cambios en las páginas guardadas, sube el número en `const C = 'miconsulta-v1'` de `sw.js`.

## Página propia del especialista
`perfil.html?sitio=<slug>` es la página personal de cada especialista: su nombre y foto arriba en lugar de MiConsulta,
sin enlaces al buscador ni a otros especialistas. Al agendar (`cita.html`) y al abrir un taller (`evento.html`) se conserva su marca
(`&sitio=` en el enlace o recordado en la pestaña). En el panel, **Mi perfil → Tu página propia** tiene el enlace para copiar o
compartir por WhatsApp y un código QR descargable para imprimir. El perfil normal (`?p=`) sigue mostrando MiConsulta.

## Bienvenida para especialistas
La primera vez que un especialista entra a su panel aparece un **recorrido guiado**: ilumina cada sección del menú y explica para qué sirve
(en celular, las pestañas de abajo y "Más"), y termina llevándolo a completar su perfil. Se guarda en su cuenta para no repetirse en otros dispositivos.
Desde su foto (arriba a la derecha) puede volver a verlo en **Recorrido por el panel**, o abrir la **Guía de cada sección**.
Los textos de cada sección están en `HELP` dentro de `panel.html`.

## Superadministrador y cuenta demo
- Las cuentas de administrador no tienen panel de especialista: al entrar a `panel.html` van directo a `admin.html`, y su perfil no se publica en el buscador.
- **Cuenta demo** (`profiles.is_demo`): "Mariana López", un especialista de ejemplo con citas en todos los estados, pacientes,
  encuestas respondidas, talleres con asistentes y opiniones. No aparece en el buscador ni en la cartelera; su perfil muestra el aviso
  "Perfil de demostración". Se entra desde Administración → Ajustes → Cuenta demo. Solo un administrador puede marcar una cuenta como demo.

## Panel de administración
`admin.html` abre en **Resumen** (función `admin_dashboard`), sin contar administradores ni la cuenta demo:
- **Ingresos:** total ganado, este mes contra el anterior, ingreso mensual estimado de las suscripciones vigentes, pago promedio,
  gráfica de los últimos 12 meses (con vista de tabla), por método de pago y renovaciones de los próximos 15 días.
- **Clientes (especialistas):** registrados, pagando, en prueba, vencidos, publicados, registros por mes y por especialidad.
- **Uso:** pacientes, citas y su estado, valor de las citas confirmadas, calificación promedio, encuestas y talleres.
- **¿Todo funciona bien?:** tareas automáticas (recordatorios), llamadas a las funciones del servidor, correos, pagos sin revisar,
  cédulas por verificar, consultorios sin ubicar y perfiles publicados sin horario.
**Bitácora** (función `admin_activity_range`, por rango de fechas con atajos Hoy, Ayer, 7 y 30 días, Este mes, Mes pasado, Este año o fechas exactas;
muestra el resumen del periodo y se descarga en CSV para Excel): registros, pagos, citas, opiniones, talleres, errores y las acciones del administrador
(tabla `admin_log`: pagos, accesos, contraseñas, correos confirmados, cédulas, perfiles, eliminaciones, opiniones ocultas).

## Horario más claro y citas agregadas a mano
- **Horario:** cada rango se ve como "De 09:00 a 14:00" con su botón **Quitar**; "No atender este día" vacía el día.
  Al cambiar algo aparece una barra fija **"Guardar cambios"** (con Deshacer), y avisa si sales sin guardar.
- **+ Agregar cita** (en Citas y Calendario, función `add_manual_appointment`): para las citas que el especialista ya tenía acordadas.
  Elige paciente existente o nuevo, fecha, hora, duración, lugar y si ya está pagada o pendiente. Ocupa la agenda (nadie más puede
  reservar ese horario), no envía correo al paciente y queda marcada como "Registrada por ti" (`appointments.source = 'manual'`).

## Aviso de privacidad
`aviso-privacidad.html` tiene dos versiones: **pacientes** y **especialistas** (`?para=especialista`).
El dueño de la plataforma es **responsable** solo de los datos de los especialistas; cada **especialista es responsable** de los datos de sus pacientes
y MiConsulta actúa como **encargado**. El skill `.claude/skills/abogado` revisa estos textos con la ley mexicana. Explica qué datos se recaban
(incluidos los de salud, que son sensibles), para qué, con quién se comparten, los derechos ARCO y cómo ejercerlos.
El responsable, su domicilio y el correo de privacidad se capturan en **Administración → Ajustes → Aviso de privacidad** (función `public_privacy`).
Se pide **consentimiento expreso** con una casilla antes de: agendar una cita, registrarse a un taller, contestar una encuesta
y crear una cuenta de especialista (se guarda `privacy_accepted_at` en la cuenta). Hay un enlace al aviso en el pie de las páginas públicas
y en el menú de la cuenta del especialista.

## Seguridad de los datos

- Todas las tablas tienen RLS: cada especialista solo ve sus pacientes, citas, notas, encuestas y eventos; el
  administrador puede verlos para dar soporte. Los pacientes entran con enlaces de token aleatorio, sin cuenta.
- Los datos privados del perfil (cuenta para cobrar y avisos por correo) **no** se pueden leer desde la API pública:
  solo el dueño con `my_private_profile()` y el paciente de una cita dentro de `get_appointment`.
- Los comprobantes de pago están en un bucket privado. Las claves de servicios viven solo en los secretos de Supabase.
- Los enlaces que guardan los especialistas (mapa, conferencia en línea, fotos) solo pueden ser `https://`, y quien no ha
  iniciado sesión no puede escribir en ninguna tabla: los pacientes solo agendan, pagan u opinan con su link (funciones con token).
- Para revisar la seguridad usa el skill `seguridad` (`.claude/skills/seguridad/SKILL.md`).
- Última auditoría: 25 nov 2026 (sin fugas; se cerró el riesgo de enlaces maliciosos).

## Planes y módulos (lo que se vende a los especialistas)
- Planes en la tabla `plan_tiers` (se editan en **Administración → Ajustes → Planes y precios**): Básico $199, Profesional $349 y Premium $499 al mes.
- Módulos: `pacientes`, `citas_manuales`, `sitio` (página propia con QR), `opiniones`, `encuestas`, `conferencias` (incluye alertas por WhatsApp).
  Agenda, perfil, horarios, consultorios y cobro con comprobante siempre están incluidos.
- `subscriptions.tier` guarda el plan de cada cuenta y `subscriptions.modules` (opcional) los módulos a la medida.
  Las cuentas que existían antes de los planes tienen `tier = 'completo'`: todo incluido, no se les cierra nada.
- Las cuentas nuevas empiezan con `platform_settings.default_tier` (Premium por defecto, también durante la prueba gratis).
- El administrador cambia el plan de cada especialista en **Acceso** (`admin_set_tier`). Lo que no está en su plan desaparece de su menú;
  si entra por el enlace ve "no está en tu plan" con los precios. En el menú de su foto está **Mi plan**.
- También lo respeta la base de datos (`has_module`): sin el módulo no puede crear encuestas ni eventos, sus eventos no salen en la cartelera,
  sus opiniones no se muestran ni se piden, y su página propia (`?sitio=`) se abre como perfil normal.
- Los planes se muestran en `especialistas.html` (página para doctores: funciones, cómo empezar, planes, preguntas, entrar o crear cuenta).
  El inicio (`index.html`) es solo para pacientes: buscar y agendar; su botón "Soy especialista" lleva a esa página. Los estilos de ambas están en `assets/home.css`.

## Alertas de citas
- **En el panel** (navegador o app instalada, con el panel abierto): sonido y aviso en pantalla cuando llega una cita nueva,
  cuando un paciente sube su comprobante o cancela, y X minutos antes de cada sesión confirmada (5, 10, 15 o 30; por defecto 10).
  Llegan al instante con Supabase Realtime (`appointments` está en la publicación `supabase_realtime`; RLS hace que cada especialista
  solo reciba sus citas) y, de respaldo, cada 45 segundos. Con permiso del navegador también sale la notificación del sistema.
  Se configura en el menú de su foto → "Alertas y sonido". El aviso de "sesión por empezar" trae el botón para escribirle al paciente por WhatsApp
  (mensaje ya escrito, sale del WhatsApp del especialista) si la cita tiene teléfono.
- **WhatsApp al especialista** (CallMeBot, gratis, solo a su propio número; se activa en Mi perfil → Alertas por WhatsApp):
  nueva cita, comprobante recibido y cancelación (función `notify`), y entre 5 y 15 minutos antes de cada sesión
  (función `event-reminders`, cada 5 minutos; `appointments.psych_soon_at` evita repetirlo).
- **WhatsApp automático al paciente**: no está activado. Requiere la API oficial de WhatsApp Business (Meta), que cobra por mensaje
  y pide verificar un negocio; mientras, el especialista lo manda con un toque desde el aviso.

## Precios del especialista
- `profiles.price` = precio presencial (o general), `profiles.price_online` = precio en línea (vacío = igual).
- `profiles.price_hidden` + `profiles.price_note`: no mostrar precios; en su lugar se ve la leyenda (por defecto "Precio a consultar con el especialista").
- Se editan en Mi perfil → "Precio por sesión". Los muestran el buscador, el mapa, el perfil y el link de cita del paciente
  (`get_appointment` devuelve el precio de la modalidad de esa cita, o la leyenda). Funciones comunes: `PA.priceLabel/priceShort/priceOf`.
