-- Ninguna banda es la «banda por defecto»: una fila sin band_id debe fallar, no caer en los datos de otra banda.
-- Idempotente: DROP DEFAULT sobre una columna sin valor por defecto no hace nada.
ALTER TABLE public.social_content_items ALTER COLUMN band_id DROP DEFAULT;
ALTER TABLE public.tours ALTER COLUMN band_id DROP DEFAULT;
ALTER TABLE public.run_of_show ALTER COLUMN band_id DROP DEFAULT;
ALTER TABLE public.gear_checklists ALTER COLUMN band_id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN main_band_id DROP DEFAULT;
