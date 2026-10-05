-- Migration: 20260920_add_alert_settings_table.sql
-- Tabla para persistir la configuración del Radar de Alertas del Mánager por banda en Supabase

CREATE TABLE IF NOT EXISTS public.band_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id TEXT NOT NULL UNIQUE,
  email_notifications_enabled BOOLEAN DEFAULT true,
  in_app_notifications_enabled BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'weekly_digest', -- 'realtime' | 'daily_digest' | 'weekly_digest'
  recipient_email TEXT,
  recipient_role TEXT DEFAULT 'leader_only', -- 'leader_only' | 'all_members'
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para búsquedas rápidas por band_id
CREATE INDEX IF NOT EXISTS idx_band_alert_settings_band_id ON public.band_alert_settings(band_id);

-- RLS (Row Level Security): Backend Access Policy
ALTER TABLE public.band_alert_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_alert_settings;
CREATE POLICY "Permitir acceso total al backend" ON public.band_alert_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.band_alert_settings IS 'Guarda la configuración personalizada de reglas de alerta, umbrales de días y canales de notificación por banda.';
