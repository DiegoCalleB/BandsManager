-- Todo el catálogo bajo el prefijo `catalogo_`: `salas_catalogo` pasa a `catalogo_salas` y las tres tablas del directorio
-- de festivales a `catalogo_festivales`, `catalogo_festival_ediciones` y `catalogo_festival_convocatorias` (junto a
-- catalogo_generos, catalogo_sala_generos, catalogo_staging…). Es un renombrado, no una copia: las filas, las claves ajenas
-- (leads.sala_id, festivales.sala_id, festival_id, catalogo_sala_generos…), RLS, índices y restricciones se mueven con la tabla.
-- Idempotente: si una tabla ya tiene el nombre nuevo no se toca. Las migraciones anteriores siguen diciendo los nombres
-- antiguos porque describen el estado de su momento; se ejecutan en orden y esta es la que cambia los nombres.
DO $$
DECLARE
    par TEXT[];
    pares TEXT[][] := ARRAY[
        ['salas_catalogo', 'catalogo_salas'],
        ['festivales', 'catalogo_festivales'],
        ['festival_ediciones', 'catalogo_festival_ediciones'],
        ['festival_convocatorias', 'catalogo_festival_convocatorias']
    ];
    r RECORD;
BEGIN
    FOREACH par SLICE 1 IN ARRAY pares LOOP
        IF to_regclass('public.' || par[1]) IS NOT NULL AND to_regclass('public.' || par[2]) IS NULL THEN
            EXECUTE format('ALTER TABLE public.%I RENAME TO %I', par[1], par[2]);
        END IF;
    END LOOP;

    -- Índices y restricciones que llevaban el nombre antiguo (los de clave primaria y unicidad son índices: al renombrar el
    -- índice se renombra también su restricción). El NOT LIKE evita renombrar dos veces lo que ya tiene el nombre nuevo.
    FOREACH par SLICE 1 IN ARRAY pares LOOP
        IF to_regclass('public.' || par[2]) IS NULL THEN
            CONTINUE;
        END IF;
        FOR r IN
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = par[2]
              AND indexname LIKE '%' || replace(par[1], '_', '\_') || '%' AND indexname NOT LIKE '%' || replace(par[2], '_', '\_') || '%'
        LOOP
            EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname, replace(r.indexname, par[1], par[2]));
        END LOOP;
        FOR r IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = to_regclass('public.' || par[2]) AND contype IN ('c', 'f', 'n')
              AND conname LIKE '%' || replace(par[1], '_', '\_') || '%' AND conname NOT LIKE '%' || replace(par[2], '_', '\_') || '%'
        LOOP
            EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', par[2], r.conname, replace(r.conname, par[1], par[2]));
        END LOOP;
    END LOOP;
END $$;
