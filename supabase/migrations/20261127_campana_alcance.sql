-- Migration: 20261127_campana_alcance.sql
-- Campañas de festivales (Black Friday): `alcance = 'festivales'` ofrece la banda a todos los festivales,
-- sin ciudad ni aforo. Por defecto 'salas' (comportamiento de siempre). Idempotente.
ALTER TABLE IF EXISTS campaigns ADD COLUMN IF NOT EXISTS alcance text NOT NULL DEFAULT 'salas';
ALTER TABLE IF EXISTS booking_campaigns ADD COLUMN IF NOT EXISTS alcance text NOT NULL DEFAULT 'salas';
