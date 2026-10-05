-- Aportaciones voluntarias de las bandas a BandManager al cerrar un bolo.
-- Sustituye, de momento, a la comisión obligatoria: se mide cuántos bolos cerrados acaban en
-- aportación para decidir con datos si merece la pena Stripe Connect (docs/design/).
-- Una fila por pago; `id` es el id de la Checkout Session de Stripe (idempotencia del webhook).
CREATE TABLE IF NOT EXISTS deal_support_contributions (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES concert_deals(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_support_band ON deal_support_contributions(band_id);
CREATE INDEX IF NOT EXISTS idx_deal_support_deal ON deal_support_contributions(deal_id);

ALTER TABLE deal_support_contributions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'deal_support_contributions'
      AND policyname = 'Permitir acceso total al backend para deal_support_contributions'
  ) THEN
    CREATE POLICY "Permitir acceso total al backend para deal_support_contributions"
      ON deal_support_contributions FOR ALL USING (true);
  END IF;
END $$;
