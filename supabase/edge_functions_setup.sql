-- ==============================================================================
-- BANDMANAGER.AI / BAKANDEYA — CONFIGURACIÓN DE SUPABASE EDGE FUNCTIONS & PG_CRON
-- ==============================================================================

-- 1. Habilitar extensiones necesarias en Supabase (SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Asegurar campos en la tabla 'leads' para threading y mensajes
ALTER TABLE IF EXISTS leads 
  ADD COLUMN IF NOT EXISTS thread_id TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_mensaje_recibido TEXT;

-- 3. Programación con pg_cron para el Despachador de Propuestas Frías
-- Horario musical España: Martes, Miércoles y Jueves (2,3,4)
-- Mañana: 10:00 a 13:30 (UTC+1/UTC+2 según horario de verano, aprox 8:00 a 11:30 UTC)
-- Tarde: 16:30 a 18:30 (aprox 14:30 a 16:30 UTC)
-- Ejecución cada 15 minutos:

-- Job 1: Ventana Mañanas (Martes a Jueves, cada 15 min de 08:00 a 11:30 UTC)
SELECT cron.schedule(
  'despachar-propuestas-frias-manana',
  '*/15 8-11 * * 2,3,4',
  $$
  SELECT
    net.http_post(
      url := 'https://TU_PROYECTO_SUPABASE.functions.supabase.co/despachador-propuestas',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer TU_SUPABASE_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Job 2: Ventana Tardes (Martes a Jueves, cada 15 min de 14:30 a 16:30 UTC)
SELECT cron.schedule(
  'despachar-propuestas-frias-tarde',
  '*/15 14-16 * * 2,3,4',
  $$
  SELECT
    net.http_post(
      url := 'https://TU_PROYECTO_SUPABASE.functions.supabase.co/despachador-propuestas',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer TU_SUPABASE_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 4. Trigger opcional para 'aprobado_respuesta' (Disparo inmediato al aprobar)
CREATE OR REPLACE FUNCTION trigger_enviar_respuesta_inmediata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado_respuesta' AND (OLD.estado IS DISTINCT FROM 'aprobado_respuesta') THEN
    PERFORM net.http_post(
      url := 'https://TU_PROYECTO_SUPABASE.functions.supabase.co/responder-hilo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer TU_SUPABASE_SERVICE_ROLE_KEY'
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
