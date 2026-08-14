-- ====================================================================
-- BAND MANAGER - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ====================================================================

-- 0. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. registered_bands
CREATE TABLE IF NOT EXISTS registered_bands (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    nombre_banda TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'pro',
    contacto_nombre TEXT,
    estilo_musical TEXT,
    localizacion TEXT,
    telefono TEXT,
    instagram TEXT,
    spotify_youtube TEXT,
    aforo_promedio INTEGER DEFAULT 0,
    estado_cuenta TEXT DEFAULT 'activo',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    plan TEXT DEFAULT 'emergente',
    band_name TEXT,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE SET NULL,
    email TEXT,
    instrument TEXT,
    avatar_color TEXT,
    password_hash TEXT,
    salt TEXT,
    google_oauth JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. user_bands
CREATE TABLE IF NOT EXISTS user_bands (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_band UNIQUE (user_id, band_id)
);

-- 4. leads
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre_sala TEXT NOT NULL,
    ciudad TEXT,
    region TEXT,
    direccion TEXT,
    aforo INTEGER DEFAULT 0 CHECK (aforo >= 0),
    genero TEXT,
    tipo TEXT DEFAULT 'sala',
    email_contacto TEXT,
    telefono TEXT,
    website TEXT,
    instagram TEXT,
    contacto_nombre TEXT,
    fuente TEXT DEFAULT 'manual',
    estado TEXT DEFAULT 'nuevo',
    pitch_generado TEXT,
    fecha_envio TEXT,
    fecha_ultima_respuesta TEXT,
    contexto_extra TEXT,
    notas TEXT,
    icono TEXT,
    imagen_url TEXT,
    es_favorito BOOLEAN DEFAULT FALSE,
    es_verificado BOOLEAN DEFAULT FALSE,
    fiabilidad_score NUMERIC,
    pitch_feedback_tono NUMERIC,
    pitch_feedback_contenido NUMERIC,
    pitch_feedback_comentario TEXT,
    historial_feedback_pitch JSONB DEFAULT '[]'::jsonb,
    historial_contacto JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. lead_messages
CREATE TABLE IF NOT EXISTS lead_messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT,
    remitente TEXT DEFAULT 'sala',
    remitente_nombre TEXT,
    asunto TEXT,
    mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. band_contacts
CREATE TABLE IF NOT EXISTS band_contacts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre_banda TEXT NOT NULL,
    estilo_musical TEXT,
    localizacion TEXT,
    estado_relacion TEXT DEFAULT 'sin_contactar',
    ultimo_contacto TEXT,
    contacto_nombre TEXT,
    email TEXT,
    telefono TEXT,
    instagram TEXT,
    spotify_youtube TEXT,
    aforo_promedio INTEGER DEFAULT 0,
    notas_colaboracion TEXT,
    ciudad_origen_swap TEXT,
    icono TEXT,
    imagen_url TEXT,
    es_favorito BOOLEAN DEFAULT FALSE,
    es_verificado BOOLEAN DEFAULT FALSE,
    fiabilidad_score NUMERIC,
    estilo_comunicacion TEXT,
    dna_expresion JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. setlists (creada antes que rehearsals y concerts por la FK)
CREATE TABLE IF NOT EXISTS setlists (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo_formato TEXT DEFAULT 'festival',
    duracion_total_estimada_minutos INTEGER DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_ultima_edicion TIMESTAMPTZ DEFAULT NOW()
);

-- 8. rehearsals
CREATE TABLE IF NOT EXISTS rehearsals (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    band_name TEXT,
    fecha TEXT NOT NULL,
    hora TEXT,
    lugar TEXT,
    asistentes JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    estado TEXT DEFAULT 'programado',
    setlist_id TEXT REFERENCES setlists(id) ON DELETE SET NULL,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. concerts
CREATE TABLE IF NOT EXISTS concerts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    band_name TEXT,
    fecha TEXT NOT NULL,
    ciudad TEXT,
    sala TEXT NOT NULL,
    direccion TEXT,
    cache NUMERIC DEFAULT 0 CHECK (cache >= 0),
    aforo_vendido INTEGER DEFAULT 0,
    aforo_total INTEGER DEFAULT 0,
    contrato_firmado BOOLEAN DEFAULT FALSE,
    estado_pago TEXT DEFAULT 'pendiente',
    notas TEXT,
    tipo TEXT DEFAULT 'sala',
    setlist_id TEXT REFERENCES setlists(id) ON DELETE SET NULL,
    gastos_detalle JSONB DEFAULT '{}'::jsonb,
    gastos_estimados_tipicos NUMERIC DEFAULT 0,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. epk_configs
CREATE TABLE IF NOT EXISTS epk_configs (
    band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    biografia TEXT,
    logo_url TEXT,
    dossier_pdf_url TEXT,
    dossier_pdf_name TEXT,
    dossier_document_url TEXT,
    dossier_document_name TEXT,
    dossier_texto_extra TEXT,
    band_photos JSONB DEFAULT '[]'::jsonb,
    rider_tecnico TEXT,
    rider_pdf_url TEXT,
    rider_pdf_name TEXT,
    enlaces_redes JSONB DEFAULT '{}'::jsonb,
    contacto_booking JSONB DEFAULT '{}'::jsonb,
    temas_destacados_ids JSONB DEFAULT '[]'::jsonb,
    incentivo_fans JSONB DEFAULT '{}'::jsonb,
    ciudades_config JSONB DEFAULT '[]'::jsonb,
    firma_email JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. fans
CREATE TABLE IF NOT EXISTS fans (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    ciudad TEXT,
    como_conocio TEXT,
    concierto_origen_id TEXT REFERENCES concerts(id) ON DELETE SET NULL,
    concierto_origen_nombre TEXT,
    fecha_captura TEXT,
    consentimiento_rgpd BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. social_posts
CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    contenido TEXT,
    estado TEXT DEFAULT 'borrador',
    responsable TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    importe NUMERIC DEFAULT 0 CHECK (importe >= 0),
    fecha TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. social_metrics
CREATE TABLE IF NOT EXISTS social_metrics (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    instagram INTEGER DEFAULT 0,
    tiktok INTEGER DEFAULT 0,
    youtube INTEGER DEFAULT 0,
    spotify INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. songs
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    duracion TEXT,
    duracion_segundos INTEGER DEFAULT 0,
    duracion_minutos INTEGER DEFAULT 0,
    tonalidad TEXT,
    bpm INTEGER DEFAULT 120,
    afinacion TEXT,
    album_disco TEXT,
    orden_album INTEGER,
    album TEXT,
    genero TEXT,
    tipo TEXT,
    estado TEXT,
    energia INTEGER DEFAULT 5,
    portada_url TEXT,
    favorito_general BOOLEAN DEFAULT FALSE,
    estado_tema TEXT DEFAULT 'ensayando',
    es_version_covers BOOLEAN DEFAULT FALSE,
    enlace_acordes TEXT,
    notas_internas TEXT,
    audio_principal_url TEXT,
    audio_ideas JSONB DEFAULT '[]'::jsonb,
    cifrado_texto TEXT,
    guia_sustituto JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. tours
CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    vehiculo TEXT,
    consumo_l100km NUMERIC CHECK (consumo_l100km >= 0),
    precio_carburante_eur NUMERIC,
    tipo_combustible TEXT,
    presupuesto_logistica NUMERIC,
    vehiculos JSONB DEFAULT '[]'::jsonb,
    stops JSONB DEFAULT '[]'::jsonb,
    estado TEXT DEFAULT 'planificacion',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. run_of_show
CREATE TABLE IF NOT EXISTS run_of_show (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    time TEXT NOT NULL,
    activity TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. gear_checklists
CREATE TABLE IF NOT EXISTS gear_checklists (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    label TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. autonomy_configs
CREATE TABLE IF NOT EXISTS autonomy_configs (
    band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    dispatch_level TEXT DEFAULT 'draft_only',
    negotiation_depth TEXT DEFAULT 'filter_conditions',
    min_cache_threshold NUMERIC DEFAULT 300,
    max_cache_threshold NUMERIC DEFAULT 800,
    auto_decline_under_min_cache BOOLEAN DEFAULT FALSE,
    notify_on_every_proposal BOOLEAN DEFAULT TRUE,
    require_human_for_final_sign_off BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. saved_filters
CREATE TABLE IF NOT EXISTS saved_filters (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    section_tab TEXT,
    search_term TEXT,
    selected_city_filter TEXT,
    status_filter TEXT,
    type_filter TEXT,
    min_capacity_filter INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    remitente TEXT,
    mensaje TEXT,
    fecha TEXT,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE registered_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE epk_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_of_show ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso total al backend" ON registered_bands FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON users FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON user_bands FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON leads FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON lead_messages FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON band_contacts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON rehearsals FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON concerts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON epk_configs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON fans FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON social_posts FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON payments FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON social_metrics FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON songs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON setlists FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON tours FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON run_of_show FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON gear_checklists FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON autonomy_configs FOR ALL USING (true);
CREATE POLICY "Permitir acceso total al backend" ON saved_filters FOR ALL USING (true);
CREATE TABLE IF NOT EXISTS band_schedules (
  band_id text PRIMARY KEY,
  timezone text DEFAULT 'Europe/Madrid',
  horas_lector jsonb DEFAULT '[]'::jsonb, -- Array de enteros de 0 a 23. Ej: [9, 14, 19]
  horas_enviador jsonb DEFAULT '[]'::jsonb -- Array de enteros de 0 a 23. Ej: [10, 16]
);

ALTER TABLE band_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON band_schedules FOR ALL USING (true);

