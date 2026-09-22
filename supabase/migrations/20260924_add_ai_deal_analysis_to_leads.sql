-- Migration: Add AI deal analysis, sentiment, intent, playbook and extracted entity fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperatura_lead TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento_label TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_intencion TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_intencion_etiqueta TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimas_objeciones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_analisis_resumen TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechas_propuestas_sala JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS condiciones_economicas_detectadas JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estrategia_playbook JSONB DEFAULT '{}'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_mensaje_recibido TEXT;
