# PsicoAgenda

App web para que una psicóloga gestione citas, pagos y encuestas, con una vista para pacientes.

## Archivos
- `index.html` — la app completa (ábrela en el navegador).
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
