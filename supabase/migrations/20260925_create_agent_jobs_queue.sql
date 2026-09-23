-- 41. agent_jobs_queue (Cola de Tareas Distribuidas y Resilientes para Agentes de IA)
-- Permite procesar trabajos de agentes (Scout, Lector, Redactor) con concurrencia,
-- reintentos automáticos (Exponential Backoff) y visibilidad completa desde Supabase.

CREATE TABLE IF NOT EXISTS agent_jobs_queue (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'scout_enrichment' | 'lector_inbox_check' | 'redactor_pitch_dispatch' | 'custom'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  payload JSONB DEFAULT '{}'::jsonb,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_by TEXT,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices optimizados para consulta atómica de colas de trabajos
CREATE INDEX IF NOT EXISTS idx_agent_queue_status_sched ON agent_jobs_queue(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agent_queue_band ON agent_jobs_queue(band_id, created_at DESC);

-- Seguridad RLS para la tabla de colas
ALTER TABLE agent_jobs_queue ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_jobs_queue' AND policyname = 'Permitir acceso total al backend'
  ) THEN
    CREATE POLICY "Permitir acceso total al backend" ON agent_jobs_queue FOR ALL USING (true);
  END IF;
END $$;
