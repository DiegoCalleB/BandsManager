# Guía de Integración con Supabase para AI Studio

Esta guía está diseñada para proporcionar al modelo e interfaz de **AI Studio** la especificación técnica completa de la base de datos PostgreSQL en **Supabase** de la aplicación **Band Manager**.

---

## 1. Arquitectura de Base de Datos y Supabase SDK

La aplicación utiliza la librería `@supabase/supabase-js` para conectarse a Supabase. Toda la persistencia de datos (conciertos, ensayos, salas/leads, repertorios, publicaciones en redes sociales y finanzas) ha sido migrada desde Google Sheets a **PostgreSQL nativo en Supabase**.

### Variables de Entorno Requeridas

Asegúrate de tener configuradas las siguientes claves en la pestaña **Secrets / Environment Variables** de AI Studio:

```env
SUPABASE_URL="https://TU-PROYECTO.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_BUCKET="band-media"
```

> Nota: este documento vivía antes en `public/`, que se sirve estáticamente, así que cualquiera
> podía acceder a él en la URL de la app y ver la URL real del proyecto de Supabase, el esquema
> completo de las tablas y las políticas RLS. Se ha movido a la raíz del repo (fuera de lo que
> se sirve al navegador) y se ha quitado la URL real de ejemplo.

> **RLS — aviso real, no aspiracional:** todas las políticas de `supabase_schema.sql` son
> `USING (true)` (acceso total). RLS está activado pero no restringe nada; el aislamiento por
> `band_id` es 100% capa de aplicación (`getTargetBandId`, ver AGENTS.md §2.1 punto 4). No
> generes código en AI Studio asumiendo que la base de datos filtra por banda — no lo hace.

---

## 2. Esquema Relacional de Tablas (DDL)

**Referencia no exhaustiva** — para el esquema completo y actual, la fuente real es
[`supabase_schema.sql`](./supabase_schema.sql) (en la raíz del repo). La tabla de abajo cubre las
entidades principales del dominio para orientarse rápido; `supabase_schema.sql` tiene más tablas
de subsistemas específicos (ledger de IA, campañas de booking, aprendizaje de pitches, etc.) que
no se listan aquí para no duplicar y desincronizar dos copias del mismo esquema.

| Tabla | Descripción | Clave Primaria | Clave Foránea (`band_id`) |
| :--- | :--- | :--- | :--- |
| `registered_bands` | Registro maestro de bandas y suscripciones | `id` (TEXT) | - |
| `users` | Usuarios de la plataforma (líderes, miembros) | `id` (TEXT) | `registered_bands(band_id)` |
| `user_bands` | Tabla N:M de relación usuarios y bandas | `id` (TEXT) | `registered_bands(band_id)` / `users(id)` |
| `leads` | CRM de salas, festivales y medios | `id` (TEXT) | `registered_bands(band_id)` |
| `lead_messages` | Histórico de correos por sala | `id` (TEXT) | `leads(id)` / `registered_bands(band_id)` |
| `band_contacts` | CRM de bandas colaboradoras (swaps) | `id` (TEXT) | `registered_bands(band_id)` |
| `rehearsals` | Ensayos y convocatorias | `id` (TEXT) | `registered_bands(band_id)` |
| `concerts` | Conciertos, cachés y finanzas del show | `id` (TEXT) | `registered_bands(band_id)` |
| `epk_configs` | Configuración de dossier y EPK de prensa | `band_id` (TEXT) | `registered_bands(band_id)` |
| `fans` | Captación de fans y RGPD | `id` (TEXT) | `registered_bands(band_id)` |
| `social_posts` | Planificación de contenido en redes | `id` (TEXT) | `registered_bands(band_id)` |
| `payments` | Transacciones de ingresos y gastos | `id` (TEXT) | `registered_bands(band_id)` |
| `social_metrics` | Seguimiento de Spotify, IG, YT, TikTok | `id` (TEXT) | `registered_bands(band_id)` |
| `songs` | Catálogo de temas, audios y cifrados | `id` (TEXT) | `registered_bands(band_id)` |
| `setlists` | Repertorios y listas de temas | `id` (TEXT) | `registered_bands(band_id)` |
| `tours` | Giras y cálculo de rutas/combustible | `id` (TEXT) | `registered_bands(band_id)` |
| `run_of_show` | Escaleta minuto a minuto por concierto | `id` (TEXT) | `registered_bands(band_id)` |
| `gear_checklists` | Checklist de equipo y backline por concierto | `id` (TEXT) | `registered_bands(band_id)` |
| `autonomy_configs` | Configuración del agente de IA | `band_id` (TEXT) | `registered_bands(band_id)` |
| `saved_filters` | Filtros guardados por el usuario | `id` (TEXT) | `registered_bands(band_id)` |
| `messages` | Mensajes o notificaciones internas | `id` (TEXT) | `registered_bands(band_id)` |

---

## 3. Patrones de Desarrollo para AI Studio

### Lectura de datos aislada por Banda

```typescript
import { getSupabase } from "./server/db/core.js";

const sb = getSupabase();
const bandId = "band-bakandeya";

// Ejemplo: Consultar canciones de una banda específica
const { data: songs, error } = await sb
  .from("songs")
  .select("*")
  .eq("band_id", bandId)
  .order("titulo", { ascending: true });
```

### Operaciones con Campos JSONB

Los campos como `audio_ideas` (en canciones), `gastos_detalle` (en conciertos) o `items` (en setlists) son de tipo `JSONB`. Se pueden guardar directamente como objetos u arrays de JavaScript sin necesidad de utilizar `JSON.stringify()`.

```typescript
// Guardar o actualizar un concierto con desglose de gastos en JSONB
await sb.from("concerts").upsert({
  id: "cnc-madrid-1",
  band_id: "band-bakandeya",
  sala: "Sala Caracol",
  fecha: "2026-11-20",
  gastos_detalle: {
    gasolina: 120,
    alojamiento: 200,
    dietas: 90
  }
});
```

---

## 4. Migración de Google Sheets a Supabase — ya completada

Esta sección tenía antes un "Prompt Máster" para pedirle a AI Studio que migrara rutas de `server/routes/` que aún llamaban a Google Sheets. **Esa migración ya terminó** (AGENTS.md §1: "Google Sheets está totalmente descartado y en desuso. No se debe mencionar ni utilizar"). Se ha retirado el prompt porque, si alguien lo copia y pega hoy, manda a un agente a buscar código de Sheets que ya no existe — pura pérdida de tiempo y confusión. Si en el futuro aparece código residual de Sheets (no debería), trátalo como una excepción puntual a arreglar, no relanzando esta migración completa.

## 5. DDL Completo (Esquema SQL)

Para el DDL completo y actualizado, usa directamente [`supabase_schema.sql`](./supabase_schema.sql) — no se duplica aquí. La sección 1 de este documento (variables de entorno) y la 3 (patrones de lectura/JSONB) siguen siendo la referencia rápida para AI Studio; el esquema en sí tiene una sola fuente.
