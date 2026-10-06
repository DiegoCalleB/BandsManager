-- RGPD: el consentimiento debe ser un acto afirmativo explícito, no un valor por defecto.
ALTER TABLE fans ALTER COLUMN consentimiento_rgpd SET DEFAULT FALSE;
