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
  | 'aprobado_respuesta';

export type LeadType = 'sala' | 'festival' | 'ayuntamiento' | 'grupo' | 'productora' | 'medio' | 'discoteca' | 'agencia' | 'manager' | 'sello';

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
  statusFilter?: LeadStatus | 'todos';
  typeFilter?: LeadType | 'todos';
  minCapacityFilter?: number;
}

export interface EmailMessage {
  id: string;
  fecha: string;
  remitente: 'sala' | 'banda';
  remitente_nombre: string;
  asunto: string;
  mensaje: string;
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
  telefono: string;
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
  es_favorito?: boolean;
  es_verificado?: boolean;
  fiabilidad_score?: number;
  pitch_feedback_tono?: number;
  pitch_feedback_contenido?: number;
  pitch_feedback_comentario?: string;
  historial_feedback_pitch?: PitchFeedbackLog[];
}

export interface Rehearsal {
  id: string;
  band_id?: string;
  bandName?: string;
  fecha: string;
  hora: string;
  lugar: string;
  asistentes: string[];
  notas: string;
  estado: 'programado' | 'cancelado' | 'completado';
  setlistId?: string;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
}

export interface ConcertExpenseBreakdown {
  gasolina?: number;
  dietas?: number;
  alquilerVehiculo?: number;
  alojamiento?: number;
  otros?: number;
  notasGastos?: string;
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
  tipo: 'sala' | 'festival' | 'ayuntamiento';
  setlistId?: string;
  gastosDetalle?: ConcertExpenseBreakdown;
  gastosEstimadosTipicos?: number;
  convocatoria_tipo?: 'completa' | 'parcial';
  convocados_ids?: string[];
  convocados_nombres?: string[];
  giraId?: string;
  giraNombre?: string;
}

export interface EmailSignatureConfig {
  nombreRemitente?: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  textoPie?: string;
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
    website?: string;
    whatsapp?: string;
  };
}

export interface EPKConfig {
  biografia: string;
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
    website?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
  contactoBooking: {
    nombre: string;
    email: string;
    telefono: string;
  };
  temasDestacadosIds: string[];
  incentivoFans?: {
    mensajeAgradecimiento?: string;
    enlaceDescarga?: string;
    codigoDescuento?: string;
  };
  ciudadesConfig?: string[];
  firmaEmail?: EmailSignatureConfig;
}

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

export type UserRole = 'leader' | 'member';

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
  plan?: 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | string;
  bandName?: string;
  band_id?: string;
  main_band_id?: string;
  band_order?: string[];
  email?: string;
  instrument?: string;
  avatarColor?: string;
  createdAt: string;
  googleOAuth?: GoogleOAuthConfig;
}

export interface UserWithHash extends User {
  passwordHash: string;
  salt: string;
}

export interface GoogleSheetsStatus {
  configured: boolean;
  spreadsheetId?: string;
  tabs?: string[];
  error?: string;
}

export type ThemeName = 'indie_velvet' | 'stitch_dark' | 'backstage_neon' | 'roots_ska' | 'brutalist_fuzz';

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
  fecha?: string;
  volumen?: number; // 0 to 1
  muted?: boolean;
  solo?: boolean;
  desfaseMs?: number; // Latency offset in milliseconds (-300 to +300) for multitrack alignment
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
}

export interface SongSubstituteGuide {
  estructura?: string;
  progresionClave?: string;
  cortesYClaves?: string;
  capoTraste?: string;
  instrumentosClave?: string;
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
  afinacion?: string; // e.g. "E Standard", "Drop D"
  albumDisco?: string; // e.g. "Álbum Debut (2025)", "EP Cacharros", "Single", "Inédita / En Proceso"
  ordenAlbum?: number; // Position/track number within the album
  album?: string;
  genero?: string;
  tipo?: string;
  estado?: string;
  energia?: number;
  portadaUrl?: string;
  favoritoGeneral?: boolean;
  estadoTema?: 'listo' | 'ensayando' | 'componiendo' | 'descartado';
  esVersionCovers?: boolean;
  enlaceAcordes?: string; // Link to drive/chords/partitura
  notasInternas?: string;
  audioPrincipalUrl?: string; // Demo / Master audio file
  audioIdeas?: SongAudioIdea[]; // Ideas by sections (Intro, Chorus, Solo, etc.)
  cifradoTexto?: string; // Lyrics and chords in LaCuerda / Ultimate Guitar format
  guiaSustituto?: SongSubstituteGuide; // Quick summary cheat-sheet for new band members & substitutes
}

export interface SetlistItem {
  id: string;
  songId?: string; // null if speech/pause/break/block header
  tipoItem: 'cancion' | 'chapa' | 'descanso' | 'bis' | 'bloque_header' | 'interludio' | 'presentacion' | 'beatbox' | 'intro_tema' | 'solo_performance' | 'cambio_instrumento' | 'otro';
  tituloCustom?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number; // e.g. 90 seconds (1m 30s)
  notaTema?: string;
  notas?: string;
  audioUrl?: string; // Recorded or uploaded speech/presentation audio
  bloqueCategoria?: 'calentamiento' | 'nudo' | 'desenlace' | 'bis' | 'otro';
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
}

export interface ThemeColors {
  name: string;
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
  plan: 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | string;
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

