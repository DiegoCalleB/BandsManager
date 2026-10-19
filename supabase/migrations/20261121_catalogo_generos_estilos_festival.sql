-- Alinea la taxonomía de géneros (ADR 0047) con los estilos del directorio de festivales (`EstiloFestival`,
-- server/utils/seo/festivales/tipos.ts): `catalogo_festivales.generos` ya usa `mundo`, `antigua`, `experimental` y `emergente`,
-- y la base del catálogo había creado `world` para lo mismo que `mundo`. Ninguna sala tiene géneros asignados todavía,
-- así que `world` se sustituye por `mundo` sin perder nada. Idempotente.

INSERT INTO catalogo_generos (id, nombre_es, nombre_en, padre_id) VALUES
    ('mundo', 'Músicas del mundo', 'World music', NULL),
    ('experimental', 'Experimental', 'Experimental', NULL),
    -- No es un género musical sino el tipo de cartel (bandas noveles), pero el directorio lo usa como estilo.
    ('emergente', 'Emergente', 'Emerging artists', NULL),
    ('antigua', 'Música antigua', 'Early music', 'clasica')
ON CONFLICT (id) DO NOTHING;

UPDATE catalogo_generos_alias SET genero_id = 'mundo' WHERE genero_id = 'world';

DELETE FROM catalogo_generos g
 WHERE g.id = 'world'
   AND NOT EXISTS (SELECT 1 FROM catalogo_sala_generos s WHERE s.genero_id = 'world')
   AND NOT EXISTS (SELECT 1 FROM catalogo_generos h WHERE h.padre_id = 'world');

INSERT INTO catalogo_generos_alias (alias, genero_id) VALUES
    ('mundo', 'mundo'), ('world', 'mundo'), ('musicas del mundo', 'mundo'),
    ('experimental', 'experimental'), ('vanguardia', 'experimental'),
    ('emergente', 'emergente'), ('emergentes', 'emergente'), ('nuevos talentos', 'emergente'),
    ('antigua', 'antigua'), ('musica antigua', 'antigua'), ('early music', 'antigua'), ('barroca', 'antigua')
ON CONFLICT (alias) DO NOTHING;
