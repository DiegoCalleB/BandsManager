-- ====================================================================
-- Inmutabilidad (Append-Only) en Tablas de Auditoría Crítica (TFM Hardening)
-- ====================================================================
-- Garantiza no repudio, trazabilidad forense e integridad ante intentos
-- de alteración o borrado de registros de auditoría y costes.

-- 1. Función genérica de rechazo para triggers append-only
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Tabla de auditoría protegida (Append-Only): % no permitido en %.', TG_OP, TG_TABLE_NAME;
    RETURN NULL;
END;
$$;

-- 2. Trigger en ai_token_ledger (bloquea DELETE para preservar el histórico de consumo)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_token_ledger') THEN
    DROP TRIGGER IF EXISTS trg_prevent_delete_ai_token_ledger ON ai_token_ledger;
    CREATE TRIGGER trg_prevent_delete_ai_token_ledger
    BEFORE DELETE ON ai_token_ledger
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();
  END IF;
END $$;

-- 3. Tabla agent_execution_logs con protección estricta (bloquea UPDATE y DELETE)
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id TEXT PRIMARY KEY,
    band_id TEXT,
    agente TEXT NOT NULL,
    motor TEXT,
    disparado_por_tipo TEXT DEFAULT 'usuario_manual',
    usuario_id TEXT,
    usuario_email TEXT,
    estado TEXT NOT NULL,
    mensaje TEXT,
    leads_afectados JSONB DEFAULT '[]'::jsonb,
    conteo_afectados INTEGER DEFAULT 0,
    duracion_ms INTEGER DEFAULT 0,
    detalles JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE agent_execution_logs ADD COLUMN IF NOT EXISTS agente TEXT;
ALTER TABLE agent_execution_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_band ON agent_execution_logs(band_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_execution_logs' AND column_name = 'agente'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agente ON agent_execution_logs(agente);
  END IF;
END $$;

ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_execution_logs' AND policyname = 'Permitir acceso total al backend'
  ) THEN
    CREATE POLICY "Permitir acceso total al backend" ON agent_execution_logs FOR ALL USING (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_append_only_agent_execution_logs ON agent_execution_logs;
CREATE TRIGGER trg_append_only_agent_execution_logs
BEFORE UPDATE OR DELETE ON agent_execution_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
