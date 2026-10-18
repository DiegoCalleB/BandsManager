-- Procedencia de los datos enriquecidos de un lead: {campo: {fuente, confianza, en}}. Solo los campos que rellenó el
-- enriquecimiento (Google Maps, web de la sala, buscador, catálogo compartido, IA); lo escrito a mano no figura.
-- Aditiva e idempotente: ninguna fila existente cambia (el valor por defecto es un objeto vacío, sin reescribir la tabla).
-- `leads.place_id` ya existe (20261009); hasta ahora ninguna ruta lo escribía.
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS datos_fuentes JSONB NOT NULL DEFAULT '{}'::jsonb;
