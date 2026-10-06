/**
 * Transcripción de la letra con un modelo de voz (Whisper en Replicate) y tiempos.
 *
 * Por qué no un LLM generativo: pedirle a un modelo de lenguaje «la letra de esta canción»
 * produce letras plausibles e inventadas. Un modelo de reconocimiento de voz solo transcribe lo
 * que oye, con marcas de tiempo, y es lo único que permite sincronizar la letra con el audio.
 *
 * Whisper también alucina con música (frases tipo «Subtítulos por…», bucles repetidos), así que la
 * salida pasa por `limpiarLineas` antes de aceptarse, y se prefiere SIEMPRE la pista de voz aislada.
 */

export interface PalabraLetra {
  t0: number;
  t1: number;
  texto: string;
}

export interface LineaLetra {
  t0: number;
  t1: number;
  texto: string;
  palabras?: PalabraLetra[];
}

export interface Transcripcion {
  lineas: LineaLetra[];
  idioma?: string;
  modelo: string;
}

// ── Parseo tolerante de la salida (cada modelo de Whisper devuelve una forma distinta) ─────────

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const limpiarTexto = (t: unknown): string => String(t ?? '').replace(/\s+/g, ' ').trim();

/** Agrupa palabras con tiempos en líneas: corte por pausa larga, longitud o duración. */
export function agruparPalabras(palabras: PalabraLetra[]): LineaLetra[] {
  const lineas: LineaLetra[] = [];
  let actual: PalabraLetra[] = [];
  const cerrar = () => {
    if (actual.length === 0) return;
    lineas.push({
      t0: actual[0].t0,
      t1: actual[actual.length - 1].t1,
      texto: actual.map((p) => p.texto).join(' '),
      palabras: actual,
    });
    actual = [];
  };
  for (const p of palabras) {
    const prev = actual[actual.length - 1];
    const pausa = prev ? p.t0 - prev.t1 : 0;
    const dur = actual.length ? p.t1 - actual[0].t0 : 0;
    if (actual.length > 0 && (pausa >= 0.9 || actual.length >= 9 || dur >= 6)) cerrar();
    actual.push(p);
  }
  cerrar();
  return lineas;
}

/**
 * Convierte la salida de un modelo de Whisper en líneas con tiempos. Formas conocidas:
 *  - { chunks: [{ timestamp: [ini, fin|null], text }] }       (incredibly-fast-whisper; por frase o por palabra)
 *  - { segments: [{ start, end, text, words?: [{word,start,end}] }], detected_language }   (openai/whisper)
 * Devuelve null si no hay tiempos: sin ellos no se puede sincronizar y no se inventan.
 */
export function normalizarSalidaWhisper(salida: any): { lineas: LineaLetra[]; idioma?: string } | null {
  if (!salida || typeof salida !== 'object') return null;
  const idioma = typeof salida.detected_language === 'string' ? salida.detected_language : undefined;

  if (Array.isArray(salida.segments) && salida.segments.length > 0) {
    const lineas: LineaLetra[] = [];
    for (const s of salida.segments) {
      const t0 = num(s?.start);
      const t1 = num(s?.end);
      const texto = limpiarTexto(s?.text);
      if (t0 === null || t1 === null || !texto) continue;
      const palabras: PalabraLetra[] = Array.isArray(s.words)
        ? s.words.flatMap((w: any) => {
            const a = num(w?.start);
            const b = num(w?.end);
            const tx = limpiarTexto(w?.word ?? w?.text);
            return a !== null && b !== null && tx ? [{ t0: a, t1: b, texto: tx }] : [];
          })
        : [];
      lineas.push({ t0, t1: Math.max(t1, t0 + 0.2), texto, ...(palabras.length ? { palabras } : {}) });
    }
    return lineas.length ? { lineas, idioma } : null;
  }

  if (Array.isArray(salida.chunks) && salida.chunks.length > 0) {
    const trozos: PalabraLetra[] = [];
    for (const c of salida.chunks) {
      const ts = Array.isArray(c?.timestamp) ? c.timestamp : null;
      const t0 = ts ? num(ts[0]) : null;
      if (t0 === null) continue;
      const t1 = (ts ? num(ts[1]) : null) ?? t0 + 1;
      const texto = limpiarTexto(c?.text);
      if (texto) trozos.push({ t0, t1: Math.max(t1, t0 + 0.05), texto });
    }
    if (trozos.length === 0) return null;
    // ¿Palabra a palabra o frase a frase? Con 1-2 palabras de media son palabras sueltas.
    const mediaPalabras = trozos.reduce((a, c) => a + c.texto.split(' ').length, 0) / trozos.length;
    return { lineas: mediaPalabras <= 2 ? agruparPalabras(trozos) : trozos.map((c) => ({ ...c })), idioma };
  }

  return null;
}

// ── Anti-alucinación ───────────────────────────────────────────────────────────────────────────

const FRASES_ALUCINADAS = [
  /subt[ií]tulos?\s+(por|realizados?|de)/i,
  /amara\.org/i,
  /gracias por (ver|vuestra|su)/i,
  /suscr[ií]be?te/i,
  /thanks for watching/i,
  /subtitles? by/i,
  /^\W*(m[uú]sica|music|aplausos|applause)\W*$/i,
  /^[\s♪♫\-–.…]*$/,
];

const normaliza = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

/**
 * Quita lo que Whisper suele inventar sobre música: créditos de subtítulos, marcas de música,
 * bucles de la misma frase y tramos larguísimos con casi nada de texto.
 */
export function limpiarLineas(lineas: LineaLetra[]): LineaLetra[] {
  const sinBasura = lineas.filter((l) => {
    if (FRASES_ALUCINADAS.some((r) => r.test(l.texto))) return false;
    const palabras = l.texto.split(/\s+/).length;
    if (l.t1 - l.t0 > 15 && palabras < 4) return false; // 15 s «cantando» 3 palabras: relleno
    return true;
  });
  // Bucles: la misma línea más de 3 veces seguidas; se conservan las 2 primeras.
  const salida: LineaLetra[] = [];
  let seguidas = 0;
  for (const l of sinBasura) {
    const igual = salida.length > 0 && normaliza(salida[salida.length - 1].texto) === normaliza(l.texto);
    seguidas = igual ? seguidas + 1 : 1;
    if (seguidas > 2) continue;
    salida.push(l);
  }
  return salida;
}

export function totalPalabras(lineas: LineaLetra[]): number {
  return lineas.reduce((a, l) => a + l.texto.split(/\s+/).filter(Boolean).length, 0);
}

// ── Cliente de Replicate ───────────────────────────────────────────────────────────────────────

const API = 'https://api.replicate.com/v1';
const MODELOS_POR_DEFECTO = ['vaibhavs10/incredibly-fast-whisper', 'openai/whisper'];

export function modelosWhisper(): string[] {
  const forzado = (process.env.WHISPER_REPLICATE_MODEL || '').trim();
  return forzado ? [forzado, ...MODELOS_POR_DEFECTO.filter((m) => m !== forzado)] : MODELOS_POR_DEFECTO;
}

/**
 * Construye la entrada de un modelo según los parámetros que DECLARA su esquema (así no se depende
 * de recordar bien el nombre de cada parámetro): audio siempre, tiempos por palabra si el modelo
 * los ofrece, transcribir (no traducir), e idioma si se conoce y el modelo lo admite.
 */
export function construirEntrada(propiedades: Set<string>, audioUrl: string, idioma?: string): Record<string, unknown> | null {
  const campoAudio = ['audio', 'audio_file', 'file'].find((c) => propiedades.has(c));
  if (!campoAudio) return null;
  const entrada: Record<string, unknown> = { [campoAudio]: audioUrl };
  if (propiedades.has('timestamp')) entrada.timestamp = 'word';
  if (propiedades.has('word_timestamps')) entrada.word_timestamps = true;
  if (propiedades.has('task')) entrada.task = 'transcribe';
  if (idioma && propiedades.has('language')) entrada.language = idioma;
  return entrada;
}

async function json(res: Response): Promise<any> {
  const texto = await res.text();
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`Respuesta no JSON de Replicate (HTTP ${res.status}): ${texto.slice(0, 160)}`);
  }
}

async function intentarModelo(modelo: string, token: string, audioUrl: string, idioma?: string): Promise<Transcripcion> {
  const cab = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const info = await json(await fetch(`${API}/models/${modelo}`, { headers: cab, signal: AbortSignal.timeout(20_000) }));
  const version: string | undefined = info?.latest_version?.id;
  if (!version) throw new Error(`El modelo ${modelo} no tiene versión publicada (${info?.detail || 'sin detalle'})`);
  const props = new Set<string>(Object.keys(info?.latest_version?.openapi_schema?.components?.schemas?.Input?.properties ?? {}));
  const entrada = construirEntrada(props, audioUrl, idioma);
  if (!entrada) throw new Error(`El modelo ${modelo} no declara un parámetro de audio (campos: ${[...props].join(', ') || 'ninguno'})`);

  let pred = await json(
    await fetch(`${API}/predictions`, {
      method: 'POST',
      headers: { ...cab, Prefer: 'wait=50' },
      body: JSON.stringify({ version, input: entrada }),
      signal: AbortSignal.timeout(70_000),
    })
  );
  const limite = Date.now() + 5 * 60_000;
  while (pred?.status === 'starting' || pred?.status === 'processing') {
    if (Date.now() > limite) throw new Error('La transcripción tardó más de 5 minutos');
    await new Promise((r) => setTimeout(r, 3000));
    pred = await json(await fetch(pred.urls?.get || `${API}/predictions/${pred.id}`, { headers: cab, signal: AbortSignal.timeout(20_000) }));
  }
  if (pred?.status !== 'succeeded') {
    throw new Error(`Replicate no completó la transcripción (${pred?.status || 'sin estado'}): ${String(pred?.error || pred?.detail || '').slice(0, 200)}`);
  }
  const norm = normalizarSalidaWhisper(pred.output);
  if (!norm) {
    throw new Error(`Salida de ${modelo} sin tiempos reconocibles (campos: ${Object.keys(pred.output ?? {}).join(', ')})`);
  }
  return { lineas: norm.lineas, idioma: norm.idioma, modelo };
}

/**
 * Transcribe la voz de `audioUrl` (URL pública https que Replicate pueda descargar). Prueba los
 * modelos en orden; si todos fallan lanza un error con el motivo de cada uno. NUNCA devuelve
 * texto sin tiempos ni texto inventado.
 */
export async function transcribirLetra(audioUrl: string, opciones: { idioma?: string } = {}): Promise<Transcripcion> {
  const token = (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '').trim();
  if (!token) throw new Error('Falta REPLICATE_API_TOKEN en el servidor: no se puede transcribir la letra.');
  if (!/^https:\/\//i.test(audioUrl)) throw new Error('El audio no está en una URL pública (https): el servicio de transcripción no puede descargarlo.');

  const fallos: string[] = [];
  for (const modelo of modelosWhisper()) {
    try {
      return await intentarModelo(modelo, token, audioUrl, opciones.idioma);
    } catch (err: any) {
      fallos.push(`${modelo}: ${String(err?.message || err).slice(0, 220)}`);
      console.warn(`[Transcripción] ${modelo} falló:`, String(err?.message || err).slice(0, 300));
    }
  }
  throw new Error(`No se pudo transcribir la letra. ${fallos.join(' | ')}`);
}
