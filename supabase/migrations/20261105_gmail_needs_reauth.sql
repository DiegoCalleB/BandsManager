-- Marca de "Google rechazó el refresh token (invalid_grant), hay que reconectar".
-- Antes el Lector reintentaba en silencio cada día con un token muerto (más de 100.000 errores en
-- agent_execution_logs). Con la marca, el planificador deja de encolar agentes para esa banda y la
-- pantalla de correo avisa. Reconectar Gmail la vuelve a poner en NULL.
-- Idempotente.
ALTER TABLE band_gmail_oauth_accounts
  ADD COLUMN IF NOT EXISTS needs_reauth_at TIMESTAMPTZ;
