-- ==============================================================================
-- BANDMANAGER.AI / BAKANDEYA — TRIGGER DE RESPUESTA INMEDIATA (aprobado_respuesta)
-- ==============================================================================
--
-- El envío programado de pitches en frío ("Enviador") ya NO vive aquí: lo gestiona el
-- scheduler interno del propio servidor Node (server/services/agentScheduler.ts), leyendo
-- el horario configurable por banda de la tabla band_schedules (pestaña "Horarios" de cada
-- banda en la app). Las antiguas Edge Functions despachador-propuestas/recibir-email/
-- responder-hilo (supabase/functions/) quedan retiradas — su lógica vive ahora en
-- server/services/agentEngine.ts y server/routes/agent.ts, con Gmail real por banda en vez
-- de un remitente compartido vía Resend.
--
-- Lo único que sigue haciendo falta en Supabase es este trigger: cuando un lead pasa a
-- 'aprobado_respuesta' (el músico aprueba responder a un hilo abierto), dispara el envío al
-- momento en vez de esperar al siguiente tick del scheduler.

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Campos de threading para respuestas dentro de un hilo de email existente (ya en
-- supabase_schema.sql / supabase_migration_only_new.sql, se repite aquí por si esta hoja se
-- aplica sola).
ALTER TABLE IF EXISTS leads
  ADD COLUMN IF NOT EXISTS thread_id TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_mensaje_recibido TEXT;

CREATE OR REPLACE FUNCTION trigger_enviar_respuesta_inmediata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado_respuesta' AND (OLD.estado IS DISTINCT FROM 'aprobado_respuesta') THEN
    PERFORM net.http_post(
      -- Sustituye por la URL real del servidor de BandsManager en Railway.
      url := 'https://TU_APP_BANDSMANAGER.up.railway.app/api/internal/agents/responder-hilo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Debe coincidir con la variable de entorno CRON_SECRET del servidor Node.
        'X-Cron-Secret', 'TU_CRON_SECRET'
      ),
      body := jsonb_build_object('lead_id', NEW.id)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enviar_respuesta_lead ON leads;
CREATE TRIGGER tr_enviar_respuesta_lead
  AFTER UPDATE OF estado ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_enviar_respuesta_inmediata();
