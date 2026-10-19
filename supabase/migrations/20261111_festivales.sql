-- Directorio de festivales (ADR 0045): una fila por festival, por edición y por convocatoria.
-- Alimenta las páginas públicas /festivales (solo fichas revisadas y vigentes) y, a través de `sala_id`, el catálogo
-- compartido de salas (ADR 0044) para que una banda pueda añadirlo a su agenda. El email y el teléfono NO se guardan
-- aquí: viven en `salas_catalogo` (solo contactos de la organización) y solo salen dentro de la app, al añadir.
-- Solo aditiva e idempotente. Solo el servidor (service_role) lee y escribe: sin políticas, nadie más puede.

CREATE TABLE IF NOT EXISTS festivales (
    -- Slug estable de la URL pública (/festivales/<id>): no se cambia nunca.
    id TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9-]+$'),
    nombre TEXT NOT NULL,
    tipo_evento TEXT NOT NULL DEFAULT 'festival'
        CHECK (tipo_evento IN ('festival', 'ciclo', 'concurso', 'showcase', 'feria', 'fiesta')),
    ciudad TEXT,
    provincia TEXT,
    comunidad TEXT,
    pais TEXT NOT NULL DEFAULT 'ES',
    generos TEXT[] NOT NULL DEFAULT '{}',
    mes_tipico INTEGER CHECK (mes_tipico BETWEEN 1 AND 12),
    primera_edicion INTEGER CHECK (primera_edicion BETWEEN 1900 AND 2100),
    activo BOOLEAN,
    web TEXT,
    descripcion_es TEXT,
    descripcion_en TEXT,
    -- Enlace con el catálogo de la app; si se borra la sala del catálogo, el festival se queda.
    sala_id TEXT REFERENCES salas_catalogo(id) ON DELETE SET NULL,
    -- candidata: solo el nombre · minima: lugar y estilo · completa: web oficial o convocatoria comprobadas.
    estado_revision TEXT NOT NULL DEFAULT 'candidata' CHECK (estado_revision IN ('candidata', 'minima', 'completa')),
    -- Dónde se leyó y cuándo se comprobó (una ficha caduca al año, ver server/utils/seo/festivales/vigencia.ts).
    fuente TEXT,
    verificado_en DATE,
    notas_internas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festivales_revision ON festivales (estado_revision);
CREATE INDEX IF NOT EXISTS idx_festivales_comunidad ON festivales (comunidad);
CREATE INDEX IF NOT EXISTS idx_festivales_sala_id ON festivales (sala_id) WHERE sala_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS festival_ediciones (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL REFERENCES festivales(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL CHECK (anio BETWEEN 1900 AND 2100),
    inicio DATE,
    fin DATE,
    recinto TEXT,
    localizacion TEXT,
    estado TEXT NOT NULL DEFAULT 'anunciada' CHECK (estado IN ('anunciada', 'confirmada', 'cancelada')),
    fuente TEXT,
    verificado_en DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (festival_id, anio),
    CHECK (fin IS NULL OR inicio IS NULL OR fin >= inicio)
);

CREATE TABLE IF NOT EXISTS festival_convocatorias (
    id TEXT PRIMARY KEY,
    festival_id TEXT NOT NULL REFERENCES festivales(id) ON DELETE CASCADE,
    -- Edición para la que se programa (puede ser la siguiente o la siguiente a la siguiente).
    edicion_anio INTEGER CHECK (edicion_anio BETWEEN 1900 AND 2100),
    abre DATE,
    cierra DATE,
    url TEXT NOT NULL,
    canal TEXT CHECK (canal IN ('formulario', 'email', 'plataforma', 'otro')),
    estado TEXT NOT NULL DEFAULT 'no_anunciada' CHECK (estado IN ('proxima', 'abierta', 'cerrada', 'no_anunciada')),
    -- Requisitos: «desconocido» no es «no». Un filtro por «admite independientes» solo devuelve lo comprobado.
    admite_independientes TEXT NOT NULL DEFAULT 'desconocido' CHECK (admite_independientes IN ('si', 'no', 'desconocido')),
    exige_sello_o_agencia TEXT NOT NULL DEFAULT 'desconocido' CHECK (exige_sello_o_agencia IN ('si', 'no', 'desconocido')),
    exige_residencia TEXT NOT NULL DEFAULT 'desconocido' CHECK (exige_residencia IN ('si', 'no', 'desconocido')),
    cuota TEXT NOT NULL DEFAULT 'desconocido' CHECK (cuota IN ('si', 'no', 'desconocido')),
    remuneracion TEXT,
    resumen_es TEXT,
    resumen_en TEXT,
    fuente TEXT,
    verificado_en DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (cierra IS NULL OR abre IS NULL OR cierra >= abre)
);

CREATE INDEX IF NOT EXISTS idx_festival_convocatorias_festival ON festival_convocatorias (festival_id);
CREATE INDEX IF NOT EXISTS idx_festival_convocatorias_cierre ON festival_convocatorias (cierra) WHERE estado IN ('proxima', 'abierta');

ALTER TABLE festivales ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_ediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_convocatorias ENABLE ROW LEVEL SECURITY;
