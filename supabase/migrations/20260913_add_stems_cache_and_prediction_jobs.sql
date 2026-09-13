-- Migración para almacenamiento de caché de separación de pistas (Stems)
-- Garantiza persistencia única entre despliegues de Railway y balanceadores multi-instancia.

CREATE TABLE IF NOT EXISTS song_stems_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id text NOT NULL,
  song_hash text NOT NULL,
  engine text NOT NULL,
  engine_used text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  locked_at timestamptz,
  locked_by text,
  is_neural boolean NOT NULL DEFAULT false,
  degraded boolean NOT NULL DEFAULT false,
  degraded_reason text,
  stems_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  timing_breakdown jsonb DEFAULT '{}'::jsonb,
  audio_url text,
  song_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_stems_band_hash_engine UNIQUE (band_id, song_hash, engine)
);

-- Si la tabla ya existía de una versión anterior sin estas columnas, añadirlas de forma idempotente:
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS engine_used text NOT NULL DEFAULT '';
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS locked_by text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS is_neural boolean NOT NULL DEFAULT false;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS degraded boolean NOT NULL DEFAULT false;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS degraded_reason text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS stems_map jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS timing_breakdown jsonb DEFAULT '{}'::jsonb;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS song_title text;

CREATE INDEX IF NOT EXISTS idx_song_stems_cache_lookup ON song_stems_cache (band_id, song_hash, engine);
CREATE INDEX IF NOT EXISTS idx_song_stems_cache_status ON song_stems_cache (status, locked_at);

-- Tabla para tracking y reconciliación de predicciones asíncronas de IA
CREATE TABLE IF NOT EXISTS stem_prediction_jobs (
  id text PRIMARY KEY, -- prediction_id de Replicate / Fal.ai
  band_id text NOT NULL,
  song_hash text NOT NULL,
  engine text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'processing', -- processing, succeeded, failed, canceled
  audio_url text NOT NULL,
  song_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  webhook_received_at timestamptz,
  webhook_signature_verified boolean DEFAULT false,
  result_stems_map jsonb,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_stem_predictions_status_created ON stem_prediction_jobs (status, created_at);

-- Tabla persistente para reintentos de almacenamiento de stems en Supabase Storage
CREATE TABLE IF NOT EXISTS stem_storage_retry_queue (
  id text PRIMARY KEY,
  file_path text NOT NULL,
  storage_sub_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'audio/mpeg',
  band_id text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_retry_at bigint NOT NULL,
  created_at bigint NOT NULL,
  last_error text,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, exhausted
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stem_retry_status_next ON stem_storage_retry_queue (status, next_retry_at);

-- Recargar la caché de PostgREST para reflejar inmediatamente las columnas
NOTIFY pgrst, 'reload schema';
