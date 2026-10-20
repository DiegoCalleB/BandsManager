-- Alias de salas del catálogo: dos claves (nombre + ciudad, o place_id) que son la misma sala.
-- La sincronización y la importación de OpenStreetMap llevan lo que cae en `alias_clave` a `clave`, así que una fusión
-- hecha a mano no se deshace la próxima vez que se agrupan los leads. `nombre` es el nombre público de la sala resultante
-- (la moda de los leads puede quedarse con una errata). Solo la escribe el servidor: RLS activa y sin políticas.
CREATE TABLE IF NOT EXISTS catalogo_sala_alias (
    alias_clave TEXT PRIMARY KEY,
    clave TEXT NOT NULL,
    nombre TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE catalogo_sala_alias ENABLE ROW LEVEL SECURITY;

-- Duplicados de Madrid que el equipo ha confirmado (2026-10-20).
INSERT INTO catalogo_sala_alias (alias_clave, clave, nombre) VALUES
    ('nc:sala clamores|madrid', 'nc:clamores|madrid', 'Sala Clamores'),
    ('nc:honky tonk|madrid', 'place:ChIJ8RYzeIwoQg0RXzcYXQjegjo', 'Honky Tonk'),
    ('nc:nazca|madrid', 'nc:nazca club|madrid', 'Nazca Club'),
    ('nc:sala nazca|madrid', 'nc:nazca club|madrid', 'Nazca Club'),
    ('nc:revilive revirock|madrid', 'place:ChIJE87ggRAlQg0R-EwRtutmjpc', 'ReviLive'),
    ('nc:wizink center la sala pista|madrid', 'nc:wizink center|madrid', 'WiZink Center'),
    ('nc:rockville|madrid', 'place:ChIJ_2TSWlspQg0RX07pxk2QW_w', 'Rockville')
ON CONFLICT (alias_clave) DO NOTHING;

-- Lo ya guardado: los leads y las referencias pasan a la sala canónica y la fila duplicada se borra. Si la canónica no
-- existe todavía, no se toca nada. El nombre público se pone aquí para que se vea sin esperar a la próxima sincronización.
DO $$
DECLARE
    a RECORD;
BEGIN
    FOR a IN
        SELECT d.id AS dup, c.id AS canon, al.nombre
        FROM catalogo_sala_alias al
        JOIN catalogo_salas d ON d.clave = al.alias_clave
        JOIN catalogo_salas c ON c.clave = al.clave
    LOOP
        UPDATE leads SET sala_id = a.canon WHERE sala_id = a.dup;
        UPDATE catalogo_staging SET sala_id = a.canon WHERE sala_id = a.dup;
        UPDATE catalogo_supresion SET sala_id = a.canon WHERE sala_id = a.dup;
        UPDATE catalogo_festivales SET sala_id = a.canon WHERE sala_id = a.dup;
        INSERT INTO catalogo_sala_generos (sala_id, genero_id, fuente) SELECT a.canon, genero_id, fuente FROM catalogo_sala_generos WHERE sala_id = a.dup ON CONFLICT DO NOTHING;
        DELETE FROM catalogo_salas WHERE id = a.dup;
        IF a.nombre IS NOT NULL THEN UPDATE catalogo_salas SET nombre = a.nombre WHERE id = a.canon; END IF;
    END LOOP;
END $$;
