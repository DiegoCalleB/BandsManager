-- Hallazgos de la auditoría código ↔ esquema (server/audit). Todo es idempotente.
--
-- PARTE A — Columnas que el código usa y que NO existían en producción. Hasta ahora cada
-- escritura fallaba en silencio (PostgREST rechaza la sentencia entera si una columna no existe):
--   * billing.ts: tras pagar, el UPDATE de plan/créditos en registered_bands y users se perdía.
--   * tracking.ts / epk_fans.ts / agentEngine.ts: aperturas de correo y clics del EPK no se guardaban.
--   * lead_messages.leido: marcar un mensaje como leído no persistía.
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS plan_pendiente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cambio_plan TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS creditos_periodo INTEGER,
  ADD COLUMN IF NOT EXISTS creditos_usados INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_pendiente TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cambio_plan TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'activo';

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS place_id TEXT,
  ADD COLUMN IF NOT EXISTS clics_epk INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_clic_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_abierto BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS veces_abierto INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_abierto_at TIMESTAMPTZ;

ALTER TABLE lead_messages
  ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT FALSE;

-- Cuentas de redes conectadas (social.ts): la tabla no existía y el código tragaba el error.
CREATE TABLE IF NOT EXISTS band_social_accounts (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL,
    plataforma TEXT NOT NULL DEFAULT 'Instagram',
    handle TEXT DEFAULT '',
    account_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    status TEXT DEFAULT 'conectado',
    auto_publish_enabled BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    followers_count BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    account_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_band_social_accounts_band ON band_social_accounts (band_id);
-- RLS activada y SIN políticas: solo la clave de servicio (que se salta RLS) puede leer o escribir.
-- Las claves públicas (anon) no ven nada. Es lo más estricto y el servidor solo usa la de servicio.
ALTER TABLE band_social_accounts ENABLE ROW LEVEL SECURITY;

-- PARTE B — Deriva inversa: existen en producción (se crearon a mano) pero no en el repo.
-- En producción esto no hace nada; en una base nueva evita que el código falle.
ALTER TABLE band_schedules
  ADD COLUMN IF NOT EXISTS dias_enviador JSONB DEFAULT '[2, 3, 4]'::jsonb,
  ADD COLUMN IF NOT EXISTS dias_lector JSONB DEFAULT '[1, 2, 3, 4, 5, 6, 7]'::jsonb;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS notas_miembros JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notas_por_miembro JSONB DEFAULT '[]'::jsonb;

ALTER TABLE social_metrics
  ADD COLUMN IF NOT EXISTS spotify_monthly_listeners BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spotify_followers BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spotify_popularity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_subscribers BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_total_views BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_video_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_followers BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_following INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_posts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_engagement_rate NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS tiktok_followers BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_total_likes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_video_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS fan_link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id TEXT NOT NULL,
    button_type TEXT NOT NULL,
    concert_id TEXT,
    concert_date TEXT,
    user_agent TEXT,
    referer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo el servidor (clave de servicio, que se salta RLS) escribe y lee los clics: RLS sin políticas.
ALTER TABLE fan_link_clicks ENABLE ROW LEVEL SECURITY;
