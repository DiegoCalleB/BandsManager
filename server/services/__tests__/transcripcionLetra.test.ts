import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  agruparPalabras, normalizarSalidaWhisper, limpiarLineas, construirEntrada, transcribirLetra, modelosWhisper,
} from '../transcripcionLetra';

describe('normalizarSalidaWhisper', () => {
  it('forma openai/whisper: segments con start/end y palabras', () => {
    const r = normalizarSalidaWhisper({
      detected_language: 'es',
      segments: [{ start: 1, end: 3.5, text: ' Hola mundo ', words: [{ word: 'Hola', start: 1, end: 1.5 }, { word: 'mundo', start: 2, end: 3.5 }] }],
    })!;
    expect(r.idioma).toBe('es');
    expect(r.lineas).toEqual([{ t0: 1, t1: 3.5, texto: 'Hola mundo', palabras: [{ t0: 1, t1: 1.5, texto: 'Hola' }, { t0: 2, t1: 3.5, texto: 'mundo' }] }]);
  });

  it('forma incredibly-fast-whisper por frase: chunks con timestamp [ini, fin]', () => {
    const r = normalizarSalidaWhisper({ text: 'x', chunks: [{ timestamp: [0, 2], text: ' Una frase de varias palabras ' }, { timestamp: [2, null], text: ' Otra frase larga también ' }] })!;
    expect(r.lineas.map((l) => l.texto)).toEqual(['Una frase de varias palabras', 'Otra frase larga también']);
    expect(r.lineas[1].t1).toBeGreaterThan(r.lineas[1].t0); // el fin null no rompe nada
  });

  it('forma por palabra: agrupa en líneas con las pausas', () => {
    const w = (t0: number, texto: string) => ({ timestamp: [t0, t0 + 0.3], text: ` ${texto}` });
    const r = normalizarSalidaWhisper({ chunks: [w(0, 'La'), w(0.4, 'máquina'), w(0.9, 'funcionó'), w(5, 'No'), w(5.4, 'me'), w(5.8, 'culpes')] })!;
    expect(r.lineas.map((l) => l.texto)).toEqual(['La máquina funcionó', 'No me culpes']);
    expect(r.lineas[0].palabras).toHaveLength(3);
  });

  it('solo texto sin tiempos → null: sin tiempos no se sincroniza ni se inventa', () => {
    expect(normalizarSalidaWhisper({ text: 'una letra sin tiempos' })).toBeNull();
    expect(normalizarSalidaWhisper({ transcription: 'x', segments: [] })).toBeNull();
    expect(normalizarSalidaWhisper(null)).toBeNull();
    expect(normalizarSalidaWhisper('texto')).toBeNull();
  });
});

describe('agruparPalabras', () => {
  it('corta por longitud (9 palabras) aunque no haya pausa', () => {
    const palabras = Array.from({ length: 20 }, (_, i) => ({ t0: i * 0.3, t1: i * 0.3 + 0.25, texto: `p${i}` }));
    const lineas = agruparPalabras(palabras);
    expect(lineas.length).toBe(3);
    expect(lineas[0].palabras).toHaveLength(9);
  });
});

describe('limpiarLineas: anti-alucinación', () => {
  const l = (texto: string, t0 = 0, t1 = 2) => ({ t0, t1, texto });

  it('quita créditos de subtítulos y marcas de música', () => {
    const r = limpiarLineas([l('Subtítulos realizados por la comunidad de Amara.org'), l('♪'), l('Música'), l('Una frase real cantada')]);
    expect(r.map((x) => x.texto)).toEqual(['Una frase real cantada']);
  });

  it('corta los bucles: la misma frase más de 2 veces seguidas', () => {
    const bucle = Array.from({ length: 8 }, (_, i) => l('Gracias a todos vosotros', i * 2, i * 2 + 2));
    expect(limpiarLineas(bucle)).toHaveLength(2);
  });

  it('un estribillo repetido NO consecutivo se conserva', () => {
    const r = limpiarLineas([l('Estribillo uno'), l('Verso intermedio'), l('Estribillo uno'), l('Otro verso'), l('Estribillo uno')]);
    expect(r).toHaveLength(5);
  });

  it('descarta un tramo de 20 s con 2 palabras', () => {
    expect(limpiarLineas([l('sí sí', 0, 20)])).toHaveLength(0);
  });
});

describe('construirEntrada: usa lo que el modelo declara', () => {
  it('pide tiempos por palabra si el modelo los ofrece', () => {
    expect(construirEntrada(new Set(['audio', 'task', 'language', 'timestamp']), 'https://x/a.mp3', 'gl')).toEqual({
      audio: 'https://x/a.mp3', timestamp: 'word', task: 'transcribe', language: 'gl',
    });
  });
  it('word_timestamps en otros modelos; sin idioma no lo envía', () => {
    expect(construirEntrada(new Set(['audio', 'word_timestamps', 'language']), 'https://x/a.mp3')).toEqual({ audio: 'https://x/a.mp3', word_timestamps: true });
  });
  it('sin parámetro de audio reconocible → null', () => {
    expect(construirEntrada(new Set(['prompt']), 'https://x/a.mp3')).toBeNull();
  });
});

describe('transcribirLetra (Replicate simulado)', () => {
  const entorno = { ...process.env };
  afterEach(() => { vi.unstubAllGlobals(); process.env = { ...entorno }; });

  const respuesta = (cuerpo: unknown, status = 200) => ({ status, text: async () => JSON.stringify(cuerpo) }) as any;
  const infoModelo = (props: string[]) => ({ latest_version: { id: 'v1', openapi_schema: { components: { schemas: { Input: { properties: Object.fromEntries(props.map((p) => [p, {}])) } } } } } });

  it('sin token: error claro y ninguna petición', async () => {
    delete process.env.REPLICATE_API_TOKEN; delete process.env.REPLICATE_API_KEY;
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    await expect(transcribirLetra('https://x/a.mp3')).rejects.toThrow(/REPLICATE_API_TOKEN/);
    expect(f).not.toHaveBeenCalled();
  });

  it('rechaza audio que no es https público', async () => {
    process.env.REPLICATE_API_TOKEN = 't';
    await expect(transcribirLetra('/audio/local.mp3')).rejects.toThrow(/URL pública/);
  });

  it('flujo feliz: descubre el esquema, pide palabras con tiempos y normaliza', async () => {
    process.env.REPLICATE_API_TOKEN = 't';
    delete process.env.WHISPER_REPLICATE_MODEL;
    const llamadas: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: any) => {
      llamadas.push({ url, init });
      if (String(url).includes('/models/')) return respuesta(infoModelo(['audio', 'timestamp', 'task']));
      return respuesta({ id: 'p1', status: 'succeeded', output: { chunks: [{ timestamp: [0, 2], text: ' Una frase con varias palabras ' }] } });
    }));
    const r = await transcribirLetra('https://x/voz.mp3');
    expect(r.modelo).toBe(modelosWhisper()[0]);
    expect(r.lineas).toHaveLength(1);
    const post = llamadas.find((c) => c.init?.method === 'POST');
    expect(JSON.parse(post.init.body).input).toEqual({ audio: 'https://x/voz.mp3', timestamp: 'word', task: 'transcribe' });
    expect(post.init.headers.Authorization).toBe('Bearer t');
  });

  it('si el primer modelo falla prueba el siguiente; si fallan todos, error con el motivo de cada uno', async () => {
    process.env.REPLICATE_API_TOKEN = 't';
    delete process.env.WHISPER_REPLICATE_MODEL;
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ detail: 'Not found' }, 404)));
    const err = await transcribirLetra('https://x/voz.mp3').catch((e) => e);
    expect(String(err.message)).toContain('vaibhavs10/incredibly-fast-whisper');
    expect(String(err.message)).toContain('openai/whisper');
  });

  it('una salida sin tiempos NUNCA se acepta como letra', async () => {
    process.env.REPLICATE_API_TOKEN = 't';
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      String(url).includes('/models/')
        ? respuesta(infoModelo(['audio']))
        : respuesta({ id: 'p', status: 'succeeded', output: { text: 'letra sin marcas de tiempo' } })));
    await expect(transcribirLetra('https://x/voz.mp3')).rejects.toThrow(/sin tiempos reconocibles/);
  });
});
