-- Migration: 20261201_catalogo_generos_multigenero.sql
-- «Multigénero» pasa a ser un estilo del directorio de festivales (server/utils/seo/festivales/tipos.ts): los festivales
-- generalistas no tienen otro estilo honesto. La taxonomía de géneros (ADR 0047) tiene que conocerlo. Idempotente.

INSERT INTO catalogo_generos (id, nombre_es, nombre_en, padre_id) VALUES
    ('multigenero', 'Multigénero', 'Multi-genre', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalogo_generos_alias (alias, genero_id) VALUES
    ('multigenero', 'multigenero'), ('multi genero', 'multigenero'), ('multi genre', 'multigenero'), ('variado', 'multigenero')
ON CONFLICT (alias) DO NOTHING;
