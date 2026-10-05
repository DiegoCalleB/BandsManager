-- Aportaciones voluntarias de las bandas a BandManager al cerrar un bolo.
-- Sustituye, de momento, a la comisión obligatoria: se mide cuántos bolos cerrados acaban en
-- aportación para decidir con datos si merece la pena Stripe Connect (docs/design/).
-- Una fila por pago; `id` es el id de la Checkout Session de Stripe (idempotencia del webhook).
CREATE TABLE IF NOT EXISTS deal_support_contributions (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES concert_deals(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    -- Para localizar el cobro en Stripe y reconciliar reembolsos (evento charge.refunded).
    stripe_payment_intent_id TEXT,
    -- Total reembolsado hasta ahora (acumulado, como lo informa Stripe en amount_refunded).
    reembolsado_cents INTEGER NOT NULL DEFAULT 0 CHECK (reembolsado_cents >= 0),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_support_band ON deal_support_contributions(band_id);
CREATE INDEX IF NOT EXISTS idx_deal_support_deal ON deal_support_contributions(deal_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_support_payment_intent
    ON deal_support_contributions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

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

-- Lo que de verdad ha aportado cada banda (descontando reembolsos).
CREATE OR REPLACE VIEW deal_support_neto AS
SELECT band_id,
       COUNT(*)                                        AS aportaciones,
       SUM(amount_cents)                               AS bruto_cents,
       SUM(reembolsado_cents)                          AS reembolsado_cents,
       SUM(amount_cents - reembolsado_cents)           AS neto_cents,
       -- Solo lectura: los importes se guardan en céntimos, aquí se ven en euros
       ROUND(SUM(amount_cents) / 100.0, 2)                      AS bruto_eur,
       ROUND(SUM(reembolsado_cents) / 100.0, 2)                 AS reembolsado_eur,
       ROUND(SUM(amount_cents - reembolsado_cents) / 100.0, 2)  AS neto_eur
FROM deal_support_contributions
GROUP BY band_id;
