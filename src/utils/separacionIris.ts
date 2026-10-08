import type { AudioTrack, Song, SongAudioIdea, StemsMeta } from '../types';
import { cancionConIdeas } from './irisTracks';

/**
 * Lógica PURA de la separación de pistas con Iris (sin React, sin red): qué se le dice al usuario en
 * cada fase, cómo se clasifica un error y cómo se funden las pistas nuevas con las que ya había.
 * Vive aparte para poder probarla sin montar el estudio; el orquestador es `useSeparacionIris`.
 */

export type MotorIris = 'fal' | 'mvsep-mdx23' | 'demucs' | 'dsp-server';

export type EtapaIris = 'preparing' | 'demucs' | 'persisting' | 'completed' | 'error';

export type ProveedorErrorIris = 'fal' | 'replicate' | 'gemini' | 'ffmpeg' | 'supabase' | 'network' | 'system';

/** Estado del modal de progreso. `minimized` lo toca solo el modal (píldora flotante). */
export interface ProgresoIris {
  isOpen: boolean;
  songTitle: string;
  ideaTitle: string;
  targetIdea?: SongAudioIdea;
  stage: EtapaIris;
  progressPct: number;
  minimized?: boolean;
  /** Date.now() de cuándo empezó la inferencia: única fuente de verdad de su % (ver `avanzarProgreso`). */
  demucsStartedAt?: number;
  currentStepText: string;
  isNeural?: boolean;
  engineUsed?: string;
  degraded?: boolean;
  degradedReason?: string;
  separationEngine?: string;
  engineChoice?: MotorIris;
  stemsAdded?: number;
  stemsInfo?: Array<{ instrument: string; trackName: string; formato: string; tamano: string; audioUrl?: string }>;
  errorMessage?: string;
  errorDetail?: string;
  errorProvider?: ProveedorErrorIris;
  errorType?: string;
  errorTitle?: string;
  actionAdvice?: string;
  executionTimeSec?: string;
  timingBreakdown?: { preloadSec?: string; gpuInferenceSec?: string; stemsPersistenceSec?: string; totalSec?: string };
}

// ───────────────────────── Textos por motor ─────────────────────────

/** Nombre comercial corto del motor elegido (el que se guarda en `stemEngineUsed`). */
export function nombreMotor(motor: MotorIris): string {
  return motor === 'fal' ? 'Iris Ultra' : motor === 'mvsep-mdx23' ? 'Iris Studio' : motor === 'demucs' ? 'Iris Cloud' : 'Iris Básico';
}

export function textoInicio(motor: MotorIris): string {
  return motor === 'fal'
    ? 'Iniciando Iris Ultra (Fal.ai GPU A100 ~10s)...'
    : motor === 'mvsep-mdx23'
      ? 'Iniciando Iris Studio (MDX-Net / Demucs v4 GPU)...'
      : motor === 'demucs'
        ? 'Iniciando Iris Cloud (HT-Demucs v4 Neural)...'
        : 'Iniciando Iris Básico (procesamiento local, gratis)...';
}

export function textoVerificando(motor: MotorIris): string {
  return motor !== 'dsp-server'
    ? 'Verificando el audio y enviándolo a la nube...'
    : 'Preparando espectro de audio en el motor local...';
}

export function textoProcesando(motor: MotorIris): string {
  return motor === 'fal'
    ? 'Iris Ultra aislando pistas en GPU A100 (~10-15s)...'
    : motor === 'mvsep-mdx23'
      ? 'Iris Studio aislando pistas vocales e instrumentales...'
      : motor === 'demucs'
        ? 'Iris Cloud aislando Voz, Batería, Bajo, Guitarras...'
        : 'Iris Básico realizando filtrado de frecuencias (gratis)...';
}

/** Etiqueta del motor dentro de los mensajes de espera. */
export function etiquetaMotor(motor: MotorIris): string {
  return motor === 'fal'
    ? 'Iris Ultra (Fal.ai GPU)'
    : motor === 'mvsep-mdx23'
      ? 'Iris Studio (MDX-Net)'
      : motor === 'demucs'
        ? 'Iris Cloud (HT-Demucs)'
        : 'Iris Básico (DSP Local)';
}

/** Cuánto esperamos al servidor antes de rendirnos: la GPU de Fal es rápida, el resto puede tardar. */
export function esperaMaximaMs(motor: MotorIris): number {
  return motor === 'fal' ? 240 * 1000 : 20 * 60 * 1000;
}

export function mensajeTiempoAgotado(motor: MotorIris): string {
  return motor === 'fal'
    ? 'Iris Ultra (Fal.ai) ha tardado más de 4 minutos en responder. Puedes cancelarlo, reintentar o usar Iris Básico gratis en 1 segundo.'
    : 'La separación sigue procesándose en el servidor tras 20 minutos. Cierra esta ventana e inténtalo de nuevo en un rato: el resultado quedará guardado y no se repetirá el gasto en GPU.';
}

/** Qué está pasando de verdad en cada tramo de la espera (subida, arranque del contenedor, inferencia). */
export function textoFaseEspera(motor: MotorIris, segundos: number): string {
  const etiqueta = etiquetaMotor(motor);
  if (motor === 'dsp-server') return `⚙️ Iris Básico procesando filtrado espectral local... (${segundos}s transcurridos)`;
  if (motor === 'fal') {
    return segundos < 6
      ? `⚡ Conectando con GPU NVIDIA A100 en Fal.ai... (${segundos}s)`
      : segundos < 60
        ? `⚡ Iris Ultra (Fal.ai GPU A100) aislando pistas vocales e instrumentales... (${segundos}s transcurridos)`
        : `⚡ Iris Ultra procesando canción completa en alta fidelidad... (${segundos}s transcurridos — temas largos suelen tardar entre 60 y 90s)`;
  }
  if (segundos < 12) return `📤 Subiendo tu audio a ${etiqueta}... (${segundos}s)`;
  if (segundos < 45) return `🧊 Reservando GPU e inicializando contenedor neuronal en la nube para ${etiqueta}... (${segundos}s)`;
  return motor === 'mvsep-mdx23'
    ? `✨ Iris Studio (MDX-Net + Demucs4) procesando 6 pasadas de alta precisión... (${segundos}s transcurridos — este ensamble de estudio tarda ~4-6 min en aislar temas completos)`
    : `🎛️ ${etiqueta} aislando canales de frecuencia en la nube... (${segundos}s transcurridos, suele tardar 1-2 min)`;
}

// ───────────────────────── Barra de progreso ─────────────────────────

/**
 * Un tic de la barra (cada 350 ms). El % de cada fase sale de una sola fórmula, nunca de dos relojes
 * compitiendo, así la barra no retrocede. `ahora` se inyecta para poder probarlo.
 */
export function avanzarProgreso(prev: ProgresoIris | null, ahora: number): ProgresoIris | null {
  if (!prev || prev.stage === 'completed' || prev.stage === 'error') return prev;
  if (prev.stage === 'preparing') return { ...prev, progressPct: Math.min(prev.progressPct + 3, 30) };
  if (prev.stage === 'demucs') {
    const seg = prev.demucsStartedAt ? (ahora - prev.demucsStartedAt) / 1000 : 0;
    const tope =
      prev.engineChoice === 'fal'
        ? Math.min(35 + Math.floor(seg * 6), 94)
        : prev.engineChoice === 'mvsep-mdx23'
          ? Math.min(30 + Math.floor(seg / 5.5), 92)
          : prev.engineChoice === 'demucs'
            ? Math.min(35 + Math.floor(seg / 1.5), 90)
            : Math.min(30 + Math.floor(seg * 4), 92);
    return { ...prev, progressPct: tope };
  }
  if (prev.stage === 'persisting') return { ...prev, progressPct: Math.min(prev.progressPct + 1, 96) };
  return prev;
}

/** Motores que se ofrecen al usuario, del recomendado al gratis. */
export const MOTORES_IRIS: Array<{ motor: MotorIris; nombre: string; nota: string }> = [
  { motor: 'fal', nombre: 'Ultra', nota: 'la mejor calidad, ~15 s' },
  { motor: 'mvsep-mdx23', nombre: 'Studio', nota: 'alta precisión, tarda varios minutos' },
  { motor: 'demucs', nombre: 'Cloud', nota: 'equilibrado, 1-2 min' },
  { motor: 'dsp-server', nombre: 'Básico', nota: 'gratis e instantáneo, menos limpio' },
];

/**
 * La idea sobre la que separar al lanzar Iris desde el Atril: la que suena (mismo audio), si no la
 * primera con audio y, si la canción solo tiene audio principal, una maqueta nueva que lo envuelve.
 */
export function ideaParaSeparar(song: Song, audioUrlActivo: string, autor = 'Banda'): SongAudioIdea | null {
  const ideas = (song.audioIdeas || []).filter((i) => !!i.audioUrl);
  const activa = ideas.find((i) => i.audioUrl === audioUrlActivo) || ideas[0];
  if (activa) return activa;
  if (!audioUrlActivo) return null;
  return {
    id: `idea-main-${song.id || 'cancion'}`,
    titulo: `Maqueta Principal (${song.titulo})`,
    audioUrl: audioUrlActivo,
    subidoPor: autor,
    seccion: 'general',
    fecha: new Date().toLocaleDateString('es-ES'),
  } as SongAudioIdea;
}

// ───────────────────────── Fusión de pistas ─────────────────────────

const normalizar = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Pista maestra sin separar (la «Demo unificada»): se descarta al llegar las pistas de verdad. */
export function pistasSinMaestra(existentes: AudioTrack[], idea: SongAudioIdea): AudioTrack[] {
  return existentes.filter(
    (t) =>
      t.audioUrl !== idea.audioUrl &&
      t.id !== `${idea.id}-track-1` &&
      t.nombre !== 'Pista Principal' &&
      t.nombre !== idea.titulo &&
      !!t.instrumento
  );
}

/** Autor que se anota en cada pista según quién la separó. */
export function autorDeSeparacion(
  data: { degraded?: boolean; separationEngine?: string; isNeural?: boolean },
  motor: MotorIris
): string {
  return data.degraded
    ? 'Iris Básico (Modo Degradado)'
    : data.separationEngine?.includes('Fal.ai') || data.separationEngine?.includes('fal') || motor === 'fal'
      ? 'Iris Ultra (Fal.ai GPU A100)'
      : data.separationEngine?.includes('MVSEP')
        ? 'Iris Studio'
        : data.isNeural
          ? 'Iris Cloud'
          : 'Iris Básico (gratis)';
}

/** Nombre del motor que queda anotado en la idea (`stemEngineUsed`). */
export function motorFinal(data: { degraded?: boolean }, motor: MotorIris): string {
  return data.degraded ? 'Iris Básico (modo degradado)' : nombreMotor(motor);
}

export interface StemDelServidor {
  audioUrl?: string;
  instrument?: string;
  trackName?: string;
  formato?: string;
  tamano?: string;
  recommendedVolume?: number;
}

/**
 * Funde las pistas que devuelve el servidor con las que la idea ya tenía. Nunca descarta material
 * caro de GPU: lo no pedido se queda silenciado (`muted`) pero en el mezclador. Si una pista del
 * mismo instrumento ya existía se sustituye en su sitio; si no, se añade. `nuevoId` se inyecta para
 * poder probar sin depender de Date.now()/Math.random().
 */
export function fusionarPistasServidor(args: {
  existentes: AudioTrack[];
  stems: StemDelServidor[];
  autor: string;
  pedidas?: string[];
  fecha: string;
  nuevoId: (instrumento: string) => string;
}): { pistas: AudioTrack[]; anadidas: number } {
  const { stems, autor, pedidas, fecha, nuevoId } = args;
  const pistas = [...args.existentes];
  let anadidas = 0;

  for (const st of stems) {
    if (!st.audioUrl) continue;
    const instNorm = normalizar(st.instrument || '');

    const seleccionada =
      !pedidas ||
      pedidas.length === 0 ||
      pedidas.some((req) => {
        const reqNorm = normalizar(req);
        if (reqNorm === 'instrumental' && instNorm !== 'voz') return true;
        return reqNorm === instNorm || instNorm.includes(reqNorm) || reqNorm.includes(instNorm);
      });

    const idx = pistas.findIndex((t) => {
      const tInst = normalizar(t.instrumento || '');
      const tNombre = normalizar(t.nombre || '');
      return (
        (tInst && tInst === instNorm) ||
        (tNombre && tNombre.includes(instNorm)) ||
        (instNorm === 'voz' && tNombre.includes('voz')) ||
        (instNorm === 'instrumental' && tNombre.includes('instrumental')) ||
        (instNorm === 'bateria' && tNombre.includes('bateria')) ||
        (instNorm === 'bajo' && tNombre.includes('bajo')) ||
        (instNorm === 'guitarras' && (tNombre.includes('guitarra') || tNombre.includes('guitarras'))) ||
        (instNorm === 'teclados' && (tNombre.includes('teclado') || tNombre.includes('piano'))) ||
        (instNorm === 'arreglos' && tNombre.includes('arreglo'))
      );
    });

    const formato = st.formato || (st.audioUrl.toLowerCase().includes('.wav') ? 'WAV' : 'MP3');
    const tamano = st.tamano || '2.5 MB';

    if (idx >= 0) {
      pistas[idx] = {
        ...pistas[idx],
        nombre: st.trackName || pistas[idx].nombre,
        audioUrl: st.audioUrl,
        autor,
        instrumento: st.instrument,
        formato,
        tamano,
        volumen: st.recommendedVolume || pistas[idx].volumen || 1,
        muted: !seleccionada,
      };
    } else {
      pistas.push({
        id: nuevoId((st.instrument || '').toLowerCase()),
        nombre: st.trackName || `Pista IA (${st.instrument})`,
        audioUrl: st.audioUrl,
        autor,
        instrumento: st.instrument,
        formato,
        tamano,
        fecha,
        volumen: st.recommendedVolume || 1,
        muted: !seleccionada,
      });
    }
    anadidas++;
  }
  return { pistas, anadidas };
}

/**
 * Devuelve la lista de ideas con la idea objetivo actualizada (pistas + datos del motor). La busca por
 * id, por audio o por título —como siempre— y, si no está, la añade al final.
 */
export function ideasConSeparacion(
  ideas: SongAudioIdea[] | undefined,
  objetivo: SongAudioIdea,
  pistas: AudioTrack[],
  meta: { motor: string; neural: boolean; degradado: boolean; procesadoEn: string }
): { ideas: SongAudioIdea[]; idea: SongAudioIdea } {
  const lista = ideas ? [...ideas] : [];
  const idea: SongAudioIdea = {
    ...objetivo,
    pistas,
    stemEngineUsed: meta.motor,
    stemIsNeural: meta.neural,
    stemDegraded: meta.degradado,
    stemProcessedAt: meta.procesadoEn,
  };
  const i = lista.findIndex(
    (x) => x.id === objetivo.id || (objetivo.audioUrl && x.audioUrl === objetivo.audioUrl) || (x.titulo && x.titulo === objetivo.titulo)
  );
  if (i >= 0) lista[i] = { ...lista[i], ...idea };
  else lista.push(idea);
  return { ideas: lista, idea };
}

/**
 * Canción con el resultado de una separación: las ideas actualizadas y, a la vez, los stems y su
 * metadato en la canción (`song.pistas`, `song.stemsMeta`), que es lo que lee la app.
 */
export function cancionConSeparacion<T extends { audioIdeas?: SongAudioIdea[]; pistas?: AudioTrack[]; stemsMeta?: StemsMeta }>(
  cancion: T,
  ideas: SongAudioIdea[]
): T {
  return cancionConIdeas(cancion, ideas);
}

// ───────────────────────── Errores ─────────────────────────

export interface ErrorIris {
  errorProvider: ProveedorErrorIris;
  errorType: string;
  errorTitle: string;
  errorMessage: string;
  actionAdvice: string;
  errorDetail?: string;
}

const TITULOS: Record<string, string> = {
  network_error: 'Error de Conexión de Red (Failed to fetch)',
  fal_billing_locked: 'Saldo Agotado en Fal.ai (HTTP 403 - Saldo Requerido TOP_UP)',
  fal_auth_invalid: 'Clave FAL_KEY Inválida o No Configurada (HTTP 401)',
  fal_rate_limit: 'Límite de Peticiones en Fal.ai Alcanzado (HTTP 429)',
  fal_generic: 'Error en la API de Fal.ai',
  gemini_key_missing: 'Clave GEMINI_API_KEY No Configurada',
  gemini_auth_invalid: 'Clave GEMINI_API_KEY Inválida o Revocada',
  gemini_quota_exceeded: 'Cuota de Gemini API Excedida (HTTP 429)',
  gemini_model_unavailable: 'Modelo de Gemini no Accesible en tu Región',
  gemini_safety_block: 'Bloqueo de Seguridad en Gemini AI',
  gemini_generic: 'Error en la API de Google Gemini',
  ffmpeg_missing: 'Librería FFmpeg no Instalada en Servidor',
  ffmpeg_codec_unsupported: 'Formato de Audio Incompatible con FFmpeg',
  ffmpeg_processing_error: 'Error en Filtros Espectrales FFmpeg',
  supabase_credentials_missing: 'Credenciales de Supabase no Configuradas',
  supabase_storage_error: 'Error de Almacenamiento en Supabase Storage',
  billing_required: 'Saldo o Facturación Requerida en el Servicio de IA (HTTP 402)',
  auth_invalid: 'Token de Acceso Inválido o Expirado (HTTP 401)',
  token_missing: 'Token de Acceso No Configurado',
  audio_unsupported: 'Formato de Audio Rechazado por el Servicio de IA (HTTP 422)',
  rate_limit: 'Límite de Peticiones Alcanzado (HTTP 429)',
  timeout: 'Tiempo de Espera en la Nube Excedido (>120s)',
  gpu_failure: 'Fallo en el Contenedor de Procesamiento en la Nube',
  server_error: 'Fallo Temporal en la Infraestructura de IA',
};

const CONSEJOS: Record<string, string> = {
  network_error: 'Comprueba tu conexión o pulsa "Separar con Iris Básico" para procesar las pistas al instante de forma local.',
  fal_billing_locked:
    'Tu cuenta de Fal.ai requiere recarga de créditos (Top Up). Puedes recargar en fal.ai/dashboard/billing o separar al instante y gratis con Iris Básico.',
  fal_auth_invalid: 'Comprueba que tu clave FAL_KEY esté activa en fal.ai/dashboard/keys o en las variables de entorno.',
  fal_rate_limit: 'Espera unos segundos o utiliza la separación local con Iris Básico.',
  gemini_key_missing: 'Añade tu clave GEMINI_API_KEY en los ajustes del proyecto o variables de entorno.',
  gemini_auth_invalid: 'Verifica tu API Key en Google AI Studio (https://aistudio.google.com/app/apikey) y actualízala.',
  gemini_quota_exceeded: 'Has superado el ratio de llamadas de tu cuenta en Gemini. Espera 60s o utiliza el plan de pago.',
  gemini_model_unavailable: 'El modelo solicitado no está activo para tu clave. Se usará el análisis local de respaldo.',
  ffmpeg_codec_unsupported: 'Exporta tu pista a MP3 estándar o WAV PCM 16-bit / 44.1kHz antes de subirla.',
  ffmpeg_missing: 'Verifica la instalación de ffmpeg-static en el servidor backend de Railway.',
  supabase_credentials_missing: 'Asegúrate de que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén definidas en Railway.',
  billing_required:
    'Tu cuenta de Replicate requiere añadir saldo en replicate.com/account/billing o utilizar el Motor DSP local gratuito.',
  auth_invalid: 'Comprueba que tu API Token comience por r8_ y esté activo en replicate.com/account/api-tokens.',
  token_missing: 'Configura la variable REPLICATE_API_TOKEN en los ajustes de tu proyecto.',
  rate_limit: 'Espera 30-60 segundos antes de enviar una nueva solicitud o utiliza el Motor DSP local.',
  timeout: 'La máquina GPU tardó en inicializar. Vuelve a intentarlo o usa la separación con el Motor DSP local.',
};

const CONSEJO_GENERICO = 'Puedes reintentar o usar la separación con el Motor DSP local que procesa el audio en el propio servidor.';

/** ¿Es un corte de red (y no un fallo del servicio)? Se reintenta distinto. */
export function esErrorDeRed(err: unknown): boolean {
  const msg = String((err as { message?: unknown } | null)?.message || '');
  return msg.includes('Failed to fetch') || msg.includes('NetworkError');
}

/**
 * Traduce lo que haya lanzado la separación (red, Fal, Replicate, Gemini, FFmpeg, Supabase...) a un
 * título, mensaje y consejo para el usuario. Es la misma clasificación de siempre, ahora probada.
 */
export function describirErrorSeparacion(err: any, motor: MotorIris): ErrorIris {
  const data = err?.data || {};
  const errMsg = String(data.message || data.error || err?.message || '');

  const esRed =
    errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('net::ERR_') || errMsg.includes('Load failed');

  const errorProvider: ProveedorErrorIris =
    data.provider ||
    (esRed
      ? 'network'
      : data.engine === 'fal' ||
          motor === 'fal' ||
          errMsg.includes('Fal.ai') ||
          errMsg.includes('fal.ai') ||
          errMsg.includes('fal.run') ||
          errMsg.includes('FAL_KEY')
        ? 'fal'
        : data.errorType?.startsWith('gemini_') ||
            errMsg.includes('GEMINI_API_KEY') ||
            errMsg.includes('Gemini') ||
            errMsg.includes('GoogleGenAI')
          ? 'gemini'
          : data.errorType?.startsWith('ffmpeg_') || errMsg.includes('ffmpeg') || errMsg.includes('fluent-ffmpeg')
            ? 'ffmpeg'
            : data.errorType?.startsWith('supabase_') || errMsg.includes('supabase') || errMsg.includes('storage')
              ? 'supabase'
              : motor !== 'dsp-server' ||
                  data.engine === 'replicate' ||
                  data.engine === 'mvsep-mdx23' ||
                  data.engine === 'demucs' ||
                  errMsg.includes('replicate') ||
                  errMsg.includes('r8_')
                ? 'replicate'
                : 'system');

  let errorType: string = data.errorType;
  if (!errorType) {
    if (esRed) {
      errorType = 'network_error';
    } else if (errorProvider === 'gemini') {
      if (errMsg.includes('key') && (errMsg.includes('not valid') || errMsg.includes('API_KEY_INVALID') || err?.status === 400 || err?.status === 401)) {
        errorType = 'gemini_auth_invalid';
      } else if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
        errorType = 'gemini_quota_exceeded';
      } else if (errMsg.includes('model') || errMsg.includes('NOT_FOUND') || err?.status === 404) {
        errorType = 'gemini_model_unavailable';
      } else {
        errorType = 'gemini_generic';
      }
    } else if (errorProvider === 'ffmpeg') {
      if (errMsg.includes('codec') || errMsg.includes('Invalid data') || err?.status === 422) {
        errorType = 'ffmpeg_codec_unsupported';
      } else if (errMsg.includes('missing') || errMsg.includes('not found')) {
        errorType = 'ffmpeg_missing';
      } else {
        errorType = 'ffmpeg_processing_error';
      }
    } else if (errorProvider === 'fal') {
      if (
        errMsg.includes('TOP_UP') ||
        errMsg.includes('locked') ||
        errMsg.includes('balance') ||
        errMsg.includes('credit') ||
        err?.status === 403
      ) {
        errorType = 'fal_billing_locked';
      } else if (errMsg.includes('401') || errMsg.includes('auth') || errMsg.includes('Key') || errMsg.includes('unauthorized')) {
        errorType = 'fal_auth_invalid';
      } else if (errMsg.includes('429') || errMsg.includes('rate') || errMsg.includes('limit')) {
        errorType = 'fal_rate_limit';
      } else {
        errorType = 'fal_generic';
      }
    } else if (errorProvider === 'supabase') {
      errorType =
        errMsg.includes('credentials') || errMsg.includes('URL') || errMsg.includes('KEY')
          ? 'supabase_credentials_missing'
          : 'supabase_storage_error';
    } else {
      errorType =
        err?.status === 401
          ? 'auth_invalid'
          : err?.status === 402
            ? 'billing_required'
            : err?.status === 422
              ? 'audio_unsupported'
              : err?.status === 429
                ? 'rate_limit'
                : err?.status === 504
                  ? 'timeout'
                  : err?.status >= 500
                    ? 'server_error'
                    : 'generic';
    }
  }

  const errorTitle = data.errorTitle || TITULOS[errorType] || 'Inconveniente en la Separación de Pistas';
  const specificMsg = esRed
    ? 'No se pudo contactar con el backend o la conexión se interrumpió temporalmente (Failed to fetch).'
    : data.message || data.error || errMsg || 'No se pudo conectar con el servidor de IA.';
  const actionAdvice = data.actionAdvice || CONSEJOS[errorType] || CONSEJO_GENERICO;
  const detailInfo = data.details || data.errorDetail;

  return {
    errorProvider,
    errorType,
    errorTitle,
    errorMessage: typeof specificMsg === 'string' ? specificMsg : JSON.stringify(specificMsg),
    actionAdvice,
    errorDetail:
      detailInfo && detailInfo !== specificMsg
        ? typeof detailInfo === 'string'
          ? detailInfo
          : JSON.stringify(detailInfo, null, 2)
        : undefined,
  };
}
