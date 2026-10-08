# ADR 0002: Monolito Express + SPA React/Vite

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: `package.json`, `server.ts`, `railway.json`, `package.json` (scripts `build` y `start`).

## Contexto

Un solo equipo (una persona más asistencia de IA) mantiene API, UI y agentes. Necesita desplegar rápido y sin coordinar dos servicios.

## Decisión

Un único repositorio y un único proceso en producción: Express 4 sirve la API y los ficheros de la SPA de React 19 construida con Vite 6. El build genera `dist/server.cjs` (esbuild) y el frontend estático. Se despliega en Railway con healthcheck en `/api/health`.

## Alternativas descartadas

- **Next.js (full-stack):** habría unificado framework, pero el servidor tiene procesos en segundo plano (scheduler, workers de cola) que encajan mal con serverless.
- **Frontend y API separados en dos servicios:** más coordinación de despliegues y de versiones sin ganar nada con un solo equipo.
- **Microservicios para los agentes:** complejidad operativa desproporcionada para el volumen actual.

## Consecuencias

- Despliegue atómico y un único lugar donde buscar.
- Los procesos en segundo plano viven en el mismo proceso que la API: ver [ADR 0007](./0007-scheduler-en-proceso.md).
- El bundle del servidor es un CJS de un fichero: el tamaño y el arranque dependen de `esbuild --packages=external`.
