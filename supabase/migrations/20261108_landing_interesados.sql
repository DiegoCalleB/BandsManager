-- Interesados que dejan su email en la landing oficial sin registrarse en la app (lista de novedades).
-- Doble confirmación: `confirmado_at` solo se rellena cuando abren el enlace del correo; sin él no se
-- les escribe más. `consentimiento_at` deja constancia de cuándo marcaron la casilla; `baja_at` es la
-- baja desde el enlace de cada correo. Idempotente.
CREATE TABLE IF NOT EXISTS landing_interesados (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  idioma TEXT NOT NULL DEFAULT 'es',
  origen TEXT NOT NULL DEFAULT 'landing',
  consentimiento_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmado_at TIMESTAMPTZ,
  baja_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_interesados_email ON landing_interesados(email);
ALTER TABLE landing_interesados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON landing_interesados;
CREATE POLICY "Permitir acceso total al backend" ON landing_interesados FOR ALL USING (true);
