-- =========================================================================
-- Tabla para gestionar cuentas Instagram Business conectadas por banda
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.band_instagram_accounts (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL UNIQUE REFERENCES public.registered_bands(band_id) ON DELETE CASCADE,
    instagram_business_account_id TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    token_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_instagram_accounts_band_id
    ON public.band_instagram_accounts(band_id);

CREATE INDEX IF NOT EXISTS idx_band_instagram_accounts_username
    ON public.band_instagram_accounts(instagram_username);

ALTER TABLE public.band_instagram_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_instagram_accounts;
CREATE POLICY "Permitir acceso total al backend" ON public.band_instagram_accounts
    FOR ALL USING (true);

-- Tabla para almacenar historial de publicaciones
CREATE TABLE IF NOT EXISTS public.instagram_posts_history (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES public.registered_bands(band_id) ON DELETE CASCADE,
    instagram_post_id TEXT,
    caption TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'IMAGE',
    published_at TIMESTAMPTZ,
    published_by TEXT,
    engagement_likes INTEGER DEFAULT 0,
    engagement_comments INTEGER DEFAULT 0,
    engagement_shares INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_history_band_id
    ON public.instagram_posts_history(band_id);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_history_published_at
    ON public.instagram_posts_history(band_id, published_at DESC);

ALTER TABLE public.instagram_posts_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.instagram_posts_history;
CREATE POLICY "Permitir acceso total al backend" ON public.instagram_posts_history
    FOR ALL USING (true);
