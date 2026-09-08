# 🗄️ Database Schema - Supabase (PostgreSQL)

Estructura completa de la BD de BandManager.ai. **Supabase es la única fuente de verdad.** Google Sheets: NUNCA.

---

## 📊 Diagrama ER (Relaciones Principales)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ password_hash   │
│ band_id (FK)    │◄──┐
│ role            │   │
│ created_at      │   │
└─────────────────┘   │
                      │
                ┌─────┴──────────┐
                │                │
        ┌───────▼─────────┐  ┌───▼──────────────┐
        │     bands       │  │  band_members    │
        ├─────────────────┤  ├──────────────────┤
        │ id (PK)         │  │ id (PK)          │
        │ name            │  │ user_id (FK)     │
        │ slug            │  │ band_id (FK)     │
        │ plan            │  │ role             │
        │ country         │  └──────────────────┘
        │ city            │
        │ created_at      │
        └───────┬─────────┘
                │
   ┌────────────┼────────────┬──────────────┐
   │            │            │              │
┌──▼────────┐ ┌─▼────────┐ ┌─▼──────────┐ ┌─▼──────────────┐
│   leads   │ │concerts  │ │ songs      │ │autonomy_configs│
│(Booking)  │ │(Logistics)│ │(Repertoire)│ │(AI Config)     │
└───────────┘ └──────────┘ └────────────┘ └────────────────┘
   │
   ├─ lead_messages (hilo de conversación)
   ├─ lead_audit_log (auditoría de transiciones)
   └─ lead_enrichment (datos enriquecidos)
```

---

## 🔑 Tablas Principales

### 1. `users` — Autenticación & Identificación

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- PBKDF2
  band_id UUID NOT NULL,                 -- Banda principal del usuario
  role VARCHAR(50) DEFAULT 'member',     -- 'member', 'leader', 'admin'
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_band_id ON users(band_id);
```

**Notas:**
- `band_id` es la banda "principal" del usuario (fallback si no hay header `x-band-id`)
- Un usuario puede ser miembro de múltiples bandas (ver `band_members`)
- `role`: 'member' (lecturas), 'leader' (escrituras + aprob de agents), 'admin' (platform-wide)

---

### 2. `bands` — Tenants (Bandas)

```sql
CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,              -- Para EPK público (/epk/:slug)
  plan VARCHAR(50) DEFAULT 'promo',      -- 'promo','ensayo','local','de_gira','cabeza_de_cartel'
  country VARCHAR(100),
  city VARCHAR(100),
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  
  -- Sociales
  instagram_url TEXT,
  youtube_url TEXT,
  spotify_url TEXT,
  tiktok_url TEXT,
  
  -- Configuración
  genre VARCHAR(100),
  year_formed INT,
  member_count INT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(slug)
);

CREATE INDEX idx_bands_plan ON bands(plan);
CREATE INDEX idx_bands_slug ON bands(slug);
```

**Notas:**
- `slug` es único y usado en EPK público
- `plan` determina features + límites (`promo` = sin booking, solo EPK)

---

### 3. `band_members` — Multi-Tenancy Explícita

```sql
CREATE TABLE band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  band_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'member',     -- 'member','leader'
  joined_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  UNIQUE(user_id, band_id)
);

CREATE INDEX idx_band_members_user_id ON band_members(user_id);
CREATE INDEX idx_band_members_band_id ON band_members(band_id);
```

**Notas:**
- Permite que un usuario sea miembro de N bandas
- `getTargetBandId(req)` valida que usuario esté aquí

---

### 4. `leads` — Core del Booking CRM

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,                 -- ⚠️ CRÍTICO: filter por esto siempre
  
  -- Info de la sala
  venue_name VARCHAR(255) NOT NULL,
  venue_email VARCHAR(255),
  venue_phone VARCHAR(20),
  venue_country VARCHAR(100),
  venue_city VARCHAR(100),
  venue_website_url TEXT,
  venue_capacity INT,
  venue_genre VARCHAR(100),
  
  -- Estado CRM (Dimensión 1)
  estado VARCHAR(50) DEFAULT 'nuevo',    -- 'nuevo','contactado','respondido','negociando','confirmado','aplazado','no_interesado'
  
  -- Estado Agéntico (Dimensión 2)
  agentic_status VARCHAR(50),            -- 'pendiente_aprobacion','aprobado_propuesta','aprobado_respuesta','borrador_creado'
  
  -- Pitch & Comunicación
  pitch_generado TEXT,                   -- Generado por Redactor
  pitch_generado_at TIMESTAMP,
  pitch_edited_by_human BOOLEAN DEFAULT false,  -- ¿Lo editó humano antes de aprobar?
  
  -- Email/Gmail
  gmail_draft_id VARCHAR(255),           -- Si está en draft_gmail mode
  sent_at TIMESTAMP,
  replied_at TIMESTAMP,
  
  -- Negociación
  cache_propuesto DECIMAL(10, 2),        -- €
  cache_negociado DECIMAL(10, 2),
  fecha_propuesta DATE,
  fecha_confirmada DATE,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID,                       -- Usuario que creó (si manual)
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_leads_band_id ON leads(band_id);
CREATE INDEX idx_leads_estado ON leads(band_id, estado);
CREATE INDEX idx_leads_agentic ON leads(band_id, agentic_status);
CREATE INDEX idx_leads_replied_at ON leads(band_id, replied_at);
```

**Notas:**
- `band_id` es la **única fuente de verdad de la banda** (no confíes en `lead.band_id` del request body)
- `estado` × `agentic_status` = 2D state machine
- `pitch_generado` guardado tal cual (versión única per lead)
- `gmail_draft_id` usado por Lector para detectar drafts enviados manualmente

---

### 5. `lead_messages` — Hilo de Conversación

```sql
CREATE TABLE lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  band_id UUID NOT NULL,                 -- Desnormalizado para queries rápidas
  
  role VARCHAR(50) NOT NULL,             -- 'assistant' (email IA), 'user' (reply de venue), 'human' (edición humana)
  content TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  email_message_id VARCHAR(255),         -- ID de Gmail/IMAP
  
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_messages_lead_id ON lead_messages(lead_id);
```

**Notas:**
- Hilo completo de conversación (todos los emails back-and-forth)
- `role='assistant'` = emails IA enviados
- `role='user'` = replies de la sala
- `role='human'` = ediciones del usuario

---

### 6. `lead_audit_log` — Auditoría (Compliance)

```sql
CREATE TABLE lead_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  band_id UUID NOT NULL,
  user_id UUID,                          -- NULL si fue agente
  agent_name VARCHAR(50),                -- 'scout','redactor','enviador','lector'
  action VARCHAR(50),                    -- 'created','pitch_generated','approved','sent','replied'
  
  from_state VARCHAR(50),                -- Estado anterior
  to_state VARCHAR(50),                  -- Estado nuevo
  
  metadata_json JSONB,                   -- Detalles: { pitch_length, api_used, duration_ms, ... }
  
  created_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_lead_id ON lead_audit_log(lead_id);
CREATE INDEX idx_audit_log_band_id ON lead_audit_log(band_id, created_at);
```

---

### 7. `concerts` — Logística & Eventos

```sql
CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,                 -- ⚠️ CRÍTICO: filter
  lead_id UUID,                          -- Referencia al lead que llevó a este concierto
  
  venue_name VARCHAR(255) NOT NULL,
  venue_city VARCHAR(100),
  venue_url TEXT,
  
  date TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  
  -- Configuración de la actuación
  setlist_id UUID,                       -- Qué canciones tocan
  tech_rider_notes TEXT,                 -- Requisitos técnicos
  setup_time_minutes INT DEFAULT 30,
  
  -- Finanzas
  cache_agreed DECIMAL(10, 2),           -- €
  payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending','paid','cancelled'
  paid_at TIMESTAMP,
  
  -- Redes/Difusión
  is_public BOOLEAN DEFAULT true,        -- ¿Publicar en EPK/sociales?
  is_recorded BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY (setlist_id) REFERENCES setlists(id) ON DELETE SET NULL
);

CREATE INDEX idx_concerts_band_id ON concerts(band_id);
CREATE INDEX idx_concerts_date ON concerts(band_id, date);
CREATE INDEX idx_concerts_payment ON concerts(band_id, payment_status);
```

---

### 8. `songs` — Repertorio

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  artist_credit VARCHAR(255),            -- Si es cover
  
  -- Audio
  duration_seconds INT,
  tempo_bpm INT,
  key_musical VARCHAR(20),               -- 'C', 'D', 'Em', etc.
  genre VARCHAR(100),
  
  -- Composición
  composed_by VARCHAR(255),
  year_released INT,
  
  -- Links
  spotify_url TEXT,
  youtube_url TEXT,
  
  -- Tipo
  song_type VARCHAR(50) DEFAULT 'original',  -- 'original','cover','medley'
  
  -- Metadata
  energy_level INT DEFAULT 5,            -- 1-10, para setlist balancing
  tempo_stability INT DEFAULT 5,         -- 1-10 (para si hay sintetizador)
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_songs_band_id ON songs(band_id);
CREATE INDEX idx_songs_title ON songs(band_id, title);
```

---

### 9. `setlists` — Listas de Canciones

```sql
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  concert_id UUID,                       -- Si está asignada a un concierto específico
  
  name VARCHAR(255) NOT NULL,            -- ej: "Gira 2026 - Set 1"
  description TEXT,
  duration_minutes INT,                  -- Duración total
  
  is_default BOOLEAN DEFAULT false,      -- Template por defecto
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  FOREIGN KEY (concert_id) REFERENCES concerts(id) ON DELETE SET NULL
);

CREATE INDEX idx_setlists_band_id ON setlists(band_id);

-- Tabla de unión: qué canciones, en qué orden
CREATE TABLE setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL,
  song_id UUID NOT NULL,
  position INT NOT NULL,                 -- Orden en el setlist
  
  FOREIGN KEY (setlist_id) REFERENCES setlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  UNIQUE(setlist_id, position)
);

CREATE INDEX idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
```

---

### 10. `fans` — Captura de Base de Fans

```sql
CREATE TABLE fans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  country VARCHAR(100),
  
  -- Segmentación
  segment_id UUID,                       -- Referencia a fan_segments
  subscribed BOOLEAN DEFAULT true,
  
  -- Fuente de captura
  source VARCHAR(50),                    -- 'epk_form','concert','social','manual'
  source_url TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  UNIQUE(band_id, email)
);

CREATE INDEX idx_fans_band_id ON fans(band_id);
CREATE INDEX idx_fans_email ON fans(band_id, email);
```

---

### 11. `autonomy_configs` — Configuración de Agentes IA

```sql
CREATE TABLE autonomy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL UNIQUE,
  
  -- Agents On/Off
  scout_enabled BOOLEAN DEFAULT false,
  redactor_enabled BOOLEAN DEFAULT false,
  enviador_enabled BOOLEAN DEFAULT false,
  lector_enabled BOOLEAN DEFAULT true,   -- Siempre ON
  
  -- Despacho
  dispatch_mode VARCHAR(50) DEFAULT 'draft_gmail',  -- 'draft_gmail' o 'direct_send'
  
  -- Ventana horaria (Enviador respeta, Lector ignora)
  horas_enviador VARCHAR(50) DEFAULT '09:00-18:00',  -- HH:MM-HH:MM
  dias_enviador VARCHAR(50) DEFAULT 'lun-vie',       -- Rango de días
  
  -- Negociación
  cache_minimo DECIMAL(10, 2) DEFAULT 500,           -- € mínimo negociable
  
  -- Tone DNA (cómo habla la banda)
  tone_dna_captions_sample TEXT,        -- Sample de captions/videos para tone
  tone_dna_voice_description TEXT,      -- Descripción manual del tono
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_autonomy_band_id ON autonomy_configs(band_id);
```

---

### 12. `band_email_accounts` — Email SMTP/IMAP (Fallback)

```sql
CREATE TABLE band_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  
  email_address VARCHAR(255) NOT NULL,
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_user VARCHAR(255),
  smtp_password VARCHAR(255),            -- Encriptado en cliente/TLS
  
  imap_host VARCHAR(255),
  imap_port INT,
  imap_user VARCHAR(255),
  imap_password VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_accounts_band_id ON band_email_accounts(band_id);
```

---

### 13. `band_gmail_oauth_accounts` — Gmail OAuth2 (Preferido)

```sql
CREATE TABLE band_gmail_oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL UNIQUE,
  
  email_address VARCHAR(255),
  refresh_token TEXT NOT NULL,           -- Encriptado en storage
  access_token TEXT,                     -- Cache, se renueva automáticamente
  access_token_expires_at TIMESTAMP,
  
  scopes_granted TEXT,                   -- JSON array de scopes consentidos
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_sync_at TIMESTAMP,
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_gmail_oauth_band_id ON band_gmail_oauth_accounts(band_id);
```

---

### 14. `agent_schedule_state` — Scheduler In-Memory Persistence

```sql
CREATE TABLE agent_schedule_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  
  operation VARCHAR(50),                 -- 'scout','redactor','enviador','lector'
  last_run_hour INT,                     -- Hora del último run (0-23)
  last_run_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE,
  UNIQUE(band_id, operation)
);

CREATE INDEX idx_schedule_state_band_id ON agent_schedule_state(band_id);
```

---

### 15. `reels` — Videos Generados

```sql
CREATE TABLE reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL,
  
  platform VARCHAR(50),                  -- 'tiktok','instagram','youtube','facebook'
  video_url TEXT,                        -- Supabase Storage URL
  video_duration_seconds INT,
  
  script_es TEXT,                        -- Descripción/caption en español
  script_en TEXT,                        -- En inglés
  
  source_video_url TEXT,                 -- Dónde se extrajo (ej: YouTube URL)
  source_timestamp_start INT,            -- Segundo de inicio en video original
  
  posted_at TIMESTAMP,
  engagement_likes INT DEFAULT 0,
  engagement_comments INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (band_id) REFERENCES bands(id) ON DELETE CASCADE
);

CREATE INDEX idx_reels_band_id ON reels(band_id);
CREATE INDEX idx_reels_platform ON reels(band_id, platform);
```

---

## 🔐 Seguridad en BD

### 1. Row-Level Security (RLS)

```sql
-- Todas las tablas que tienen band_id deben tener RLS:
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see leads from their bands"
  ON leads
  FOR SELECT
  USING (band_id IN (
    SELECT band_id FROM band_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only update leads from their bands"
  ON leads
  FOR UPDATE
  USING (band_id IN (
    SELECT band_id FROM band_members WHERE user_id = auth.uid()
  ));
```

### 2. Encriptación de Datos Sensibles

```sql
-- Tokens de refresh + contraseñas SMTP deben estar encriptados
-- En Express: usar crypto.encrypt() before INSERT / decrypt() after SELECT

-- Ejemplo:
INSERT INTO band_gmail_oauth_accounts (band_id, refresh_token)
VALUES ('banda-1', encrypt_value(refresh_token_value, secret_key));
```

---

## 📈 Query Patterns Eficientes

### Obtener todos los leads de una banda con sus mensajes

```sql
SELECT 
  l.*,
  json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at))
    FILTER (WHERE m.id IS NOT NULL) as messages
FROM leads l
LEFT JOIN lead_messages m ON l.id = m.lead_id
WHERE l.band_id = $1
GROUP BY l.id
ORDER BY l.created_at DESC;
```

### Leads en cola agéntica (pendientes de aprobación)

```sql
SELECT * FROM leads
WHERE band_id = $1
  AND agentic_status IN ('pendiente_aprobacion', 'aprobado_propuesta', 'borrador_creado')
ORDER BY pitch_generado_at ASC;
```

### Chequear plan limit

```sql
SELECT COUNT(*) as lead_count
FROM leads
WHERE band_id = $1 AND estado != 'no_interesado';

-- Comparar contra PLAN_LIMITS[plan][leads]
```

---

## 🔄 Migraciones & Versionado

```sql
-- supabase/migrations/000X_create_leads_table.sql
-- Cada cambio de schema va aquí, idempotente

CREATE TABLE IF NOT EXISTS leads (...);
CREATE INDEX IF NOT EXISTS idx_leads_band_id ON leads(band_id);
```

**Nunca** modifiques directamente en Supabase dashboard. Siempre:
1. Crea migration en `supabase/migrations/`
2. Testea localmente con `supabase db pull`
3. Commiteá
4. Deploy automático en Railway

---

## 📊 Resumen de Tablas

| Tabla | Propósito | Filtro Clave |
|-------|-----------|--------------|
| `users` | Autenticación | `user_id` |
| `bands` | Tenants | `band_id` |
| `band_members` | Multi-tenancy | `band_id` + `user_id` |
| `leads` | Booking CRM | `band_id` |
| `lead_messages` | Conversaciones | `lead_id`, `band_id` |
| `lead_audit_log` | Auditoría | `lead_id`, `band_id` |
| `concerts` | Logística | `band_id` |
| `songs` | Repertorio | `band_id` |
| `setlists` | Listas de canciones | `band_id` |
| `fans` | Base de fans | `band_id` |
| `autonomy_configs` | Config agentes | `band_id` |
| `band_email_accounts` | Email SMTP | `band_id` |
| `band_gmail_oauth_accounts` | Gmail OAuth | `band_id` |
| `agent_schedule_state` | Scheduler state | `band_id` |
| `reels` | Videos generados | `band_id` |

**REGLA DE ORO:** Toda tabla que tiene `band_id` DEBE filtrarse por `band_id` en TODA query. Sin excepción.

---

