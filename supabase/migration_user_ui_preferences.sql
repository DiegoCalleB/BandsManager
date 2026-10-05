-- ====================================================================
-- MIGRATION: Add ui_preferences JSONB column to users table
-- Permite almacenar configuraciones personalizadas de interfaz de usuario
-- (como la vista por defecto del calendario: 1M o 2M diferenciado por móvil/escritorio)
-- ====================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.ui_preferences IS 'Preferencias personalizadas de UI del usuario (ej. calendar_default_months diferenciado por tipo de dispositivo: mobile, desktop)';
