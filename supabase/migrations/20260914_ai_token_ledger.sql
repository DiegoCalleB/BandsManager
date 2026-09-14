-- ====================================================================
-- Transparencia de Costes Dinámica: ledger de consumo de IA + donación
-- ====================================================================
-- No se crea una tabla `profiles` paralela: `users` ya es la fuente única
-- de identidad de esta app (ver users.plan/estado_suscripcion en
-- supabase_schema.sql). Añadimos `tier` ahí en vez de duplicar la tabla.

ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

-- 1. Ledger de tokens de IA -------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_token_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL CHECK (completion_tokens >= 0),
    model_name TEXT NOT NULL,
    estimated_cost_eur NUMERIC(10, 6) NOT NULL CHECK (estimated_cost_eur >= 0),
    -- NULL = deuda todavía viva. Se rellena en la misma transacción que marca
    -- al usuario como 'sponsor', así una fila nunca se cobra dos veces.
    settled_at TIMESTAMPTZ,
    settled_by_event TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- La consulta caliente de todo esto es "deuda viva de un usuario, más
-- reciente primero" (checkout dinámico) y "deuda viva agrupada del mes en
-- curso" (RPC de abajo): un índice parcial sobre filas sin liquidar cubre
-- ambas sin arrastrar todo el histórico ya cobrado.
CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_user_unsettled
    ON ai_token_ledger (user_id, created_at)
    WHERE settled_at IS NULL;

ALTER TABLE ai_token_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON ai_token_ledger FOR ALL USING (true);

-- 2. Vista de reporting: coste mensual agregado por usuario -----------------
-- Para dashboards/admin. El checkout individual usa la función de abajo,
-- no esta vista, porque necesita datos de un único usuario resueltos en el
-- momento exacto de la petición (ver get_ai_debt_cents).
CREATE OR REPLACE VIEW ai_monthly_cost_by_user AS
SELECT
    user_id,
    date_trunc('month', created_at) AS billing_month,
    SUM(prompt_tokens) AS prompt_tokens,
    SUM(completion_tokens) AS completion_tokens,
    SUM(estimated_cost_eur) AS total_cost_eur,
    COUNT(*) FILTER (WHERE settled_at IS NULL) AS unsettled_calls
FROM ai_token_ledger
GROUP BY user_id, date_trunc('month', created_at);

-- 3. RPC: deuda viva (sin liquidar) de un usuario, en céntimos --------------
-- STABLE + search_path fijo: SECURITY DEFINER con un search_path mutable es
-- el vector clásico de escalado de privilegios en funciones Postgres
-- (cualquiera con permiso en un esquema propio podría colar un `users` o
-- `ai_token_ledger` falsos delante en el path). Fijarlo a pg_catalog/public
-- lo cierra.
CREATE OR REPLACE FUNCTION get_ai_debt_cents(p_user_id TEXT)
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
     WHERE user_id = p_user_id
       AND settled_at IS NULL;

    RETURN GREATEST(0, ROUND(v_owed_eur * 100)::INTEGER);
END;
$$;

REVOKE ALL ON FUNCTION get_ai_debt_cents(TEXT) FROM PUBLIC;

-- 4. RPC: liquidar una donación de forma atómica ----------------------------
-- Hace en una sola transacción lo que en el paso 3 del enunciado son "dos
-- pasos" (comparar cobrado vs. adeudado + actualizar perfil): bloquea
-- exactamente las filas de deuda que va a sumar (FOR UPDATE), así una fila
-- de coste insertada a mitad de la liquidación (uso de IA concurrente con el
-- webhook) no se pierde ni se liquida por error - simplemente no entra en el
-- snapshot y queda para la próxima liquidación. El advisory lock por
-- usuario sirve de cinturón extra si Stripe reintenta el webhook o llegan
-- dos checkouts casi a la vez para el mismo usuario: el segundo espera a que
-- el primero termine de leer+marcar antes de recalcular la deuda, en vez de
-- leer un estado a medio actualizar.
CREATE OR REPLACE FUNCTION settle_ai_donation(
    p_user_id TEXT,
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
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id, 0));

    WITH deuda_bloqueada AS (
        SELECT id, estimated_cost_eur
          FROM ai_token_ledger
         WHERE user_id = p_user_id
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

        UPDATE users SET tier = 'sponsor' WHERE id = p_user_id;

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
