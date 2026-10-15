-- Migration: 20261013_calendar_conflict_notifications.sql
-- Registro de avisos de choque de calendario ya enviados por email, para no repetir el mismo
-- aviso cada vez que se guarda un evento o corre el barrido diario. La `huella` (ver
-- src/utils/calendarConflicts.ts) cambia si se mueve la fecha/hora de alguno de los dos eventos,
-- así que un choque que se arregla y reaparece distinto SÍ vuelve a avisar. Idempotente.

CREATE TABLE IF NOT EXISTS public.calendar_conflict_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  huella TEXT NOT NULL,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_calendar_conflict_user_huella UNIQUE (user_id, huella)
);

CREATE INDEX IF NOT EXISTS idx_calendar_conflict_notifications_band
  ON public.calendar_conflict_notifications(band_id);

ALTER TABLE public.calendar_conflict_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.calendar_conflict_notifications;
CREATE POLICY "Permitir acceso total al backend" ON public.calendar_conflict_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.calendar_conflict_notifications IS 'Avisos de choque de calendario ya enviados por email (user_id + huella), ver server/services/calendarConflictService.ts.';
