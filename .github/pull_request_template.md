## Resumen

<!-- Qué cambia y por qué (2-4 líneas). El "por qué" importa más que el "qué": el diff ya dice qué cambió. -->

## Rama base

- [ ] Este PR apunta a `develop` (rama activa), no a `main` (solo la toca el entorno de producción de Railway y suele ir por detrás)

## Plan de pruebas

- [ ] `npx tsc --noEmit` sin errores nuevos (el ratchet de CI tolera un margen pequeño sobre el `BASELINE` de `.github/workflows/ci.yml`, pero no añadas más)
- [ ] `npm run lint` (esbuild dry-run bundle, no ESLint) sin errores
- [ ] Si añadiste o cambiaste rutas: `npm run docs:api` y `docs/api/` commiteado (CI lo comprueba)
- [ ] `npx vitest run` en verde — si algún test falla ya en la base sin tu cambio, dilo explícitamente aquí en vez de ocultarlo
- [ ] Verificación manual en el navegador si el cambio toca UI/frontend (el tsc/lint/tests no prueban que la funcionalidad funcione, solo que compila)

## Multi-tenancy y seguridad (si el PR toca datos de banda, agentes o auth)

- [ ] Cualquier ruta nueva que lea/escriba datos de banda resuelve el `band_id` con `getTargetBandId(req)` (`server/utils/bandAccess.ts`), nunca desde `req.body.bandId` o el header directo
- [ ] Cualquier `dbUpsertX` nuevo en `server/db/*.ts` recibe el `band_id` ya resuelto por la ruta, y no hace `cleanBandId(objeto.band_id || bandId)` (ver `server/db/__tests__/bandIdTrustBoundary.test.ts`)
- [ ] Si toca los agentes de booking (Scout/Redactor/Enviador/Lector): el envío real sigue pasando por aprobación humana explícita, sin excepciones para "modo hands-off"
- [ ] Si añade un endpoint que llama a un modelo de IA de pago: tiene `requireAuth` + un rate limiter de `server/middleware/rateLimiter.ts`
