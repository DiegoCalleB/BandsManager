-- Base del catálogo global (ADR 0047): país y coordenadas de cada sala, taxonomía de géneros, registro de ingestas
-- con staging y lista de supresión de emails. Solo aditiva e idempotente: no renombra ni modifica nada existente,
-- no añade triggers ni CHECK a tablas existentes y no toca `leads`. Las tablas nuevas llevan el prefijo `catalogo_`.
-- Solo el servidor (service_role) lee y escribe: RLS activada y sin políticas, nadie más puede.

-- País (ISO 3166-1 alfa-2) y coordenadas de cada sala. Las salas que ya existen son de España; las coordenadas
-- quedan vacías hasta que una fuente las aporte. La sincronización normal no escribe estas columnas.
ALTER TABLE salas_catalogo
    ADD COLUMN IF NOT EXISTS pais TEXT NOT NULL DEFAULT 'ES',
    ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_salas_catalogo_pais_tipo ON salas_catalogo (pais, tipo);

-- Taxonomía de géneros: un id estable por género, con padre opcional (punk → rock) y enlaces a Wikidata y
-- MusicBrainz cuando se comprueben (no se rellenan a ciegas). Los ids son los que usan `festivales.generos`.
CREATE TABLE IF NOT EXISTS catalogo_generos (
    id TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9-]+$'),
    nombre_es TEXT NOT NULL,
    nombre_en TEXT NOT NULL,
    padre_id TEXT REFERENCES catalogo_generos(id) ON DELETE SET NULL,
    wikidata_qid TEXT CHECK (wikidata_qid ~ '^Q[0-9]+$'),
    musicbrainz_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (padre_id IS NULL OR padre_id <> id)
);

-- Cómo se escribe un género en texto libre («Electrónica», «Hip-Hop», «monólogos»), ya normalizado con
-- `normalizarTexto` (server/utils/salaCatalogo.ts): minúsculas, sin acentos salvo la ñ, solo letras, números y espacios.
CREATE TABLE IF NOT EXISTS catalogo_generos_alias (
    alias TEXT PRIMARY KEY CHECK (alias ~ '^[a-z0-9ñ]+( [a-z0-9ñ]+)*$'),
    genero_id TEXT NOT NULL REFERENCES catalogo_generos(id) ON DELETE CASCADE
);

-- Géneros de cada sala, con su procedencia. Si se borra la sala o el género, se borra la asignación.
CREATE TABLE IF NOT EXISTS catalogo_sala_generos (
    sala_id TEXT NOT NULL REFERENCES salas_catalogo(id) ON DELETE CASCADE,
    genero_id TEXT NOT NULL REFERENCES catalogo_generos(id) ON DELETE CASCADE,
    fuente TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (sala_id, genero_id)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_sala_generos_genero ON catalogo_sala_generos (genero_id);

INSERT INTO catalogo_generos (id, nombre_es, nombre_en, padre_id) VALUES
    ('rock', 'Rock', 'Rock', NULL),
    ('pop', 'Pop', 'Pop', NULL),
    ('electronica', 'Electrónica', 'Electronic', NULL),
    ('urbano', 'Urbano', 'Urban', NULL),
    ('reggae', 'Reggae', 'Reggae', NULL),
    ('ska', 'Ska', 'Ska', NULL),
    ('mestizaje', 'Mestizaje', 'Crossover', NULL),
    ('jazz', 'Jazz', 'Jazz', NULL),
    ('blues', 'Blues', 'Blues', NULL),
    ('soul', 'Soul', 'Soul', NULL),
    ('funk', 'Funk', 'Funk', NULL),
    ('flamenco', 'Flamenco', 'Flamenco', NULL),
    ('folk', 'Folk', 'Folk', NULL),
    ('latina', 'Latina', 'Latin', NULL),
    ('clasica', 'Clásica', 'Classical', NULL),
    ('cantautor', 'Cantautor', 'Singer-songwriter', NULL),
    ('country', 'Country', 'Country', NULL),
    ('gospel', 'Gospel', 'Gospel', NULL),
    ('world', 'Músicas del mundo', 'World music', NULL),
    ('comedia', 'Comedia y monólogos', 'Comedy', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalogo_generos (id, nombre_es, nombre_en, padre_id) VALUES
    ('punk', 'Punk', 'Punk', 'rock'),
    ('metal', 'Metal', 'Metal', 'rock'),
    ('indie', 'Indie', 'Indie', 'rock'),
    ('techno', 'Techno', 'Techno', 'electronica'),
    ('house', 'House', 'House', 'electronica'),
    ('hip-hop', 'Hip hop', 'Hip hop', 'urbano'),
    ('trap', 'Trap', 'Trap', 'urbano'),
    ('reggaeton', 'Reguetón', 'Reggaeton', 'urbano'),
    ('rumba', 'Rumba', 'Rumba', 'flamenco'),
    ('salsa', 'Salsa', 'Salsa', 'latina'),
    ('bolero', 'Bolero', 'Bolero', 'latina'),
    ('cumbia', 'Cumbia', 'Cumbia', 'latina'),
    ('opera', 'Ópera', 'Opera', 'clasica'),
    ('zarzuela', 'Zarzuela', 'Zarzuela', 'clasica')
ON CONFLICT (id) DO NOTHING;

INSERT INTO catalogo_generos_alias (alias, genero_id) VALUES
    ('rock', 'rock'), ('hard rock', 'rock'), ('rock and roll', 'rock'), ('rock roll', 'rock'),
    ('punk', 'punk'), ('hardcore', 'punk'), ('metal', 'metal'), ('heavy metal', 'metal'),
    ('indie', 'indie'), ('alternativo', 'indie'), ('alternativa', 'indie'), ('pop', 'pop'),
    ('electronica', 'electronica'), ('electronic', 'electronica'), ('dj', 'electronica'), ('dj sessions', 'electronica'),
    ('techno', 'techno'), ('house', 'house'), ('urban', 'urbano'), ('urbano', 'urbano'), ('urbana', 'urbano'),
    ('hip hop', 'hip-hop'), ('rap', 'hip-hop'), ('trap', 'trap'), ('reggaeton', 'reggaeton'), ('regueton', 'reggaeton'),
    ('reggae', 'reggae'), ('ska', 'ska'), ('mestizaje', 'mestizaje'), ('fusion', 'mestizaje'),
    ('jazz', 'jazz'), ('blues', 'blues'), ('soul', 'soul'), ('funk', 'funk'), ('flamenco', 'flamenco'),
    ('rumba', 'rumba'), ('folk', 'folk'), ('latina', 'latina'), ('latino', 'latina'), ('salsa', 'salsa'),
    ('bolero', 'bolero'), ('cumbia', 'cumbia'), ('clasica', 'clasica'), ('classical', 'clasica'),
    ('opera', 'opera'), ('zarzuela', 'zarzuela'), ('cantautor', 'cantautor'), ('singer songwriter', 'cantautor'),
    ('country', 'country'), ('gospel', 'gospel'), ('world music', 'world'), ('musica del mundo', 'world'),
    ('comedia', 'comedia'), ('humor', 'comedia'), ('monologos', 'comedia'), ('stand up', 'comedia')
ON CONFLICT (alias) DO NOTHING;

-- Registro de cada ingesta desde una fuente externa (Wikidata, MusicBrainz, OSM…): qué se pidió y qué salió.
CREATE TABLE IF NOT EXISTS catalogo_ingestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuente TEXT NOT NULL,
    pais TEXT,
    parametros JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado TEXT NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'ok', 'parcial', 'error')),
    inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin TIMESTAMPTZ,
    leidas INTEGER NOT NULL DEFAULT 0 CHECK (leidas >= 0),
    nuevas INTEGER NOT NULL DEFAULT 0 CHECK (nuevas >= 0),
    enlazadas INTEGER NOT NULL DEFAULT 0 CHECK (enlazadas >= 0),
    descartadas INTEGER NOT NULL DEFAULT 0 CHECK (descartadas >= 0),
    error TEXT,
    CHECK (fin IS NULL OR fin >= inicio)
);

-- Lo que trae una ingesta, antes de tocar el catálogo. Nada pasa a `salas_catalogo` sin pasar por aquí:
-- pendiente → enlazada (misma `claveSala` que una sala existente) | nueva (se creará) | revisar | descartada.
-- La identidad la decide `claveSala` (ADR 0044), nunca una coincidencia difusa: lo dudoso queda en «revisar».
CREATE TABLE IF NOT EXISTS catalogo_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingesta_id UUID NOT NULL REFERENCES catalogo_ingestas(id) ON DELETE CASCADE,
    fuente TEXT NOT NULL,
    external_id TEXT NOT NULL,
    licencia TEXT NOT NULL,
    datos JSONB NOT NULL,
    clave TEXT,
    sala_id TEXT REFERENCES salas_catalogo(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'enlazada', 'nueva', 'revisar', 'descartada')),
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ingesta_id, fuente, external_id)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_staging_estado ON catalogo_staging (ingesta_id, estado);
CREATE INDEX IF NOT EXISTS idx_catalogo_staging_sala ON catalogo_staging (sala_id) WHERE sala_id IS NOT NULL;

-- Emails que no se deben contactar nunca, de ninguna banda: bajas y quejas. Se guarda el SHA-256 hexadecimal del email
-- en minúsculas y sin espacios, no el email. Una vez dentro, no sale (la baja es definitiva salvo revisión manual).
CREATE TABLE IF NOT EXISTS catalogo_supresion (
    email_sha256 TEXT PRIMARY KEY CHECK (email_sha256 ~ '^[0-9a-f]{64}$'),
    motivo TEXT NOT NULL CHECK (motivo IN ('baja', 'queja', 'rebote_permanente', 'peticion_legal')),
    origen TEXT,
    sala_id TEXT REFERENCES salas_catalogo(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE catalogo_generos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_generos_alias ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_sala_generos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_ingestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_supresion ENABLE ROW LEVEL SECURITY;
