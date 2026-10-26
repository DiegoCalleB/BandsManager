-- ====================================================================
-- BAND MANAGER - ESQUEMA COMPLETO DE SUPABASE (PostgreSQL)
-- ====================================================================
-- Estado de la base tras aplicar todas las migraciones de supabase/migrations/
-- hasta la indicada abajo. Sirve para levantar una base nueva desde cero y como
-- referencia de qué tablas y columnas existen. Idempotente: se puede volver a
-- ejecutar sin romper nada.
--
-- Las migraciones posteriores a la indicada se aplican encima (lo hace el runner
-- en producción y server/audit/pgliteSchema.ts en los tests). Se regenera con
-- pg_dump sobre una base con todas las migraciones aplicadas (ADR 0008).
--
-- incluye-migraciones-hasta: 20261121_catalogo_generos_estilos_festival.sql
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
--
-- Name: fn_capture_row_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fn_capture_row_history() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_fila_id TEXT;
  v_band_id TEXT;
BEGIN
  v_fila_id := COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'band_id');
  v_band_id := to_jsonb(OLD)->>'band_id';

  INSERT INTO public.data_change_history(tabla, fila_id, band_id, operacion, datos_anteriores)
  VALUES (TG_TABLE_NAME, v_fila_id, v_band_id, TG_OP, to_jsonb(OLD));

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

--
-- Name: fn_concert_deals_inmutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fn_concert_deals_inmutable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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

--
-- Name: get_active_band_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_active_band_id() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('app.current_band_id', true), ''),
    nullif(auth.jwt() ->> 'band_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'band_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'band_id', '')
  );
END;
$$;

--
-- Name: get_user_authorized_band_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_user_authorized_band_ids() RETURNS TABLE(band_id text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- If service role, return all bands
  IF public.is_service_role() THEN
    RETURN QUERY SELECT rb.band_id FROM public.registered_bands rb;
    RETURN;
  END IF;

  -- If active band is present in session context, include it
  IF public.get_active_band_id() IS NOT NULL THEN
    RETURN QUERY SELECT public.get_active_band_id();
  END IF;

  -- Include all permitted bands for the authenticated user from user_bands and users
  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
      SELECT ub.band_id FROM public.user_bands ub WHERE ub.user_id = auth.uid()::text
      UNION
      SELECT u.band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.band_id IS NOT NULL AND u.band_id != ''
      UNION
      SELECT u.main_band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.main_band_id IS NOT NULL AND u.main_band_id != '';
  END IF;
END;
$$;

--
-- Name: is_service_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.is_service_role() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce((auth.jwt() ->> 'role'), '') = 'service_role'
  );
END;
$$;

--
-- Name: match_pitch_embeddings(vector, double precision, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.match_pitch_embeddings(query_embedding vector(768), match_threshold double precision, match_count integer, filter_band_id text, filter_category text DEFAULT NULL::text) RETURNS TABLE(id text, band_id text, nombre_sala text, tipo_entidad text, ciudad text, texto_pitch text, resultado_respuesta text, conversion_score numeric, similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
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

--
-- Name: prevent_audit_log_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
    RAISE EXCEPTION 'Tabla de auditoría protegida (Append-Only): % no permitido en %.', TG_OP, TG_TABLE_NAME;
    RETURN NULL;
END;
$$;

--
-- Name: prune_old_agent_jobs_queue(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.prune_old_agent_jobs_queue(completed_retention_days integer DEFAULT 7, failed_retention_days integer DEFAULT 30) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER := 0;
  deleted_completed INTEGER := 0;
  deleted_failed INTEGER := 0;
BEGIN
  -- 1. Eliminar trabajos completados con más de X días
  DELETE FROM agent_jobs_queue
  WHERE status = 'completed'
    AND completed_at < (NOW() - (completed_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS deleted_completed = ROW_COUNT;

  -- 2. Eliminar trabajos fallidos/cancelados antiguos con más de Y días
  DELETE FROM agent_jobs_queue
  WHERE status IN ('failed', 'cancelled')
    AND updated_at < (NOW() - (failed_retention_days || ' days')::INTERVAL);
  GET DIAGNOSTICS deleted_failed = ROW_COUNT;

  deleted_count := deleted_completed + deleted_failed;
  RETURN deleted_count;
END;
$$;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

--
-- Name: agent_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
    id text NOT NULL,
    band_id text NOT NULL,
    agente text NOT NULL,
    motor text,
    disparado_por_tipo text DEFAULT 'usuario_manual'::text,
    usuario_id text,
    usuario_email text,
    estado text NOT NULL,
    mensaje text,
    leads_afectados jsonb DEFAULT '[]'::jsonb,
    conteo_afectados integer DEFAULT 0,
    duracion_ms integer DEFAULT 0,
    detalles jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: agent_jobs_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.agent_jobs_queue (
    id text NOT NULL,
    band_id text NOT NULL,
    agent_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    error_message text,
    scheduled_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    locked_by text,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: agent_schedule_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.agent_schedule_state (
    job_name text NOT NULL,
    last_run_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: ai_token_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ai_token_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text CONSTRAINT ai_token_ledger_user_id_not_null NOT NULL,
    prompt_tokens integer NOT NULL,
    completion_tokens integer NOT NULL,
    model_name text NOT NULL,
    estimated_cost_eur numeric(10,6) NOT NULL,
    settled_at timestamp with time zone,
    settled_by_event text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_token_ledger_completion_tokens_check CHECK ((completion_tokens >= 0)),
    CONSTRAINT ai_token_ledger_estimated_cost_eur_check CHECK ((estimated_cost_eur >= (0)::numeric)),
    CONSTRAINT ai_token_ledger_prompt_tokens_check CHECK ((prompt_tokens >= 0))
);

--
-- Name: ai_monthly_cost_by_band; Type: VIEW; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.ai_monthly_cost_by_band AS
 SELECT band_id,
    date_trunc('month'::text, created_at) AS billing_month,
    sum(prompt_tokens) AS prompt_tokens,
    sum(completion_tokens) AS completion_tokens,
    sum(estimated_cost_eur) AS total_cost_eur,
    count(*) FILTER (WHERE (settled_at IS NULL)) AS unsettled_calls
   FROM public.ai_token_ledger
  GROUP BY band_id, (date_trunc('month'::text, created_at));

--
-- Name: autonomy_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.autonomy_configs (
    band_id text NOT NULL,
    dispatch_level text DEFAULT 'draft_only'::text,
    negotiation_depth text DEFAULT 'filter_conditions'::text,
    min_cache_threshold numeric DEFAULT 300,
    max_cache_threshold numeric DEFAULT 800,
    auto_decline_under_min_cache boolean DEFAULT false,
    notify_on_every_proposal boolean DEFAULT true,
    require_human_for_final_sign_off boolean DEFAULT true,
    dispatch_mode text DEFAULT 'draft_gmail'::text,
    mark_as_read_in_inbox boolean DEFAULT false,
    agent_sender_email text,
    agent_sender_name text,
    agent_reply_to_email text,
    updated_at timestamp with time zone DEFAULT now(),
    response_strategies jsonb DEFAULT '{}'::jsonb,
    min_cache_by_type jsonb,
    negotiation_start_cache_by_type jsonb
);

--
-- Name: band_alert_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_alert_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    email_notifications_enabled boolean DEFAULT true,
    in_app_notifications_enabled boolean DEFAULT true,
    digest_frequency text DEFAULT 'weekly_digest'::text,
    recipient_email text,
    recipient_role text DEFAULT 'leader_only'::text,
    rules jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: TABLE band_alert_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.band_alert_settings IS 'Guarda la configuración personalizada de reglas de alerta, umbrales de días y canales de notificación por banda.';

--
-- Name: band_cartel_estilo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_cartel_estilo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    estilo jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: TABLE band_cartel_estilo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.band_cartel_estilo IS 'ADN visual de la banda para sus carteles (lista blanca en src/utils/cartel/adn.ts).';

--
-- Name: band_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_contacts (
    id text NOT NULL,
    band_id text,
    nombre_banda text NOT NULL,
    estilo_musical text,
    localizacion text,
    estado_relacion text DEFAULT 'sin_contactar'::text,
    ultimo_contacto text,
    contacto_nombre text,
    email text,
    telefono text,
    instagram text,
    spotify_youtube text,
    aforo_promedio integer DEFAULT 0,
    notas_colaboracion text,
    ciudad_origen_swap text,
    icono text,
    imagen_url text,
    es_favorito boolean DEFAULT false,
    es_verificado boolean DEFAULT false,
    fiabilidad_score numeric,
    estilo_comunicacion text,
    dna_expresion jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: band_email_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_email_accounts (
    band_id text NOT NULL,
    provider text DEFAULT 'other'::text NOT NULL,
    email text NOT NULL,
    app_password text NOT NULL,
    smtp_host text NOT NULL,
    smtp_port integer NOT NULL,
    smtp_secure boolean DEFAULT true NOT NULL,
    imap_host text NOT NULL,
    imap_port integer DEFAULT 993 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: band_gmail_oauth_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_gmail_oauth_accounts (
    band_id text NOT NULL,
    gmail_email text NOT NULL,
    refresh_token text NOT NULL,
    scope text NOT NULL,
    connected_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    needs_reauth_at timestamp with time zone,
    gmail_history_id text
);

--
-- Name: band_letras_auto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_letras_auto (
    band_id text NOT NULL,
    activado boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE band_letras_auto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.band_letras_auto IS 'Opt-in por banda: transcribir solo las canciones nuevas con audio y sin cifrado.';

--
-- Name: band_print_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_print_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: TABLE band_print_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.band_print_settings IS 'Ajustes de impresión del setlist recordados por banda (lista blanca en src/utils/printSettings.ts).';

--
-- Name: band_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_schedules (
    band_id text NOT NULL,
    timezone text DEFAULT 'Europe/Madrid'::text,
    horas_lector jsonb DEFAULT '[]'::jsonb,
    horas_enviador jsonb DEFAULT '[]'::jsonb,
    dias_enviador jsonb DEFAULT '[2, 3, 4]'::jsonb,
    dias_lector jsonb DEFAULT '[1, 2, 3, 4, 5, 6, 7]'::jsonb
);

--
-- Name: band_social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.band_social_accounts (
    id text NOT NULL,
    band_id text NOT NULL,
    plataforma text DEFAULT 'Instagram'::text NOT NULL,
    handle text DEFAULT ''::text,
    account_name text DEFAULT ''::text,
    avatar_url text DEFAULT ''::text,
    status text DEFAULT 'conectado'::text,
    auto_publish_enabled boolean DEFAULT true,
    connected_at timestamp with time zone DEFAULT now(),
    last_sync_at timestamp with time zone DEFAULT now(),
    followers_count bigint DEFAULT 0,
    total_views bigint DEFAULT 0,
    account_id text
);

--
-- Name: calendar_conflict_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.calendar_conflict_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    user_id text NOT NULL,
    huella text NOT NULL,
    notified_at timestamp with time zone DEFAULT now()
);

--
-- Name: TABLE calendar_conflict_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.calendar_conflict_notifications IS 'Avisos de choque de calendario ya enviados por email (user_id + huella), ver server/services/calendarConflictService.ts.';

--
-- Name: campaign_pitch_training; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.campaign_pitch_training (
    id text NOT NULL,
    band_id text NOT NULL,
    campaign_id text NOT NULL,
    borrador_ia text NOT NULL,
    texto_aprobado text NOT NULL,
    tuvo_edicion boolean DEFAULT false,
    diferencia_longitud integer,
    tipo_accion text DEFAULT 'entrenamiento_campaña'::text,
    fecha_aprobacion timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.campaigns (
    id text NOT NULL,
    band_id text NOT NULL,
    name text NOT NULL,
    target_cities text[] DEFAULT '{}'::text[],
    min_capacity integer DEFAULT 0,
    max_capacity integer DEFAULT 0,
    target_dates jsonb DEFAULT '[]'::jsonb,
    target_dates_text text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    custom_pitch_templates jsonb DEFAULT '{}'::jsonb,
    campaign_tone_rules jsonb,
    is_active boolean DEFAULT false,
    color text DEFAULT '#8b5cf6'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    campaign_start_date text DEFAULT ''::text,
    campaign_end_date text DEFAULT ''::text,
    min_cache_by_type jsonb
);

--
-- Name: catalogo_festival_convocatorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_festival_convocatorias (
    id text NOT NULL,
    festival_id text NOT NULL,
    edicion_anio integer,
    abre date,
    cierra date,
    url text NOT NULL,
    canal text,
    estado text DEFAULT 'no_anunciada'::text NOT NULL,
    admite_independientes text DEFAULT 'desconocido'::text NOT NULL,
    exige_sello_o_agencia text DEFAULT 'desconocido'::text NOT NULL,
    exige_residencia text DEFAULT 'desconocido'::text NOT NULL,
    cuota text DEFAULT 'desconocido'::text NOT NULL,
    remuneracion text,
    resumen_es text,
    resumen_en text,
    fuente text,
    verificado_en date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_festival_convocatorias_admite_independientes_check CHECK ((admite_independientes = ANY (ARRAY['si'::text, 'no'::text, 'desconocido'::text]))),
    CONSTRAINT catalogo_festival_convocatorias_canal_check CHECK ((canal = ANY (ARRAY['formulario'::text, 'email'::text, 'plataforma'::text, 'otro'::text]))),
    CONSTRAINT catalogo_festival_convocatorias_check CHECK (((cierra IS NULL) OR (abre IS NULL) OR (cierra >= abre))),
    CONSTRAINT catalogo_festival_convocatorias_cuota_check CHECK ((cuota = ANY (ARRAY['si'::text, 'no'::text, 'desconocido'::text]))),
    CONSTRAINT catalogo_festival_convocatorias_edicion_anio_check CHECK (((edicion_anio >= 1900) AND (edicion_anio <= 2100))),
    CONSTRAINT catalogo_festival_convocatorias_estado_check CHECK ((estado = ANY (ARRAY['proxima'::text, 'abierta'::text, 'cerrada'::text, 'no_anunciada'::text]))),
    CONSTRAINT catalogo_festival_convocatorias_exige_residencia_check CHECK ((exige_residencia = ANY (ARRAY['si'::text, 'no'::text, 'desconocido'::text]))),
    CONSTRAINT catalogo_festival_convocatorias_exige_sello_o_agencia_check CHECK ((exige_sello_o_agencia = ANY (ARRAY['si'::text, 'no'::text, 'desconocido'::text])))
);

--
-- Name: catalogo_festival_ediciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_festival_ediciones (
    id text NOT NULL,
    festival_id text NOT NULL,
    anio integer NOT NULL,
    inicio date,
    fin date,
    recinto text,
    localizacion text,
    estado text DEFAULT 'anunciada'::text NOT NULL,
    fuente text,
    verificado_en date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_festival_ediciones_anio_check CHECK (((anio >= 1900) AND (anio <= 2100))),
    CONSTRAINT catalogo_festival_ediciones_check CHECK (((fin IS NULL) OR (inicio IS NULL) OR (fin >= inicio))),
    CONSTRAINT catalogo_festival_ediciones_estado_check CHECK ((estado = ANY (ARRAY['anunciada'::text, 'confirmada'::text, 'cancelada'::text])))
);

--
-- Name: catalogo_festivales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_festivales (
    id text NOT NULL,
    nombre text NOT NULL,
    tipo_evento text DEFAULT 'festival'::text NOT NULL,
    ciudad text,
    provincia text,
    comunidad text,
    pais text DEFAULT 'ES'::text NOT NULL,
    generos text[] DEFAULT '{}'::text[] NOT NULL,
    mes_tipico integer,
    primera_edicion integer,
    activo boolean,
    web text,
    descripcion_es text,
    descripcion_en text,
    sala_id text,
    estado_revision text DEFAULT 'candidata'::text NOT NULL,
    fuente text,
    verificado_en date,
    notas_internas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_festivales_estado_revision_check CHECK ((estado_revision = ANY (ARRAY['candidata'::text, 'minima'::text, 'completa'::text]))),
    CONSTRAINT catalogo_festivales_id_check CHECK ((id ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT catalogo_festivales_mes_tipico_check CHECK (((mes_tipico >= 1) AND (mes_tipico <= 12))),
    CONSTRAINT catalogo_festivales_primera_edicion_check CHECK (((primera_edicion >= 1900) AND (primera_edicion <= 2100))),
    CONSTRAINT catalogo_festivales_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['festival'::text, 'ciclo'::text, 'concurso'::text, 'showcase'::text, 'feria'::text, 'fiesta'::text])))
);

--
-- Name: catalogo_generos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_generos (
    id text NOT NULL,
    nombre_es text NOT NULL,
    nombre_en text NOT NULL,
    padre_id text,
    wikidata_qid text,
    musicbrainz_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_generos_check CHECK (((padre_id IS NULL) OR (padre_id <> id))),
    CONSTRAINT catalogo_generos_id_check CHECK ((id ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT catalogo_generos_wikidata_qid_check CHECK ((wikidata_qid ~ '^Q[0-9]+$'::text))
);

--
-- Name: catalogo_generos_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_generos_alias (
    alias text NOT NULL,
    genero_id text NOT NULL,
    CONSTRAINT catalogo_generos_alias_alias_check CHECK ((alias ~ '^[a-z0-9ñ]+( [a-z0-9ñ]+)*$'::text))
);

--
-- Name: catalogo_ingestas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_ingestas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fuente text NOT NULL,
    pais text,
    parametros jsonb DEFAULT '{}'::jsonb NOT NULL,
    estado text DEFAULT 'en_curso'::text NOT NULL,
    inicio timestamp with time zone DEFAULT now() NOT NULL,
    fin timestamp with time zone,
    leidas integer DEFAULT 0 NOT NULL,
    nuevas integer DEFAULT 0 NOT NULL,
    enlazadas integer DEFAULT 0 NOT NULL,
    descartadas integer DEFAULT 0 NOT NULL,
    error text,
    CONSTRAINT catalogo_ingestas_check CHECK (((fin IS NULL) OR (fin >= inicio))),
    CONSTRAINT catalogo_ingestas_descartadas_check CHECK ((descartadas >= 0)),
    CONSTRAINT catalogo_ingestas_enlazadas_check CHECK ((enlazadas >= 0)),
    CONSTRAINT catalogo_ingestas_estado_check CHECK ((estado = ANY (ARRAY['en_curso'::text, 'ok'::text, 'parcial'::text, 'error'::text]))),
    CONSTRAINT catalogo_ingestas_leidas_check CHECK ((leidas >= 0)),
    CONSTRAINT catalogo_ingestas_nuevas_check CHECK ((nuevas >= 0))
);

--
-- Name: catalogo_sala_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_sala_alias (
    alias_clave text NOT NULL,
    clave text NOT NULL,
    nombre text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: catalogo_sala_generos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_sala_generos (
    sala_id text NOT NULL,
    genero_id text NOT NULL,
    fuente text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: catalogo_salas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_salas (
    id text NOT NULL,
    clave text NOT NULL,
    place_id text,
    nombre text NOT NULL,
    ciudad text,
    region text,
    direccion text,
    tipo text DEFAULT 'sala'::text NOT NULL,
    aforo integer,
    genero text,
    website text,
    instagram text,
    email_contacto text,
    telefono text,
    nivel text DEFAULT 'sin_verificar'::text NOT NULL,
    puntuacion integer DEFAULT 0 NOT NULL,
    verificada_en timestamp with time zone,
    bandas_con_respuesta integer DEFAULT 0 NOT NULL,
    bandas_con_entrega integer DEFAULT 0 NOT NULL,
    rebotes integer DEFAULT 0 NOT NULL,
    no_contactar boolean DEFAULT false NOT NULL,
    motivo_no_contactar text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    estado_negocio text DEFAULT 'sin_verificar'::text NOT NULL,
    estado_negocio_en timestamp with time zone,
    fuentes text[] DEFAULT '{}'::text[] NOT NULL,
    pais text DEFAULT 'ES'::text NOT NULL,
    lat double precision,
    lon double precision,
    web_revisada_en timestamp with time zone,
    coordenadas_aprox boolean DEFAULT false NOT NULL,
    geolocalizada_en timestamp with time zone,
    CONSTRAINT catalogo_salas_aforo_check CHECK (((aforo IS NULL) OR (aforo > 0))),
    CONSTRAINT catalogo_salas_bandas_con_entrega_check CHECK ((bandas_con_entrega >= 0)),
    CONSTRAINT catalogo_salas_bandas_con_respuesta_check CHECK ((bandas_con_respuesta >= 0)),
    CONSTRAINT catalogo_salas_estado_negocio_check CHECK ((estado_negocio = ANY (ARRAY['sin_verificar'::text, 'operativo'::text, 'cerrado_temporal'::text, 'cerrado_permanente'::text]))),
    CONSTRAINT catalogo_salas_nivel_check CHECK ((nivel = ANY (ARRAY['sin_verificar'::text, 'probable'::text, 'verificada'::text]))),
    CONSTRAINT catalogo_salas_puntuacion_check CHECK (((puntuacion >= 0) AND (puntuacion <= 100))),
    CONSTRAINT catalogo_salas_rebotes_check CHECK ((rebotes >= 0))
);

--
-- Name: catalogo_staging; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_staging (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ingesta_id uuid NOT NULL,
    fuente text NOT NULL,
    external_id text NOT NULL,
    licencia text NOT NULL,
    datos jsonb NOT NULL,
    clave text,
    sala_id text,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_staging_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'enlazada'::text, 'nueva'::text, 'revisar'::text, 'descartada'::text])))
);

--
-- Name: catalogo_supresion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.catalogo_supresion (
    email_sha256 text NOT NULL,
    motivo text NOT NULL,
    origen text,
    sala_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogo_supresion_email_sha256_check CHECK ((email_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT catalogo_supresion_motivo_check CHECK ((motivo = ANY (ARRAY['baja'::text, 'queja'::text, 'rebote_permanente'::text, 'peticion_legal'::text])))
);

--
-- Name: category_pitch_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.category_pitch_templates (
    id text NOT NULL,
    band_id text NOT NULL,
    category text NOT NULL,
    title text DEFAULT ''::text,
    subject text DEFAULT ''::text,
    body text DEFAULT ''::text,
    guidelines text DEFAULT ''::text,
    custom_instruction text DEFAULT ''::text,
    tone_rating integer DEFAULT 5,
    content_rating integer DEFAULT 5,
    feedback_logs jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: concert_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.concert_deals (
    id text NOT NULL,
    band_id text NOT NULL,
    lead_id text,
    concert_id text,
    token text NOT NULL,
    nombre_evento text NOT NULL,
    lugar_sala text NOT NULL,
    ciudad text DEFAULT ''::text,
    fecha_evento text NOT NULL,
    hora_llegada text DEFAULT '18:30'::text,
    hora_concierto text DEFAULT '21:30'::text,
    tipo_remuneracion text DEFAULT 'cache_fijo'::text,
    cache_base numeric(10,2) DEFAULT 0.00,
    total_suplementos numeric(10,2) DEFAULT 0.00,
    total_acordado numeric(10,2) DEFAULT 0.00,
    porcentaje_taquilla numeric(5,2) DEFAULT 0.00,
    comision_porcentaje numeric(5,2) DEFAULT 5.00,
    comision_importe numeric(10,2) DEFAULT 0.00,
    neto_banda numeric(10,2) DEFAULT 0.00,
    apoyo_porcentaje numeric(4,1),
    forma_pago text DEFAULT 'efectivo'::text,
    rider_incluido boolean DEFAULT true,
    rider_texto text DEFAULT ''::text,
    rider_validado_por_sala boolean DEFAULT false,
    hospitalidad_notas text DEFAULT ''::text,
    estado text DEFAULT 'pendiente'::text,
    nombre_firmante text,
    cargo_firmante text,
    firma_imagen text,
    firma_ip text,
    firma_user_agent text,
    firma_timestamp timestamp with time zone,
    contrato_sha256 text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT concert_deals_apoyo_porcentaje_check CHECK (((apoyo_porcentaje IS NULL) OR ((apoyo_porcentaje >= (0)::numeric) AND (apoyo_porcentaje <= (20)::numeric))))
);

--
-- Name: concerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.concerts (
    id text NOT NULL,
    band_id text,
    band_name text,
    fecha text NOT NULL,
    ciudad text,
    sala text NOT NULL,
    direccion text,
    cache numeric DEFAULT 0,
    aforo_vendido integer DEFAULT 0,
    aforo_total integer DEFAULT 0,
    contrato_firmado boolean DEFAULT false,
    estado_pago text DEFAULT 'pendiente'::text,
    notas text,
    tipo text DEFAULT 'sala'::text,
    setlist_id text,
    gastos_detalle jsonb DEFAULT '{}'::jsonb,
    gastos_estimados_tipicos numeric DEFAULT 0,
    convocatoria_tipo text DEFAULT 'completa'::text,
    convocados_ids jsonb DEFAULT '[]'::jsonb,
    convocados_nombres jsonb DEFAULT '[]'::jsonb,
    idioma text DEFAULT ''::text,
    is_posible boolean DEFAULT false,
    custom_qr_url text,
    cartel_url text,
    cartel_config jsonb,
    es_hito_destacado boolean DEFAULT false,
    asistencia_propia integer DEFAULT 0,
    asistencia_otras_bandas integer DEFAULT 0,
    bandas_compartidas jsonb DEFAULT '[]'::jsonb,
    post_show_review text DEFAULT ''::text,
    gira_id text,
    gira_nombre text,
    entradas_url text,
    entradas_lugar_fisico text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT concerts_cache_check CHECK ((cache >= (0)::numeric))
);

--
-- Name: data_change_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.data_change_history (
    id bigint NOT NULL,
    tabla text NOT NULL,
    fila_id text NOT NULL,
    band_id text,
    operacion text NOT NULL,
    datos_anteriores jsonb NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: data_change_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.data_change_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: data_change_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_change_history_id_seq OWNED BY public.data_change_history.id;

--
-- Name: deal_support_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.deal_support_contributions (
    id text NOT NULL,
    deal_id text NOT NULL,
    band_id text NOT NULL,
    amount_cents integer NOT NULL,
    stripe_payment_intent_id text,
    reembolsado_cents integer DEFAULT 0 NOT NULL,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT deal_support_contributions_amount_cents_check CHECK ((amount_cents >= 0)),
    CONSTRAINT deal_support_contributions_reembolsado_cents_check CHECK ((reembolsado_cents >= 0))
);

--
-- Name: deal_support_neto; Type: VIEW; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.deal_support_neto AS
 SELECT band_id,
    count(*) AS aportaciones,
    sum(amount_cents) AS bruto_cents,
    sum(reembolsado_cents) AS reembolsado_cents,
    sum((amount_cents - reembolsado_cents)) AS neto_cents,
    round(((sum(amount_cents))::numeric / 100.0), 2) AS bruto_eur,
    round(((sum(reembolsado_cents))::numeric / 100.0), 2) AS reembolsado_eur,
    round(((sum((amount_cents - reembolsado_cents)))::numeric / 100.0), 2) AS neto_eur
   FROM public.deal_support_contributions
  GROUP BY band_id;

--
-- Name: deleted_bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.deleted_bands (
    id text NOT NULL,
    band_id text NOT NULL,
    nombre_banda text NOT NULL,
    motivo text DEFAULT 'Eliminado por el usuario para evitar ruido'::text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: deleted_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.deleted_leads (
    id text NOT NULL,
    band_id text NOT NULL,
    nombre_sala text NOT NULL,
    motivo text DEFAULT 'Eliminado por el usuario para evitar ruido'::text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: emails_ciclo_vida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.emails_ciclo_vida (
    user_id text NOT NULL,
    tipo text NOT NULL,
    enviado_en timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: enlaces_bandas_amigas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.enlaces_bandas_amigas (
    id bigint NOT NULL,
    band_contact_id text NOT NULL,
    band_id text NOT NULL,
    plataforma text NOT NULL,
    url text NOT NULL,
    verificado boolean DEFAULT false NOT NULL,
    actualizado_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT enlaces_bandas_amigas_plataforma_check CHECK ((plataforma = ANY (ARRAY['spotify'::text, 'youtube'::text, 'instagram'::text, 'tiktok'::text, 'web'::text])))
);

--
-- Name: enlaces_bandas_amigas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.enlaces_bandas_amigas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: enlaces_bandas_amigas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enlaces_bandas_amigas_id_seq OWNED BY public.enlaces_bandas_amigas.id;

--
-- Name: epk_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.epk_configs (
    band_id text NOT NULL,
    biografia text,
    logo_url text,
    dossier_pdf_url text,
    dossier_pdf_name text,
    dossier_document_url text,
    dossier_document_name text,
    dossier_texto_extra text,
    band_photos jsonb DEFAULT '[]'::jsonb,
    rider_tecnico text,
    rider_pdf_url text,
    rider_pdf_name text,
    enlaces_redes jsonb DEFAULT '{}'::jsonb,
    contacto_booking jsonb DEFAULT '{}'::jsonb,
    temas_destacados_ids jsonb DEFAULT '[]'::jsonb,
    incentivo_fans jsonb DEFAULT '{}'::jsonb,
    donacion_revolut jsonb DEFAULT '{}'::jsonb,
    ciudades_config jsonb DEFAULT '[]'::jsonb,
    firma_email jsonb DEFAULT '{}'::jsonb,
    miembros jsonb DEFAULT '[]'::jsonb,
    videos jsonb DEFAULT '[]'::jsonb,
    datos_contratacion jsonb DEFAULT '{}'::jsonb,
    traducciones jsonb DEFAULT '{}'::jsonb,
    plantilla text DEFAULT 'stage'::text,
    orden_secciones jsonb DEFAULT '[]'::jsonb,
    secciones_ocultas jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    genero text DEFAULT ''::text,
    frase_impacto text DEFAULT ''::text,
    bandas_similares jsonb DEFAULT '[]'::jsonb,
    mostrar_bandas_similares boolean DEFAULT false,
    rider_config jsonb DEFAULT '{}'::jsonb,
    idioma text,
    font_style text,
    tipografia text
);

--
-- Name: fan_link_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.fan_link_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    button_type text NOT NULL,
    concert_id text,
    concert_date text,
    user_agent text,
    referer text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: fans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.fans (
    id text NOT NULL,
    band_id text,
    nombre text NOT NULL,
    email text NOT NULL,
    ciudad text,
    como_conocio text,
    concierto_origen_id text,
    concierto_origen_nombre text,
    fecha_captura text,
    consentimiento_rgpd boolean DEFAULT false,
    mensaje text DEFAULT ''::text,
    cancion_favorita text DEFAULT ''::text,
    instagram text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: gear_checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.gear_checklists (
    id text NOT NULL,
    band_id text,
    fecha text NOT NULL,
    label text NOT NULL,
    checked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: lead_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.lead_messages (
    id text NOT NULL,
    lead_id text NOT NULL,
    band_id text,
    fecha text,
    remitente text DEFAULT 'sala'::text,
    remitente_nombre text,
    asunto text,
    mensaje text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sentimiento text,
    sentimiento_score numeric,
    sentimiento_label text,
    intencion text,
    intencion_etiqueta text,
    temperatura text,
    objeciones jsonb DEFAULT '[]'::jsonb,
    puntos_clave jsonb DEFAULT '[]'::jsonb,
    resumen_ejecutivo text,
    sugerencia_estrategia text,
    analisis_ia jsonb,
    leido boolean DEFAULT false,
    fechas_propuestas jsonb,
    condiciones_economicas jsonb,
    requisitos_tecnicos jsonb,
    accion_sugerida text,
    estrategia_playbook jsonb
);

--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.leads (
    id text NOT NULL,
    band_id text,
    nombre_sala text NOT NULL,
    ciudad text,
    region text,
    direccion text,
    aforo integer DEFAULT 0,
    genero text,
    tipo text DEFAULT 'sala'::text,
    email_contacto text,
    email_secundario text DEFAULT ''::text,
    telefono text,
    telefono_movil text DEFAULT ''::text,
    telefono_fijo text DEFAULT ''::text,
    website text,
    instagram text,
    contacto_nombre text,
    fuente text DEFAULT 'manual'::text,
    estado text DEFAULT 'nuevo'::text,
    pitch_generado text,
    fecha_envio text,
    fecha_ultima_respuesta text,
    contexto_extra text,
    notas text,
    icono text,
    imagen_url text,
    es_favorito boolean DEFAULT false,
    es_verificado boolean DEFAULT false,
    fiabilidad_score numeric,
    pitch_feedback_tono numeric,
    pitch_feedback_contenido numeric,
    pitch_feedback_comentario text,
    historial_feedback_pitch jsonb DEFAULT '[]'::jsonb,
    historial_contacto jsonb DEFAULT '[]'::jsonb,
    hilo_emails jsonb DEFAULT '[]'::jsonb,
    roster text,
    festival_start_date text,
    festival_end_date text,
    fechas_ocupadas jsonb DEFAULT '[]'::jsonb,
    fechas_libres_detectadas jsonb DEFAULT '[]'::jsonb,
    temperatura_lead text,
    ultimo_sentimiento text,
    ultimo_sentimiento_score numeric,
    ultimo_sentimiento_label text,
    ultima_intencion text,
    ultima_intencion_etiqueta text,
    ultimas_objeciones jsonb DEFAULT '[]'::jsonb,
    ultimo_analisis_resumen text,
    fechas_propuestas_sala jsonb DEFAULT '[]'::jsonb,
    condiciones_economicas_detectadas jsonb DEFAULT '{}'::jsonb,
    estrategia_playbook jsonb DEFAULT '{}'::jsonb,
    ultimo_mensaje_recibido text,
    gmail_draft_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    place_id text,
    clics_epk integer DEFAULT 0,
    ultimo_clic_at timestamp with time zone,
    email_abierto boolean DEFAULT false,
    veces_abierto integer DEFAULT 0,
    ultimo_abierto_at timestamp with time zone,
    gmail_thread_id text,
    gmail_message_id text,
    aprobado_por text,
    aprobado_at timestamp with time zone,
    pitch_aprobado_hash text,
    sala_id text,
    datos_fuentes jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT leads_aforo_check CHECK ((aforo >= 0))
);

--
-- Name: letras_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.letras_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id text NOT NULL,
    song_id text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    origen text DEFAULT 'manual'::text NOT NULL,
    error text,
    disponible_desde timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE letras_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.letras_jobs IS 'Cola de transcripción de letras (Whisper) por canción; un trabajo por (banda, canción).';

--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.messages (
    id text NOT NULL,
    band_id text,
    remitente text,
    mensaje text,
    fecha text,
    leido boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: metricas_bandas_amigas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.metricas_bandas_amigas (
    id bigint NOT NULL,
    band_id text NOT NULL,
    band_contact_id text NOT NULL,
    fuente text NOT NULL,
    periodo text NOT NULL,
    seguidores bigint,
    fans bigint,
    suscriptores bigint,
    visualizaciones bigint,
    popularidad integer,
    capturado_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT metricas_bandas_amigas_fuente_check CHECK ((fuente = ANY (ARRAY['spotify'::text, 'deezer'::text, 'youtube'::text, 'instagram'::text]))),
    CONSTRAINT metricas_bandas_amigas_periodo_check CHECK ((periodo ~ '^[0-9]{4}-[0-9]{2}$'::text))
);

--
-- Name: metricas_bandas_amigas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.metricas_bandas_amigas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: metricas_bandas_amigas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metricas_bandas_amigas_id_seq OWNED BY public.metricas_bandas_amigas.id;

--
-- Name: musicians_waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.musicians_waitlist (
    id text NOT NULL,
    nombre_banda text,
    nombre_contacto text,
    email text,
    instagram text,
    telefono text,
    ciudad text,
    genero text,
    enlace_musica text,
    interes_principal text,
    notas text,
    idioma text DEFAULT 'es'::text,
    banda_origen text,
    concierto_origen text,
    origen text,
    consentimiento_at timestamp with time zone,
    confirmado_at timestamp with time zone,
    baja_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.payments (
    id text NOT NULL,
    band_id text,
    tipo text NOT NULL,
    categoria text NOT NULL,
    concepto text NOT NULL,
    importe numeric DEFAULT 0,
    fecha text NOT NULL,
    estado text DEFAULT 'pendiente'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_importe_check CHECK ((importe >= (0)::numeric))
);

--
-- Name: pegatinas_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pegatinas_pedidos (
    band_id text NOT NULL,
    plan text NOT NULL,
    cantidad integer NOT NULL,
    expres boolean DEFAULT false NOT NULL,
    nombre text NOT NULL,
    direccion text NOT NULL,
    cp text NOT NULL,
    ciudad text NOT NULL,
    pais text DEFAULT 'España'::text NOT NULL,
    telefono text DEFAULT ''::text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: pitch_example_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pitch_example_threads (
    id text NOT NULL,
    band_id text NOT NULL,
    category text NOT NULL,
    titulo text DEFAULT ''::text,
    mensajes jsonb DEFAULT '[]'::jsonb NOT NULL,
    resultado text DEFAULT 'positiva'::text,
    notas text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: pitch_learning_examples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pitch_learning_examples (
    id text NOT NULL,
    band_id text NOT NULL,
    lead_id text NOT NULL,
    nombre_sala text DEFAULT 'Sala'::text,
    tipo_entidad text DEFAULT 'sala'::text,
    ciudad text DEFAULT ''::text,
    borrador_ia text DEFAULT ''::text,
    texto_aprobado text DEFAULT ''::text,
    tuvo_edicion boolean DEFAULT false,
    diferencia_longitud integer DEFAULT 0,
    tipo_accion text NOT NULL,
    resultado_respuesta text DEFAULT 'pendiente'::text,
    fecha_aprobacion timestamp with time zone DEFAULT now()
);

--
-- Name: pitch_vector_store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pitch_vector_store (
    id text NOT NULL,
    band_id text NOT NULL,
    lead_id text,
    nombre_sala text NOT NULL,
    tipo_entidad text DEFAULT 'sala'::text NOT NULL,
    ciudad text,
    genero_musical text,
    texto_pitch text NOT NULL,
    embedding vector(768),
    resultado_respuesta text DEFAULT 'pendiente'::text,
    conversion_score numeric DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: reel_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.reel_analyses (
    id text NOT NULL,
    band_id text NOT NULL,
    video_key text NOT NULL,
    source_type text DEFAULT 'youtube'::text NOT NULL,
    source_url text DEFAULT ''::text,
    video_title text DEFAULT ''::text,
    video_duration integer DEFAULT 0,
    target_duration integer DEFAULT 30,
    highlights jsonb DEFAULT '[]'::jsonb NOT NULL,
    optimal_time jsonb DEFAULT '{}'::jsonb,
    energy_windows jsonb DEFAULT '[]'::jsonb,
    video_meta jsonb DEFAULT '{}'::jsonb,
    generated_by_ai boolean DEFAULT false,
    notice text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: reel_clips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.reel_clips (
    id text NOT NULL,
    band_id text NOT NULL,
    clip_url text NOT NULL,
    source_url text DEFAULT ''::text NOT NULL,
    source_author text DEFAULT ''::text NOT NULL,
    source_author_url text DEFAULT ''::text NOT NULL,
    derechos text,
    loop_perfecto boolean DEFAULT false NOT NULL,
    hook_text text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    control_calidad jsonb,
    duracion_seg numeric,
    CONSTRAINT reel_clips_control_calidad_objeto CHECK (((control_calidad IS NULL) OR (jsonb_typeof(control_calidad) = 'object'::text)))
);

--
-- Name: reel_metricas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.reel_metricas (
    post_id text NOT NULL,
    horas smallint NOT NULL,
    band_id text NOT NULL,
    published_id text NOT NULL,
    duracion_seg numeric,
    loop_perfecto boolean,
    views integer,
    reach integer,
    likes integer,
    comments integer,
    shares integer,
    saves integer,
    avg_watch_ms integer,
    total_watch_ms bigint,
    medido_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reel_metricas_horas_check CHECK ((horas = ANY (ARRAY[1, 24, 72, 168])))
);

--
-- Name: registered_bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.registered_bands (
    id text NOT NULL,
    band_id text NOT NULL,
    user_id text,
    fecha_registro timestamp with time zone DEFAULT now(),
    nombre_banda text NOT NULL,
    email text NOT NULL,
    plan text DEFAULT 'pro'::text,
    contacto_nombre text,
    estilo_musical text,
    localizacion text,
    telefono text,
    instagram text,
    spotify_youtube text,
    aforo_promedio integer DEFAULT 0,
    estado_cuenta text DEFAULT 'activo'::text,
    notas text,
    radar_enabled boolean DEFAULT true,
    last_social_radar_at timestamp with time zone,
    dna_expresion jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tier text DEFAULT 'free'::text NOT NULL,
    plan_pendiente text,
    fecha_cambio_plan timestamp with time zone,
    estado_suscripcion text DEFAULT 'activo'::text,
    creditos_periodo integer,
    creditos_usados integer DEFAULT 0,
    logo_url text,
    imagen_url text,
    ref_code text,
    referido_por text,
    referido_en timestamp with time zone,
    suscripcion_habilitada boolean DEFAULT false NOT NULL,
    ciclo_facturacion text
);

--
-- Name: COLUMN registered_bands.ref_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.registered_bands.ref_code IS 'Código público de invitación de la banda (atribución de altas, no es un secreto).';

--
-- Name: COLUMN registered_bands.referido_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.registered_bands.referido_por IS 'band_id de la banda que la invitó; la primera atribución no se reescribe.';

--
-- Name: rehearsals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rehearsals (
    id text NOT NULL,
    band_id text,
    band_name text,
    fecha text NOT NULL,
    hora text,
    hora_fin text,
    lugar text,
    asistentes jsonb DEFAULT '[]'::jsonb,
    notas text,
    estado text DEFAULT 'programado'::text,
    setlist_id text,
    convocatoria_tipo text DEFAULT 'completa'::text,
    convocados_ids jsonb DEFAULT '[]'::jsonb,
    convocados_nombres jsonb DEFAULT '[]'::jsonb,
    agenda jsonb DEFAULT '[]'::jsonb,
    objetivos jsonb DEFAULT '[]'::jsonb,
    duracion_estimada_min integer DEFAULT 0,
    duracion_real_seg integer DEFAULT 0,
    cronometro_estado jsonb DEFAULT '{}'::jsonb,
    acta jsonb DEFAULT '{}'::jsonb,
    grabaciones jsonb DEFAULT '[]'::jsonb,
    rating_general integer,
    temperatura_local text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tipo_evento text DEFAULT 'ensayo'::text,
    asunto text DEFAULT ''::text,
    enlace_reunion text DEFAULT ''::text
);

--
-- Name: COLUMN rehearsals.agenda; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rehearsals.agenda IS 'Orden del día con minutaje, canciones vinculadas, enfoque y evaluaciones';

--
-- Name: COLUMN rehearsals.acta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rehearsals.acta IS 'Acta digital con resumen ejecutivo, deberes de casa por músico y tomas destacadas';

--
-- Name: COLUMN rehearsals.grabaciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rehearsals.grabaciones IS 'Tomas de audio y notas de voz grabadas durante el ensayo';

--
-- Name: run_of_show; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.run_of_show (
    id text NOT NULL,
    band_id text,
    fecha text NOT NULL,
    "time" text NOT NULL,
    activity text NOT NULL,
    done boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: saved_filters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.saved_filters (
    id text NOT NULL,
    band_id text,
    nombre text NOT NULL,
    section_tab text,
    search_term text,
    selected_city_filter text,
    status_filter text,
    type_filter text,
    min_capacity_filter integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: setlist_shortcuts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.setlist_shortcuts (
    id text NOT NULL,
    band_id text,
    icono text DEFAULT '⚡'::text,
    etiqueta text NOT NULL,
    titulo_custom text,
    duracion_estimada_minutos integer,
    duracion_estimada_segundos integer,
    nota_tema text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: setlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.setlists (
    id text NOT NULL,
    band_id text,
    nombre text NOT NULL,
    descripcion text,
    tipo_formato text DEFAULT 'festival'::text,
    duracion_total_estimada_minutos integer DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb,
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_ultima_edicion timestamp with time zone DEFAULT now(),
    ai_analysis_json jsonb,
    ai_analysis_generated_at timestamp with time zone
);

--
-- Name: short_link_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.short_link_clicks (
    id bigint NOT NULL,
    code text NOT NULL,
    band_id text NOT NULL,
    clicked_at timestamp with time zone DEFAULT now(),
    visitante text,
    dispositivo text,
    origen text
);

--
-- Name: TABLE short_link_clicks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.short_link_clicks IS 'Clics en enlaces cortos. Sin IP: visitante es un hash que rota a diario.';

--
-- Name: short_link_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.short_link_clicks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: short_link_clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.short_link_clicks_id_seq OWNED BY public.short_link_clicks.id;

--
-- Name: short_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.short_links (
    code text NOT NULL,
    band_id text NOT NULL,
    concert_id text,
    destino text NOT NULL,
    canal text DEFAULT 'otro'::text NOT NULL,
    clave text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: TABLE short_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.short_links IS 'Enlaces cortos de una banda (/r/<code>) con destino lógico resuelto al pulsar.';

--
-- Name: social_content_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.social_content_items (
    id text NOT NULL,
    band_id text NOT NULL,
    platform text NOT NULL,
    external_id text,
    title text DEFAULT 'Sin título'::text,
    url text DEFAULT ''::text,
    thumbnail_url text DEFAULT ''::text,
    published_at timestamp with time zone,
    views bigint DEFAULT 0,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    last_scraped_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: social_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.social_metrics (
    id text NOT NULL,
    band_id text,
    fecha text NOT NULL,
    instagram integer DEFAULT 0,
    tiktok integer DEFAULT 0,
    youtube integer DEFAULT 0,
    spotify integer DEFAULT 0,
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    spotify_monthly_listeners bigint DEFAULT 0,
    spotify_followers bigint DEFAULT 0,
    spotify_popularity integer DEFAULT 0,
    youtube_subscribers bigint DEFAULT 0,
    youtube_total_views bigint DEFAULT 0,
    youtube_video_count integer DEFAULT 0,
    instagram_followers bigint DEFAULT 0,
    instagram_following integer DEFAULT 0,
    instagram_posts_count integer DEFAULT 0,
    instagram_engagement_rate numeric DEFAULT 0.0,
    tiktok_followers bigint DEFAULT 0,
    tiktok_total_likes bigint DEFAULT 0,
    tiktok_video_count integer DEFAULT 0
);

--
-- Name: social_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.social_posts (
    id text NOT NULL,
    band_id text,
    fecha text NOT NULL,
    plataforma text NOT NULL,
    contenido text,
    estado text DEFAULT 'borrador'::text,
    responsable text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    hora_programada text,
    video_url text,
    thumbnail_url text,
    media_type text,
    auto_publish boolean DEFAULT false,
    published_id text,
    published_at timestamp with time zone,
    publish_error text,
    account_handle text,
    hashtags jsonb,
    metrics jsonb,
    publish_started_at timestamp with time zone
);

--
-- Name: song_stems_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.song_stems_cache (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    band_id text NOT NULL,
    song_hash text NOT NULL,
    engine text NOT NULL,
    engine_used text,
    is_neural boolean DEFAULT false,
    degraded boolean DEFAULT false,
    status text DEFAULT 'completed'::text,
    locked_at timestamp with time zone,
    locked_by text,
    timing_breakdown jsonb DEFAULT '{}'::jsonb,
    stems_map jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    degraded_reason text,
    audio_url text,
    song_title text
);

--
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.songs (
    id text NOT NULL,
    band_id text,
    titulo text NOT NULL,
    duracion text,
    duracion_segundos integer DEFAULT 0,
    duracion_minutos integer DEFAULT 0,
    tonalidad text,
    bpm integer DEFAULT 120,
    afinacion text,
    album_disco text,
    orden_album integer,
    album text,
    genero text,
    tipo text,
    estado text,
    energia integer DEFAULT 5,
    portada_url text,
    favorito_general boolean DEFAULT false,
    estado_tema text DEFAULT 'ensayando'::text,
    es_version_covers boolean DEFAULT false,
    enlace_acordes text,
    notas_internas text,
    audio_principal_url text,
    audio_ideas jsonb DEFAULT '[]'::jsonb,
    cifrado_texto text,
    guia_sustituto jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    energia_db_promedio numeric,
    energia_bpm_detectado numeric,
    energia_manual boolean DEFAULT false NOT NULL,
    bpm_detectado_en timestamp with time zone,
    tonalidad_detectada_en timestamp with time zone,
    energia_onset_density double precision,
    notas_miembros jsonb DEFAULT '{}'::jsonb,
    notas_por_miembro jsonb DEFAULT '[]'::jsonb,
    analisis_acordes jsonb,
    pistas jsonb,
    stems_meta jsonb,
    estructura_documento_url text DEFAULT ''::text,
    estructura_documento_nombre text DEFAULT ''::text,
    estructura_documento_procesado_en text,
    estructura_verificada boolean DEFAULT false,
    notas_repertorio text DEFAULT ''::text,
    energia_variacion numeric,
    energia_variacion_calculada_en timestamp with time zone
);

--
-- Name: stem_prediction_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.stem_prediction_jobs (
    id text NOT NULL,
    band_id text,
    song_hash text,
    engine text,
    provider text DEFAULT 'replicate'::text,
    status text DEFAULT 'processing'::text NOT NULL,
    audio_url text,
    song_title text,
    webhook_received_at timestamp with time zone,
    webhook_signature_verified boolean DEFAULT false,
    result_stems_map jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: stem_storage_retry_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.stem_storage_retry_queue (
    id text NOT NULL,
    file_path text NOT NULL,
    storage_sub_path text NOT NULL,
    mime_type text DEFAULT 'audio/mpeg'::text,
    band_id text NOT NULL,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 5,
    next_retry_at bigint NOT NULL,
    last_error text,
    status text DEFAULT 'pending'::text,
    created_at bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

--
-- Name: stripe_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    event_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    processed_at timestamp with time zone DEFAULT now()
);

--
-- Name: tours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.tours (
    id text NOT NULL,
    band_id text,
    nombre text NOT NULL,
    fecha_inicio text,
    fecha_fin text,
    vehiculo text,
    consumo_l100km numeric,
    precio_carburante_eur numeric,
    tipo_combustible text,
    presupuesto_logistica numeric,
    vehiculos jsonb DEFAULT '[]'::jsonb,
    stops jsonb DEFAULT '[]'::jsonb,
    estado text DEFAULT 'planificacion'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    convocatoria_tipo text DEFAULT 'completa'::text,
    convocados_ids jsonb DEFAULT '[]'::jsonb,
    convocados_nombres jsonb DEFAULT '[]'::jsonb,
    sincronizar_calendario boolean DEFAULT true,
    sincronizar_finanzas boolean DEFAULT false,
    CONSTRAINT tours_consumo_l100km_check CHECK ((consumo_l100km >= (0)::numeric))
);

--
-- Name: user_bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_bands (
    id text NOT NULL,
    user_id text NOT NULL,
    band_id text NOT NULL,
    role text DEFAULT 'member'::text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.users (
    id text NOT NULL,
    username text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'member'::text,
    plan text DEFAULT 'emergente'::text,
    band_name text,
    band_id text,
    email text,
    instrument text,
    avatar_color text,
    password_hash text,
    salt text,
    google_oauth jsonb DEFAULT '{}'::jsonb,
    main_band_id text,
    band_order jsonb,
    ui_preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    plan_pendiente text,
    fecha_cambio_plan timestamp with time zone,
    estado_suscripcion text DEFAULT 'activo'::text
);

--
-- Name: data_change_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_change_history ALTER COLUMN id SET DEFAULT nextval('public.data_change_history_id_seq'::regclass);

--
-- Name: enlaces_bandas_amigas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enlaces_bandas_amigas ALTER COLUMN id SET DEFAULT nextval('public.enlaces_bandas_amigas_id_seq'::regclass);

--
-- Name: metricas_bandas_amigas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metricas_bandas_amigas ALTER COLUMN id SET DEFAULT nextval('public.metricas_bandas_amigas_id_seq'::regclass);

--
-- Name: short_link_clicks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.short_link_clicks ALTER COLUMN id SET DEFAULT nextval('public.short_link_clicks_id_seq'::regclass);

--
-- Name: agent_execution_logs agent_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.agent_execution_logs ADD CONSTRAINT agent_execution_logs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: agent_jobs_queue agent_jobs_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.agent_jobs_queue ADD CONSTRAINT agent_jobs_queue_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: agent_schedule_state agent_schedule_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.agent_schedule_state ADD CONSTRAINT agent_schedule_state_pkey PRIMARY KEY (job_name); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: ai_token_ledger ai_token_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.ai_token_ledger ADD CONSTRAINT ai_token_ledger_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: autonomy_configs autonomy_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.autonomy_configs ADD CONSTRAINT autonomy_configs_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_alert_settings band_alert_settings_band_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_alert_settings ADD CONSTRAINT band_alert_settings_band_id_key UNIQUE (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_alert_settings band_alert_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_alert_settings ADD CONSTRAINT band_alert_settings_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_cartel_estilo band_cartel_estilo_band_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_cartel_estilo ADD CONSTRAINT band_cartel_estilo_band_id_key UNIQUE (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_cartel_estilo band_cartel_estilo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_cartel_estilo ADD CONSTRAINT band_cartel_estilo_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_contacts band_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_contacts ADD CONSTRAINT band_contacts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_email_accounts band_email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_email_accounts ADD CONSTRAINT band_email_accounts_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_gmail_oauth_accounts band_gmail_oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_gmail_oauth_accounts ADD CONSTRAINT band_gmail_oauth_accounts_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_letras_auto band_letras_auto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_letras_auto ADD CONSTRAINT band_letras_auto_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_print_settings band_print_settings_band_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_print_settings ADD CONSTRAINT band_print_settings_band_id_key UNIQUE (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_print_settings band_print_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_print_settings ADD CONSTRAINT band_print_settings_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_schedules band_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_schedules ADD CONSTRAINT band_schedules_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_social_accounts band_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_social_accounts ADD CONSTRAINT band_social_accounts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: calendar_conflict_notifications calendar_conflict_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.calendar_conflict_notifications ADD CONSTRAINT calendar_conflict_notifications_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: campaign_pitch_training campaign_pitch_training_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.campaign_pitch_training ADD CONSTRAINT campaign_pitch_training_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festival_convocatorias catalogo_festival_convocatorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festival_convocatorias ADD CONSTRAINT catalogo_festival_convocatorias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festival_ediciones catalogo_festival_ediciones_festival_id_anio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festival_ediciones ADD CONSTRAINT catalogo_festival_ediciones_festival_id_anio_key UNIQUE (festival_id, anio); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festival_ediciones catalogo_festival_ediciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festival_ediciones ADD CONSTRAINT catalogo_festival_ediciones_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festivales catalogo_festivales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festivales ADD CONSTRAINT catalogo_festivales_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_generos_alias catalogo_generos_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_generos_alias ADD CONSTRAINT catalogo_generos_alias_pkey PRIMARY KEY (alias); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_generos catalogo_generos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_generos ADD CONSTRAINT catalogo_generos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_ingestas catalogo_ingestas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_ingestas ADD CONSTRAINT catalogo_ingestas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_sala_alias catalogo_sala_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_sala_alias ADD CONSTRAINT catalogo_sala_alias_pkey PRIMARY KEY (alias_clave); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_sala_generos catalogo_sala_generos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_sala_generos ADD CONSTRAINT catalogo_sala_generos_pkey PRIMARY KEY (sala_id, genero_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_salas catalogo_salas_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_salas ADD CONSTRAINT catalogo_salas_clave_key UNIQUE (clave); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_salas catalogo_salas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_salas ADD CONSTRAINT catalogo_salas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_staging catalogo_staging_ingesta_id_fuente_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_staging ADD CONSTRAINT catalogo_staging_ingesta_id_fuente_external_id_key UNIQUE (ingesta_id, fuente, external_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_staging catalogo_staging_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_staging ADD CONSTRAINT catalogo_staging_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_supresion catalogo_supresion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_supresion ADD CONSTRAINT catalogo_supresion_pkey PRIMARY KEY (email_sha256); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: category_pitch_templates category_pitch_templates_band_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.category_pitch_templates ADD CONSTRAINT category_pitch_templates_band_id_category_key UNIQUE (band_id, category); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: category_pitch_templates category_pitch_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.category_pitch_templates ADD CONSTRAINT category_pitch_templates_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concert_deals concert_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concert_deals ADD CONSTRAINT concert_deals_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concert_deals concert_deals_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concert_deals ADD CONSTRAINT concert_deals_token_key UNIQUE (token); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concerts concerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concerts ADD CONSTRAINT concerts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: data_change_history data_change_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.data_change_history ADD CONSTRAINT data_change_history_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deal_support_contributions deal_support_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deal_support_contributions ADD CONSTRAINT deal_support_contributions_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deleted_bands deleted_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deleted_bands ADD CONSTRAINT deleted_bands_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deleted_leads deleted_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deleted_leads ADD CONSTRAINT deleted_leads_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: emails_ciclo_vida emails_ciclo_vida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.emails_ciclo_vida ADD CONSTRAINT emails_ciclo_vida_pkey PRIMARY KEY (user_id, tipo); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: enlaces_bandas_amigas enlaces_bandas_amigas_band_contact_id_plataforma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.enlaces_bandas_amigas ADD CONSTRAINT enlaces_bandas_amigas_band_contact_id_plataforma_key UNIQUE (band_contact_id, plataforma); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: enlaces_bandas_amigas enlaces_bandas_amigas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.enlaces_bandas_amigas ADD CONSTRAINT enlaces_bandas_amigas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: epk_configs epk_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.epk_configs ADD CONSTRAINT epk_configs_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: fan_link_clicks fan_link_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.fan_link_clicks ADD CONSTRAINT fan_link_clicks_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: fans fans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.fans ADD CONSTRAINT fans_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: gear_checklists gear_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.gear_checklists ADD CONSTRAINT gear_checklists_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: lead_messages lead_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.lead_messages ADD CONSTRAINT lead_messages_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: letras_jobs letras_jobs_band_song_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.letras_jobs ADD CONSTRAINT letras_jobs_band_song_unique UNIQUE (band_id, song_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: letras_jobs letras_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.letras_jobs ADD CONSTRAINT letras_jobs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: metricas_bandas_amigas metricas_bandas_amigas_band_contact_id_fuente_periodo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.metricas_bandas_amigas ADD CONSTRAINT metricas_bandas_amigas_band_contact_id_fuente_periodo_key UNIQUE (band_contact_id, fuente, periodo); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: metricas_bandas_amigas metricas_bandas_amigas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.metricas_bandas_amigas ADD CONSTRAINT metricas_bandas_amigas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: musicians_waitlist musicians_waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.musicians_waitlist ADD CONSTRAINT musicians_waitlist_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pegatinas_pedidos pegatinas_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pegatinas_pedidos ADD CONSTRAINT pegatinas_pedidos_pkey PRIMARY KEY (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_example_threads pitch_example_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_example_threads ADD CONSTRAINT pitch_example_threads_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_learning_examples pitch_learning_examples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_learning_examples ADD CONSTRAINT pitch_learning_examples_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_vector_store pitch_vector_store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_vector_store ADD CONSTRAINT pitch_vector_store_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_analyses reel_analyses_band_id_video_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_analyses ADD CONSTRAINT reel_analyses_band_id_video_key_key UNIQUE (band_id, video_key); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_analyses reel_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_analyses ADD CONSTRAINT reel_analyses_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_clips reel_clips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_clips ADD CONSTRAINT reel_clips_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_metricas reel_metricas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_metricas ADD CONSTRAINT reel_metricas_pkey PRIMARY KEY (post_id, horas); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: registered_bands registered_bands_band_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.registered_bands ADD CONSTRAINT registered_bands_band_id_key UNIQUE (band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: registered_bands registered_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.registered_bands ADD CONSTRAINT registered_bands_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: rehearsals rehearsals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.rehearsals ADD CONSTRAINT rehearsals_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: run_of_show run_of_show_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.run_of_show ADD CONSTRAINT run_of_show_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: saved_filters saved_filters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.saved_filters ADD CONSTRAINT saved_filters_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: setlist_shortcuts setlist_shortcuts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.setlist_shortcuts ADD CONSTRAINT setlist_shortcuts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.setlists ADD CONSTRAINT setlists_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: short_link_clicks short_link_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.short_link_clicks ADD CONSTRAINT short_link_clicks_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: short_links short_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.short_links ADD CONSTRAINT short_links_pkey PRIMARY KEY (code); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_content_items social_content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_content_items ADD CONSTRAINT social_content_items_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_metrics social_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_metrics ADD CONSTRAINT social_metrics_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_posts social_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_posts ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: song_stems_cache song_stems_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.song_stems_cache ADD CONSTRAINT song_stems_cache_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.songs ADD CONSTRAINT songs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: stem_prediction_jobs stem_prediction_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.stem_prediction_jobs ADD CONSTRAINT stem_prediction_jobs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: stem_storage_retry_queue stem_storage_retry_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.stem_storage_retry_queue ADD CONSTRAINT stem_storage_retry_queue_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: stripe_webhook_events stripe_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.stripe_webhook_events ADD CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (event_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.tours ADD CONSTRAINT tours_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: song_stems_cache unique_band_song_engine; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.song_stems_cache ADD CONSTRAINT unique_band_song_engine UNIQUE (band_id, song_hash, engine); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: user_bands unique_user_band; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.user_bands ADD CONSTRAINT unique_user_band UNIQUE (user_id, band_id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: calendar_conflict_notifications uq_calendar_conflict_user_huella; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.calendar_conflict_notifications ADD CONSTRAINT uq_calendar_conflict_user_huella UNIQUE (user_id, huella); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: user_bands user_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.user_bands ADD CONSTRAINT user_bands_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username); EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: enlaces_bandas_amigas_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS enlaces_bandas_amigas_band_idx ON public.enlaces_bandas_amigas USING btree (band_id);

--
-- Name: idx_agent_execution_logs_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agente ON public.agent_execution_logs USING btree (agente);

--
-- Name: idx_agent_execution_logs_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_band ON public.agent_execution_logs USING btree (band_id);

--
-- Name: idx_agent_logs_band_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_agent_logs_band_date ON public.agent_execution_logs USING btree (band_id, created_at DESC);

--
-- Name: idx_agent_queue_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_agent_queue_band ON public.agent_jobs_queue USING btree (band_id, created_at DESC);

--
-- Name: idx_agent_queue_status_sched; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_agent_queue_status_sched ON public.agent_jobs_queue USING btree (status, scheduled_at) WHERE (status = 'pending'::text);

--
-- Name: idx_ai_token_ledger_band_unsettled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_band_unsettled ON public.ai_token_ledger USING btree (band_id, created_at) WHERE (settled_at IS NULL);

--
-- Name: idx_band_alert_settings_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_band_alert_settings_band_id ON public.band_alert_settings USING btree (band_id);

--
-- Name: idx_band_cartel_estilo_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_band_cartel_estilo_band_id ON public.band_cartel_estilo USING btree (band_id);

--
-- Name: idx_band_print_settings_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_band_print_settings_band_id ON public.band_print_settings USING btree (band_id);

--
-- Name: idx_band_social_accounts_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_band_social_accounts_band ON public.band_social_accounts USING btree (band_id);

--
-- Name: idx_calendar_conflict_notifications_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_calendar_conflict_notifications_band ON public.calendar_conflict_notifications USING btree (band_id);

--
-- Name: idx_campaign_pitch_training_band_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_campaign_pitch_training_band_campaign ON public.campaign_pitch_training USING btree (band_id, campaign_id);

--
-- Name: idx_campaign_pitch_training_campaign; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_campaign_pitch_training_campaign ON public.campaign_pitch_training USING btree (campaign_id);

--
-- Name: idx_campaigns_band_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_campaigns_band_active ON public.campaigns USING btree (band_id, is_active);

--
-- Name: idx_catalogo_festival_convocatorias_cierre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_festival_convocatorias_cierre ON public.catalogo_festival_convocatorias USING btree (cierra) WHERE (estado = ANY (ARRAY['proxima'::text, 'abierta'::text]));

--
-- Name: idx_catalogo_festival_convocatorias_festival; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_festival_convocatorias_festival ON public.catalogo_festival_convocatorias USING btree (festival_id);

--
-- Name: idx_catalogo_festivales_comunidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_festivales_comunidad ON public.catalogo_festivales USING btree (comunidad);

--
-- Name: idx_catalogo_festivales_revision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_festivales_revision ON public.catalogo_festivales USING btree (estado_revision);

--
-- Name: idx_catalogo_festivales_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_festivales_sala_id ON public.catalogo_festivales USING btree (sala_id) WHERE (sala_id IS NOT NULL);

--
-- Name: idx_catalogo_sala_generos_genero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_sala_generos_genero ON public.catalogo_sala_generos USING btree (genero_id);

--
-- Name: idx_catalogo_salas_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_nivel ON public.catalogo_salas USING btree (nivel) WHERE (no_contactar = false);

--
-- Name: idx_catalogo_salas_pais_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_pais_tipo ON public.catalogo_salas USING btree (pais, tipo);

--
-- Name: idx_catalogo_salas_region_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_region_tipo ON public.catalogo_salas USING btree (region, tipo);

--
-- Name: idx_catalogo_salas_sin_coordenadas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_salas_sin_coordenadas ON public.catalogo_salas USING btree (geolocalizada_en NULLS FIRST) WHERE (lat IS NULL);

--
-- Name: idx_catalogo_staging_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_staging_estado ON public.catalogo_staging USING btree (ingesta_id, estado);

--
-- Name: idx_catalogo_staging_sala; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_catalogo_staging_sala ON public.catalogo_staging USING btree (sala_id) WHERE (sala_id IS NOT NULL);

--
-- Name: idx_category_templates_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_category_templates_band ON public.category_pitch_templates USING btree (band_id, category);

--
-- Name: idx_concert_deals_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_concert_deals_band_id ON public.concert_deals USING btree (band_id);

--
-- Name: idx_concert_deals_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_concert_deals_lead_id ON public.concert_deals USING btree (lead_id);

--
-- Name: idx_concert_deals_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_concert_deals_token ON public.concert_deals USING btree (token);

--
-- Name: idx_data_change_history_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_data_change_history_band ON public.data_change_history USING btree (band_id, changed_at DESC);

--
-- Name: idx_data_change_history_tabla_fila; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_data_change_history_tabla_fila ON public.data_change_history USING btree (tabla, fila_id, changed_at DESC);

--
-- Name: idx_deal_support_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_deal_support_band ON public.deal_support_contributions USING btree (band_id);

--
-- Name: idx_deal_support_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_deal_support_deal ON public.deal_support_contributions USING btree (deal_id);

--
-- Name: idx_deleted_bands_band_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_deleted_bands_band_nombre ON public.deleted_bands USING btree (band_id, nombre_banda);

--
-- Name: idx_deleted_leads_band_sala; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_deleted_leads_band_sala ON public.deleted_leads USING btree (band_id, nombre_sala);

--
-- Name: idx_lead_messages_lead_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_band ON public.lead_messages USING btree (lead_id, band_id);

--
-- Name: idx_leads_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_leads_sala_id ON public.leads USING btree (sala_id) WHERE (sala_id IS NOT NULL);

--
-- Name: idx_letras_jobs_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_letras_jobs_band ON public.letras_jobs USING btree (band_id, estado);

--
-- Name: idx_letras_jobs_cola; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_letras_jobs_cola ON public.letras_jobs USING btree (estado, disponible_desde);

--
-- Name: idx_musicians_waitlist_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_musicians_waitlist_email ON public.musicians_waitlist USING btree (email);

--
-- Name: idx_pitch_example_threads_band_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_example_threads_band_cat ON public.pitch_example_threads USING btree (band_id, category);

--
-- Name: idx_pitch_learning_band_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_learning_band_fecha ON public.pitch_learning_examples USING btree (band_id, fecha_aprobacion DESC);

--
-- Name: idx_pitch_vector_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_vector_embedding ON public.pitch_vector_store USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_pitch_vector_band ON public.pitch_vector_store USING btree (band_id, tipo_entidad);

--
-- Name: idx_pitch_vector_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_vector_score ON public.pitch_vector_store USING btree (conversion_score DESC);

--
-- Name: idx_pitch_vector_store_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_vector_store_band_id ON public.pitch_vector_store USING btree (band_id);

--
-- Name: idx_pitch_vector_store_metadata_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_pitch_vector_store_metadata_gin ON public.pitch_vector_store USING gin (metadata);

--
-- Name: idx_reel_analyses_band_video; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_reel_analyses_band_video ON public.reel_analyses USING btree (band_id, video_key);

--
-- Name: idx_reel_clips_band_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_reel_clips_band_url ON public.reel_clips USING btree (band_id, clip_url);

--
-- Name: idx_reel_metricas_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_reel_metricas_band ON public.reel_metricas USING btree (band_id, medido_en DESC);

--
-- Name: idx_registered_bands_ref_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS idx_registered_bands_ref_code ON public.registered_bands USING btree (ref_code) WHERE (ref_code IS NOT NULL);

--
-- Name: idx_registered_bands_referido_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_registered_bands_referido_por ON public.registered_bands USING btree (referido_por) WHERE (referido_por IS NOT NULL);

--
-- Name: idx_setlist_shortcuts_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_setlist_shortcuts_band ON public.setlist_shortcuts USING btree (band_id);

--
-- Name: idx_setlist_shortcuts_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_setlist_shortcuts_band_id ON public.setlist_shortcuts USING btree (band_id);

--
-- Name: idx_setlists_ai_analysis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_setlists_ai_analysis ON public.setlists USING btree (band_id) WHERE (ai_analysis_json IS NOT NULL);

--
-- Name: idx_short_link_clicks_band_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_band_fecha ON public.short_link_clicks USING btree (band_id, clicked_at DESC);

--
-- Name: idx_short_link_clicks_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_short_link_clicks_code ON public.short_link_clicks USING btree (code);

--
-- Name: idx_short_links_band_clave; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_band_clave ON public.short_links USING btree (band_id, clave);

--
-- Name: idx_short_links_band_concert; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_short_links_band_concert ON public.short_links USING btree (band_id, concert_id);

--
-- Name: idx_social_content_band_plat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_social_content_band_plat ON public.social_content_items USING btree (band_id, platform);

--
-- Name: idx_song_stems_cache_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_song_stems_cache_lookup ON public.song_stems_cache USING btree (band_id, song_hash, engine);

--
-- Name: idx_song_stems_cache_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_song_stems_cache_status ON public.song_stems_cache USING btree (status, locked_at);

--
-- Name: idx_songs_energia_bpm_detectado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_songs_energia_bpm_detectado ON public.songs USING btree (energia_bpm_detectado) WHERE (energia_bpm_detectado IS NOT NULL);

--
-- Name: idx_songs_energia_db_promedio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_songs_energia_db_promedio ON public.songs USING btree (energia_db_promedio) WHERE (energia_db_promedio IS NOT NULL);

--
-- Name: idx_stem_prediction_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_stem_prediction_jobs_status ON public.stem_prediction_jobs USING btree (status, created_at DESC);

--
-- Name: idx_stem_predictions_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_stem_predictions_status_created ON public.stem_prediction_jobs USING btree (status, created_at);

--
-- Name: idx_stem_retry_status_next; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_stem_retry_status_next ON public.stem_storage_retry_queue USING btree (status, next_retry_at);

--
-- Name: idx_stem_storage_retry_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS idx_stem_storage_retry_status ON public.stem_storage_retry_queue USING btree (status, next_retry_at);

--
-- Name: metricas_bandas_amigas_band_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS metricas_bandas_amigas_band_idx ON public.metricas_bandas_amigas USING btree (band_id, periodo);

--
-- Name: uq_deal_support_payment_intent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_support_payment_intent ON public.deal_support_contributions USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL);

--
-- Name: agent_execution_logs trg_append_only_agent_execution_logs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_append_only_agent_execution_logs BEFORE DELETE OR UPDATE ON public.agent_execution_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

--
-- Name: band_contacts trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.band_contacts FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: concerts trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.concerts FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: epk_configs trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.epk_configs FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: gear_checklists trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.gear_checklists FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: registered_bands trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.registered_bands FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: rehearsals trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.rehearsals FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: run_of_show trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.run_of_show FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: setlists trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.setlists FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: songs trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: tours trg_capture_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_capture_history BEFORE DELETE OR UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.fn_capture_row_history();

--
-- Name: concert_deals trg_concert_deals_inmutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_concert_deals_inmutable BEFORE UPDATE ON public.concert_deals FOR EACH ROW EXECUTE FUNCTION public.fn_concert_deals_inmutable();

--
-- Name: ai_token_ledger trg_prevent_delete_ai_token_ledger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER trg_prevent_delete_ai_token_ledger BEFORE DELETE ON public.ai_token_ledger FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

--
-- Name: agent_execution_logs agent_execution_logs_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.agent_execution_logs ADD CONSTRAINT agent_execution_logs_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: agent_jobs_queue agent_jobs_queue_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.agent_jobs_queue ADD CONSTRAINT agent_jobs_queue_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: ai_token_ledger ai_token_ledger_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.ai_token_ledger ADD CONSTRAINT ai_token_ledger_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: autonomy_configs autonomy_configs_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.autonomy_configs ADD CONSTRAINT autonomy_configs_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_contacts band_contacts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_contacts ADD CONSTRAINT band_contacts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_email_accounts band_email_accounts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_email_accounts ADD CONSTRAINT band_email_accounts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: band_gmail_oauth_accounts band_gmail_oauth_accounts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.band_gmail_oauth_accounts ADD CONSTRAINT band_gmail_oauth_accounts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: campaign_pitch_training campaign_pitch_training_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.campaign_pitch_training ADD CONSTRAINT campaign_pitch_training_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: campaign_pitch_training campaign_pitch_training_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.campaign_pitch_training ADD CONSTRAINT campaign_pitch_training_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: campaigns campaigns_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.campaigns ADD CONSTRAINT campaigns_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festival_convocatorias catalogo_festival_convocatorias_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festival_convocatorias ADD CONSTRAINT catalogo_festival_convocatorias_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.catalogo_festivales(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festival_ediciones catalogo_festival_ediciones_festival_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festival_ediciones ADD CONSTRAINT catalogo_festival_ediciones_festival_id_fkey FOREIGN KEY (festival_id) REFERENCES public.catalogo_festivales(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_festivales catalogo_festivales_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_festivales ADD CONSTRAINT catalogo_festivales_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.catalogo_salas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_generos_alias catalogo_generos_alias_genero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_generos_alias ADD CONSTRAINT catalogo_generos_alias_genero_id_fkey FOREIGN KEY (genero_id) REFERENCES public.catalogo_generos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_generos catalogo_generos_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_generos ADD CONSTRAINT catalogo_generos_padre_id_fkey FOREIGN KEY (padre_id) REFERENCES public.catalogo_generos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_sala_generos catalogo_sala_generos_genero_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_sala_generos ADD CONSTRAINT catalogo_sala_generos_genero_id_fkey FOREIGN KEY (genero_id) REFERENCES public.catalogo_generos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_sala_generos catalogo_sala_generos_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_sala_generos ADD CONSTRAINT catalogo_sala_generos_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.catalogo_salas(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_staging catalogo_staging_ingesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_staging ADD CONSTRAINT catalogo_staging_ingesta_id_fkey FOREIGN KEY (ingesta_id) REFERENCES public.catalogo_ingestas(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_staging catalogo_staging_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_staging ADD CONSTRAINT catalogo_staging_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.catalogo_salas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: catalogo_supresion catalogo_supresion_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.catalogo_supresion ADD CONSTRAINT catalogo_supresion_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.catalogo_salas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: category_pitch_templates category_pitch_templates_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.category_pitch_templates ADD CONSTRAINT category_pitch_templates_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concert_deals concert_deals_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concert_deals ADD CONSTRAINT concert_deals_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concert_deals concert_deals_concert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concert_deals ADD CONSTRAINT concert_deals_concert_id_fkey FOREIGN KEY (concert_id) REFERENCES public.concerts(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concert_deals concert_deals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concert_deals ADD CONSTRAINT concert_deals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concerts concerts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concerts ADD CONSTRAINT concerts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: concerts concerts_setlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.concerts ADD CONSTRAINT concerts_setlist_id_fkey FOREIGN KEY (setlist_id) REFERENCES public.setlists(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deal_support_contributions deal_support_contributions_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deal_support_contributions ADD CONSTRAINT deal_support_contributions_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deal_support_contributions deal_support_contributions_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deal_support_contributions ADD CONSTRAINT deal_support_contributions_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.concert_deals(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deleted_bands deleted_bands_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deleted_bands ADD CONSTRAINT deleted_bands_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: deleted_leads deleted_leads_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.deleted_leads ADD CONSTRAINT deleted_leads_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: emails_ciclo_vida emails_ciclo_vida_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.emails_ciclo_vida ADD CONSTRAINT emails_ciclo_vida_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: enlaces_bandas_amigas enlaces_bandas_amigas_band_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.enlaces_bandas_amigas ADD CONSTRAINT enlaces_bandas_amigas_band_contact_id_fkey FOREIGN KEY (band_contact_id) REFERENCES public.band_contacts(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: enlaces_bandas_amigas enlaces_bandas_amigas_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.enlaces_bandas_amigas ADD CONSTRAINT enlaces_bandas_amigas_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: epk_configs epk_configs_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.epk_configs ADD CONSTRAINT epk_configs_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: fans fans_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.fans ADD CONSTRAINT fans_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: fans fans_concierto_origen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.fans ADD CONSTRAINT fans_concierto_origen_id_fkey FOREIGN KEY (concierto_origen_id) REFERENCES public.concerts(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: gear_checklists gear_checklists_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.gear_checklists ADD CONSTRAINT gear_checklists_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: lead_messages lead_messages_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.lead_messages ADD CONSTRAINT lead_messages_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: lead_messages lead_messages_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.lead_messages ADD CONSTRAINT lead_messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: leads leads_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.leads ADD CONSTRAINT leads_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: leads leads_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.leads ADD CONSTRAINT leads_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.catalogo_salas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: messages messages_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: metricas_bandas_amigas metricas_bandas_amigas_band_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.metricas_bandas_amigas ADD CONSTRAINT metricas_bandas_amigas_band_contact_id_fkey FOREIGN KEY (band_contact_id) REFERENCES public.band_contacts(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: metricas_bandas_amigas metricas_bandas_amigas_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.metricas_bandas_amigas ADD CONSTRAINT metricas_bandas_amigas_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: payments payments_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pegatinas_pedidos pegatinas_pedidos_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pegatinas_pedidos ADD CONSTRAINT pegatinas_pedidos_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_example_threads pitch_example_threads_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_example_threads ADD CONSTRAINT pitch_example_threads_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_learning_examples pitch_learning_examples_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_learning_examples ADD CONSTRAINT pitch_learning_examples_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_vector_store pitch_vector_store_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_vector_store ADD CONSTRAINT pitch_vector_store_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: pitch_vector_store pitch_vector_store_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.pitch_vector_store ADD CONSTRAINT pitch_vector_store_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_analyses reel_analyses_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_analyses ADD CONSTRAINT reel_analyses_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_clips reel_clips_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_clips ADD CONSTRAINT reel_clips_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_metricas reel_metricas_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_metricas ADD CONSTRAINT reel_metricas_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: reel_metricas reel_metricas_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.reel_metricas ADD CONSTRAINT reel_metricas_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: rehearsals rehearsals_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.rehearsals ADD CONSTRAINT rehearsals_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: rehearsals rehearsals_setlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.rehearsals ADD CONSTRAINT rehearsals_setlist_id_fkey FOREIGN KEY (setlist_id) REFERENCES public.setlists(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: run_of_show run_of_show_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.run_of_show ADD CONSTRAINT run_of_show_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: saved_filters saved_filters_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.saved_filters ADD CONSTRAINT saved_filters_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: setlist_shortcuts setlist_shortcuts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.setlist_shortcuts ADD CONSTRAINT setlist_shortcuts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: setlists setlists_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.setlists ADD CONSTRAINT setlists_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: short_link_clicks short_link_clicks_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.short_link_clicks ADD CONSTRAINT short_link_clicks_code_fkey FOREIGN KEY (code) REFERENCES public.short_links(code) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_content_items social_content_items_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_content_items ADD CONSTRAINT social_content_items_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_metrics social_metrics_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_metrics ADD CONSTRAINT social_metrics_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: social_posts social_posts_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.social_posts ADD CONSTRAINT social_posts_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: song_stems_cache song_stems_cache_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.song_stems_cache ADD CONSTRAINT song_stems_cache_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: songs songs_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.songs ADD CONSTRAINT songs_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: stem_prediction_jobs stem_prediction_jobs_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.stem_prediction_jobs ADD CONSTRAINT stem_prediction_jobs_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: stem_storage_retry_queue stem_storage_retry_queue_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.stem_storage_retry_queue ADD CONSTRAINT stem_storage_retry_queue_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: tours tours_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.tours ADD CONSTRAINT tours_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: user_bands user_bands_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.user_bands ADD CONSTRAINT user_bands_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: user_bands user_bands_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.user_bands ADD CONSTRAINT user_bands_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: users users_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $$ BEGIN ALTER TABLE ONLY public.users ADD CONSTRAINT users_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.registered_bands(band_id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL; END $$;

--
-- Name: agent_execution_logs Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.agent_execution_logs;
CREATE POLICY "Permitir acceso total al backend" ON public.agent_execution_logs USING (true);

--
-- Name: agent_jobs_queue Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.agent_jobs_queue;
CREATE POLICY "Permitir acceso total al backend" ON public.agent_jobs_queue USING (true);

--
-- Name: agent_schedule_state Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.agent_schedule_state;
CREATE POLICY "Permitir acceso total al backend" ON public.agent_schedule_state USING (true);

--
-- Name: band_alert_settings Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_alert_settings;
CREATE POLICY "Permitir acceso total al backend" ON public.band_alert_settings USING (true) WITH CHECK (true);

--
-- Name: band_cartel_estilo Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_cartel_estilo;
CREATE POLICY "Permitir acceso total al backend" ON public.band_cartel_estilo USING (true) WITH CHECK (true);

--
-- Name: band_email_accounts Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_email_accounts;
CREATE POLICY "Permitir acceso total al backend" ON public.band_email_accounts USING (true);

--
-- Name: band_gmail_oauth_accounts Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_gmail_oauth_accounts;
CREATE POLICY "Permitir acceso total al backend" ON public.band_gmail_oauth_accounts USING (true);

--
-- Name: band_letras_auto Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_letras_auto;
CREATE POLICY "Permitir acceso total al backend" ON public.band_letras_auto USING (true) WITH CHECK (true);

--
-- Name: band_print_settings Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_print_settings;
CREATE POLICY "Permitir acceso total al backend" ON public.band_print_settings USING (true) WITH CHECK (true);

--
-- Name: band_schedules Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_schedules;
CREATE POLICY "Permitir acceso total al backend" ON public.band_schedules USING (true);

--
-- Name: calendar_conflict_notifications Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.calendar_conflict_notifications;
CREATE POLICY "Permitir acceso total al backend" ON public.calendar_conflict_notifications USING (true) WITH CHECK (true);

--
-- Name: campaign_pitch_training Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.campaign_pitch_training;
CREATE POLICY "Permitir acceso total al backend" ON public.campaign_pitch_training USING (true);

--
-- Name: campaigns Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.campaigns;
CREATE POLICY "Permitir acceso total al backend" ON public.campaigns USING (true);

--
-- Name: deleted_bands Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.deleted_bands;
CREATE POLICY "Permitir acceso total al backend" ON public.deleted_bands USING (true);

--
-- Name: deleted_leads Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.deleted_leads;
CREATE POLICY "Permitir acceso total al backend" ON public.deleted_leads USING (true);

--
-- Name: letras_jobs Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.letras_jobs;
CREATE POLICY "Permitir acceso total al backend" ON public.letras_jobs USING (true) WITH CHECK (true);

--
-- Name: musicians_waitlist Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.musicians_waitlist;
CREATE POLICY "Permitir acceso total al backend" ON public.musicians_waitlist USING (true);

--
-- Name: pegatinas_pedidos Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.pegatinas_pedidos;
CREATE POLICY "Permitir acceso total al backend" ON public.pegatinas_pedidos USING (true);

--
-- Name: reel_analyses Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.reel_analyses;
CREATE POLICY "Permitir acceso total al backend" ON public.reel_analyses USING (true);

--
-- Name: saved_filters Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.saved_filters;
CREATE POLICY "Permitir acceso total al backend" ON public.saved_filters USING (true);

--
-- Name: social_content_items Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.social_content_items;
CREATE POLICY "Permitir acceso total al backend" ON public.social_content_items USING (true);

--
-- Name: song_stems_cache Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.song_stems_cache;
CREATE POLICY "Permitir acceso total al backend" ON public.song_stems_cache USING (true);

--
-- Name: stem_prediction_jobs Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.stem_prediction_jobs;
CREATE POLICY "Permitir acceso total al backend" ON public.stem_prediction_jobs USING (true);

--
-- Name: stem_storage_retry_queue Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.stem_storage_retry_queue;
CREATE POLICY "Permitir acceso total al backend" ON public.stem_storage_retry_queue USING (true);

--
-- Name: stripe_webhook_events Permitir acceso total al backend; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.stripe_webhook_events;
CREATE POLICY "Permitir acceso total al backend" ON public.stripe_webhook_events USING (true);

--
-- Name: pitch_vector_store Permitir acceso total al backend en pitch_vector_store; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend en pitch_vector_store" ON public.pitch_vector_store;
CREATE POLICY "Permitir acceso total al backend en pitch_vector_store" ON public.pitch_vector_store USING (true);

--
-- Name: concert_deals Permitir acceso total al backend para concert_deals; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend para concert_deals" ON public.concert_deals;
CREATE POLICY "Permitir acceso total al backend para concert_deals" ON public.concert_deals USING (true);

--
-- Name: deal_support_contributions Permitir acceso total al backend para deal_support_contribution; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS "Permitir acceso total al backend para deal_support_contribution" ON public.deal_support_contributions;
CREATE POLICY "Permitir acceso total al backend para deal_support_contribution" ON public.deal_support_contributions USING (true);

--
-- Name: agent_execution_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_execution_logs agent_execution_logs_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS agent_execution_logs_isolation_policy ON public.agent_execution_logs;
CREATE POLICY agent_execution_logs_isolation_policy ON public.agent_execution_logs USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: agent_jobs_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_jobs_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_schedule_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_schedule_state ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_token_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_token_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_token_ledger ai_token_ledger_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS ai_token_ledger_isolation_policy ON public.ai_token_ledger;
CREATE POLICY ai_token_ledger_isolation_policy ON public.ai_token_ledger USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: autonomy_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.autonomy_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: autonomy_configs autonomy_configs_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS autonomy_configs_isolation_policy ON public.autonomy_configs;
CREATE POLICY autonomy_configs_isolation_policy ON public.autonomy_configs USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: band_alert_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_alert_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: band_cartel_estilo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_cartel_estilo ENABLE ROW LEVEL SECURITY;

--
-- Name: band_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: band_contacts band_contacts_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS band_contacts_isolation_policy ON public.band_contacts;
CREATE POLICY band_contacts_isolation_policy ON public.band_contacts USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: band_email_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_email_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: band_gmail_oauth_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_gmail_oauth_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: band_letras_auto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_letras_auto ENABLE ROW LEVEL SECURITY;

--
-- Name: band_print_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_print_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: band_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: band_social_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.band_social_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_conflict_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_conflict_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_pitch_training; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_pitch_training ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_festival_convocatorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_festival_convocatorias ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_festival_ediciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_festival_ediciones ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_festivales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_festivales ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_generos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_generos ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_generos_alias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_generos_alias ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_ingestas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_ingestas ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_sala_alias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_sala_alias ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_sala_generos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_sala_generos ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_salas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_salas ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_staging; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_staging ENABLE ROW LEVEL SECURITY;

--
-- Name: catalogo_supresion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.catalogo_supresion ENABLE ROW LEVEL SECURITY;

--
-- Name: category_pitch_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.category_pitch_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: category_pitch_templates category_pitch_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS category_pitch_templates_isolation_policy ON public.category_pitch_templates;
CREATE POLICY category_pitch_templates_isolation_policy ON public.category_pitch_templates USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: concert_deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.concert_deals ENABLE ROW LEVEL SECURITY;

--
-- Name: concerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;

--
-- Name: concerts concerts_delete_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS concerts_delete_policy ON public.concerts;
CREATE POLICY concerts_delete_policy ON public.concerts FOR DELETE USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: concerts concerts_insert_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS concerts_insert_policy ON public.concerts;
CREATE POLICY concerts_insert_policy ON public.concerts FOR INSERT WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: concerts concerts_select_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS concerts_select_policy ON public.concerts;
CREATE POLICY concerts_select_policy ON public.concerts FOR SELECT USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))));

--
-- Name: concerts concerts_update_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS concerts_update_policy ON public.concerts;
CREATE POLICY concerts_update_policy ON public.concerts FOR UPDATE USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: deal_support_contributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_support_contributions ENABLE ROW LEVEL SECURITY;

--
-- Name: deleted_bands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deleted_bands ENABLE ROW LEVEL SECURITY;

--
-- Name: deleted_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deleted_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: emails_ciclo_vida; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emails_ciclo_vida ENABLE ROW LEVEL SECURITY;

--
-- Name: enlaces_bandas_amigas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.enlaces_bandas_amigas ENABLE ROW LEVEL SECURITY;

--
-- Name: epk_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.epk_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: epk_configs epk_configs_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS epk_configs_isolation_policy ON public.epk_configs;
CREATE POLICY epk_configs_isolation_policy ON public.epk_configs USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: fan_link_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fan_link_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: fans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;

--
-- Name: fans fans_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS fans_isolation_policy ON public.fans;
CREATE POLICY fans_isolation_policy ON public.fans USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: gear_checklists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gear_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: gear_checklists gear_checklists_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS gear_checklists_isolation_policy ON public.gear_checklists;
CREATE POLICY gear_checklists_isolation_policy ON public.gear_checklists USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: lead_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_messages lead_messages_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS lead_messages_isolation_policy ON public.lead_messages;
CREATE POLICY lead_messages_isolation_policy ON public.lead_messages USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: leads leads_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS leads_isolation_policy ON public.leads;
CREATE POLICY leads_isolation_policy ON public.leads USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: letras_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.letras_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: metricas_bandas_amigas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metricas_bandas_amigas ENABLE ROW LEVEL SECURITY;

--
-- Name: musicians_waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.musicians_waitlist ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payments payments_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS payments_isolation_policy ON public.payments;
CREATE POLICY payments_isolation_policy ON public.payments USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: pegatinas_pedidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pegatinas_pedidos ENABLE ROW LEVEL SECURITY;

--
-- Name: pitch_example_threads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pitch_example_threads ENABLE ROW LEVEL SECURITY;

--
-- Name: pitch_example_threads pitch_example_threads_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS pitch_example_threads_isolation_policy ON public.pitch_example_threads;
CREATE POLICY pitch_example_threads_isolation_policy ON public.pitch_example_threads USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: pitch_learning_examples; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pitch_learning_examples ENABLE ROW LEVEL SECURITY;

--
-- Name: pitch_learning_examples pitch_learning_examples_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS pitch_learning_examples_isolation_policy ON public.pitch_learning_examples;
CREATE POLICY pitch_learning_examples_isolation_policy ON public.pitch_learning_examples USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: pitch_vector_store; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pitch_vector_store ENABLE ROW LEVEL SECURITY;

--
-- Name: reel_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reel_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: reel_clips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reel_clips ENABLE ROW LEVEL SECURITY;

--
-- Name: reel_metricas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reel_metricas ENABLE ROW LEVEL SECURITY;

--
-- Name: registered_bands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registered_bands ENABLE ROW LEVEL SECURITY;

--
-- Name: registered_bands registered_bands_modify_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS registered_bands_modify_policy ON public.registered_bands;
CREATE POLICY registered_bands_modify_policy ON public.registered_bands USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR (user_id = (auth.uid())::text))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR (user_id = (auth.uid())::text)));

--
-- Name: registered_bands registered_bands_select_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS registered_bands_select_policy ON public.registered_bands;
CREATE POLICY registered_bands_select_policy ON public.registered_bands FOR SELECT USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)) OR (user_id = (auth.uid())::text)));

--
-- Name: rehearsals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;

--
-- Name: rehearsals rehearsals_delete_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS rehearsals_delete_policy ON public.rehearsals;
CREATE POLICY rehearsals_delete_policy ON public.rehearsals FOR DELETE USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: rehearsals rehearsals_insert_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS rehearsals_insert_policy ON public.rehearsals;
CREATE POLICY rehearsals_insert_policy ON public.rehearsals FOR INSERT WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: rehearsals rehearsals_select_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS rehearsals_select_policy ON public.rehearsals;
CREATE POLICY rehearsals_select_policy ON public.rehearsals FOR SELECT USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))));

--
-- Name: rehearsals rehearsals_update_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS rehearsals_update_policy ON public.rehearsals;
CREATE POLICY rehearsals_update_policy ON public.rehearsals FOR UPDATE USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: run_of_show; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.run_of_show ENABLE ROW LEVEL SECURITY;

--
-- Name: run_of_show run_of_show_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS run_of_show_isolation_policy ON public.run_of_show;
CREATE POLICY run_of_show_isolation_policy ON public.run_of_show USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: saved_filters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

--
-- Name: setlist_shortcuts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setlist_shortcuts ENABLE ROW LEVEL SECURITY;

--
-- Name: setlist_shortcuts setlist_shortcuts_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS setlist_shortcuts_isolation_policy ON public.setlist_shortcuts;
CREATE POLICY setlist_shortcuts_isolation_policy ON public.setlist_shortcuts USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: setlists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

--
-- Name: setlists setlists_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS setlists_isolation_policy ON public.setlists;
CREATE POLICY setlists_isolation_policy ON public.setlists USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: short_link_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: short_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

--
-- Name: social_content_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_content_items ENABLE ROW LEVEL SECURITY;

--
-- Name: social_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: social_metrics social_metrics_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS social_metrics_isolation_policy ON public.social_metrics;
CREATE POLICY social_metrics_isolation_policy ON public.social_metrics USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: social_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: social_posts social_posts_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS social_posts_isolation_policy ON public.social_posts;
CREATE POLICY social_posts_isolation_policy ON public.social_posts USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: song_stems_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_stems_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

--
-- Name: songs songs_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS songs_isolation_policy ON public.songs;
CREATE POLICY songs_isolation_policy ON public.songs USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: stem_prediction_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stem_prediction_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: stem_storage_retry_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stem_storage_retry_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: tours; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

--
-- Name: tours tours_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS tours_isolation_policy ON public.tours;
CREATE POLICY tours_isolation_policy ON public.tours USING ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids))))) WITH CHECK ((public.is_service_role() OR (band_id = public.get_active_band_id()) OR ((public.get_active_band_id() IS NULL) AND (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))));

--
-- Name: user_bands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_bands ENABLE ROW LEVEL SECURITY;

--
-- Name: user_bands user_bands_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS user_bands_isolation_policy ON public.user_bands;
CREATE POLICY user_bands_isolation_policy ON public.user_bands USING ((public.is_service_role() OR (user_id = (auth.uid())::text) OR (band_id = public.get_active_band_id()) OR (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))) WITH CHECK ((public.is_service_role() OR (user_id = (auth.uid())::text)));

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

DROP POLICY IF EXISTS users_isolation_policy ON public.users;
CREATE POLICY users_isolation_policy ON public.users USING ((public.is_service_role() OR (id = (auth.uid())::text) OR (band_id = public.get_active_band_id()) OR (band_id IN ( SELECT public.get_user_authorized_band_ids() AS get_user_authorized_band_ids)))) WITH CHECK ((public.is_service_role() OR (id = (auth.uid())::text)));

-- ====================================================================
-- Datos semilla (catálogo global de géneros y alias de salas)
-- ====================================================================
--
-- Data for Name: catalogo_generos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_generos VALUES ('rock', 'Rock', 'Rock', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('pop', 'Pop', 'Pop', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('electronica', 'Electrónica', 'Electronic', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('urbano', 'Urbano', 'Urban', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('reggae', 'Reggae', 'Reggae', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('ska', 'Ska', 'Ska', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('mestizaje', 'Mestizaje', 'Crossover', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('jazz', 'Jazz', 'Jazz', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('blues', 'Blues', 'Blues', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('soul', 'Soul', 'Soul', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('funk', 'Funk', 'Funk', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('flamenco', 'Flamenco', 'Flamenco', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('folk', 'Folk', 'Folk', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('latina', 'Latina', 'Latin', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('clasica', 'Clásica', 'Classical', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('cantautor', 'Cantautor', 'Singer-songwriter', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('country', 'Country', 'Country', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('gospel', 'Gospel', 'Gospel', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('comedia', 'Comedia y monólogos', 'Comedy', NULL, NULL, NULL, '2026-10-26 16:12:00.108+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('punk', 'Punk', 'Punk', 'rock', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('metal', 'Metal', 'Metal', 'rock', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('indie', 'Indie', 'Indie', 'rock', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('techno', 'Techno', 'Techno', 'electronica', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('house', 'House', 'House', 'electronica', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('hip-hop', 'Hip hop', 'Hip hop', 'urbano', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('trap', 'Trap', 'Trap', 'urbano', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('reggaeton', 'Reguetón', 'Reggaeton', 'urbano', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('rumba', 'Rumba', 'Rumba', 'flamenco', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('salsa', 'Salsa', 'Salsa', 'latina', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('bolero', 'Bolero', 'Bolero', 'latina', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('cumbia', 'Cumbia', 'Cumbia', 'latina', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('opera', 'Ópera', 'Opera', 'clasica', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('zarzuela', 'Zarzuela', 'Zarzuela', 'clasica', NULL, NULL, '2026-10-26 16:12:00.116+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('mundo', 'Músicas del mundo', 'World music', NULL, NULL, NULL, '2026-10-26 16:12:00.166+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('experimental', 'Experimental', 'Experimental', NULL, NULL, NULL, '2026-10-26 16:12:00.166+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('emergente', 'Emergente', 'Emerging artists', NULL, NULL, NULL, '2026-10-26 16:12:00.166+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos VALUES ('antigua', 'Música antigua', 'Early music', 'clasica', NULL, NULL, '2026-10-26 16:12:00.166+00') ON CONFLICT DO NOTHING;

--
-- Data for Name: catalogo_generos_alias; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_generos_alias VALUES ('rock', 'rock') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('hard rock', 'rock') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('rock and roll', 'rock') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('rock roll', 'rock') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('punk', 'punk') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('hardcore', 'punk') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('metal', 'metal') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('heavy metal', 'metal') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('indie', 'indie') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('alternativo', 'indie') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('alternativa', 'indie') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('pop', 'pop') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('electronica', 'electronica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('electronic', 'electronica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('dj', 'electronica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('dj sessions', 'electronica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('techno', 'techno') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('house', 'house') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('urban', 'urbano') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('urbano', 'urbano') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('urbana', 'urbano') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('hip hop', 'hip-hop') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('rap', 'hip-hop') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('trap', 'trap') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('reggaeton', 'reggaeton') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('regueton', 'reggaeton') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('reggae', 'reggae') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('ska', 'ska') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('mestizaje', 'mestizaje') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('fusion', 'mestizaje') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('jazz', 'jazz') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('blues', 'blues') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('soul', 'soul') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('funk', 'funk') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('flamenco', 'flamenco') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('rumba', 'rumba') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('folk', 'folk') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('latina', 'latina') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('latino', 'latina') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('salsa', 'salsa') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('bolero', 'bolero') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('cumbia', 'cumbia') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('clasica', 'clasica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('classical', 'clasica') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('opera', 'opera') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('zarzuela', 'zarzuela') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('cantautor', 'cantautor') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('singer songwriter', 'cantautor') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('country', 'country') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('gospel', 'gospel') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('comedia', 'comedia') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('humor', 'comedia') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('monologos', 'comedia') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('stand up', 'comedia') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('world music', 'mundo') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('musica del mundo', 'mundo') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('mundo', 'mundo') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('world', 'mundo') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('musicas del mundo', 'mundo') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('experimental', 'experimental') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('vanguardia', 'experimental') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('emergente', 'emergente') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('emergentes', 'emergente') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('nuevos talentos', 'emergente') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('antigua', 'antigua') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('musica antigua', 'antigua') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('early music', 'antigua') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_generos_alias VALUES ('barroca', 'antigua') ON CONFLICT DO NOTHING;

--
-- Data for Name: catalogo_sala_alias; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_sala_alias VALUES ('nc:sala clamores|madrid', 'nc:clamores|madrid', 'Sala Clamores', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:honky tonk|madrid', 'place:ChIJ8RYzeIwoQg0RXzcYXQjegjo', 'Honky Tonk', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:nazca|madrid', 'nc:nazca club|madrid', 'Nazca Club', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:sala nazca|madrid', 'nc:nazca club|madrid', 'Nazca Club', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:revilive revirock|madrid', 'place:ChIJE87ggRAlQg0R-EwRtutmjpc', 'ReviLive', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:wizink center la sala pista|madrid', 'nc:wizink center|madrid', 'WiZink Center', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;
INSERT INTO public.catalogo_sala_alias VALUES ('nc:rockville|madrid', 'place:ChIJ_2TSWlspQg0RX07pxk2QW_w', 'Rockville', '2026-10-26 16:12:00.157+00') ON CONFLICT DO NOTHING;

