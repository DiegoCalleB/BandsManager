export type LeadStatus = 
  | 'nuevo' 
  | 'contactado'
  | 'esperando_respuesta' 
  | 'enviado'
  | 'respondido'
  | 'negociando'
  | 'confirmado'
  | 'aplazado'
  | 'no_interesado' 
  | 'descartado'
  | 'interesado' 
  | 'pendiente_aprobacion' 
  | 'aprobado' 
  | 'aprobado_propuesta'
  | 'aprobado_respuesta'
  | 'borrador_creado';

// Mismas 7 categorías que server/promptsManager.ts (mapLeadTipoToTemplateCategory) y
// src/components/booking/TemplateConfigSection.tsx usan para las plantillas generales por
// tipo de lead — se reutilizan aquí para poder definir un mensaje de campaña por caso de uso.
export type PitchTemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos';

export interface BookingCampaign {
  id: string;
  band_id?: string;
  name: string;
  targetCities: string[];
  minCapacity: number;
  maxCapacity: number;
  targetDates: string[]; // e.g., ['2026-12-04', '2026-12-05', '2027-04-11', '2027-04-12']
  targetDatesText?: string; // e.g., "4 o 5 de diciembre, o 11 y 12 de abril"
  campaignStartDate?: string; // YYYY-MM-DD: start date for filtering festival leads
  campaignEndDate?: string; // YYYY-MM-DD: end date for filtering festival leads
  notes?: string;
  // Mensaje clave por caso de uso (salas/festivales/discotecas/...) que el Redactor prioriza
  // sobre la plantilla general de esa categoría mientras la campaña esté activa. Las categorías
  // sin entrada aquí siguen usando solo la plantilla general de su tipo.
  customPitchTemplates?: Partial<Record<PitchTemplateCategory, string>>;
  isActive: boolean;
  color?: string; // Hex color for badge styling (e.g. '#8b5cf6', '#f59e0b', '#06b6d4')
  created_at?: string;
}

export type LeadType = 'sala' | 'festival' | 'ayuntamiento' | 'grupo' | 'productora' | 'medio' | 'discoteca' | 'agencia' | 'manager' | 'sello' | 'productor' | 'patrocinador' | 'supervisor_sync';

export type BandRelationshipStatus = 
  | 'sin_contactar' 
  | 'intercambio_propuesto' 
  | 'concierto_agendado' 
  | 'colegas_aliados' 
  | 'pendiente_respuesta' 
  | 'no_disponible';

export interface BandContact {
  id: string;
  band_id?: string;
  nombre_banda: string;
  estilo_musical: string;
  localizacion: string;
  estado_relacion: BandRelationshipStatus;
  ultimo_contacto: string; // YYYY-MM-DD or relative string
  contacto_nombre?: string;
  email?: string;
  telefono?: string;
  instagram?: string;
  spotify_youtube?: string;
  aforo_promedio?: number;
  notas_colaboracion?: string;
  ciudad_origen_swap?: string;
  icono?: string;
  imagen_url?: string;
  es_favorito?: boolean;
  es_verificado?: boolean;
  fiabilidad_score?: number;
  estilo_comunicacion?: string;
  dna_expresion?: any;
}

export interface InteractionLog {
  id: string;
  fecha: string;
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Otro';
  autor?: string;
  notas: string;
  resultado?: 'Interesado' | 'Enviar propuesta' | 'Seguimiento pendiente' | 'Rechazado' | 'Info recibida' | 'Acuerdo cerrado';
}

export interface SavedFilter {
  id: string;
  nombre: string;
  sectionTab?: 'salas' | 'medios' | 'grupos';
  searchTerm?: string;
  selectedCityFilter?: string;
  statusFilter?: LeadStatus | 'todos' | 'seguimientos';
  typeFilter?: LeadType | 'todos' | 'radio' | 'tv' | 'prensa' | 'redes' | 'podcast';
  minCapacityFilter?: number;
}

export interface EmailMessage {
  id: string;
  fecha: string;
  remitente: 'sala' | 'banda';
  remitente_nombre: string;
  asunto: string;
  mensaje: string;
  sentimiento?: 'muy_positivo' | 'positivo' | 'neutral' | 'negativo_suave' | 'negativo_firme';
  sentimiento_score?: number; // -1.0 a +1.0
  sentimiento_label?: string;
  intencion?: 'confirmacion' | 'negociacion_precio' | 'pregunta_logistica' | 'peticion_fechas' | 'rechazo_temporal' | 'rechazo_definitivo' | 'informativo' | 'otro';
  intencion_etiqueta?: string;
  temperatura?: 'muy_caliente' | 'caliente' | 'tibio' | 'frio' | 'congelado';
  objeciones?: string[];
  puntos_clave?: string[];
  fechas_propuestas?: string[];
  condiciones_economicas?: {
    tipo?: string;
    cifra?: string;
    detalles?: string;
  };
  requisitos_tecnicos?: string[];
  accion_sugerida?: string;
  estrategia_playbook?: {
    titulo: string;
    pasos: string[];
    propuesta_rapida: string;
  };
  resumen_ejecutivo?: string;
  sugerencia_estrategia?: string;
  analisis_ia?: any;
}

export interface PitchFeedbackLog {
  id: string;
  fecha: string;
  pitch_previo: string;
  tono_rating?: number;
  contenido_rating?: number;
  comentario?: string;
  pitch_nuevo: string;
  deshecho?: boolean;
  alcance?: 'este_pitch' | 'global';
}

export interface Lead {
  id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion?: string;
  aforo: number;
  genero: string;
  roster?: string;
  tipo?: LeadType | string;
  email_contacto: string;
  email_secundario?: string;
  telefono: string;
  telefono_movil?: string;
  telefono_fijo?: string;
  website?: string;
  instagram: string;
  contacto_nombre?: string;
  fuente: string;
  estado: LeadStatus;
  pitch_generado: string;
  fecha_envio?: string;
  fecha_ultima_respuesta?: string;
  thread_id?: string;
  ultimo_mensaje_recibido?: string;
  contexto_extra?: string;
  notas: string;
  hilo_emails?: EmailMessage[];
  historial_contacto?: InteractionLog[];
  icono?: string;
  imagen_url?: string;
  band_id?: string;
  campaign_id?: string;
  campaña_asociada?: string;
  es_favorito?: boolean;
  es_verificado?: boolean;
  fiabilidad_score?: number;
  pitch_feedback_tono?: number;
  pitch_feedback_contenido?: number;
  pitch_feedback_comentario?: string;
  historial_feedback_pitch?: PitchFeedbackLog[];
  festival_start_date?: string;
  festival_end_date?: string;
  email_abierto?: boolean;
  veces_abierto?: number;
  primer_abierto_at?: string;
  ultimo_abierto_at?: string;
  clics_epk?: number;
  ultimo_clic_at?: string;
  fechas_ocupadas?: string[];
  fechas_libres_detectadas?: string[];
  disponible_para_campana?: boolean;
  fechas_ocupadas_campana?: string[];
  fechas_libres_campana?: string[];
  datos_fechas_encontrados?: boolean;
  mensaje_disponibilidad?: string;
  radar_fuentes_verificadas?: string[];
  radar_wegow_status?: 'ok' | 'sin_datos' | 'error';
  radar_bandsintown_status?: 'ok' | 'sin_datos' | 'error';
  contrastado_multi_fuente?: boolean;
  fiabilidad_radar?: 'alta' | 'media' | 'baja' | 'sin_datos';
  estado_cartelera?: 'publicada_libre' | 'ocupada' | 'no_publicada_aun' | 'fuera_temporada' | 'residencia_clubbing' | 'sin_datos';
  max_fecha_publicada?: string;
  min_fecha_publicada?: string;
  ultimo_sentimiento?: 'muy_positivo' | 'positivo' | 'neutral' | 'negativo_suave' | 'negativo_firme';
  ultimo_sentimiento_score?: number;
  ultimo_sentimiento_label?: string;
  ultima_intencion?: string;
  ultima_intencion_etiqueta?: string;
  ultimas_objeciones?: string[];
  ultimo_analisis_resumen?: string;
  temperatura_lead?: 'muy_caliente' | 'caliente' | 'tibio' | 'frio' | 'congelado';
  fechas_propuestas_sala?: string[];
  condiciones_economicas_detectadas?: {
    tipo?: string;
    cifra?: string;
    detalles?: string;
  };
  requisitos_tecnicos_detectados?: string[];
  accion_sugerida_ia?: string;
  estrategia_playbook?: {
    titulo: string;
    pasos: string[];
    propuesta_rapida: string;
  };
  spotify_city_demand?: {
    oyentes_ciudad: number;
    afinidad_genero: number; // 0 - 100%
    prediccion_entradas: number;
    porcentaje_ocupacion_estimado: number;
    top_ciudades_ranking?: number;
  };
  google_places_info?: {
    rating: number;
    total_reviews: number;
    fotos: string[];
    horario_carga?: string;
    resumen_acustica?: string;
    acceso_backline?: string;
    place_id?: string;
  };
  setlist_history?: {
    bandas_similares_recientes: string[];
    fecha_ultimo_concierto?: string;
    generos_habituales: string[];
    promotores_frecuentes?: string[];
    referencia_pitch_sugerida?: string;
  };
  email_verification?: {
    estado: 'valido' | 'inseguro' | 'no_verificado' | 'invalido';
    mx_valido: boolean;
    entregabilidad_score: number; // 0 - 100
    es_cuenta_rol: boolean; // ej: info@, booking@
    motivo?: string;
    verificado_at?: string;
  };
  tour_logistics?: {
    origen: string;
    distancia_km: number;
    tiempo_conduccion: string;
    coste_gasolina_estimado: number;
    peajes_estimados: number;
    coste_total_viaje: number;
    recomendacion_logistica?: string;
  };
  social_engagement?: {
    instagram_followers: number;
    engagement_rate: number;
    promedio_views_reels: number;
    promociona_bandas_activo: boolean;
    calidad_promo_sala: 'alta' | 'media' | 'baja';
    resumen_social: string;
  };
  financial_break_even?: {
    precio_entrada_anticipada: number;
    precio_entrada_taquilla: number;
    alquiler_sala_fijo: number;
    porcentaje_sala: number;
    gastos_produccion_fijos: number;
    entradas_break_even: number;
    beneficio_estimado_lleno: number;
    beneficio_por_musico_estimado: number;
    num_musicos: number;
  };
  booking_window_info?: {
    antelacion_meses_recomendada: number;
    meses_cierre_temporada?: string[];
    dias_semana_ideales: string[];
    estado_calendario_estimado: 'abierto' | 'llenandose' | 'casi_cerrado' | 'fuera_de_temporada';
    consejo_antelacion: string;
    ventana_optima_pitch: string;
  };
  local_events_clash_info?: {
    eventos_detectados: Array<{
      nombre: string;
      tipo: 'festival' | 'fiesta_patronal' | 'macroconcierto' | 'festivo';
      fecha_aproximada: string;
      nivel_riesgo_solapamiento: 'alto' | 'medio' | 'bajo';
      descripcion: string;
    }>;
    alerta_resumen: string;
    fechas_favorables_sugeridas: string[];
  };
  local_press_media_info?: {
    medios: Array<{
      nombre: string;
      tipo: 'radio' | 'prensa_escrita' | 'blog_cultural' | 'agenda_local';
      alcance: 'provincial' | 'autonomico' | 'local';
      contacto_sugerido?: string;
      canal: string;
    }>;
    resumen_cobertura: string;
    plantilla_nota_prensa_hook: string;
  };
  local_band_partners_info?: {
    bandas_compatibles: Array<{
      nombre: string;
      genero: string;
      oyentes_estimados?: number;
      instagram?: string;
      motivo_afinidad: string;
    }>;
    estrategia_co_booking: string;
    gancho_propuesta_sala: string;
  };
}

export interface RehearsalAgendaItem {
  id: string;
  tipo: 'cancion' | 'calentamiento' | 'pausa' | 'intro' | 'outro' | 'seccion_especifica' | 'improvisacion';
  titulo: string;
  songId?: string;
  duracionEstimadaMin: number;
  duracionRealSeg?: number;
  enfoque?: string; // Ej: "Afinar el solo de guitarra y la entrada del bajo", "Cuidar la segunda voz del estribillo"
  prioridad?: 'alta' | 'media' | 'baja';
  evaluacion?: 'bordada' | 'regular' | 'repetir'; // 🟢 Bordada, 🟡 Regular, 🔴 Repetir
  completado?: boolean;
  notas?: string;
}

export interface RehearsalObjective {
  id: string;
  texto: string;
  completado: boolean;
  responsable?: string;
}

export interface RehearsalRecording {
  id: string;
  titulo: string;
  audioUrl: string;
  duracionSeg: number;
  duracionSegundos?: number;
  grabadoEn: string;
  songId?: string;
  tipo: 'toma_completa' | 'idea_riff' | 'nota_voz_debate' | 'fragmento';
  notas?: string;
}

export interface RehearsalActa {
  resumenIa?: string;
  resumenEjecutivo?: string;
  audioNotaVozUrl?: string;
  puntosClave?: string[];
  cancionesDestacadas?: string[];
  cancionesBordadas?: string[];
  cancionesAPulir?: string[];
  cancionesParaRepetir?: string[];
  deberesPorMiembro?: Array<{ miembro: string; tarea: string }>;
  deberesCasa?: Array<{
    id: string;
    miembro?: string;
    tarea: string;
    hecho: boolean;
  }>;
  generadoEn?: string;
}

export interface Rehearsal {
  id: string;
  band_id?: string;
  bandName?: string;
  fecha: string;
  hora: string;
  horaFin?: string;
  lugar: string;
  asistentes: string[];
  notas: string;
  estado: 'programado' | 'cancelado' | 'completado' | 'en_curso';
  tipo_evento?: 'ensayo' | 'reunion' | 'otro';
  asunto?: string;
  enlace_reunion?: string;
  setlistId?: string;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
  // Módulo de Ensayos Pro
  agenda?: RehearsalAgendaItem[];
  objetivos?: RehearsalObjective[];
  duracionEstimadaMin?: number;
  duracionRealSeg?: number;
  cronometroEstado?: {
    segundosTranscurridos: number;
    enPausa: boolean;
    ultimoInicio?: string;
  };
  acta?: RehearsalActa;
  grabaciones?: RehearsalRecording[];
  ratingGeneral?: number;
  temperaturaLocal?: string;
}

export interface ConcertExpenseBreakdown {
  gasolina?: number;
  dietas?: number;
  alquilerVehiculo?: number;
  alojamiento?: number;
  otros?: number;
  notasGastos?: string;
}

export interface KeyContactItem {
  id: string;
  nombre: string;
  rol: string;
  telefono: string;
  email?: string;
  notas?: string;
}

export interface TechnicalLogistics {
  horaLlegada?: string;
  horaPruebaSonido?: string;
  horaAperturaPuertas?: string;
  horaShow?: string;
  horaCierreToque?: string;
  paEspecificaciones?: string;
  monitoresTipo?: string;
  canalesMonitores?: string;
  backlineInfo?: string;
  potenciaElectrica?: string;
  inputList?: string;
  notasTecnicas?: string;
}

export interface CierreMaterialItem {
  id: string;
  categoria: 'escenario' | 'camerino' | 'furgoneta' | 'general';
  item: string;
  checked: boolean;
  responsable?: string;
}

export interface MerchBoloItem {
  id: string;
  nombre: string;
  categoria?: 'camisetas' | 'vinilos' | 'musica' | 'accesorios' | 'otro';
  talla?: string;
  precioUnitario: number;
  stockInicial: number; // Que sube a la furgoneta
  stockFinal: number;   // Stock al terminar la noche
}

export interface MerchControlBolo {
  items: MerchBoloItem[];
  fondoCajaInicial?: number;
  ingresosEfectivo: number;
  ingresosBizum: number;
  notas?: string;
}

export interface Concert {
  id: string;
  band_id?: string;
  bandName?: string;
  fecha: string;
  ciudad: string;
  sala: string;
  direccion?: string;
  cache: number;
  aforo_vendido: number;
  aforo_total: number;
  contrato_firmado: boolean;
  estado_pago: 'pendiente' | 'pagado' | 'anticipo';
  notas: string;
  // 'sala'/'ayuntamiento' los usan el scout/chatbot (mismas categorías que Lead.tipo);
  // 'propio'/'privado'/'posible' los usa el alta manual desde el calendario.
  tipo: 'sala' | 'festival' | 'ayuntamiento' | 'propio' | 'privado' | 'posible';
  is_posible?: boolean;
  setlistId?: string;
  gastosDetalle?: ConcertExpenseBreakdown;
  gastosEstimadosTipicos?: number;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
  giraId?: string;
  giraNombre?: string;
  idioma?: string;
  customQrUrl?: string;
  customQrSlug?: string;
  entradasUrl?: string;
  entradasLugarFisico?: string;
  precioEntradaEstimado?: number;
  logisticaTecnica?: TechnicalLogistics;
  contactosClave?: KeyContactItem[];
  cierreMaterial?: CierreMaterialItem[];
  merchControl?: MerchControlBolo;
  // Métricas de convocatoria real e historial para la IA de booking
  asistencia_propia?: number;
  asistencia_otras_bandas?: number;
  bandas_compartidas?: string[];
  post_show_review?: string;
  es_hito_destacado?: boolean;
  cartelUrl?: string;
  cartel_url?: string;
}

export interface EmailSignatureConfig {
  nombreRemitente?: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  textoPie?: string;
  incluirLogo?: boolean;
  incluirIconosRedes?: boolean;
  adjuntarDossierPorDefecto?: boolean;
  redesSociales?: {
    spotify?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    appleMusic?: string;
    bandcamp?: string;
    soundcloud?: string;
    bandsintown?: string;
    songkick?: string;
    wegow?: string;
    tidal?: string;
    deezer?: string;
    amazonMusic?: string;
    twitch?: string;
    threads?: string;
    website?: string;
    whatsapp?: string;
    revolut?: string;
    paypal?: string;
    [key: string]: string | undefined;
  };
}

// Miembro de la banda con su foto, para la sección de formación del EPK. Quien programa
// quiere ver caras y saber cuánta gente sube al escenario (afecta a caché y logística).
export interface BandMember {
  id: string;
  nombre: string;
  rol: string;
  fotoUrl?: string;
  bio?: string;
  instagram?: string;
}

// Vídeo de directo. Es el material que más pesa en la decisión de contratar, así que el EPK
// permite elegir varios y marcar cuál se enseña primero.
export interface EPKVideo {
  id: string;
  titulo: string;
  url: string;
  destacado?: boolean;
}

// Datos duros de contratación: lo que un programador pregunta siempre antes de responder.
export interface DatosContratacion {
  numMusicos?: number;
  duracionDirecto?: string;
  ciudadBase?: string;
  formatos?: string;
  necesidadesEscenario?: string;
  // Operativa real para el agente y salas:
  tieneMerchandising?: boolean;
  detallesMerchandising?: string; // ej: 'Camisetas y vinilos con datáfono propio'
  tieneTecnicoSonidoPropio?: boolean; // true = viajan con técnico propio, false = usan técnico de la sala
  transportePropio?: boolean; // furgoneta propia / transporte público
  hospedajeRequerido?: boolean; // si necesitan alojamiento para bolos fuera de su comunidad
  facturacion?: 'autonomo' | 'sociedad' | 'cooperativa' | 'asociacion' | 'facturacion_por_terceros';
}

export interface RiderConfig {
  tipoMonitoreo?: "in_ear" | "cuñas_escenario" | "mixto" | "sin_preferencia";
  microfoniaPropia?: boolean; // Traen sus propios micrófonos/DIs o dependen de la sala
  canalesMinimos?: number; // Ej: 12, 16, 24 canales
  backlinePropio?: "completo" | "parcial" | "sin_backline"; // Ej: traen ampli de bajo/guitarra/batería o piden todo a la sala
  tiempoPruebaMinutos?: number; // Ej: 30, 45, 60 min
  observacionesRider?: string;
}

export interface EPKConfig {
  bandId?: string;
  biografia: string;
  fraseImpacto?: string;
  genero?: string;
  /** Bandas o artistas afines / Sonido similar ("Para fans de..." / FFO - For Fans Of) */
  bandasSimilares?: string[];
  /** Si está activo, muestra la etiqueta de "Para fans de (FFO)" en el dossier público */
  mostrarBandasSimilares?: boolean;
  idioma?: string;
  fontStyle?: string;
  tipografia?: string;
  miembros?: BandMember[];
  videos?: EPKVideo[];
  datosContratacion?: DatosContratacion;
  riderConfig?: RiderConfig;
  logoUrl: string;
  dossierPdfUrl?: string;
  dossierPdfName?: string;
  dossierDocumentUrl?: string;
  dossierDocumentName?: string;
  dossierTextoExtra?: string;
  bandPhotos: string[];
  riderTecnico: string;
  riderPdfUrl?: string;
  riderPdfName?: string;
  enlacesRedes: {
    spotify?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    appleMusic?: string;
    bandcamp?: string;
    soundcloud?: string;
    bandsintown?: string;
    songkick?: string;
    wegow?: string;
    tidal?: string;
    deezer?: string;
    amazonMusic?: string;
    twitch?: string;
    threads?: string;
    website?: string;
    whatsapp?: string;
    revolut?: string;
    paypal?: string;
    bizum?: string;
    iban?: string;
    [key: string]: string | undefined;
  };
  contactoBooking: {
    nombre: string;
    email: string;
    telefono: string;
  };
  temasDestacadosIds: string[];
  audioPreview?: {
    habilitado?: boolean;
    cancionId?: string;
    audioUrl?: string;
    tituloTema?: string;
    subtitulo?: string;
  };
  donacionRevolut?: {
    habilitado?: boolean;
    revolutTag?: string;
    revolutUrl?: string;
    paypalUser?: string;
    paypalUrl?: string;
    bizumTelefono?: string;
    ibanCuenta?: string;
    metodoPorDefecto?: 'revolut' | 'paypal' | 'bizum' | 'iban';
    titulo?: string;
    descripcion?: string;
  };
  incentivoFans?: {
    mensajeAgradecimiento?: string;
    enlaceDescarga?: string;
    codigoDescuento?: string;
    fraseGancho?: string;
    premioTexto?: string;
    recompensaTipo?: string;
  };
  ciudadesConfig?: string[];
  firmaEmail?: EmailSignatureConfig;
  traducciones?: EPKTranslations;
  // Cifras clave / social proof (oyentes, directos, comunidad, ciudades) del EPK público.
  // Deshabilitado por defecto: son cifras que la banda tiene que rellenar con datos reales
  // propios, nunca un número inventado por defecto.
  cifrasClave?: {
    habilitado?: boolean;
    oyentes?: string;
    directos?: string;
    comunidad?: string;
    ciudades?: string;
  };
  // Citas de prensa / reseñas destacadas del EPK público. Deshabilitado por defecto y sin citas
  // de ejemplo: antes venían 3 citas fijas atribuidas a medios reales (MondoSonoro, Radio 3,
  // RockZone) que ninguna banda había dicho ni aprobado.
  resenasPrensa?: {
    habilitado?: boolean;
    citas?: PressQuote[];
  };
  // Plantilla visual y estética del EPK público ('stage', 'minimal', 'neon', 'vintage')
  plantilla?: EPKTemplateId;
  // Orden personalizado de las secciones en el dossier web
  ordenSecciones?: EPKSectionId[];
  // Secciones ocultas voluntariamente por la banda en el dossier público
  seccionesOcultas?: EPKSectionId[];
}

export type EPKTemplateId = 'stage' | 'minimal' | 'neon' | 'vintage';

export type EPKSectionId =
  | 'cifras'
  | 'datos'
  | 'videos'
  | 'miembros'
  | 'bio'
  | 'prensa'
  | 'musica'
  | 'galeria'
  | 'escucha'
  | 'conciertos';

export interface PressQuote {
  id: string;
  texto: string;
  medio: string;
}

// Versiones en otros idiomas del contenido que escribe la banda, para el EPK público
// (/epk?band=...&lang=en). Solo prosa: nombres de personas, emails, teléfonos, URLs, números
// y títulos de canciones NO se traducen nunca.
//
// Los miembros y los vídeos van indexados por su id, NUNCA por posición: reordenar o borrar
// un miembro no puede descolocar las traducciones del resto.
export interface EPKContenidoTraducido {
  biografia?: string;
  textoPie?: string;
  riderTecnico?: string;
  miembros?: Record<string, { rol?: string; bio?: string }>;
  videos?: Record<string, { titulo?: string }>;
  datosContratacion?: {
    duracionDirecto?: string;
    formatos?: string;
    necesidadesEscenario?: string;
  };
  /** Huella del texto original con el que se generó esta traducción, para detectar que se ha quedado vieja. */
  _fuenteHash?: string;
  _traducidoEn?: string;
  /** true en cuanto la banda edita la traducción a mano desde el gestor del EPK. */
  _revisadoAMano?: boolean;
}

/** Clave = código de idioma ('en', y los que se añadan). El español es siempre el original. */
export type EPKTranslations = Record<string, EPKContenidoTraducido>;

export interface Fan {
  id: string;
  band_id?: string;
  nombre: string;
  email: string;
  ciudad?: string;
  comoConocio?: string;
  conciertoOrigenId?: string;
  conciertoOrigenNombre?: string;
  fechaCaptura: string;
  consentimientoRGPD: boolean;
  mensaje?: string;
  cancionFavorita?: string;
  instagram?: string;
  avatarUrl?: string;
  nivelFan?: 'fundador' | 'superfan' | 'backstage' | 'fiel';
  reacciones?: {
    likes?: number;
    fire?: number;
    applause?: number;
    guitars?: number;
  };
}

export interface SocialPost {
  id: string;
  band_id?: string;
  fecha: string;
  plataforma: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';
  contenido: string;
  estado: 'borrador' | 'aprobado' | 'publicado';
  responsable: string;
}

export interface Payment {
  id: string;
  band_id?: string;
  tipo: 'ingreso' | 'gasto';
  categoria: 'concierto' | 'merchandising' | 'subvencion' | 'transporte' | 'alojamiento' | 'comida' | 'promo' | 'otros';
  concepto: string;
  importe: number;
  fecha: string;
  estado: 'pendiente' | 'pagado';
}

export interface Message {
  id: string;
  remitente: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

export interface SocialMetric {
  id: string;
  band_id?: string;
  fecha: string;
  instagram: number;
  tiktok: number;
  youtube: number;
  spotify?: number;
  notas: string;
  
  // Métricas avanzadas de Spotify
  spotify_monthly_listeners?: number;
  spotify_followers?: number;
  spotify_popularity?: number; // 0 a 100
  
  // Métricas avanzadas de YouTube
  youtube_subscribers?: number;
  youtube_total_views?: number;
  youtube_video_count?: number;
  
  // Métricas avanzadas de Instagram
  instagram_followers?: number;
  instagram_following?: number;
  instagram_posts_count?: number;
  instagram_engagement_rate?: number;
  
  // Métricas avanzadas de TikTok
  tiktok_followers?: number;
  tiktok_total_likes?: number;
  tiktok_video_count?: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface SocialContentItem {
  id: string;
  band_id: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'spotify';
  external_id: string;
  title: string;
  url?: string;
  thumbnail_url?: string;
  published_at?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  last_scraped_at?: string;
}

// 'admin' es un rol real en producción (ver server/auth.ts, server/routes/users.ts): antes no
// estaba declarado aquí, así que TypeScript marcaba como "imposible" cualquier comprobación
// `role === 'admin'` del frontend — código que en realidad protege permisos reales y que alguien
// podría borrar por parecer inalcanzable.
export type UserRole = 'leader' | 'member' | 'admin';

export interface GoogleOAuthConfig {
  connected: boolean;
  email?: string;
  displayName?: string;
  photoURL?: string;
  accessToken?: string;
  scopes?: string[];
  connectedAt?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  plan?: 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | string;
  bandName?: string;
  band_id?: string;
  main_band_id?: string;
  band_order?: string[];
  email?: string;
  secondary_email?: string;
  instrument?: string;
  avatarColor?: string;
  createdAt: string;
  googleOAuth?: GoogleOAuthConfig;
  ui_preferences?: {
    calendar_default_months?: {
      mobile?: '1' | '2';
      desktop?: '1' | '2';
    };
    [key: string]: any;
  };
  // Campos reales de facturación (ver server/routes/billing.ts, que los escribe directamente
  // sobre el usuario persistido). Sin declararlos aquí, Planes.tsx y UserProfileModal.tsx los
  // leían con `as any`, sin que el tipo protegiera nada.
  estado_suscripcion?: string;
  plan_pendiente?: string;
  fecha_cambio_plan?: string;
}

export interface UserWithHash extends User {
  passwordHash: string;
  salt: string;
}

export type ThemeName = 'analog_light' | 'analog_dark' | 'legato_light' | 'legato_dark' | 'spectrum_light' | 'spectrum_dark' | 'backstage_dark' | 'indie_velvet' | 'stitch_dark' | 'backstage_neon' | 'roots_ska' | 'brutalist_fuzz';

// Patrones de batería soportados por el sintetizador de acompañamiento (src/utils/accompanimentSynth.ts),
// compartido entre el generador del Song Studio y las bases rítmicas propuestas por el chatbot.
export type DrumPatternStyle = 'rock' | 'pop' | 'funk' | 'reggae' | 'ska' | 'cumbia' | 'punk';

// Instrumentos melódicos que el "genio de la lámpara" del chatbot puede sintetizar
// (src/utils/instrumentSynth.ts, motor Tone.js) para proponer ideas de partes de canción
// coherentes con el ADN musical de la banda, más allá de la base de batería/bajo.
export type MelodicInstrument = 'guitarra' | 'violin' | 'handpan' | 'percusion';

// Una nota o golpe dentro de una idea melódica generada por IA. 'tiempo' y 'duracionBeats'
// se expresan en beats (no segundos) para que sean independientes del BPM al reproducirlos.
export interface MelodicNoteEvent {
  tiempo: number; // posición de inicio en beats desde el arranque de la idea (0 = primer tiempo)
  nota: string; // notación científica compatible con Tone.js, ej. 'A3', 'C#4', 'G2'
  duracionBeats: number; // duración de la nota/golpe en beats
  velocidad?: number; // intensidad de 0 a 1 (por defecto ~0.8)
}

export interface AudioComment {
  id: string;
  autor: string;
  instrumento?: string;
  timestampSegundos?: number; // e.g. 15 for 0:15 in audio
  texto: string;
  fecha: string;
}

export interface AudioTrack {
  id: string;
  nombre: string;
  audioUrl: string;
  autor?: string;
  instrumento?: string;
  formato?: string; // e.g. "MP3 (256 kbps)", "WAV", "MP3"
  tamano?: string;  // e.g. "2.4 MB", "1.2 MB", "850 KB"
  fecha?: string;
  volumen?: number; // 0 to 1
  muted?: boolean;
  solo?: boolean;
  desfaseMs?: number; // Latency offset in milliseconds (-300 to +300) for multitrack alignment
  pan?: number; // Stereo panning (-1.0 Left to +1.0 Right, 0 Center)
  eqLow?: number; // 3-Band EQ Low Shelf Gain in dB (-12 to +12)
  eqMid?: number; // 3-Band EQ Mid Peaking Gain in dB (-12 to +12)
  eqHigh?: number; // 3-Band EQ High Shelf Gain in dB (-12 to +12)
  colorHue?: number; // Tono (0-360) fijo asignado a la pista al crearla, para que su color de
                      // identidad en el mezclador no cambie si el usuario reordena las pistas
}

export interface SongAudioIdea {
  id: string;
  titulo: string;
  seccion: 'general' | 'intro' | 'verso' | 'estribillo' | 'puente' | 'solo' | 'outro';
  audioUrl: string; // Primary or legacy single audio track
  pistas?: AudioTrack[]; // Multitrack basic recording support
  subidoPor: string;
  instrumento?: string;
  fecha: string;
  notas?: string;
  votos?: string[]; // Array of usernames who approved/liked this idea
  comentarios?: AudioComment[];
  stemEngineUsed?: string;
  stemIsNeural?: boolean;
  stemDegraded?: boolean;
  stemProcessedAt?: string;
}

export interface SongSubstituteGuide {
  estructura?: string;
  progresionClave?: string;
  cortesYClaves?: string;
  capoTraste?: string;
  instrumentosClave?: string;
}

export interface MemberSongNote {
  userId?: string;
  memberName: string;
  instrument?: string;
  nota: string;
  updatedAt?: string;
  /** Nivel de preparación de ESTE miembro con la canción, de cara a tocarla en directo — no es un
   *  estado global de la canción (ya existe Song.estadoTema para eso), sino "¿yo, en concreto, ya
   *  me la sé?", para que quien lleve la banda vea de un vistazo quién necesita repasar antes del bolo. */
  estadoPreparacion?: 'aprendiendo' | 'casi_lista' | 'lista';
}

export interface Song {
  id: string;
  band_id?: string;
  titulo: string;
  duracion: string; // e.g. "3:45"
  duracionSegundos: number; // e.g. 225
  duracionMinutos?: number;
  tonalidad: string; // e.g. "Am", "G", "C#m"
  bpm: number; // e.g. 128
  // ISO timestamp de la última vez que Iris detectó bpm/tonalidad automáticamente desde el
  // audio (análisis de la mezcla completa, o redetección con una pista ya separada — más
  // fiable). undefined si el valor actual es el que puso el usuario a mano.
  bpmDetectadoEn?: string;
  tonalidadDetectadaEn?: string;
  afinacion?: string; // e.g. "E Standard", "Drop D"
  albumDisco?: string; // e.g. "Álbum Debut (2025)", "EP Cacharros", "Single", "Inédita / En Proceso"
  ordenAlbum?: number; // Position/track number within the album
  album?: string;
  genero?: string;
  tipo?: string;
  estado?: string;
  energia?: number;
  energiaManual?: boolean; // true si el usuario fijó la energía a mano (1-20) — el recalibrado automático desde audio ya no la toca
  energiaVariacion?: number; // 0-10, cuánto varía la energía dentro del tema (subidas/bajadas internas), detectado automáticamente del audio
  energiaVariacionCalculadaEn?: string; // ISO timestamp del último análisis automático de dinámica interna
  cantantePrincipal?: string; // Lead vocalist for this song (shown in the setlist and searchable)
  artista?: string; // Performing artist/band name (written on bulk album upload, shown in the player)
  portadaUrl?: string;
  favoritoGeneral?: boolean;
  estadoTema?: 'listo' | 'ensayando' | 'componiendo' | 'descartado';
  esVersionCovers?: boolean;
  enlaceAcordes?: string; // Link to drive/chords/partitura
  notasInternas?: string;
  notasRepertorio?: string; // General notes for repertoire/print
  notasMiembros?: Record<string, string>; // member ID or member Name -> note text
  notasPorMiembro?: MemberSongNote[];
  audioPrincipalUrl?: string; // Demo / Master audio file
  audioUrl?: string; // Alias for audioPrincipalUrl for legacy/sample playback
  audioIdeas?: SongAudioIdea[]; // Ideas by sections (Intro, Chorus, Solo, etc.)
  cifradoTexto?: string; // Lyrics and chords in LaCuerda / Ultimate Guitar format
  guiaSustituto?: SongSubstituteGuide; // Quick summary cheat-sheet for new band members & substitutes
  estructuraDocumentoUrl?: string; // PDF/image URL of uploaded song structure (stored in Supabase)
  estructuraDocumentoNombre?: string; // Original filename (e.g., "Bakandeya-estructura.pdf")
  estructuraDocumentoProcesadoEn?: string; // ISO timestamp when structure was extracted with AI
  speechTranscription?: string; // Audio/speech transcription from live cutting
  // Puntos CUE y detección automática de inicio/fin de música real (para saltar
  // huecos de silencio, afinaciones o aplausos del directo al inicio y final)
  cueIn?: number; // Segundo de inicio de la música real (e.g. 4.5)
  cueOut?: number; // Segundo de final de la música real antes de aplausos/silencio (e.g. 215.2)
  trimSilenceDetectedAt?: string; // ISO timestamp del último análisis acústico
  applauseDetected?: {
    intro?: boolean;
    outro?: boolean;
    introDurationSec?: number;
    outroDurationSec?: number;
  };
  // Un humano ha comparado los acordes extraídos por la IA contra el documento original y
  // confirma que son correctos. Sin esto, en directo no hay forma de distinguir un cifrado ya
  // revisado de uno recién subido en el que nadie ha confiado todavía.
  estructuraVerificada?: boolean;
}

export interface SetlistItem {
  id: string;
  songId?: string; // null if speech/pause/break/block header
  tipoItem: 'cancion' | 'bloque';
  bloqueSubtipo?: 'header' | 'presentacion' | 'intro_tema' | 'beatbox' | 'solo_performance' | 'cambio_instrumento' | 'chapa' | 'descanso' | 'bis' | 'otro';
  tituloCustom?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number; // e.g. 90 seconds (1m 30s)
  notaTema?: string;
  notas?: string;
  audioUrl?: string; // Recorded or uploaded speech/presentation audio
  // Tono en el que se quiere tocar ESTE tema en ESTE repertorio concreto (p.ej. "Re" para un
  // tema grabado en "Mi", porque el cantante de este bolo canta más grave). Vive en el
  // SetlistItem y no en Song porque el mismo tema puede tocarse en tonos distintos según el
  // repertorio/cantante — no es una propiedad fija de la canción. Si no se define, se toca en
  // la tonalidad original de la canción.
  tonalidadDeseada?: string;
}

export interface Setlist {
  id: string;
  band_id?: string;
  nombre: string;
  descripcion?: string;
  tipoFormato: 'festival' | 'sala_larga' | 'acustico' | 'ensayo' | 'otro';
  duracionTotalEstimadaMinutos?: number;
  items: SetlistItem[];
  fechaCreacion: string;
  fechaUltimaEdicion: string;
  ai_analysis_json?: any;
  ai_analysis_generated_at?: string;
}

// A band's own custom "quick add" preset for the setlist editor, alongside the built-in ones
// (Presentación, Intro Tema, Chapa...). Always inserted as tipoItem 'otro' — the icon/label are
// what the band picks, tituloCustom/duracion are what gets pre-filled into the setlist item.
export interface SetlistShortcut {
  id: string;
  band_id?: string;
  icono: string; // single emoji
  etiqueta: string; // short chip label, e.g. "Solo Batería"
  tituloCustom: string; // text used for the created setlist item
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number;
  notaTema?: string;
}

export interface ThemeColors {
  name: string;
  mode?: 'light' | 'dark';
  bg: string;
  card: string;
  border: string;
  primary: string;
  primaryHover: string;
  text: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  badgeGreen: string;
  badgeYellow: string;
  badgeRed: string;
  badgeBlue: string;
  neonShadow: string;
  fontDisplay: string;
  fontSans: string;
}

export interface TourVehicle {
  id: string;
  nombre: string;
  consumoL100km: number;
  precioCarburanteEUR?: number;
  tipoCombustible?: 'diesel' | 'gasolina95' | 'gasolina98' | 'electrico';
}

export interface TourRouteStop {
  id: string;
  concertId?: string;
  ciudad: string;
  sala: string;
  fecha: string;
  distanciaAnteriorKm?: number;
  tiempoConduccionHoras?: number;
  gastosAlojamiento?: number;
  gastosGasolina?: number;
  gastosDietas?: number;
  ingresoCacheEstimated?: number;
  notasLogisticas?: string;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
}

export interface Tour {
  id: string;
  band_id?: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  vehiculo?: string;
  consumoL100km?: number;
  precioCarburanteEUR?: number;
  tipoCombustible?: 'diesel' | 'gasolina95' | 'gasolina98' | 'electrico';
  vehiculos?: TourVehicle[];
  presupuestoLogistica?: number;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
  sincronizarCalendario?: boolean;
  sincronizarFinanzas?: boolean;
  stops: TourRouteStop[];
  estado: 'planificacion' | 'confirmada' | 'completada' | 'cancelada';
}

export interface RegisteredBand {
  id: string;
  band_id: string;
  fecha_registro: string;
  nombre_banda: string;
  email: string;
  plan: 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | string;
  contacto_nombre?: string;
  estilo_musical?: string;
  localizacion?: string;
  telefono?: string;
  instagram?: string;
  spotify_youtube?: string;
  aforo_promedio?: number;
  estado_cuenta?: 'activo' | 'prueba' | 'cancelado' | string;
  notas?: string;
  radar_enabled?: boolean;
  last_social_radar_at?: string;
}

export interface BandSchedule {
  band_id: string;
  timezone: string;
  horas_lector: number[];
  horas_enviador: number[];
  dias_enviador?: number[]; // [1..7], 1=Lunes, 7=Domingo
  dias_lector?: number[];   // [1..7], 1=Lunes, 7=Domingo
  updated_at?: string;
}

// app_password nunca viaja en la respuesta del GET - ver toSafeEmailAccountResponse en
// server/db/emailAccounts.ts. Este tipo describe justo esa forma "segura".
export interface BandEmailAccountStatus {
  connected: boolean;
  band_id?: string;
  provider?: 'gmail' | 'outlook' | 'other';
  email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  imap_host?: string;
  imap_port?: number;
  updated_at?: string;
}

export interface PitchLearningExample {
  id: string;
  band_id: string;
  lead_id: string;
  nombre_sala: string;
  tipo_entidad: string;
  ciudad?: string;
  borrador_ia: string;
  texto_aprobado: string;
  tuvo_edicion: boolean;
  diferencia_longitud?: number;
  tipo_accion: 'aprobado_propuesta' | 'aprobado_respuesta' | 'regenerado_con_feedback';
  resultado_respuesta?: 'pendiente' | 'positiva' | 'negativa' | 'sin_respuesta';
  fecha_aprobacion: string;
}

export interface BandToneDnaExpression {
  tono_comunicacion?: string;
  tratamiento_habitual?: string;
  nivel_energia?: string;
  vocabulario_clave?: string[];
  frases_emblematicas_extraidas?: string[];
  emojis_frecuentes?: string[];
  matices_por_red?: Record<string, string>;
  puntos_fuertes_para_conectar?: string;
  recomendacion_pitch?: string;
  reglas_estilo_aprendidas?: string[];
  vocabulario_aprendido?: string[];
  terminos_a_evitar?: string[];
  ultimo_auto_refinamiento?: string;
}

export interface CustomAlertRule {
  id: string;
  name: string;
  description: string;
  category: 'booking' | 'finanzas' | 'ensayos' | 'epk';
  requiredModule: string;
  enabled: boolean;
  daysThreshold?: number;
  notifyInApp: boolean;
  notifyEmail: boolean;
  targetRoleOnly?: boolean;
}

export interface AlertSettingsConfig {
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  digestFrequency: 'realtime' | 'daily_digest' | 'weekly_digest';
  recipientEmail?: string;
  recipientRole: 'leader_only' | 'all_members';
  rules: CustomAlertRule[];
}


