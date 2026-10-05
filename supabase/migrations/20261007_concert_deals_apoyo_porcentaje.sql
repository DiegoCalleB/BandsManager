-- Apoyo voluntario a BandManager elegido por la banda al crear el acuerdo.
--  · NULL  = no eligió: se propone la sugerencia por defecto (3 % del caché) al firmar la sala.
--  · 0     = eligió no apoyar: no se le vuelve a pedir.
--  · 0.5-20 = su elección: esa % del caché es el importe que se propone.
-- Se fija al crear el acuerdo (antes de la firma) y NO forma parte del sello SHA-256: no es un
-- término del contrato con la sala.
ALTER TABLE concert_deals
  ADD COLUMN IF NOT EXISTS apoyo_porcentaje NUMERIC(4,1)
  CHECK (apoyo_porcentaje IS NULL OR (apoyo_porcentaje >= 0 AND apoyo_porcentaje <= 20));
