-- Cuándo se leyó por última vez la web de una sala del catálogo para completar sus datos (Instagram, email de rol, teléfono
-- fijo, género). Sirve para repartir el trabajo (las más antiguas primero) y no volver a leer la misma web cada día.
-- Solo aditiva e idempotente.
ALTER TABLE catalogo_salas ADD COLUMN IF NOT EXISTS web_revisada_en TIMESTAMPTZ;
