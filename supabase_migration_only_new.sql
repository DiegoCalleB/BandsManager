-- =========================================================================
-- MIGRACIÓN INCREMENTAL: SOLO TABLAS Y CAMPOS NUEVOS PARA SUPABASE
-- =========================================================================

-- 1. TABLAS NUEVAS
CREATE TABLE IF NOT EXISTS public.social_content_items (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL DEFAULT 'band-bakandeya',
    platform TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT DEFAULT '',
    url TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    published_at TIMESTAMPTZ,
    views BIGINT DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_content_band_platform ON public.social_content_items(band_id, platform);

CREATE TABLE IF NOT EXISTS public.tours (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL DEFAULT 'band-bakandeya',
    nombre TEXT NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    vehiculo TEXT DEFAULT '',
    consumo_l100km NUMERIC DEFAULT 8.5,
    precio_carburante_eur NUMERIC DEFAULT 1.65,
    tipo_combustible TEXT DEFAULT 'diesel',
    vehiculos JSONB DEFAULT '[]'::jsonb,
    presupuesto_logistica NUMERIC DEFAULT 0,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    sincronizar_calendario BOOLEAN DEFAULT TRUE,
    sincronizar_finanzas BOOLEAN DEFAULT TRUE,
    stops JSONB DEFAULT '[]'::jsonb,
    estado TEXT DEFAULT 'planificacion',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tours_band_id ON public.tours(band_id);

CREATE TABLE IF NOT EXISTS public.run_of_show (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL DEFAULT 'band-bakandeya',
    fecha TEXT NOT NULL,
    time TEXT NOT NULL,
    activity TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_run_of_show_band_fecha ON public.run_of_show(band_id, fecha);

CREATE TABLE IF NOT EXISTS public.gear_checklists (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL DEFAULT 'band-bakandeya',
    fecha TEXT NOT NULL,
    label TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gear_checklists_band_fecha ON public.gear_checklists(band_id, fecha);

CREATE TABLE IF NOT EXISTS public.band_schedules (
    band_id TEXT PRIMARY KEY,
    timezone TEXT DEFAULT 'Europe/Madrid',
    horas_lector JSONB DEFAULT '[8, 12, 16, 20]'::jsonb,
    horas_enviador JSONB DEFAULT '[9, 10, 11, 12, 13]'::jsonb,
    dias_enviador JSONB DEFAULT '[2, 3, 4]'::jsonb,
    dias_lector JSONB DEFAULT '[1, 2, 3, 4, 5, 6, 7]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deleted_leads (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deleted_bands (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);

-- 2. CAMPOS NUEVOS EN TABLAS EXISTENTES
ALTER TABLE public.registered_bands 
    ADD COLUMN IF NOT EXISTS radar_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS last_social_radar_at TIMESTAMPTZ;

ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS main_band_id TEXT DEFAULT 'band-bakandeya',
    ADD COLUMN IF NOT EXISTS band_order JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS google_oauth JSONB DEFAULT NULL;

ALTER TABLE public.leads 
    ADD COLUMN IF NOT EXISTS pitch_feedback_tono NUMERIC DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pitch_feedback_contenido NUMERIC DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pitch_feedback_comentario TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS historial_feedback_pitch JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS historial_contacto JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS hilo_emails JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS thread_id TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS ultimo_mensaje_recibido TEXT DEFAULT '';

ALTER TABLE public.band_contacts
    ADD COLUMN IF NOT EXISTS estilo_comunicacion TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS dna_expresion JSONB DEFAULT NULL;

ALTER TABLE public.concerts
    ADD COLUMN IF NOT EXISTS gira_id TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS gira_nombre TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS gastos_detalle JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS gastos_estimados_tipicos NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS convocatoria_tipo TEXT DEFAULT 'completa',
    ADD COLUMN IF NOT EXISTS convocados_ids JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS convocados_nombres JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT '';

ALTER TABLE public.rehearsals
    ADD COLUMN IF NOT EXISTS convocatoria_tipo TEXT DEFAULT 'completa',
    ADD COLUMN IF NOT EXISTS convocados_ids JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS convocados_nombres JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.songs
    ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER DEFAULT 210,
    ADD COLUMN IF NOT EXISTS duracion_minutos NUMERIC DEFAULT 3.5,
    ADD COLUMN IF NOT EXISTS audio_principal_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS audio_ideas JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cifrado_texto TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS guia_sustituto JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notas_repertorio TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS notas_miembros JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notas_por_miembro JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS album_disco TEXT DEFAULT 'Inédita / En Proceso',
    ADD COLUMN IF NOT EXISTS orden_album INTEGER DEFAULT 1;

ALTER TABLE public.epk_configs
    ADD COLUMN IF NOT EXISTS firma_email JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS incentivo_fans JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ciudades_config JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS dossier_pdf_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS dossier_pdf_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS dossier_document_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS dossier_document_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS dossier_texto_extra TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS rider_pdf_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS rider_pdf_name TEXT DEFAULT '',
    -- Contenido del EPK público orientado a contratación: formación con fotos, vídeos de
    -- directo y datos duros (nº de músicos, duración del directo, ciudad base...).
    ADD COLUMN IF NOT EXISTS miembros JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS datos_contratacion JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.fans
    ADD COLUMN IF NOT EXISTS mensaje TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS cancion_favorita TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';

-- 3. BUCKET DE SUPABASE STORAGE PARA SUBIDAS DE ARCHIVOS (MEDIA)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'band-media', 
    'band-media', 
    true, 
    1073741824,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Access band-media" ON storage.objects;
CREATE POLICY "Public Access band-media" ON storage.objects FOR SELECT USING (bucket_id = 'band-media');

DROP POLICY IF EXISTS "Allow All Uploads band-media" ON storage.objects;
CREATE POLICY "Allow All Uploads band-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'band-media');

DROP POLICY IF EXISTS "Allow All Updates band-media" ON storage.objects;
CREATE POLICY "Allow All Updates band-media" ON storage.objects FOR UPDATE USING (bucket_id = 'band-media');

DROP POLICY IF EXISTS "Allow All Deletes band-media" ON storage.objects;
CREATE POLICY "Allow All Deletes band-media" ON storage.objects FOR DELETE USING (bucket_id = 'band-media');

-- Motor de agentes de booking consolidado en Node (server/services/agentScheduler.ts,
-- server/services/emailAgentClient.ts) - ver supabase_schema.sql para el comentario completo.
CREATE TABLE IF NOT EXISTS public.agent_schedule_state (
  job_name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ
);
ALTER TABLE public.agent_schedule_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.agent_schedule_state;
CREATE POLICY "Permitir acceso total al backend" ON public.agent_schedule_state FOR ALL USING (true);

-- Sustituye a band_gmail_tokens (OAuth específico de Gmail, retirado en favor de SMTP/IMAP
-- genérico para soportar Outlook y cualquier otro proveedor). band_gmail_tokens nunca llegó a
-- poblarse en producción, así que no hace falta migrar datos.
DROP TABLE IF EXISTS public.band_gmail_tokens;

CREATE TABLE IF NOT EXISTS public.band_email_accounts (
  band_id TEXT PRIMARY KEY REFERENCES public.registered_bands(band_id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'other',
  email TEXT NOT NULL,
  app_password TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.band_email_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_email_accounts;
CREATE POLICY "Permitir acceso total al backend" ON public.band_email_accounts FOR ALL USING (true);
