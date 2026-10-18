-- Estado del negocio de cada sala del catálogo según Google Maps (abierta, cerrada temporal o definitivamente).
-- Solo aditiva e idempotente. Una sala «cerrada_permanente» deja de salir en las consultas del catálogo; no se borra
-- nada y la agenda de ninguna banda cambia: quien ya la tiene la sigue teniendo.
ALTER TABLE salas_catalogo
    ADD COLUMN IF NOT EXISTS estado_negocio TEXT NOT NULL DEFAULT 'sin_verificar'
        CHECK (estado_negocio IN ('sin_verificar', 'operativo', 'cerrado_temporal', 'cerrado_permanente')),
    ADD COLUMN IF NOT EXISTS estado_negocio_en TIMESTAMPTZ;
