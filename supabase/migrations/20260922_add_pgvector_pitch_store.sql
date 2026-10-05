-- ====================================================================
-- MIGRACIÓN: PGVECTOR PITCH STORE & RAG DE BOOKING
-- ====================================================================
-- Habilitar extensión pgvector si no estuviese habilitada ya
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla para almacenar embeddings semánticos de pitches exitosos,
-- hilos de negociación cerrados y ejemplos Few-Shot con su score de conversión
CREATE TABLE IF NOT EXISTS pitch_vector_store (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    band_id TEXT NOT NULL,
    lead_id TEXT,
    nombre_sala TEXT NOT NULL,
    tipo_entidad TEXT NOT NULL DEFAULT 'sala',
    ciudad TEXT,
    genero_musical TEXT,
    texto_pitch TEXT NOT NULL,
    embedding vector(768),
    resultado_respuesta TEXT DEFAULT 'pendiente', -- 'positiva', 'negativa', 'confirmado', 'pendiente'
    conversion_score NUMERIC DEFAULT 0.5,        -- Ponderador de 0.0 a 1.0 según éxito
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices relacionales
CREATE INDEX IF NOT EXISTS idx_pitch_vector_band ON pitch_vector_store (band_id, tipo_entidad);
CREATE INDEX IF NOT EXISTS idx_pitch_vector_score ON pitch_vector_store (conversion_score DESC);

-- Índice HNSW para búsqueda por distancia coseno ultrarrápida
CREATE INDEX IF NOT EXISTS idx_pitch_vector_embedding 
ON pitch_vector_store 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Función RPC para búsqueda por similitud semántica con filtro de banda y categoría
CREATE OR REPLACE FUNCTION match_pitch_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_band_id text,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  band_id text,
  nombre_sala text,
  tipo_entidad text,
  ciudad text,
  texto_pitch text,
  resultado_respuesta text,
  conversion_score numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.band_id,
    p.nombre_sala,
    p.tipo_entidad,
    p.ciudad,
    p.texto_pitch,
    p.resultado_respuesta,
    p.conversion_score,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM pitch_vector_store p
  WHERE (p.band_id = filter_band_id OR p.band_id = 'system_curated')
    AND (filter_category IS NULL OR p.tipo_entidad = filter_category)
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY (1 - (p.embedding <=> query_embedding)) * (1 + (p.conversion_score * 0.2)) DESC
  LIMIT match_count;
END;
$$;

-- RLS: Habilitar Row Level Security con política permisiva para backend
ALTER TABLE pitch_vector_store ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pitch_vector_store' AND policyname = 'Permitir acceso total al backend en pitch_vector_store'
    ) THEN
        CREATE POLICY "Permitir acceso total al backend en pitch_vector_store"
        ON pitch_vector_store FOR ALL
        USING (true);
    END IF;
END $$;
