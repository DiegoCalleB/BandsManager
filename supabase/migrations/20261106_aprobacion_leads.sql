-- Constancia de la aprobación humana de cada correo (AGENTS.md §3, mandamiento 2): quién aprobó,
-- cuándo y una huella sha256 del texto exacto. El Enviador solo despacha si la huella coincide con
-- el texto que va a salir (server/utils/aprobacionLead.ts).
-- Idempotente.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS aprobado_por TEXT,
  ADD COLUMN IF NOT EXISTS aprobado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pitch_aprobado_hash TEXT;

-- Los leads que YA están en cola de envío fueron aprobados por una persona con el flujo anterior:
-- se les sella el texto actual para no bloquearlos por sorpresa. El autor queda como 'migracion'.
UPDATE leads
SET pitch_aprobado_hash = encode(sha256(convert_to(regexp_replace(COALESCE(pitch_generado, ''), '^\s+|\s+$', '', 'g'), 'UTF8')), 'hex'),
    aprobado_por = 'migracion',
    aprobado_at = NOW()
WHERE estado IN ('aprobado', 'aprobado_propuesta', 'aprobado_respuesta')
  AND pitch_aprobado_hash IS NULL
  AND COALESCE(btrim(pitch_generado), '') <> '';
