-- Regalo de pegatinas en la primera suscripción de pago. Una fila por banda (PRIMARY KEY): pedirlo dos
-- veces no es posible. `estado` lo mueve a mano quien fabrica y envía el pack (pendiente → enviado).
-- Idempotente.
CREATE TABLE IF NOT EXISTS pegatinas_pedidos (
  band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  expres BOOLEAN NOT NULL DEFAULT FALSE,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  cp TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'España',
  telefono TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE pegatinas_pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON pegatinas_pedidos;
CREATE POLICY "Permitir acceso total al backend" ON pegatinas_pedidos FOR ALL USING (true);
