-- Migration: Agregar mecanismo de baja en emails (LSSICE art. 21)
-- Fecha: 2026-09-21
-- Propósito: Token unsubscribe único por propuesta para cumplir con ley de comercio electrónico

ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS unsubscribe_timestamp TIMESTAMPTZ;

-- Índice para búsqueda rápida de token
CREATE INDEX IF NOT EXISTS idx_lead_messages_unsubscribe_token
  ON lead_messages(unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;
