-- Agregar columnas para rastrear thread de Gmail en los leads
-- Permite emparejar respuestas por threadId en lugar de solo por email exacto

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;

-- Crear índice para búsquedas rápidas por thread
CREATE INDEX IF NOT EXISTS idx_leads_gmail_thread_id
ON leads(band_id, gmail_thread_id)
WHERE gmail_thread_id IS NOT NULL;

-- Comentarios de documentación
COMMENT ON COLUMN leads.gmail_thread_id IS 'Gmail thread ID para emparejar respuestas incluso si llegan de email diferente';
COMMENT ON COLUMN leads.gmail_message_id IS 'Gmail message ID del email enviado (borrador o enviado)';
