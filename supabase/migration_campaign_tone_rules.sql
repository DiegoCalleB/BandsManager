-- Agregar soporte para reglas de tono específicas por campaña
-- Permite que cada campaña acumule sus propias reglas de estilo aprendidas

-- Tabla campaigns (estándar)
ALTER TABLE IF EXISTS public.campaigns
    ADD COLUMN IF NOT EXISTS campaign_tone_rules JSONB DEFAULT NULL;

-- Tabla booking_campaigns (fallback)
ALTER TABLE IF EXISTS public.booking_campaigns
    ADD COLUMN IF NOT EXISTS campaign_tone_rules JSONB DEFAULT NULL;

-- Tabla para registrar ediciones de entrenamiento específicas de campaña
CREATE TABLE IF NOT EXISTS campaign_pitch_training (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    borrador_ia TEXT NOT NULL,
    texto_aprobado TEXT NOT NULL,
    tuvo_edicion BOOLEAN DEFAULT FALSE,
    diferencia_longitud INTEGER,
    tipo_accion TEXT DEFAULT 'entrenamiento_campaña',
    fecha_aprobacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_pitch_training_band_campaign
    ON campaign_pitch_training(band_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_pitch_training_campaign
    ON campaign_pitch_training(campaign_id);

ALTER TABLE campaign_pitch_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON campaign_pitch_training FOR ALL USING (true);
