-- Renombra metricas_bandas_amigas a bandas_amigas_metricas: el prefijo indica de quién son los datos.
-- Idempotente: si la tabla ya tiene el nombre nuevo, no hace nada.
-- Rollback: ALTER TABLE bandas_amigas_metricas RENAME TO metricas_bandas_amigas;

DO $$
BEGIN
  IF to_regclass('public.metricas_bandas_amigas') IS NOT NULL
     AND to_regclass('public.bandas_amigas_metricas') IS NULL THEN
    ALTER TABLE metricas_bandas_amigas RENAME TO bandas_amigas_metricas;
  END IF;
  IF to_regclass('public.metricas_bandas_amigas_band_idx') IS NOT NULL
     AND to_regclass('public.bandas_amigas_metricas_band_idx') IS NULL THEN
    ALTER INDEX metricas_bandas_amigas_band_idx RENAME TO bandas_amigas_metricas_band_idx;
  END IF;
END $$;
