/**
 * PsicoAgenda · Guardar comprobantes de pago en Google Drive
 *
 * Recibe la imagen que sube el paciente y la guarda en la subcarpeta "Pagos"
 * dentro de tu carpeta de Drive. Si "Pagos" no existe, la crea.
 */
const PARENT_FOLDER_ID = '1ijFsJin4mT2ZSg_duoeKU3FAs4UuqSYE';
const SUBFOLDER = 'Pagos';
const MAX_BYTES = 8 * 1024 * 1024;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!/^image\//.test(body.mimeType || '')) throw new Error('Solo se aceptan imágenes');
    const bytes = Utilities.base64Decode(body.data);
    if (bytes.length > MAX_BYTES) throw new Error('Imagen demasiado grande');

    const folder = pagosFolder_();
    const name = String(body.filename || 'comprobante.jpg').replace(/[^\w.\-]/g, '_');
    const file = folder.createFile(Utilities.newBlob(bytes, body.mimeType, name));
    file.setDescription('Paciente: ' + body.patient + ' · Cita: ' + body.date + ' ' + body.hour + ':00 · Ref: ' + (body.ref || '-'));
    return json_({ ok: true, id: file.getId(), url: file.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function pagosFolder_() {
  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  const found = parent.getFoldersByName(SUBFOLDER);
  return found.hasNext() ? found.next() : parent.createFolder(SUBFOLDER);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecútalo una vez desde el editor para autorizar y crear la carpeta "Pagos". */
function crearCarpetaPagos() {
  Logger.log('Carpeta lista: ' + pagosFolder_().getUrl());
}
