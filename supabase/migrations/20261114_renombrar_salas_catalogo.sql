-- Renombra `salas_catalogo` a `catalogo_salas` para que todo el catálogo viva bajo el prefijo `catalogo_` (junto a
-- catalogo_generos, catalogo_sala_generos, catalogo_staging…). Es un renombrado, no una copia: las filas, las claves
-- ajenas (leads.sala_id, festivales.sala_id, catalogo_sala_generos…), RLS, índices y restricciones se mueven con la tabla.
-- Idempotente: si ya se llama `catalogo_salas` no hace nada. Las migraciones anteriores siguen diciendo `salas_catalogo`
-- porque describen el estado de su momento; se ejecutan en orden y esta es la que cambia el nombre.
DO $$
BEGIN
    IF to_regclass('public.salas_catalogo') IS NOT NULL AND to_regclass('public.catalogo_salas') IS NULL THEN
        ALTER TABLE public.salas_catalogo RENAME TO catalogo_salas;
    END IF;
END $$;

-- Índices y restricciones que llevaban el nombre antiguo (los de clave primaria y unicidad son índices: al renombrar
-- el índice se renombra también su restricción).
DO $$
DECLARE
    r RECORD;
BEGIN
    IF to_regclass('public.catalogo_salas') IS NULL THEN
        RETURN;
    END IF;
    FOR r IN
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'catalogo_salas' AND indexname LIKE '%salas\_catalogo%'
    LOOP
        EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname, replace(r.indexname, 'salas_catalogo', 'catalogo_salas'));
    END LOOP;
    FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.catalogo_salas'::regclass AND contype IN ('c', 'f', 'n') AND conname LIKE '%salas\_catalogo%'
    LOOP
        EXECUTE format('ALTER TABLE public.catalogo_salas RENAME CONSTRAINT %I TO %I', r.conname, replace(r.conname, 'salas_catalogo', 'catalogo_salas'));
    END LOOP;
END $$;
