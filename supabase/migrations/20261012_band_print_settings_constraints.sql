-- Migration: 20261012_band_print_settings_constraints.sql
-- Repara band_print_settings si se creó sin restricciones ni política (en producción estaba sin PK,
-- sin UNIQUE(band_id) y sin policy: el upsert `onConflict: band_id` fallaba siempre y la app
-- mostraba "No se pudieron guardar estos ajustes para la banda"). Idempotente.

-- Si hubiera filas duplicadas por banda, se queda la más reciente (antes de crear el UNIQUE).
DELETE FROM public.band_print_settings a
USING public.band_print_settings b
WHERE a.band_id = b.band_id
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS band_print_settings_band_id_key ON public.band_print_settings(band_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.band_print_settings'::regclass AND contype = 'p') THEN
    ALTER TABLE public.band_print_settings ADD PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE public.band_print_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_print_settings;
CREATE POLICY "Permitir acceso total al backend" ON public.band_print_settings
  FOR ALL USING (true) WITH CHECK (true);
