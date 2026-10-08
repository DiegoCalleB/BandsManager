-- Migration: 20261016_referidos_banda.sql
-- Referidos entre bandas («Hecho con BandManager» y el enlace de invitación).
--   ref_code      código público de la banda (8 caracteres) que va en los enlaces de invitación.
--   referido_por  band_id de la banda que la invitó (la PRIMERA atribución manda, no se reescribe).
--   referido_en   cuándo se atribuyó.
-- El código NO es un secreto ni un control de acceso: solo atribuye altas. Las bandas que ya
-- existen reciben un código derivado de su band_id; las nuevas lo generan la primera vez que lo
-- necesitan. Idempotente.

ALTER TABLE public.registered_bands ADD COLUMN IF NOT EXISTS ref_code TEXT;
ALTER TABLE public.registered_bands ADD COLUMN IF NOT EXISTS referido_por TEXT;
ALTER TABLE public.registered_bands ADD COLUMN IF NOT EXISTS referido_en TIMESTAMPTZ;

UPDATE public.registered_bands
  SET ref_code = upper(substr(md5('ref:' || band_id), 1, 8))
  WHERE ref_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registered_bands_ref_code
  ON public.registered_bands(ref_code) WHERE ref_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registered_bands_referido_por
  ON public.registered_bands(referido_por) WHERE referido_por IS NOT NULL;

COMMENT ON COLUMN public.registered_bands.ref_code IS 'Código público de invitación de la banda (atribución de altas, no es un secreto).';
COMMENT ON COLUMN public.registered_bands.referido_por IS 'band_id de la banda que la invitó; la primera atribución no se reescribe.';
