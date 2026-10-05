-- ====================================================================
-- MIGRACIÓN SUPABASE: TABLA MUSICIANS_WAITLIST (BandManager.ai)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.musicians_waitlist (
    id TEXT PRIMARY KEY,
    nombre_banda TEXT NOT NULL,
    nombre_contacto TEXT,
    email TEXT NOT NULL,
    instagram TEXT,
    telefono TEXT,
    ciudad TEXT,
    genero TEXT,
    enlace_musica TEXT,
    interes_principal TEXT,
    notas TEXT,
    idioma TEXT DEFAULT 'es',
    banda_origen TEXT,
    concierto_origen TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas y ordenación
CREATE INDEX IF NOT EXISTS idx_musicians_waitlist_email ON public.musicians_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_musicians_waitlist_created_at ON public.musicians_waitlist(created_at DESC);

-- Seguridad RLS y Políticas
ALTER TABLE public.musicians_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.musicians_waitlist;
CREATE POLICY "Permitir acceso total al backend" ON public.musicians_waitlist FOR ALL USING (true);
