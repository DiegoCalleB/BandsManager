-- Migration: Create concert_deals table for 1-Click Deals and eIDAS signatures
CREATE TABLE IF NOT EXISTS concert_deals (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    concert_id TEXT REFERENCES concerts(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    
    nombre_evento TEXT NOT NULL,
    lugar_sala TEXT NOT NULL,
    ciudad TEXT DEFAULT '',
    fecha_evento TEXT NOT NULL,
    hora_llegada TEXT DEFAULT '18:30',
    hora_concierto TEXT DEFAULT '21:30',
    
    tipo_remuneracion TEXT DEFAULT 'cache_fijo',
    cache_base NUMERIC(10,2) DEFAULT 0.00,
    total_suplementos NUMERIC(10,2) DEFAULT 0.00,
    total_acordado NUMERIC(10,2) DEFAULT 0.00,
    porcentaje_taquilla NUMERIC(5,2) DEFAULT 0.00,
    forma_pago TEXT DEFAULT 'efectivo',
    
    rider_incluido BOOLEAN DEFAULT true,
    rider_texto TEXT DEFAULT '',
    rider_validado_por_sala BOOLEAN DEFAULT false,
    
    hospitalidad_notas TEXT DEFAULT '',
    
    estado TEXT DEFAULT 'pendiente',
    nombre_firmante TEXT,
    cargo_firmante TEXT,
    firma_imagen TEXT,
    firma_ip TEXT,
    firma_user_agent TEXT,
    firma_timestamp TIMESTAMPTZ,
    contrato_sha256 TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concert_deals_band_id ON concert_deals(band_id);
CREATE INDEX IF NOT EXISTS idx_concert_deals_lead_id ON concert_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_concert_deals_token ON concert_deals(token);

ALTER TABLE concert_deals ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'concert_deals' AND policyname = 'Permitir acceso total al backend para concert_deals'
  ) THEN
    CREATE POLICY "Permitir acceso total al backend para concert_deals" ON concert_deals FOR ALL USING (true);
  END IF;
END $$;
