-- Emails de ciclo de vida (onboarding): qué email se envió a cada usuario y quién se ha dado de baja.
-- Una fila (user_id, tipo) = ese email ya se envió. tipo = 'baja' = el usuario no quiere más.
-- Idempotente: se puede lanzar varias veces.
CREATE TABLE IF NOT EXISTS emails_ciclo_vida (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    enviado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tipo)
);

-- Solo el servidor (service_role) la usa; sin políticas, nadie más la lee ni la escribe.
ALTER TABLE emails_ciclo_vida ENABLE ROW LEVEL SECURITY;
