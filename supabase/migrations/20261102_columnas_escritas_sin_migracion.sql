-- Columnas que el servidor escribe y que el esquema del repo no definía.
--
-- Salieron a la luz al tipar las filas de server/db/*.ts: con `payload: any` el escáner de
-- server/audit/__tests__/schemaContract.test.ts no veía las columnas que se añaden de forma
-- condicional. Unas vivían en ficheros sueltos de supabase/ que el ejecutor de migraciones no
-- aplica (migration_response_strategies.sql, migration_negotiation_start_cache.sql,
-- migration_song_energia_variacion.sql); otras solo existían en la base de producción, creadas a
-- mano. Todo es ADD COLUMN IF NOT EXISTS: en producción no cambia nada; en una base nueva evita
-- que el guardado falle (o que escrituraTolerante tenga que descartar el campo).

-- Estrategias de respuesta y cachés por tipo de recinto de la autonomía de agentes.
ALTER TABLE autonomy_configs
  ADD COLUMN IF NOT EXISTS response_strategies JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS min_cache_by_type JSONB,
  ADD COLUMN IF NOT EXISTS negotiation_start_cache_by_type JSONB;

-- Campañas: rango de fechas para filtrar festivales y caché mínimo por tipo.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS campaign_start_date TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS campaign_end_date TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS min_cache_by_type JSONB;

-- Análisis del Lector guardado junto a cada mensaje recibido.
ALTER TABLE lead_messages
  ADD COLUMN IF NOT EXISTS fechas_propuestas JSONB,
  ADD COLUMN IF NOT EXISTS condiciones_economicas JSONB,
  ADD COLUMN IF NOT EXISTS requisitos_tecnicos JSONB,
  ADD COLUMN IF NOT EXISTS accion_sugerida TEXT,
  ADD COLUMN IF NOT EXISTS estrategia_playbook JSONB;

-- Ensayos que también son reuniones.
ALTER TABLE rehearsals
  ADD COLUMN IF NOT EXISTS tipo_evento TEXT DEFAULT 'ensayo',
  ADD COLUMN IF NOT EXISTS asunto TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS enlace_reunion TEXT DEFAULT '';

-- Canciones: documento de estructura, notas de repertorio y variación de energía.
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS estructura_documento_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS estructura_documento_nombre TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS estructura_documento_procesado_en TEXT,
  ADD COLUMN IF NOT EXISTS estructura_verificada BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notas_repertorio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS energia_variacion NUMERIC,
  ADD COLUMN IF NOT EXISTS energia_variacion_calculada_en TIMESTAMPTZ;

-- Publicaciones sociales programadas / publicadas automáticamente.
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS hora_programada TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_id TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_error TEXT,
  ADD COLUMN IF NOT EXISTS account_handle TEXT,
  ADD COLUMN IF NOT EXISTS hashtags JSONB,
  ADD COLUMN IF NOT EXISTS metrics JSONB;
