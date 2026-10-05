-- Migration: Create concert_deals table for 1-Click Deals and eIDAS signatures
-- (versión con columnas de comisión e inmutabilidad del acuerdo firmado; la tabla NO existía en
-- producción cuando se redactó esta versión, así que se edita en lugar de añadir otra migración).
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
    comision_porcentaje NUMERIC(5,2) DEFAULT 5.00,
    comision_importe NUMERIC(10,2) DEFAULT 0.00,
    neto_banda NUMERIC(10,2) DEFAULT 0.00,
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

-- ---------------------------------------------------------------------------------------------
-- Inmutabilidad: un acuerdo 'confirmado' (firmado por la sala) no puede cambiar sus términos ni
-- su firma, ni siquiera con la service role. Solo se permite `concert_id` (lo enlaza el efecto
-- dominó tras firmar), `updated_at` y `lead_id` (el FK ON DELETE SET NULL del lead lo pone a NULL).
-- Los DELETE no se bloquean a propósito: ON DELETE CASCADE de la banda debe poder borrar sus datos. Anular un acuerdo firmado exige crear uno nuevo.
-- IMPORTANTE: en un trigger BEFORE UPDATE hay que devolver NEW, no OLD (OLD descarta el cambio).
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_concert_deals_inmutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.estado = 'confirmado' THEN
    IF (to_jsonb(NEW) - 'concert_id' - 'updated_at' - 'lead_id') IS DISTINCT FROM (to_jsonb(OLD) - 'concert_id' - 'updated_at' - 'lead_id') THEN
      RAISE EXCEPTION 'El acuerdo % ya está firmado y no se puede modificar', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_concert_deals_inmutable ON concert_deals;
CREATE TRIGGER trg_concert_deals_inmutable
  BEFORE UPDATE ON concert_deals
  FOR EACH ROW EXECUTE FUNCTION public.fn_concert_deals_inmutable();
