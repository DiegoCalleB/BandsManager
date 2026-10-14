-- Cursor de lectura incremental de la bandeja de Gmail (historyId del último estado ya procesado).
-- Antes el Lector pedía "in:inbox newer_than:7d" con un máximo de 25 mensajes: en un buzón normal
-- una respuesta de una sala podía quedar fuera de esos 25 y no verse nunca. Con el cursor se piden
-- solo los mensajes añadidos desde la última lectura, sea cual sea el volumen del buzón.
-- NULL = sin cursor (escaneo completo de 7 días); se vuelve a poner a NULL al reconectar la cuenta.
-- Idempotente.
ALTER TABLE band_gmail_oauth_accounts
  ADD COLUMN IF NOT EXISTS gmail_history_id TEXT;
