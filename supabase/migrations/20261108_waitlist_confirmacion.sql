-- La lista de espera (`musicians_waitlist`) también recibe a quien deja su email en la landing oficial
-- sin registrarse. Doble confirmación: `confirmado_at` solo se rellena cuando abren el enlace del
-- correo, y sin él no se les escribe. `consentimiento_at` deja constancia de cuándo marcaron la casilla
-- (NULL en las filas anteriores, que no pasaron por este flujo: a esas no se les escribe) y `baja_at`
-- es la baja desde el enlace de cada correo. `origen` distingue de dónde llegó la fila. Idempotente.
ALTER TABLE musicians_waitlist
  ADD COLUMN IF NOT EXISTS origen TEXT,
  ADD COLUMN IF NOT EXISTS consentimiento_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS baja_at TIMESTAMPTZ;
