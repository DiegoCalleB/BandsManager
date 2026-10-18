-- Catálogo compartido de salas (fase 1): datos PÚBLICOS de cada sala, comunes a todas las bandas.
-- Aquí no hay notas, pitches, estados ni historial de ninguna banda: eso sigue siendo privado en `leads`.
-- Solo aditiva e idempotente: no toca ninguna fila existente, y una fila de `leads` sin `sala_id` sigue
-- funcionando exactamente igual. El relleno lo hace el servicio (server/services/catalogoSalas.ts), no este SQL.

CREATE TABLE IF NOT EXISTS salas_catalogo (
    id TEXT PRIMARY KEY,
    -- Clave de desduplicación: «place:<place_id>» o «nc:<nombre normalizado>|<ciudad normalizada>».
    clave TEXT NOT NULL UNIQUE,
    place_id TEXT,
    nombre TEXT NOT NULL,
    ciudad TEXT,
    region TEXT,
    direccion TEXT,
    tipo TEXT NOT NULL DEFAULT 'sala',
    aforo INTEGER CHECK (aforo IS NULL OR aforo > 0),
    genero TEXT,
    website TEXT,
    instagram TEXT,
    -- Solo contactos de la sala (email de rol, teléfono fijo), nunca de una persona (RGPD).
    email_contacto TEXT,
    telefono TEXT,
    -- Fiabilidad calculada, no declarada (server/utils/salaCatalogo.ts).
    nivel TEXT NOT NULL DEFAULT 'sin_verificar' CHECK (nivel IN ('sin_verificar', 'probable', 'verificada')),
    puntuacion INTEGER NOT NULL DEFAULT 0 CHECK (puntuacion BETWEEN 0 AND 100),
    verificada_en TIMESTAMPTZ,
    -- Contadores anónimos: cuántas bandas, nunca cuáles.
    bandas_con_respuesta INTEGER NOT NULL DEFAULT 0 CHECK (bandas_con_respuesta >= 0),
    bandas_con_entrega INTEGER NOT NULL DEFAULT 0 CHECK (bandas_con_entrega >= 0),
    rebotes INTEGER NOT NULL DEFAULT 0 CHECK (rebotes >= 0),
    -- Un «no contactar» bloquea las sugerencias a todas las bandas.
    no_contactar BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_no_contactar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salas_catalogo_nivel ON salas_catalogo (nivel) WHERE no_contactar = FALSE;
CREATE INDEX IF NOT EXISTS idx_salas_catalogo_region_tipo ON salas_catalogo (region, tipo);

-- Solo el servidor (service_role) la lee y la escribe; sin políticas, nadie más puede.
ALTER TABLE salas_catalogo ENABLE ROW LEVEL SECURITY;

-- Enlace opcional del lead privado de cada banda con su sala del catálogo. ON DELETE SET NULL: borrar una
-- sala del catálogo nunca borra ni modifica leads de nadie.
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS sala_id TEXT REFERENCES salas_catalogo(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_sala_id ON leads (sala_id) WHERE sala_id IS NOT NULL;
