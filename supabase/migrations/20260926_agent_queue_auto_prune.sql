-- 42. Procedimiento de Poda y Retención Automática de la Cola de Agentes (agent_jobs_queue)
-- Elimina de forma segura trabajos completados con más de 7 días y fallidos con más de 30 días,
-- evitando la degradación de rendimiento y manteniendo los índices compactos.

CREATE OR REPLACE FUNCTION prune_old_agent_jobs_queue(
  completed_retention_days INTEGER DEFAULT 7,
  failed_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  deleted_completed INTEGER := 0;
  deleted_failed INTEGER := 0;
BEGIN
  -- 1. Eliminar trabajos completados con más de X días
  DELETE FROM agent_jobs_queue
  WHERE status = 'completed'
    AND completed_at < (NOW() - (completed_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS deleted_completed = ROW_COUNT;

  -- 2. Eliminar trabajos fallidos/cancelados antiguos con más de Y días
  DELETE FROM agent_jobs_queue
  WHERE status IN ('failed', 'cancelled')
    AND updated_at < (NOW() - (failed_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS deleted_failed = ROW_COUNT;

  deleted_count := deleted_completed + deleted_failed;
  RETURN deleted_count;
END;
$$;
