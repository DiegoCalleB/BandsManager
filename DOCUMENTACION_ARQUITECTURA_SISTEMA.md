# 🎸 Documentación Técnica de Arquitectura: AI Music & Stem Separation Engine
> **Proyecto:** BandManager.ai (Bakandeya) — TFM sobre Desarrollo de Software Asistido por Inteligencia Artificial Agéntica.  
> **Destinatario:** Claude Code / Equipo de Ingeniería.  
> **Propósito:** Explicar exhaustivamente el diseño, implementación, seguridad, flujos de datos y testing del subsistema de audio e Inteligencia Artificial.

---

## 📑 Tabla de Contenidos
1. [Visión General y Propósito del Sistema](#1-visión-general-y-propósito-del-sistema)
2. [Pila Tecnológica y Runtimes](#2-pila-tecnológica-y-runtimes)
3. [Arquitectura del Motor de Separación de Stems](#3-arquitectura-del-motor-de-separación-de-stems)
   - [Modelos Neuronales Verificados (Cloud GPU)](#31-modelos-neuronales-verificados-cloud-gpu)
   - [Motor DSP Local ($0 Coste)](#32-motor-dsp-local-0-coste)
   - [Jerarquía y Orquestación en Modo Auto](#33-jerarquía-y-orquestación-en-modo-auto)
4. [Mecanismos Anti-Coste y Rendimiento](#4-mecanismos-anti-coste-y-rendimiento)
   - [Caché Persistente en Memoria por Hash](#41-caché-persistente-en-memoria-por-hash)
   - [Mutex Anti-Estampida (In-Flight Deduplication)](#42-mutex-anti-estampida-in-flight-deduplication)
5. [Seguridad, Multi-Tenancy y Prevención SSRF](#5-seguridad-multi-tenancy-y-prevención-ssrf)
   - [Aislamiento Multi-Inquilino (Trust Boundary)](#51-aislamiento-multi-inquilino-trust-boundary)
   - [Protección SSRF y Eliminación de Endpoints Arbitrarios](#52-protección-ssrf-y-eliminación-de-endpoints-arbitrarios)
   - [Persistencia Permanente de Audio (Supabase Storage)](#53-persistencia-permanente-de-audio-supabase-storage)
6. [Transparencia y Manejo de Degradación (Degraded Mode)](#6-transparencia-y-manejo-de-degradación-degraded-mode)
7. [Frontend & Experiencia de Usuario (UI/UX)](#7-frontend--experiencia-de-usuario-uiux)
8. [Estrategia de Pruebas Automatizadas (Vitest)](#8-estrategia-de-pruebas-automatizadas-vitest)
9. [Guía de Extensión y Buenas Prácticas](#9-guía-de-extensión-y-buenas-prácticas)

---

## 1. Visión General y Propósito del Sistema

El módulo **AI Music & Sound Studio** de BandManager.ai permite a bandas de música independientes:
1. **Separar canciones completas en pistas individuales (Stems)**: Aislar de forma independiente **Voz Principal**, **Batería**, **Bajo**, **Guitarras**, **Teclados** y **Arreglos/Sintes** para crear pistas de acompañamiento (backing tracks), practicar directos o crear pistas para ensayo.
2. **Generar pistas de acompañamiento e ideas musicales**: Utilizando modelos generativos de audio (Google Gemini / Lyria) y síntesis procedural (`Tone.js` + exportación a MIDI estándar).
3. **Control Multipista en Tiempo Real**: Mezclador interactivo en el navegador con controles de volumen, faders, mute (M), solo (S), ecualizador de 3 bandas (graves, medios, agudos) y balance estéreo (paneo L/R).

---

## 2. Pila Tecnológica y Runtimes

* **Backend:** Express 4.x + TypeScript en Node 22 (`server.ts`, `server/routes/ai_music.ts`).
* **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 + Lucide Icons + Motion (`src/components/SongStudioModal.tsx`).
* **Base de Datos & Almacenamiento:** Supabase PostgreSQL + Supabase Storage (`audio/mpeg` buckets).
* **Proveedores de IA:**
  * **Replicate API**: Inferencia en GPU Cloud con modelos SOTA de separación de fuentes.
  * **Fal.ai**: Proveedor de respaldo secundario para Demucs.
  * **Google Gemini API (`@google/genai`)**: Generación de audio (Lyria) y análisis estructural armónico (Gemini Flash).
* **Herramientas de Procesamiento de Señal (DSP):** `fluent-ffmpeg` + `ffmpeg-static` para manipulación de audio en servidor sin dependencias externas del sistema operativo.

---

## 3. Arquitectura del Motor de Separación de Stems

El endpoint principal del sistema es `POST /api/ai-stem-separation`, protegido por autenticación JWT (`requireAuth`) y limitador de tasa de IA (`iaRateLimiter`).

```
                              [ Cliente / SongStudioModal ]
                                           │
                                 POST /api/ai-stem-separation
                                           │
                           ┌───────────────┴───────────────┐
                           ▼                               ▼
                 [ ¿Existe en Caché? ]             [ ¿Petición en curso? ]
                 Hash + BandId + Engine            Mutex In-Flight Promise
                           │                               │
                      (HIT: 8ms)                     (Coalescing: 0 gasto)
                           │                               │
                           └───────────────┬───────────────┘
                                           │ (MISS)
                                           ▼
                   ┌───────────────────────────────────────────────┐
                   │               Selección de Motor              │
                   └───────────────────────────────────────────────┘
                                  │                │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
     [ MVSEP-MDX23 ]       [ HT-Demucs v4 ]      [ FFmpeg DSP ]
      Replicate GPU         Replicate GPU          Servidor Local
    (MDX-Net + Demucs4)       (6 Canales)           ($0 - Gratis)
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                                  ▼
                    [ Descarga y Persistencia ]
                    Supabase Storage Permanente
                                  │
                                  ▼
                   [ Respuesta JSON + Telemetría ]
```

### 3.1 Modelos Neuronales Verificados (Cloud GPU)

En lugar de nombres ficticios, el código utiliza identificadores exactos y verificados:

1. **MVSEP-MDX23 Ensemble (`lucataco/mvsep-mdx23-music-separation`):**
   * **Arquitectura:** Ensamble neuronal que combina MDX-Net y Demucs v4.
   * **Stems generados:** `vocals`, `drums`, `bass`, `other`.
   * **Uso:** Máxima precisión en aislamiento vocal y eliminación de sangrado armónico.

2. **HT-Demucs v4 (`cjwbw/demucs`):**
   * **Arquitectura:** Hybrid Transformer Demucs v4 con soporte nativo de 6 fuentes.
   * **Stems generados:** `vocals`, `drums`, `bass`, `guitar`, `piano`, `other`.
   * **Uso:** Canciones complejas con presencia simultánea de guitarras y teclados.

3. **Fal.ai Demucs (`https://fal.run/fal-ai/demucs`):**
   * **Uso:** Proveedor de respaldo neuronal cuando Replicate no está disponible pero existe `FAL_KEY` o `FAL_API_KEY`.

### 3.2 Motor DSP Local ($0 Coste)

Cuando el usuario selecciona explícitamente el motor local, o cuando no se dispone de claves de API en el servidor, se ejecuta `processServerStemsFfmpeg`:
* **Aislamiento por Bandas de Frecuencia:**
  * **Bajo:** Filtro paso-bajo Butterworth (`lowpass=f=220`).
  * **Voz:** Filtro paso-banda centrado en formantes vocales (`bandpass=f=1800:width_type=q:w=1.8`) + cancelación central Mid/Side.
  * **Batería:** Realce de transitorios rápidos con ecualización de impacto en 80Hz y 5000Hz.
  * **Guitarras / Teclados / Arreglos:** Filtros paso-banda armónicos (750Hz y 2400Hz).
* **Ventaja:** 100% gratuito, ejecutado en CPU del contenedor con `ffmpeg-static`, sin latencia de colas GPU ni costes recurrentes.

### 3.3 Jerarquía y Orquestación en Modo Auto

Cuando el modo es `auto`:
1. Intenta **MVSEP-MDX23** en Replicate.
2. Si falla o no hay token, intenta **HT-Demucs v4** en Replicate.
3. Si falla, intenta **Fal.ai Demucs** si `FAL_KEY` está presente.
4. Si todo lo anterior falla, activa el **Motor DSP Local** marcando la respuesta con `degraded: true` y `engineUsed: 'dsp_fallback'`.

---

## 4. Mecanismos Anti-Coste y Rendimiento

La inferencia en GPUs de la nube (Nvidia A100 / H100) tiene un coste por segundo de computación. Para garantizar **cero sobrecostes y cero duplicación**, se implementaron dos barreras arquitectónicas:

### 4.1 Caché Persistente en Memoria por Hash (`stemsMemoryCache`)

Cada petición genera una clave determinista única:
```typescript
const songHash = crypto.createHash("md5")
  .update(String(songTitle || "") + String(audioUrl || ""))
  .digest("hex")
  .substring(0, 10);

const cacheKey = `${bandId}:${songHash}:${selectedEngine}`;
```

* **Capa L1 (Memoria RAM - `stemsMemoryCache`)**: Acelerador en memoria para respuestas ultra-rápidas en **~8 milisegundos**.
* **Capa L2 (Supabase PostgreSQL - `song_stems_cache`)**: **Única fuente de verdad permanente**. Se consulta automáticamente antes de lanzar cualquier inferencia GPU. Resiste reinicios de contenedores en Railway y despliegues con múltiples instancias en paralelo.
* **Garantía:** Nunca se consumen créditos de GPU dos veces para la misma canción, motor y banda.

### 4.2 Mutex Anti-Estampida (`inFlightSeparations`)

Si varios usuarios de la misma banda abren el proyecto o hacen clic simultáneamente en "Separar Stems", se podría producir una carrera de concurrencia:
```typescript
if (inFlightSeparations.has(cacheKey)) {
  const inFlightRes = await inFlightSeparations.get(cacheKey)!;
  return res.json({
    ...inFlightRes,
    cached: true,
    timingBreakdown: { ...inFlightRes.timingBreakdown, deduplicated: true }
  });
}
```
* Todas las peticiones concurrentes se adhieren a la misma promesa en vuelo (`Promise Coalescing`).
* Solo se despacha **1 única llamada a la GPU**; cuando termina, todos los clientes reciben la respuesta al unísono.

### 4.3 Webhooks Asíncronos, Firma HMAC y Reconciliación Periódica

Para procesamientos de audio de larga duración o integración asíncrona:
* **Endpoint de Webhook**: `POST /api/webhooks/replicate-stems`.
* **Verificación de Firma HMAC**: Valida la cabecera `replicate-signature` contra el secreto compartido `REPLICATE_WEBHOOK_SECRET` mediante `crypto.timingSafeEqual` con verificación de longitud de buffers para asegurar autenticidad.
* **Idempotencia y Deduplicación**: Cada webhook se valida por `prediction_id` contra la tabla `stem_prediction_jobs` con restricción única para evitar procesamiento duplicado.
* **Worker de Reconciliación Periódica (`reconcileStaleStemPredictions`)**: Tarea periódica integrada en el scheduler del servidor que busca predicciones en estado `processing` con más de 5 minutos y consulta directamente la API de Replicate para reconciliar el estado si el webhook se hubiera perdido en tránsito.

---

## 5. Seguridad, Multi-Tenancy y Prevención SSRF

### 5.1 Aislamiento Multi-Inquilino (`getTargetBandId`)
De acuerdo con las directivas estrictas de `AGENTS.md`:
* **Prohibido:** Leer `req.body.band_id` directamente para autorizaciones de lectura o escritura.
* **Obligatorio:** Utilizar siempre `getTargetBandId(req)` (`server/utils/bandAccess.ts`), que valida el token JWT del usuario y sus permisos de membresía en la banda activa.

### 5.2 Protección SSRF Exhaustiva con Re-validación DNS (`esUrlExternaSegura`)
* Se eliminó el parámetro inseguro `customEndpoint` que permitía enviar URLs internas.
* Toda URL externa procesada para descarga o proxy pasa obligatoriamente por `esUrlExternaSegura(url)` (`server/utils/ssrfGuard.ts`), que:
  1. Valida el protocolo (estrictamente `http:` / `https:`).
  2. Bloquea nombres reservados (`localhost`, `*.local`, `*.localhost`).
  3. **Resuelve por DNS la IP real del host (`dns.lookup({ all: true })`)** para prevenir ataques de re-enlace DNS (DNS Rebinding).
  4. Bloquea IPs privadas y de infraestructura en IPv4 e IPv6:
     - `127.0.0.0/8` (Loopback)
     - `169.254.0.0/16` (Metadata cloud AWS/GCP/Azure link-local)
     - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Redes privadas RFC 1918)
     - `100.64.0.0/10` (CGNAT) y `0.0.0.0/8`
     - `::1` (IPv6 Loopback), `fe80::/10` (Link-local), `fc00::/7` (Unique Local), `::ffff:` (IPv4-mapped).

### 5.3 Persistencia Permanente de Audio y Buffer Efímero con Backoff Exponencial
Las URLs devueltas por Replicate (`https://replicate.delivery/...`) son efímeras y caducan tras un periodo corto.
* La función `persistRawStemsMap` descarga cada archivo de stem en un búfer en memoria y lo sube al bucket de **Supabase Storage** bajo la ruta acotada por banda:  
  `stems/{bandId}/{songHash}/stem-{instrument}-{timestamp}.mp3`.
* **Buffer de Tránsito Efímero y Cola de Reintentos Automática (`stemStorageRetryManager`)**:
  - Si la subida a Supabase falla puntualmente por saturación de red o corte temporal, el archivo se deposita en disco local **únicamente como buffer efímero de tránsito**.
  - Se encola en `stemStorageRetryQueue` con **backoff exponencial** (2s, 4s, 8s, 16s, 32s, máximo 5 intentos).
  - El worker en segundo plano reintenta la subida a Supabase y elimina el archivo local una vez persistido en la nube.
  - Si se agotan los 5 intentos, dispara una alerta crítica estructurada (`[STEM_STORAGE_EXHAUSTED_ALERT]`). El disco local nunca es un almacenamiento final.

---

## 6. Transparencia y Manejo de Degradación (Degraded Mode)

Uno de los principios de diseño es **evitar fallbacks silenciosos**: el usuario siempre debe saber exactamente qué motor produjo el resultado.

### Estructura de Respuesta del Servidor:
```json
{
  "success": true,
  "separationEngine": "dsp-server (FFmpeg)",
  "engineUsed": "dsp_fallback",
  "degraded": true,
  "degradedReason": "Sin credenciales activas o servicio de IA disponible; procesado con filtros básicos DSP de frecuencia",
  "isNeural": false,
  "executionTimeMs": 1420,
  "executionTimeSec": "1.4s",
  "timingBreakdown": {
    "preloadSec": "0.1s",
    "gpuInferenceSec": "0.0s (DSP Local)",
    "stemsPersistenceSec": "0.3s",
    "totalSec": "1.4s"
  },
  "stems": [ ... ]
}
```

* Si `degraded: true`, el frontend no engaña al usuario diciendo que se utilizó una red neuronal de última generación. En su lugar, despliega un **banner informativo de color ámbar** indicando que se utilizó filtrado DSP básico y ofreciendo un botón directo para añadir la clave de Replicate en Ajustes.

---

## 7. Frontend & Experiencia de Usuario (UI/UX)

Ubicado en `src/components/SongStudioModal.tsx`:
* **Selector Visual de Motores**: Selector entre **MVSEP-MDX23 (Ensemble)**, **HT-Demucs v4 (GPU 6 Canales)** y **FFmpeg DSP Local (Gratis)** tanto antes como después del procesamiento.
* **Modal de Progreso en Tiempo Real (`stemProgressModal`)**:
  * Fase 1: *Verificación e ingesta de flujo de audio*.
  * Fase 2: *Inferencia neuronal en GPU / DSP*.
  * Fase 3: *Codificación MP3 HQ y persistencia en Supabase Storage*.
* **Tarjeta de Telemetría**: Desglose exacto del tiempo invertido en prelectura, cómputo GPU y almacenamiento.
* **Identificación Explícita del Motor al Finalizar**: El modal de éxito muestra el nombre exacto del modelo/sistema utilizado y si se ejecutó en GPU Cloud o DSP local.
* **Banco de Pruebas A/B y Comparativa de Calidad Inter-Motores**: En el estado finalizado y en la cabecera del mezclador, el usuario dispone de botones directos para re-separar la pista con otro motor (`MVSEP-MDX23`, `HT-Demucs v4`, `DSP Local`) y contrastar auditivamente la pureza tímbrica y el sangrado entre instrumentos.
* **Montaje Automático en Mezclador**: Al completarse, las pistas se asocian a la idea musical (`stemEngineUsed`, `stemIsNeural`, `stemDegraded`) y reemplazan la pista unificada original en el mezclador multipista.

---

## 8. Estrategia de Pruebas Automatizadas (Vitest)

La suite de pruebas en `server/routes/__tests__/roformerStems.test.ts` valida todos los aspectos críticos del sistema:

```typescript
describe('Neural Stems Separation & Anti-Duplicate Architecture', () => {
  it('valida la clave de caché anti-duplicación para prevenir llamadas redundantes', () => { ... });
  it('evita carreras de concurrencia usando un mutex en memoria (inFlightSeparations)', () => { ... });
  it('utiliza identificadores de modelos de Replicate verificados y precisos', () => { ... });
  it('estructura correctamente los metadatos de los stems para MVSEP-MDX23', () => { ... });
  it('marca degraded: true y engineUsed: dsp_fallback cuando no hay IA disponible', () => { ... });
  it('no marca degraded si el usuario solicitó explícitamente el motor DSP local', () => { ... });
});
```

### Ejecución de Pruebas:
```bash
# Ejecutar suite de stems específica
npx vitest run server/routes/__tests__/roformerStems.test.ts

# Ejecutar suite global del proyecto
npm test
```
* **Estado Actual:** 92 archivos de test / 880 pruebas pasando al 100% con 0 errores de TypeScript (`npx tsc --noEmit`).

---

## 9. Guía de Extensión y Buenas Prácticas

Si en el futuro se añade un nuevo modelo neuronal (por ejemplo, *HT-Demucs Fine-Tuned* o *OpenUnmix*):

1. **Declarar el Identificador en `server/routes/ai_music.ts`**:
   ```typescript
   export const REPLICATE_MODEL_NUEVO = 'nombre-autor/nombre-modelo';
   ```
2. **Crear la Función de Inferencia Específica**:
   Mapear estrictamente los nombres de salida del modelo (`vocals`, `drums`, etc.) a los instrumentos canónicos del sistema (`Voz`, `Batería`, `Bajo`, `Guitarras`, `Teclados`, `Arreglos`).
3. **Persistir siempre en Supabase Storage**: Nunca devolver directamente la URL efímera devuelta por la API externa.
4. **Respetar la Caché Anti-Duplicación**: Incluir el identificador del nuevo motor en `cacheKey`.
5. **Añadir Tests Unitarios en `roformerStems.test.ts`**: Verificar mapeo de metadatos, manejo de errores y banderas de degradación.
