-- Migration: 20261104_concerts_cartel_config.sql
-- Cartelería: lo que la banda eligió para el cartel de cada bolo (fondo, cabeza de cartel en un
-- bolo compartido, línea extra, QR, marca e historial de fondos de IA), para no volver a pagar un
-- fondo ni volver a preguntar quién encabeza. El cartel final ya va en `cartel_url`.
-- Lo escribe solo `dbGuardarCartel` (server/db/concerts.ts), saneado con sanearConfigCartel.
-- Idempotente.

ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS cartel_config JSONB;
