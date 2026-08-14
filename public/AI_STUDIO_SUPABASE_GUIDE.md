# Guía de Integración con Supabase para AI Studio

Esta guía está diseñada para proporcionar al modelo e interfaz de **AI Studio** la especificación técnica completa de la base de datos PostgreSQL en **Supabase** de la aplicación **Band Manager**.

---

## 1. Arquitectura de Base de Datos y Supabase SDK

La aplicación utiliza la librería `@supabase/supabase-js` para conectarse a Supabase. Toda la persistencia de datos (conciertos, ensayos, salas/leads, repertorios, publicaciones en redes sociales y finanzas) ha sido migrada desde Google Sheets a **PostgreSQL nativo en Supabase**.

### Variables de Entorno Requeridas

Asegúrate de tener configuradas las siguientes claves en la pestaña **Secrets / Environment Variables** de AI Studio:

```env
SUPABASE_URL="https://brynltixytuyjdfdupjx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="band-media"
```

---

## 2. Esquema Relacional de Tablas (DDL)

El archivo [`supabase_schema.sql`](file:///c:/Users/Diego.delaCalle/OneDrive%20-%20Kantar/Desarrollos_One_Drive/Matchings_Antigravity/old/AIronLabs/BandManager/Band_Manager_Application/supabase_schema.sql) define las siguientes 19 tablas relacionales:

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
import { getSupabase } from "./server/db.js";

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

## 4. Prompt Máster para pedir cambios en AI Studio

Cuando utilices **AI Studio** para construir o extender funcionalidades de Band Manager, copia y pega el siguiente prompt:

> **PROMPT PARA AI STUDIO (Migración Completa):**
> 
> "He dejado el archivo de documentación de la migración en la carpeta `public` del proyecto (busca **`public/AI_STUDIO_SUPABASE_GUIDE.md`**) y el esquema completo está al final de ese documento. Por favor, revisa esa guía primero para entender el esquema multi-tenant y cómo funcionan las consultas con JSONB en este proyecto.
> 
> Tu objetivo es realizar la **migración completa y de una sola vez** de TODAS las rutas del proyecto que aún dependen de Google Sheets.
> 
> **Paso a paso a seguir:**
> 1. Analiza **todas las rutas** dentro de la carpeta `server/routes/` y detecta todos los endpoints y funciones que sigan llamando al sistema antiguo de Google Sheets.
> 2. Redacta todas las funciones CRUD equivalentes que necesitamos añadir en `server/db.ts` usando `@supabase/supabase-js`. Valida los errores devueltos por Supabase y aplica el filtro `band_id` en todas las operaciones.
> 3. Refactoriza el código de TODAS esas rutas para que consuman tus nuevas funciones de `db.ts`.
> 
> **Formato de Salida:**
> - Devuélveme el código completo que debo añadir a `server/db.ts` con todas las funciones juntas.
> - A continuación, devuélveme los bloques de código exactos que debo reemplazar en cada archivo de la carpeta `server/routes/`, separados por comentarios claros (ej. `// --- server/routes/songs.ts ---`).
> - Mantén el código limpio, fuertemente tipado en TypeScript y respeta las reglas de la guía multi-tenant."


## 5. DDL Completo (Esquema SQL)

``sql

-- ====================================================================
-- 0.5 FUNCIONES DE UTILIDAD (BEST PRACTICES PARA TFM)
-- ====================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- BAND MANAGER - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ====================================================================

-- 0. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. TABLA REGISTRO DE BANDAS (registered_bands)
-- ====================================================================
CREATE TABLE IF NOT EXISTS registered_bands (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    nombre_banda TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'pro',
    contacto_nombre TEXT,
    estilo_musical TEXT,
    localizacion TEXT,
    telefono TEXT,
    instagram TEXT,
    spotify_youtube TEXT,
    aforo_promedio INTEGER DEFAULT 0,
    estado_cuenta TEXT DEFAULT 'activo',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. TABLA USUARIOS (users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    plan TEXT DEFAULT 'emergente',
    band_name TEXT,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE SET NULL,
    email TEXT,
    instrument TEXT,
    avatar_color TEXT,
    password_hash TEXT,
    salt TEXT,
    google_oauth JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. TABLA INTERMEDIA USUARIOS - BANDAS (user_bands)
-- ====================================================================
CREATE TABLE IF NOT EXISTS user_bands (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_band UNIQUE (user_id, band_id)
);

-- ====================================================================
-- 4. TABLA LEADS / SALAS / MEDIOS / FESTIVALES (leads)
-- ====================================================================
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre_sala TEXT NOT NULL,
    ciudad TEXT,
    region TEXT,
    direccion TEXT,
    aforo INTEGER DEFAULT 0 CHECK (aforo >= 0),
    genero TEXT,
    tipo TEXT DEFAULT 'sala',
    email_contacto TEXT,
    telefono TEXT,
    website TEXT,
    instagram TEXT,
    contacto_nombre TEXT,
    fuente TEXT DEFAULT 'manual',
    estado TEXT DEFAULT 'nuevo',
    pitch_generado TEXT,
    fecha_envio TEXT,
    fecha_ultima_respuesta TEXT,
    contexto_extra TEXT,
    notas TEXT,
    icono TEXT,
    imagen_url TEXT,
    es_favorito BOOLEAN DEFAULT FALSE,
    es_verificado BOOLEAN DEFAULT FALSE,
    fiabilidad_score NUMERIC,
    pitch_feedback_tono NUMERIC,
    pitch_feedback_contenido NUMERIC,
    pitch_feedback_comentario TEXT,
    historial_feedback_pitch JSONB DEFAULT '[]'::jsonb,
    historial_contacto JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. TABLA MENSAJES DE EMAIL POR LEAD (lead_messages)
-- ====================================================================
CREATE TABLE IF NOT EXISTS lead_messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT,
    remitente TEXT DEFAULT 'sala',
    remitente_nombre TEXT,
    asunto TEXT,
    mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. TABLA CRM BANDAS COLABORADORAS (band_contacts)
-- ====================================================================
CREATE TABLE IF NOT EXISTS band_contacts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre_banda TEXT NOT NULL,
    estilo_musical TEXT,
    localizacion TEXT,
    estado_relacion TEXT DEFAULT 'sin_contactar',
    ultimo_contacto TEXT,
    contacto_nombre TEXT,
    email TEXT,
    telefono TEXT,
    instagram TEXT,
    spotify_youtube TEXT,
    aforo_promedio INTEGER DEFAULT 0,
    notas_colaboracion TEXT,
    ciudad_origen_swap TEXT,
    icono TEXT,
    imagen_url TEXT,
    es_favorito BOOLEAN DEFAULT FALSE,
    es_verificado BOOLEAN DEFAULT FALSE,
    fiabilidad_score NUMERIC,
    estilo_comunicacion TEXT,
    dna_expresion JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 7. TABLA ENSAYOS (rehearsals)
-- ====================================================================
CREATE TABLE IF NOT EXISTS rehearsals (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    band_name TEXT,
    fecha TEXT NOT NULL,
    hora TEXT,
    lugar TEXT,
    asistentes JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    estado TEXT DEFAULT 'programado',
    setlist_id TEXT REFERENCES setlists(id) ON DELETE SET NULL,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. TABLA CONCIERTOS (concerts)
-- ====================================================================
CREATE TABLE IF NOT EXISTS concerts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    band_name TEXT,
    fecha TEXT NOT NULL,
    ciudad TEXT,
    sala TEXT NOT NULL,
    direccion TEXT,
    cache NUMERIC DEFAULT 0 CHECK (cache >= 0),
    aforo_vendido INTEGER DEFAULT 0,
    aforo_total INTEGER DEFAULT 0,
    contrato_firmado BOOLEAN DEFAULT FALSE,
    estado_pago TEXT DEFAULT 'pendiente',
    notas TEXT,
    tipo TEXT DEFAULT 'sala',
    setlist_id TEXT REFERENCES setlists(id) ON DELETE SET NULL,
    gastos_detalle JSONB DEFAULT '{}'::jsonb,
    gastos_estimados_tipicos NUMERIC DEFAULT 0,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. TABLA EPK / DOSSIER CONFIG (epk_configs)
-- ====================================================================
CREATE TABLE IF NOT EXISTS epk_configs (
    band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    biografia TEXT,
    logo_url TEXT,
    dossier_pdf_url TEXT,
    dossier_pdf_name TEXT,
    dossier_document_url TEXT,
    dossier_document_name TEXT,
    dossier_texto_extra TEXT,
    band_photos JSONB DEFAULT '[]'::jsonb,
    rider_tecnico TEXT,
    rider_pdf_url TEXT,
    rider_pdf_name TEXT,
    enlaces_redes JSONB DEFAULT '{}'::jsonb,
    contacto_booking JSONB DEFAULT '{}'::jsonb,
    temas_destacados_ids JSONB DEFAULT '[]'::jsonb,
    incentivo_fans JSONB DEFAULT '{}'::jsonb,
    ciudades_config JSONB DEFAULT '[]'::jsonb,
    firma_email JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 10. TABLA FANS / NEWSLETTER (fans)
-- ====================================================================
CREATE TABLE IF NOT EXISTS fans (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    ciudad TEXT,
    como_conocio TEXT,
    concierto_origen_id TEXT REFERENCES concerts(id) ON DELETE SET NULL,
    concierto_origen_nombre TEXT,
    fecha_captura TEXT,
    consentimiento_rgpd BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 11. TABLA PUBLICACIONES REDES SOCIALES (social_posts)
-- ====================================================================
CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    contenido TEXT,
    estado TEXT DEFAULT 'borrador',
    responsable TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 12. TABLA PAGOS Y FINANZAS (payments)
-- ====================================================================
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    importe NUMERIC DEFAULT 0 CHECK (importe >= 0),
    fecha TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 13. TABLA MÉTRICAS SOCIALES (social_metrics)
-- ====================================================================
CREATE TABLE IF NOT EXISTS social_metrics (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    instagram INTEGER DEFAULT 0,
    tiktok INTEGER DEFAULT 0,
    youtube INTEGER DEFAULT 0,
    spotify INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 14. TABLA CANCIONES Y REPERTORIO (songs)
-- ====================================================================
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    duracion TEXT,
    duracion_segundos INTEGER DEFAULT 0,
    duracion_minutos INTEGER DEFAULT 0,
    tonalidad TEXT,
    bpm INTEGER DEFAULT 120,
    afinacion TEXT,
    album_disco TEXT,
    orden_album INTEGER,
    album TEXT,
    genero TEXT,
    tipo TEXT,
    estado TEXT,
    energia INTEGER DEFAULT 5,
    portada_url TEXT,
    favorito_general BOOLEAN DEFAULT FALSE,
    estado_tema TEXT DEFAULT 'ensayando',
    es_version_covers BOOLEAN DEFAULT FALSE,
    enlace_acordes TEXT,
    notas_internas TEXT,
    audio_principal_url TEXT,
    audio_ideas JSONB DEFAULT '[]'::jsonb,
    cifrado_texto TEXT,
    guia_sustituto JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 15. TABLA SETLISTS / LISTAS DE TEMAS (setlists)
-- ====================================================================
CREATE TABLE IF NOT EXISTS setlists (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo_formato TEXT DEFAULT 'festival',
    duracion_total_estimada_minutos INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_ultima_edicion TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 16. TABLA GIRAS Y LOGÍSTICA (tours)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    vehiculo TEXT,
    consumo_l100km NUMERIC CHECK (consumo_l100km >= 0),
    precio_carburante_eur NUMERIC,
    tipo_combustible TEXT,
    presupuesto_logistica NUMERIC,
    stops JSONB DEFAULT '[]'::jsonb,
    estado TEXT DEFAULT 'planificacion',
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 17. TABLA ESCALETA MINUTO A MINUTO (run_of_show)
-- ====================================================================
CREATE TABLE IF NOT EXISTS run_of_show (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    time TEXT NOT NULL,
    activity TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 18. TABLA CHECKLIST DE EQUIPO (gear_checklists)
-- ====================================================================
CREATE TABLE IF NOT EXISTS gear_checklists (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    label TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 19. TABLA CONFIGURACIÓN DE AUTONOMÍA IA (autonomy_configs)
-- ====================================================================
CREATE TABLE IF NOT EXISTS autonomy_configs (
    band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    dispatch_level TEXT DEFAULT 'draft_only',
    negotiation_depth TEXT DEFAULT 'filter_conditions',
    min_cache_threshold NUMERIC DEFAULT 300,
    max_cache_threshold NUMERIC DEFAULT 800,
    auto_decline_under_min_cache BOOLEAN DEFAULT FALSE,
    notify_on_every_proposal BOOLEAN DEFAULT TRUE,
    require_human_for_final_sign_off BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 20. TABLA FILTROS GUARDADOS (saved_filters)
-- ====================================================================
CREATE TABLE IF NOT EXISTS saved_filters (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    section_tab TEXT,
    search_term TEXT,
    selected_city_filter TEXT,
    status_filter TEXT,
    type_filter TEXT,
    min_capacity_filter INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 21. TABLA MENSAJES INTERNOS (messages)
-- ====================================================================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    remitente TEXT,
    mensaje TEXT,
    fecha TEXT,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA (updated_at)
-- ====================================================================
DROP TRIGGER IF EXISTS update_registered_bands_modtime ON registered_bands;
CREATE TRIGGER update_registered_bands_modtime BEFORE UPDATE ON registered_bands FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_user_bands_modtime ON user_bands;
CREATE TRIGGER update_user_bands_modtime BEFORE UPDATE ON user_bands FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_leads_modtime ON leads;
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_lead_messages_modtime ON lead_messages;
CREATE TRIGGER update_lead_messages_modtime BEFORE UPDATE ON lead_messages FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_band_contacts_modtime ON band_contacts;
CREATE TRIGGER update_band_contacts_modtime BEFORE UPDATE ON band_contacts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_rehearsals_modtime ON rehearsals;
CREATE TRIGGER update_rehearsals_modtime BEFORE UPDATE ON rehearsals FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_concerts_modtime ON concerts;
CREATE TRIGGER update_concerts_modtime BEFORE UPDATE ON concerts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_epk_configs_modtime ON epk_configs;
CREATE TRIGGER update_epk_configs_modtime BEFORE UPDATE ON epk_configs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_fans_modtime ON fans;
CREATE TRIGGER update_fans_modtime BEFORE UPDATE ON fans FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_social_posts_modtime ON social_posts;
CREATE TRIGGER update_social_posts_modtime BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_social_metrics_modtime ON social_metrics;
CREATE TRIGGER update_social_metrics_modtime BEFORE UPDATE ON social_metrics FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_songs_modtime ON songs;
CREATE TRIGGER update_songs_modtime BEFORE UPDATE ON songs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_setlists_modtime ON setlists;
CREATE TRIGGER update_setlists_modtime BEFORE UPDATE ON setlists FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_tours_modtime ON tours;
CREATE TRIGGER update_tours_modtime BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_run_of_show_modtime ON run_of_show;
CREATE TRIGGER update_run_of_show_modtime BEFORE UPDATE ON run_of_show FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_gear_checklists_modtime ON gear_checklists;
CREATE TRIGGER update_gear_checklists_modtime BEFORE UPDATE ON gear_checklists FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_autonomy_configs_modtime ON autonomy_configs;
CREATE TRIGGER update_autonomy_configs_modtime BEFORE UPDATE ON autonomy_configs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_saved_filters_modtime ON saved_filters;
CREATE TRIGGER update_saved_filters_modtime BEFORE UPDATE ON saved_filters FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS update_messages_modtime ON messages;
CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ====================================================================
-- ÍNDICES DE RENDIMIENTO (B-TREE)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_band_id ON users(band_id);

CREATE INDEX IF NOT EXISTS idx_user_bands_user ON user_bands(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bands_band ON user_bands(band_id);

CREATE INDEX IF NOT EXISTS idx_leads_band_id ON leads(band_id);
CREATE INDEX IF NOT EXISTS idx_leads_ciudad ON leads(ciudad);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_band ON lead_messages(band_id);

CREATE INDEX IF NOT EXISTS idx_concerts_band_id ON concerts(band_id);
CREATE INDEX IF NOT EXISTS idx_concerts_fecha ON concerts(fecha);

CREATE INDEX IF NOT EXISTS idx_rehearsals_band_id ON rehearsals(band_id);
CREATE INDEX IF NOT EXISTS idx_rehearsals_fecha ON rehearsals(fecha);

CREATE INDEX IF NOT EXISTS idx_songs_band_id ON songs(band_id);
CREATE INDEX IF NOT EXISTS idx_songs_titulo ON songs(titulo);

CREATE INDEX IF NOT EXISTS idx_setlists_band_id ON setlists(band_id);
CREATE INDEX IF NOT EXISTS idx_payments_band_id ON payments(band_id);
CREATE INDEX IF NOT EXISTS idx_fans_band_id ON fans(band_id);

-- ====================================================================
-- SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ====================================================================
ALTER TABLE registered_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE epk_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_of_show ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- CLAVES FORÁNEAS POST-CREACIÓN (Para dependencias circulares)
-- ====================================================================
ALTER TABLE registered_bands 
    ADD CONSTRAINT fk_registered_bands_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Políticas de acceso permissivo para service role / backend API
CREATE POLICY "Permitir acceso total al backend" ON registered_bands FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON users FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON user_bands FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON leads FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON lead_messages FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON band_contacts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON rehearsals FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON concerts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON epk_configs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON fans FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON social_posts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON payments FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON social_metrics FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON songs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON setlists FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON tours FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON run_of_show FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON gear_checklists FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON autonomy_configs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON saved_filters FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON messages FOR ALL USING (true);
``
