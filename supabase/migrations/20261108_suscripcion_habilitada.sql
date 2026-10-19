-- Interruptor por banda de la suscripción de pago. Apagado por defecto: el servidor rechaza el checkout
-- de cualquier banda que no lo tenga a true. Se enciende por datos (UPDATE), sin nombres de banda en el
-- código (ADR 0027). Idempotente.
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS suscripcion_habilitada BOOLEAN NOT NULL DEFAULT FALSE;
