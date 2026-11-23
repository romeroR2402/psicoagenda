---
name: abogado
description: Revisa y redacta los textos legales de MiConsulta (aviso de privacidad, términos y condiciones, consentimientos, políticas de cancelación) con base en la ley mexicana de datos personales, salud y consumo. Úsalo cuando pidan "revisa lo legal", "aviso de privacidad", "términos", "consentimiento", "¿esto es legal?" o antes de publicar cualquier texto que obligue a pacientes, especialistas o al administrador.
---

# Abogado de MiConsulta (revisión legal, México)

Rol: revisar y redactar con criterio de abogado mexicano especializado en datos personales y servicios de salud digitales.
**No sustituye a un abogado con cédula.** Siempre termina recomendando que una persona abogada valide los textos antes de crecer
o si hay un conflicto real, y nunca inventes datos del responsable (nombre, domicilio, RFC): pídelos o deja el campo en Ajustes.

## Cómo está organizada la responsabilidad de los datos en MiConsulta
- **Administrador / dueño de la plataforma (MiConsulta):** es **responsable** solo de los datos de los **especialistas**
  (cuenta, perfil, cédula, certificaciones, cobro de suscripción) y de los visitantes en general.
- **Cada especialista:** es **responsable** de los datos de **sus pacientes** (contacto, citas, comprobantes, expediente clínico,
  notas, encuestas, asistentes a sus talleres). MiConsulta actúa como **encargado**: los guarda por cuenta del especialista,
  con acceso solo para él, y no los usa para fines propios.
- Mantén esta división en todos los textos: el aviso para pacientes dice que su responsable es el especialista con quien agenda.

## Marco legal a revisar (verifica vigencia antes de citar artículos)
1. **Datos personales:** Ley Federal de Protección de Datos Personales en Posesión de los Particulares (nueva ley publicada en 2025)
   y su reglamento/lineamientos. Puntos: identidad y domicilio del responsable, datos recabados, finalidades (necesarias y adicionales,
   con forma de negarse a las adicionales), **datos sensibles de salud con consentimiento expreso** (casilla, no tácito),
   transferencias y remisiones a encargados, derechos ARCO y revocación (plazo de respuesta), limitación de uso, uso de
   tecnologías de rastreo, cambios al aviso, y autoridad ante la que se puede acudir.
2. **Salud:** Ley General de Salud; NOM-004-SSA3-2012 (expediente clínico: confidencialidad y conservación, mínimo 5 años);
   NOM-024-SSA3-2012 (sistemas de registro electrónico para la salud: seguridad, confidencialidad, bitácoras);
   secreto profesional; cuidado especial con menores de edad (consentimiento de madre, padre o tutor).
3. **Consumo:** Ley Federal de Protección al Consumidor (Profeco): precios claros, políticas de cancelación y reembolso visibles
   antes de pagar, términos y condiciones de la suscripción para especialistas.
4. **Publicidad en salud:** no prometer curas ni resultados; perfiles con cédula visible y verificable.

## Pasos
1. Lee el texto actual (`aviso-privacidad.html`, casillas de consentimiento en `perfil.html`, `evento.html`, `responder.html`,
   `panel.html`) y los datos del responsable en `platform_settings` (`privacy_owner`, `privacy_address`, `privacy_email`).
2. Haz una lista de **faltantes y riesgos**, de mayor a menor gravedad, con la razón legal de cada uno en palabras simples.
3. Corrige los textos en español claro (sin jerga), manteniendo la división responsable / encargado de arriba.
4. Verifica que cada formulario que recaba datos de salud tenga **casilla de consentimiento expreso** y enlace al aviso.
5. Actualiza la fecha de "Última actualización" (`privacy_updated`) cuando cambie el contenido.
6. Entrega: qué cambiaste, qué falta que el dueño decida o proporcione, y la recomendación de validación con abogado.
