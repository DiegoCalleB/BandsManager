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
    radar_enabled BOOLEAN DEFAULT TRUE,
    last_social_radar_at TIMESTAMPTZ,
    dna_expresion JSONB,
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
    main_band_id TEXT,
    band_order JSONB,
    ui_preferences JSONB DEFAULT '{}'::jsonb,
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
    email_secundario TEXT DEFAULT '',
    telefono TEXT,
    telefono_movil TEXT DEFAULT '',
    telefono_fijo TEXT DEFAULT '',
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
    -- Historial de hilo de email tal como lo ve el frontend (integración de Gmail, simulación de
    -- negociación) - NO es la fuente de verdad de la conversación real (esa es lead_messages,
    -- donde escribe el Enviador/Lector); server/db/leads.ts la persiste para que ese lado del
    -- frontend deje de perderse en cada guardado, pero conceptualmente son dos cosas distintas.
    hilo_emails JSONB DEFAULT '[]'::jsonb,
    roster TEXT,
    festival_start_date TEXT,
    festival_end_date TEXT,
    fechas_ocupadas JSONB DEFAULT '[]'::jsonb,
    fechas_libres_detectadas JSONB DEFAULT '[]'::jsonb,
    temperatura_lead TEXT,
    ultimo_sentimiento TEXT,
    ultimo_sentimiento_score NUMERIC,
    ultimo_sentimiento_label TEXT,
    ultima_intencion TEXT,
    ultima_intencion_etiqueta TEXT,
    ultimas_objeciones JSONB DEFAULT '[]'::jsonb,
    ultimo_analisis_resumen TEXT,
    fechas_propuestas_sala JSONB DEFAULT '[]'::jsonb,
    condiciones_economicas_detectadas JSONB DEFAULT '{}'::jsonb,
    estrategia_playbook JSONB DEFAULT '{}'::jsonb,
    ultimo_mensaje_recibido TEXT,
    -- ID del borrador creado por el Agente Enviador vía la API de Gmail (server/services/
    -- gmailApiClient.ts) cuando la banda usa OAuth sin contraseña. Permite comprobar en el
    -- siguiente tick del scheduler si el borrador sigue existiendo o si ya se envió a mano
    -- desde Gmail (server/services/agentEngine.ts:comprobarBorradoresGmailEnviados). Null para
    -- leads creados por el camino IMAP o enviados de verdad.
    gmail_draft_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. lead_messages (fuente de verdad de la conversación real por lead: lo que el Enviador
-- manda de verdad y lo que el Lector detecta como respuesta entrante, ambos en esta misma
-- tabla - ver server/db/leadMessages.ts, server/services/lectorAgent.ts)
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
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_band ON lead_messages(lead_id, band_id);

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

-- 7b. setlist_shortcuts
CREATE TABLE IF NOT EXISTS setlist_shortcuts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    icono TEXT DEFAULT '⚡',
    etiqueta TEXT NOT NULL,
    titulo_custom TEXT,
    duracion_estimada_minutos INTEGER,
    duracion_estimada_segundos INTEGER,
    nota_tema TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. rehearsals
CREATE TABLE IF NOT EXISTS rehearsals (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    band_name TEXT,
    fecha TEXT NOT NULL,
    hora TEXT,
    hora_fin TEXT,
    lugar TEXT,
    asistentes JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    estado TEXT DEFAULT 'programado',
    setlist_id TEXT REFERENCES setlists(id) ON DELETE SET NULL,
    convocatoria_tipo TEXT DEFAULT 'completa',
    convocados_ids JSONB DEFAULT '[]'::jsonb,
    convocados_nombres JSONB DEFAULT '[]'::jsonb,
    agenda JSONB DEFAULT '[]'::jsonb,
    objetivos JSONB DEFAULT '[]'::jsonb,
    duracion_estimada_min INTEGER DEFAULT 0,
    duracion_real_seg INTEGER DEFAULT 0,
    cronometro_estado JSONB DEFAULT '{}'::jsonb,
    acta JSONB DEFAULT '{}'::jsonb,
    grabaciones JSONB DEFAULT '[]'::jsonb,
    rating_general INTEGER,
    temperatura_local TEXT,
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
    idioma TEXT DEFAULT '',
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
    donacion_revolut JSONB DEFAULT '{}'::jsonb,
    ciudades_config JSONB DEFAULT '[]'::jsonb,
    firma_email JSONB DEFAULT '{}'::jsonb,
    -- Contenido del EPK público orientado a contratación (ver src/components/PublicEPK.tsx)
    miembros JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    datos_contratacion JSONB DEFAULT '{}'::jsonb,
    -- Versiones en otros idiomas del contenido que escribe la banda (biografía, lema, bios de
    -- los miembros...). Clave = código de idioma; ver EPKTranslations en src/types.ts.
    traducciones JSONB DEFAULT '{}'::jsonb,
    plantilla TEXT DEFAULT 'stage',
    orden_secciones JSONB DEFAULT '[]'::jsonb,
    secciones_ocultas JSONB DEFAULT '[]'::jsonb,
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
    mensaje TEXT DEFAULT '',
    cancion_favorita TEXT DEFAULT '',
    instagram TEXT DEFAULT '',
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
    -- Qué hace el Agente Enviador justo después de que un humano apruebe un lead en la app:
    -- 'draft_gmail' (por defecto) deja un borrador en Gmail para un último vistazo antes de
    -- mandarlo a mano; 'direct_send' lo despacha directamente, sin ese segundo paso manual, para
    -- bandas que ya se fían de lo que aprobaron en el paso 1. Ninguno de los dos salta la
    -- aprobación humana en sí (server/services/agentEngine.ts) - y solo tiene efecto si además
    -- el servidor entero tiene AGENT_EMAIL_MODE=send (si no, siempre se queda en borrador).
    dispatch_mode TEXT DEFAULT 'draft_gmail',
    agent_sender_email TEXT,
    agent_sender_name TEXT,
    agent_reply_to_email TEXT,
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

-- Migraciones adicionales idempotentes
ALTER TABLE tours ADD COLUMN IF NOT EXISTS vehiculos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS convocatoria_tipo TEXT DEFAULT 'completa';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS convocados_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS convocados_nombres JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS sincronizar_calendario BOOLEAN DEFAULT true;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS sincronizar_finanzas BOOLEAN DEFAULT false;
ALTER TABLE concerts ADD COLUMN IF NOT EXISTS gira_id TEXT;
ALTER TABLE concerts ADD COLUMN IF NOT EXISTS gira_nombre TEXT;

-- Motor de agentes de booking consolidado en Node (server/services/agentScheduler.ts,
-- server/services/gmailAgentClient.ts) - sustituye a las implementaciones en Python/GitHub
-- Actions, Node nativo con Resend y las Edge Functions de Supabase, ver server/routes/agent.ts.
-- (agent_schedule_state se define más abajo, tabla 31 - esta sección solo documentaba la
-- intención antes de que la tabla real llegara a crearse en producción).

-- Cuenta de email por banda para envío/lectura desatendidos (Agente Enviador/Lector), vía
-- SMTP (envío) e IMAP (lectura) - protocolos estándar que soportan Gmail, Outlook, Yahoo o
-- cualquier dominio propio, en vez de atarse a la API específica de un solo proveedor. Cada
-- banda conecta su propia cuenta con una contraseña de aplicación (nunca un buzón compartido
-- entre bandas). email se usa para verificar que la cuenta configurada coincide con el email
-- oficial de la banda en su EPK antes de enviar nada (si no coincide, el Enviador falla
-- explícito y no manda).
DROP TABLE IF EXISTS band_gmail_tokens;

CREATE TABLE IF NOT EXISTS band_email_accounts (
  band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'other', -- 'gmail' | 'outlook' | 'other'
  email TEXT NOT NULL,
  app_password TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE band_email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON band_email_accounts FOR ALL USING (true);

-- Reintroduce, deliberadamente y solo para Gmail, lo que band_gmail_tokens hacía antes de ser
-- retirada (ver DROP TABLE arriba): un refresh token de OAuth por banda para que el backend
-- pueda crear borradores en Gmail sin contraseña de aplicación NI popup - imprescindible para
-- el Agente Enviador programado (server/services/agentScheduler.ts), que corre sin navegador y
-- sin ninguna banda con sesión abierta en ese instante. band_email_accounts (arriba) sigue
-- siendo el único camino para Outlook y para cualquier banda Gmail que no conecte OAuth; ver
-- server/services/agentEngine.ts para el orden de preferencia entre las dos.
CREATE TABLE IF NOT EXISTS band_gmail_oauth_accounts (
  band_id TEXT PRIMARY KEY REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  gmail_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE band_gmail_oauth_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON band_gmail_oauth_accounts FOR ALL USING (true);


-- Análisis de highlights del generador de Reels (server/routes/reels.ts). Antes vivía solo en
-- el estado de React: al recargar la página, o simplemente al cerrar la pestaña, se perdían los
-- clips sugeridos, el mapa de energía del audio y los copies ya escritos, y para volver a verlos
-- había que pagar otra llamada a Gemini. Una fila por banda+vídeo: volver a analizar el mismo
-- vídeo actualiza la fila en vez de acumular duplicados.
CREATE TABLE IF NOT EXISTS reel_analyses (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  -- Id de YouTube, o una clave sintética "file:nombre-tamaño" para vídeos subidos como archivo
  -- (que no llegan al servidor, así que solo sirve para reconocer si es "el mismo" al reabrirlo).
  video_key TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'youtube', -- 'youtube' | 'file'
  source_url TEXT DEFAULT '',
  video_title TEXT DEFAULT '',
  video_duration INTEGER DEFAULT 0,
  target_duration INTEGER DEFAULT 30,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  optimal_time JSONB DEFAULT '{}'::jsonb,
  energy_windows JSONB DEFAULT '[]'::jsonb,
  video_meta JSONB DEFAULT '{}'::jsonb,
  generated_by_ai BOOLEAN DEFAULT false,
  notice TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, video_key)
);
CREATE INDEX IF NOT EXISTS idx_reel_analyses_band_video ON reel_analyses(band_id, video_key);

ALTER TABLE reel_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON reel_analyses FOR ALL USING (true);

-- 22. campaigns (Campañas activas de booking por banda)
--
-- server/db/campaigns.ts prueba primero la tabla "campaigns" y solo cae a "booking_campaigns"
-- si esa falla. En producción existía una tabla "campaigns" creada a mano con id/band_id como
-- uuid y start_date/end_date NOT NULL sin default -tipos incompatibles con lo que este código
-- manda (band_id como texto tipo "bakandeya", sin fechas de inicio/fin)-, así que CADA guardado
-- fallaba en silencio y la app devolvía un objeto simulado como si se hubiera guardado. Este es
-- el esquema real y corregido (ver migración fix_campaigns_table_schema).
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_cities TEXT[] DEFAULT '{}',
  min_capacity INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 0,
  target_dates JSONB DEFAULT '[]'::jsonb,
  target_dates_text TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  custom_pitch_templates JSONB DEFAULT '{}'::jsonb, -- { "salas": "...", "festivales": "...", ... } por caso de uso
  campaign_tone_rules JSONB DEFAULT NULL, -- { "reglas_estilo_aprendidas": [...], "vocabulario_aprendido": [...], "terminos_a_evitar": [...], "actualizado": "..." }
  is_active BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_band_active ON campaigns(band_id, is_active);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON campaigns FOR ALL USING (true);

-- 22b. campaign_pitch_training (Registro de entrenamiento de tono específico por campaña)
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

-- 23. deleted_leads (Lista negra de salas/leads descartados)
CREATE TABLE IF NOT EXISTS deleted_leads (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  nombre_sala TEXT NOT NULL,
  motivo TEXT DEFAULT 'Eliminado por el usuario para evitar ruido',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deleted_leads_band_sala ON deleted_leads(band_id, nombre_sala);
ALTER TABLE deleted_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON deleted_leads FOR ALL USING (true);

-- 24. deleted_bands (Lista negra de bandas de intercambio descartadas)
CREATE TABLE IF NOT EXISTS deleted_bands (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  nombre_banda TEXT NOT NULL,
  motivo TEXT DEFAULT 'Eliminado por el usuario para evitar ruido',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deleted_bands_band_nombre ON deleted_bands(band_id, nombre_banda);
ALTER TABLE deleted_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON deleted_bands FOR ALL USING (true);

-- 25. musicians_waitlist (Captación de músicos en landing pública / EPK)
CREATE TABLE IF NOT EXISTS musicians_waitlist (
  id TEXT PRIMARY KEY,
  nombre_banda TEXT,
  nombre_contacto TEXT,
  email TEXT,
  instagram TEXT,
  telefono TEXT,
  ciudad TEXT,
  genero TEXT,
  enlace_musica TEXT,
  interes_principal TEXT,
  notas TEXT,
  idioma TEXT DEFAULT 'es',
  banda_origen TEXT,
  concierto_origen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_musicians_waitlist_email ON musicians_waitlist(email);
ALTER TABLE musicians_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON musicians_waitlist FOR ALL USING (true);

-- 26. social_content_items (Radar de contenidos en redes: YouTube, TikTok, Reels)
CREATE TABLE IF NOT EXISTS social_content_items (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  title TEXT DEFAULT 'Sin título',
  url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  published_at TIMESTAMPTZ,
  views BIGINT DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_content_band_plat ON social_content_items(band_id, platform);
ALTER TABLE social_content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON social_content_items FOR ALL USING (true);

-- 27. stripe_webhook_events (Idempotencia de webhooks de facturación Stripe)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON stripe_webhook_events FOR ALL USING (true);

-- 28. agent_execution_logs (Auditoría y trazabilidad de ejecuciones de Agentes IA)
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  agente TEXT NOT NULL,
  motor TEXT,
  disparado_por_tipo TEXT DEFAULT 'usuario_manual',
  usuario_id TEXT,
  usuario_email TEXT,
  estado TEXT NOT NULL,
  mensaje TEXT,
  leads_afectados JSONB DEFAULT '[]'::jsonb,
  conteo_afectados INTEGER DEFAULT 0,
  duracion_ms INTEGER DEFAULT 0,
  detalles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_band_date ON agent_execution_logs(band_id, created_at DESC);
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON agent_execution_logs FOR ALL USING (true);

-- 29. category_pitch_templates (Plantillas de email + pautas de IA por categoría de lead, por banda)
--
-- Antes vivía en state.categoryTemplates: un único objeto en memoria/data.json compartido por
-- TODAS las bandas de la plataforma (sin band_id), que además se perdía en cada redeploy de
-- Railway. Una fila por banda+categoría: volver a guardar la misma categoría actualiza la fila
-- en vez de acumular duplicados.
CREATE TABLE IF NOT EXISTS category_pitch_templates (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos'
  title TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  guidelines TEXT DEFAULT '',
  custom_instruction TEXT DEFAULT '',
  tone_rating INTEGER DEFAULT 5,
  content_rating INTEGER DEFAULT 5,
  feedback_logs JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, category)
);
CREATE INDEX IF NOT EXISTS idx_category_templates_band ON category_pitch_templates(band_id, category);
ALTER TABLE category_pitch_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON category_pitch_templates FOR ALL USING (true);

-- 30. pitch_learning_examples (Comparación borrador IA vs. versión aprobada por el humano)
--
-- Alimenta el few-shot dinámico (dbGetDynamicFewShotExamples) y el auto-refinamiento de tono
-- (triggerSelfRefiningToneDnaBackground) en server/db/pitchLearning.ts. Ese código ya
-- contemplaba que esta tabla pudiera no existir y degradaba en silencio con un aviso por
-- consola - pero nunca llegó a crearse, así que este bucle de aprendizaje nunca ha funcionado
-- en producción hasta esta migración.
CREATE TABLE IF NOT EXISTS pitch_learning_examples (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL,
  nombre_sala TEXT DEFAULT 'Sala',
  tipo_entidad TEXT DEFAULT 'sala',
  ciudad TEXT DEFAULT '',
  borrador_ia TEXT DEFAULT '',
  texto_aprobado TEXT DEFAULT '',
  tuvo_edicion BOOLEAN DEFAULT false,
  diferencia_longitud INTEGER DEFAULT 0,
  tipo_accion TEXT NOT NULL, -- 'aprobado_propuesta' | 'aprobado_respuesta' | 'regenerado_con_feedback'
  resultado_respuesta TEXT DEFAULT 'pendiente', -- 'pendiente' | 'positiva' | 'negativa' | 'sin_respuesta'
  fecha_aprobacion TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pitch_learning_band_fecha ON pitch_learning_examples(band_id, fecha_aprobacion DESC);
ALTER TABLE pitch_learning_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON pitch_learning_examples FOR ALL USING (true);

-- 31. agent_schedule_state (Estado "ya se ejecutó esta hora" del planificador de agentes IA)
--
-- server/services/agentScheduler.ts y server/db/agentSchedule.ts. Sin esta tabla, un redeploy
-- de Railway reinicia el proceso y pierde ese estado en memoria, con riesgo real de que el
-- Enviador vuelva a mandar correos ya aprobados a las mismas salas. Tampoco existía en
-- producción hasta esta migración.
CREATE TABLE IF NOT EXISTS agent_schedule_state (
  job_name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_schedule_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON agent_schedule_state FOR ALL USING (true);

-- 32. pitch_example_threads (Hilos de email reales completos pegados a mano por el mánager, por categoría)
--
-- A diferencia de pitch_learning_examples (un único borrador-IA vs versión-aprobada), aquí se
-- guarda la conversación completa (nuestro mensaje inicial + la respuesta real de la sala +
-- nuestra respuesta a esa respuesta...) para entrenar tanto la generación del pitch inicial
-- como el Contestador (server/routes/leads/reply.ts, server/utils/bandDna.ts:
-- buildReplySystemPrompt), que hasta esta migración no tenía ninguna fuente de ejemplos reales.
CREATE TABLE IF NOT EXISTS pitch_example_threads (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos'
  titulo TEXT DEFAULT '',
  mensajes JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{rol: 'banda'|'sala', texto, orden}]
  resultado TEXT DEFAULT 'positiva', -- 'positiva' | 'negativa' | 'neutral'
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pitch_example_threads_band_cat ON pitch_example_threads(band_id, category);
ALTER TABLE pitch_example_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON pitch_example_threads FOR ALL USING (true);

-- 33. setlist_shortcuts (Accesos rápidos propios de cada banda en el editor de repertorio)
--
-- server/routes/repertorio.ts, server/db/repertoire.ts, src/components/RepertorioSetlists.tsx.
-- Los "Rápidos" del editor de repertorio (Presentación, Chapa, BIS...) eran botones fijos en
-- el propio componente y uno de ellos ("Solo Filgue") nombraba directamente a un músico de
-- Bakandeya, apareciendo así en el repertorio de cualquier otra banda. Esta tabla permite que
-- cada banda cree sus propios accesos rápidos (icono + etiqueta + texto/duración del ítem que
-- se inserta) sin tocar código.
CREATE TABLE IF NOT EXISTS setlist_shortcuts (
  id TEXT PRIMARY KEY,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  icono TEXT NOT NULL DEFAULT '⚡',
  etiqueta TEXT NOT NULL,
  titulo_custom TEXT NOT NULL,
  duracion_estimada_minutos INTEGER,
  duracion_estimada_segundos INTEGER,
  nota_tema TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_setlist_shortcuts_band ON setlist_shortcuts(band_id);
ALTER TABLE setlist_shortcuts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON setlist_shortcuts FOR ALL USING (true);

-- 34. song_stems_cache (Caché persistente L2 y mutex distribuido de pistas separadas por IA)
CREATE TABLE IF NOT EXISTS song_stems_cache (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  song_hash TEXT NOT NULL,
  engine TEXT NOT NULL,
  engine_used TEXT,
  is_neural BOOLEAN DEFAULT false,
  degraded BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed', -- 'pending' | 'completed' | 'failed'
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  timing_breakdown JSONB DEFAULT '{}'::jsonb,
  stems_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_band_song_engine UNIQUE (band_id, song_hash, engine)
);
CREATE INDEX IF NOT EXISTS idx_song_stems_cache_lookup ON song_stems_cache(band_id, song_hash, engine);
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS engine_used text NOT NULL DEFAULT '';
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS locked_by text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS is_neural boolean NOT NULL DEFAULT false;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS degraded boolean NOT NULL DEFAULT false;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS degraded_reason text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS stems_map jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS timing_breakdown jsonb DEFAULT '{}'::jsonb;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE song_stems_cache ADD COLUMN IF NOT EXISTS song_title text;
ALTER TABLE song_stems_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON song_stems_cache FOR ALL USING (true);

-- 35. stem_storage_retry_queue (Cola persistente de subida de stems a Supabase Storage con backoff)
CREATE TABLE IF NOT EXISTS stem_storage_retry_queue (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  storage_sub_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'audio/mpeg',
  band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at BIGINT NOT NULL,
  last_error TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'exhausted'
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stem_storage_retry_status ON stem_storage_retry_queue(status, next_retry_at);
ALTER TABLE stem_storage_retry_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON stem_storage_retry_queue FOR ALL USING (true);

-- 36. stem_prediction_jobs (Registro y conciliación asíncrona de predicciones de GPUs en la nube)
CREATE TABLE IF NOT EXISTS stem_prediction_jobs (
  id TEXT PRIMARY KEY,
  band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
  song_hash TEXT,
  engine TEXT,
  provider TEXT DEFAULT 'replicate',
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'succeeded' | 'failed' | 'canceled'
  audio_url TEXT,
  song_title TEXT,
  webhook_received_at TIMESTAMPTZ,
  webhook_signature_verified BOOLEAN DEFAULT false,
  result_stems_map JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stem_prediction_jobs_status ON stem_prediction_jobs(status, created_at DESC);
ALTER TABLE stem_prediction_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso total al backend" ON stem_prediction_jobs FOR ALL USING (true);

-- ====================================================================
-- 37. STRICT ROW LEVEL SECURITY (RLS) POLICIES & FUNCTIONS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce((auth.jwt() ->> 'role'), '') = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_active_band_id()
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('app.current_band_id', true), ''),
    nullif(auth.jwt() ->> 'band_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'band_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'band_id', '')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_authorized_band_ids()
RETURNS TABLE(band_id TEXT) AS $$
BEGIN
  IF public.is_service_role() THEN
    RETURN QUERY SELECT rb.band_id FROM public.registered_bands rb;
    RETURN;
  END IF;

  IF public.get_active_band_id() IS NOT NULL THEN
    RETURN QUERY SELECT public.get_active_band_id();
  END IF;

  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
      SELECT ub.band_id FROM public.user_bands ub WHERE ub.user_id = auth.uid()::text
      UNION
      SELECT u.band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.band_id IS NOT NULL AND u.band_id != ''
      UNION
      SELECT u.main_band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.main_band_id IS NOT NULL AND u.main_band_id != '';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calendar policies (Concerts & Rehearsals)
CREATE POLICY "concerts_select_policy" ON public.concerts
  FOR SELECT USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  );

CREATE POLICY "rehearsals_select_policy" ON public.rehearsals
  FOR SELECT USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  );

-- Migraciones idempotentes para asegurar que la tabla leads tiene las últimas columnas
ALTER TABLE leads ADD COLUMN IF NOT EXISTS roster TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS festival_start_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS festival_end_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechas_ocupadas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fechas_libres_detectadas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento_score NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_sentimiento_label TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_intencion TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_intencion_etiqueta TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimas_objeciones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_analisis_resumen TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperatura_lead TEXT;

-- Migraciones idempotentes para columnas de sentimiento en lead_messages
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS sentimiento TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS sentimiento_score NUMERIC;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS sentimiento_label TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS intencion TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS intencion_etiqueta TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS temperatura TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS objeciones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS puntos_clave JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS resumen_ejecutivo TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS sugerencia_estrategia TEXT;
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS analisis_ia JSONB;



