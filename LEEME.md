# PsicoAgenda

App web para que una psicóloga gestione citas, pagos y encuestas, con una vista para pacientes.

## Archivos
- `index.html` — la app de la psicóloga (agenda, pagos, pacientes y encuestas).
- `responder.html` — página pública donde el paciente contesta una encuesta con su link.
- `config.js` — conexión a la base de datos (Supabase) y URL opcional de Drive.
- `drive-pagos.gs` — Google Apps Script que guarda los comprobantes en Drive › Pagos.

## Conectar los comprobantes a Google Drive
1. Entra a https://script.google.com con la cuenta dueña de la carpeta y crea un **Nuevo proyecto**.
2. Borra el contenido y pega todo `drive-pagos.gs`. Guarda.
3. En el menú de funciones elige `crearCarpetaPagos` y pulsa **Ejecutar**. Acepta los permisos.
   Se crea la carpeta **Pagos** dentro de tu carpeta.
4. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la URL que termina en `/exec` y pégala en `index.html`:
   `const DRIVE_UPLOAD_URL = 'https://script.google.com/macros/s/.../exec';`
6. Publica `index.html` en tu propio hosting (por ejemplo GitHub Pages). Cada comprobante
   que suba un paciente se guarda como `AAAA-MM-DD_HHMM_Nombre-Paciente.jpg` en Drive › Pagos.

Nota: la vista previa en claude.ai no puede conectarse a sitios externos, así que ahí
los comprobantes se quedan en el navegador y aparecen como "Drive sin conectar".

## Pacientes y encuestas (Supabase)
Los pacientes, encuestas y respuestas se guardan en el proyecto de Supabase **psicoagenda**.
Cada psicóloga entra con su correo y contraseña y solo ve sus propios datos.

Configuración necesaria una sola vez, para que el correo de confirmación de cuenta funcione:
1. Abre https://supabase.com/dashboard/project/welweahxizjuufjyzbkj/auth/url-configuration
2. En **Site URL** escribe `https://romeror2402.github.io/psicoagenda/`
3. En **Redirect URLs** agrega `https://romeror2402.github.io/psicoagenda/**` y guarda.

Cómo funciona el link de encuesta:
- Cada paciente recibe un link personal (`responder.html?t=...`) imposible de adivinar.
- Al abrirlo se le pide su teléfono; si no coincide con el registrado, no ve nada.
  Después de 5 intentos fallidos el link se bloquea.
- Solo se puede responder una vez. La respuesta queda guardada con el nombre y teléfono del paciente.
