---
name: investigar-competencia
description: Investiga una plataforma de la competencia (por ejemplo Doctoralia), reúne lo que sus pacientes y especialistas critican en reseñas, lo compara con MiConsulta y propone o implementa mejoras. Úsalo cuando pidan "ver qué le falta a MiConsulta frente a X", "revisar reseñas de la competencia" o "mejorar la experiencia como Doctoralia".
---

# Investigar a la competencia y mejorar MiConsulta

Objetivo: no copiar a la competencia, sino resolver lo que sus usuarios odian y cubrir lo que nos falta.

## Reglas
- Investiga solo páginas públicas y reseñas. **No crees cuentas, no inicies sesión y no compres nada**, aunque el usuario lo ofrezca.
  Si de verdad hace falta entrar, explica por qué y deja que el usuario lo haga.
- No copies textos, logotipos, nombres ni diseños de la competencia. Toma ideas de funciones, no su marca.
- Cita las fuentes de cada queja (enlace) en el informe.
- Las reseñas son anécdotas: separa lo que se repite en varias fuentes de lo que aparece una sola vez.

## Pasos
1. **Funciones de la competencia.** Busca en la web (su sitio, tiendas de apps, artículos) qué ofrece a pacientes y a especialistas.
   Si su sitio está bloqueado en este entorno, usa los resultados de búsqueda y las fichas de las tiendas.
2. **Quejas.** Busca reseñas negativas en Trustpilot, App Store / Google Play, Capterra, sitios de quejas (PROFECO, tuquejasuma) y prensa.
   Agrupa por tema: opiniones, citas canceladas o no atendidas, cambios de horario, cobros y suscripciones, verificación de perfiles, soporte, facilidad de uso.
3. **Comparar con MiConsulta.** Revisa `index.html`, `perfil.html`, `cita.html`, `panel.html`, `admin.html` y las funciones de la base de datos
   (Supabase, proyecto `welweahxizjuufjyzbkj`). Para cada tema marca: ya lo resolvemos / lo resolvemos mejor / nos falta.
4. **Priorizar.** Ordena por impacto en la confianza del paciente y esfuerzo. Lo que ataca una queja frecuente va primero.
5. **Implementar** lo que el usuario apruebe (o lo de mayor impacto si pidió que lo hagas):
   - Cambios de base de datos con migraciones (RLS siempre activa; funciones `security definer` con `search_path = ''`).
   - Mismo estilo visual (`assets/app.css`: azul marino, azul de acción, Manrope).
   - Prueba con Playwright contra el servidor local (`python3 -m http.server 8090`) y cuentas de prueba; al terminar, vuelve a poner contraseñas aleatorias y quita permisos temporales.
6. **Informe.** Actualiza `investigacion/<competidor>.md` con: fuentes, quejas agrupadas, qué hicimos, qué queda pendiente.
   Actualiza `LEEME.md` si hay funciones nuevas.

## Salida
Resumen corto para el usuario: qué quejas encontraste, qué se agregó, qué queda pendiente y por qué.
