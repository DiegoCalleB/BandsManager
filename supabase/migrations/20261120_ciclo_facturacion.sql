-- Ciclo de facturación de la suscripción ('monthly' | 'annual'). Hasta ahora solo vivía en memoria
-- (data.json) y se perdía en cada reinicio del servidor, así que el regalo de pegatinas del plan anual
-- nunca habría llegado a nadie. NULL = desconocido (suscripciones anteriores): se rellena en la
-- siguiente renovación (invoice.paid) o a mano. Idempotente.
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS ciclo_facturacion TEXT;
