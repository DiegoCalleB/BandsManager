-- ====================================================================
-- MIGRATION: Add telefono_movil and telefono_fijo to leads table
-- Permite diferenciar el teléfono móvil (con soporte WhatsApp)
-- del teléfono fijo de la sala o promotora para contacto directo.
-- ====================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefono_movil TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefono_fijo TEXT DEFAULT '';

-- Retrocompatibilidad: Si un lead tiene telefono pero no telefono_fijo ni telefono_movil,
-- clasificamos tentativamente según el prefijo estándar español (+34 6xx / 7xx móvil, 8xx / 9xx fijo)
UPDATE leads
SET telefono_movil = telefono
WHERE (telefono_movil IS NULL OR telefono_movil = '')
  AND telefono IS NOT NULL AND telefono != ''
  AND (
    telefono ~* '(\+34|0034)?\s*[67][0-9]'
    OR telefono ~* '^[67][0-9]'
  );

UPDATE leads
SET telefono_fijo = telefono
WHERE (telefono_fijo IS NULL OR telefono_fijo = '')
  AND telefono IS NOT NULL AND telefono != ''
  AND (
    telefono ~* '(\+34|0034)?\s*[89][0-9]'
    OR telefono ~* '^[89][0-9]'
  );
