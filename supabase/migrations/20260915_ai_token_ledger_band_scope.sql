-- ====================================================================
-- Transparencia de Costes Dinámica: de usuario a banda
-- ====================================================================
-- Se decidió llevar el ledger a nivel de banda, no de usuario individual,
-- por dos motivos:
-- 1. Todo lo demás en esta app está scoped por banda (ver bandAccess.ts /
--    AGENTS.md §2.1), y el "tier" de sponsor tiene más sentido como estado
--    de la banda (junto a plan/estado_suscripcion en registered_bands) que
--    como campo suelto de un usuario cualquiera de esa banda.
-- 2. Los agentes de booking en background (Scout/Redactor, agentEngine.ts)
--    son la parte más cara de IA de toda la app y actúan sobre una banda,
--    sin ningún usuario interactivo al que atribuirles el coste. Un ledger
--    por user_id nunca iba a poder medir eso.

ALTER TABLE ai_token_ledger DROP CONSTRAINT IF EXISTS ai_token_ledger_user_id_fkey;
ALTER TABLE ai_token_ledger RENAME COLUMN user_id TO band_id;
ALTER TABLE ai_token_ledger
    ADD CONSTRAINT ai_token_ledger_band_id_fkey
    FOREIGN KEY (band_id) REFERENCES registered_bands(band_id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_ai_token_ledger_user_unsettled;
CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_band_unsettled
    ON ai_token_ledger (band_id, created_at)
    WHERE settled_at IS NULL;

-- tier se muda de users a registered_bands, junto al resto del estado de facturación de la banda.
ALTER TABLE users DROP COLUMN IF EXISTS tier;
ALTER TABLE registered_bands ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

DROP VIEW IF EXISTS ai_monthly_cost_by_user;
CREATE OR REPLACE VIEW ai_monthly_cost_by_band AS
SELECT
    band_id,
    date_trunc('month', created_at) AS billing_month,
    SUM(prompt_tokens) AS prompt_tokens,
    SUM(completion_tokens) AS completion_tokens,
    SUM(estimated_cost_eur) AS total_cost_eur,
    COUNT(*) FILTER (WHERE settled_at IS NULL) AS unsettled_calls
FROM ai_token_ledger
GROUP BY band_id, date_trunc('month', created_at);

DROP FUNCTION IF EXISTS get_ai_debt_cents(TEXT);
CREATE OR REPLACE FUNCTION get_ai_debt_cents(p_band_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_owed_eur NUMERIC(12, 6);
BEGIN
    SELECT COALESCE(SUM(estimated_cost_eur), 0)
      INTO v_owed_eur
      FROM ai_token_ledger
     WHERE band_id = p_band_id
       AND settled_at IS NULL;

    RETURN GREATEST(0, ROUND(v_owed_eur * 100)::INTEGER);
END;
$$;

REVOKE ALL ON FUNCTION get_ai_debt_cents(TEXT) FROM PUBLIC;

DROP FUNCTION IF EXISTS settle_ai_donation(TEXT, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION settle_ai_donation(
    p_band_id TEXT,
    p_amount_paid_cents INTEGER,
    p_stripe_event_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_owed_cents INTEGER;
    v_ids UUID[];
    v_became_sponsor BOOLEAN := FALSE;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_band_id, 0));

    WITH deuda_bloqueada AS (
        SELECT id, estimated_cost_eur
          FROM ai_token_ledger
         WHERE band_id = p_band_id
           AND settled_at IS NULL
         ORDER BY created_at
         FOR UPDATE
    )
    SELECT COALESCE(ROUND(SUM(estimated_cost_eur) * 100)::INTEGER, 0),
           COALESCE(array_agg(id), ARRAY[]::UUID[])
      INTO v_owed_cents, v_ids
      FROM deuda_bloqueada;

    IF p_amount_paid_cents > v_owed_cents THEN
        UPDATE ai_token_ledger
           SET settled_at = NOW(),
               settled_by_event = p_stripe_event_id
         WHERE id = ANY(v_ids);

        UPDATE registered_bands SET tier = 'sponsor' WHERE band_id = p_band_id;

        v_became_sponsor := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'owed_cents', v_owed_cents,
        'paid_cents', p_amount_paid_cents,
        'became_sponsor', v_became_sponsor,
        'settled_rows', array_length(v_ids, 1)
    );
END;
$$;

REVOKE ALL ON FUNCTION settle_ai_donation(TEXT, INTEGER, TEXT) FROM PUBLIC;
