# ADR: Modularización de server/routes/ai_music.ts en sub-routers y módulos de motor

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de tamaño), §2 (multi-tenancy), continuación de [0041](./0041-modularizacion-song-transition-preview.md)

## Problema
`server/routes/ai_music.ts` tenía 4183 líneas: siete rutas (generación con Lyria/MusicGen, separación de stems, su estado, diagnóstico de Fal.ai y dos webhooks), cuatro motores de separación, los diagnósticos de error de cinco proveedores, la caché de stems y un único handler de ~1000 líneas para `POST /ai-stem-separation`.

## Decisión
**Primero los tests de seguridad**, sobre el código original:
- `server/routes/__tests__/superficieUsersAiMusic.test.ts`: inventario exacto de rutas, toda ruta no pública exige `requireAuth`, las de IA de pago llevan limitador, y el estado de una separación nunca lee la caché de otra banda.
- `server/routes/__tests__/separacionStems.test.ts`: `POST /ai-stem-separation` de punta a punta (caché, reserva distribuida, 202 + segundo plano, caídas entre motores, fallos registrados), siempre en la banda de la sesión. **Pasa igual contra el fichero original y contra el partido.**
- `helpers/rutas.ts`: los tests buscan handlers recorriendo sub-routers, así no dependen de en qué fichero se declaró la ruta.

Después, `ai_music.ts` queda como router contenedor que monta cuatro sub-routers y reexporta la API pública:

| Módulo (`server/routes/ai_music/`) | Contenido |
|---|---|
| `rutasGeneracion`, `generacionMusical` | `/generate`, `/ai-generate-instrument-track`; Lyria y MusicGen |
| `rutaSeparacion`, `separacionContexto`, `separacionMotores` | `/ai-stem-separation`: orquestación (caché → reserva → deduplicación → 202), contexto de la petición y un motor por función |
| `rutasEstadoStems`, `rutasWebhooks` | polling de estado, diagnóstico de Fal.ai, webhooks de Fal.ai y Replicate |
| `motorDemucs`, `motorMdx23`, `motoresNeuronales`, `motorFfmpeg` | motores de separación |
| `diagnosticos`, `diagnosticosInfra`, `cacheStems`, `formatoStems`, `audioPublico`, `modelos`, `ffmpegConfigurado` | errores de proveedor, caché y formato de stems, preparación del audio |

Los servicios de `server/services/audioSeparator/` importan directamente del módulo que usan en vez del contenedor.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `ai_music.ts` | 4183 | 48 |
| Mayor módulo | 4183 | 388 (`motorDemucs`) |
| Handler de `/ai-stem-separation` | ~1000 líneas | orquestador de ~60 + un motor por función |

## Cambios deliberados
- **Se elimina una llamada de pago que no servía para nada.** Cada `POST /ai-stem-separation` pedía a Gemini un «análisis espectral» (~130 líneas de prompt y valores por defecto) cuyo resultado no se usaba: la respuesta es un 202 y el resultado real sale de la caché por polling.
- Las tres copias del bloque de error de Replicate y las dos de «token no configurado» pasan a `falloDeReplicate` y `sinTokenDeReplicate`; las dos respuestas de caché, a `respuestaDesdeCache`; las tres de «procesando», a `respuestaProcesando`.
- `fluent-ffmpeg` se configura una vez en `ffmpegConfigurado.ts`.

## Consecuencias
Una ruta nueva va a su sub-router; si se añade o se quita una, `superficieUsersAiMusic.test.ts` obliga a declararla (y a justificar si es pública). El orden entre sub-routers de ai_music no importa porque todas sus rutas son literales distintos.
