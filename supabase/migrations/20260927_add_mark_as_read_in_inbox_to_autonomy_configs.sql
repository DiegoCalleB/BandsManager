-- Añade columna mark_as_read_in_inbox a autonomy_configs (por defecto FALSE para preservar
-- el estado SIN LEER de los correos en la bandeja de entrada de Gmail/Outlook del mánager).
ALTER TABLE autonomy_configs ADD COLUMN IF NOT EXISTS mark_as_read_in_inbox BOOLEAN DEFAULT FALSE;
