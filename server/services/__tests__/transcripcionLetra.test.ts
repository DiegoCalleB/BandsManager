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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { normalizarSalidaOpenAI, transcribirConOpenAI, confianzaGlobal } from '../transcripcionLetra';

describe('normalizarSalidaOpenAI (verbose_json de whisper-1)', () => {
  const salida = {
    language: 'galician',
    words: [
      { word: 'A', start: 0.5, end: 0.7 }, { word: 'miña', start: 0.8, end: 1.2 }, { word: 'máquina', start: 1.3, end: 2 },
      { word: 'Non', start: 6, end: 6.4 }, { word: 'me', start: 6.5, end: 6.7 },
    ],
    segments: [
      { start: 0.4, end: 2.1, text: ' A miña máquina', avg_logprob: -0.2, no_speech_prob: 0.01, compression_ratio: 1.1 },
      { start: 5.9, end: 7, text: ' Non me', avg_logprob: -0.9, no_speech_prob: 0.3, compression_ratio: 1.0 },
    ],
  };

  it('une frases, palabras con tiempos y métricas de confianza', () => {
    const r = normalizarSalidaOpenAI(salida)!;
    expect(r.lineas).toHaveLength(2);
    expect(r.lineas[0].palabras?.map((p) => p.texto)).toEqual(['A', 'miña', 'máquina']);
    expect(r.lineas[1].palabras?.map((p) => p.texto)).toEqual(['Non', 'me']);
    expect(r.lineas[0].confianza).toBeCloseTo(Math.exp(-0.2), 3);
    expect(r.lineas[1].sinHabla).toBe(0.3);
    expect(r.idioma).toBe('galician');
  });

  it('sin frases → null', () => {
    expect(normalizarSalidaOpenAI({ text: 'x' })).toBeNull();
    expect(normalizarSalidaOpenAI({ segments: [] })).toBeNull();
  });
});

describe('limpiarLineas con las métricas de Whisper', () => {
  const l = (texto: string, extra: object) => ({ t0: 0, t1: 3, texto, ...extra });
  it('descarta lo que Whisper marca como probable ruido (no-habla alta + baja confianza)', () => {
    expect(limpiarLineas([l('algo que suena a letra', { sinHabla: 0.9, confianza: 0.2 })])).toHaveLength(0);
  });
  it('conserva una frase con no-habla alta pero buena confianza (voz entre ruido)', () => {
    expect(limpiarLineas([l('frase clara cantada', { sinHabla: 0.8, confianza: 0.9 })])).toHaveLength(1);
  });
  it('descarta un bucle por compression_ratio > 2,4', () => {
    expect(limpiarLineas([l('la la la la la la la la', { compresion: 3.1 })])).toHaveLength(0);
  });
});

describe('confianzaGlobal', () => {
  const l = (conf: number | undefined, n = 5) => ({ t0: 0, t1: 1, texto: Array(n).fill('p').join(' '), ...(conf !== undefined ? { confianza: conf } : {}) });
  it('con métricas: >=0,8 alta, >=0,6 media, el resto baja', () => {
    expect(confianzaGlobal([l(0.9)], 'voz')).toBe('alta');
    expect(confianzaGlobal([l(0.7)], 'voz')).toBe('media');
    expect(confianzaGlobal([l(0.4)], 'voz')).toBe('baja');
  });
  it('pondera por palabras: una frase larga mala pesa más que una corta buena', () => {
    expect(confianzaGlobal([l(0.95, 2), l(0.3, 20)], 'voz')).toBe('baja');
  });
  it('la mezcla nunca es «alta»', () => {
    expect(confianzaGlobal([l(0.99)], 'mezcla')).toBe('media');
  });
  it('sin métricas: voz «media», mezcla «baja», jamás «alta» a ciegas', () => {
    expect(confianzaGlobal([l(undefined)], 'voz')).toBe('media');
    expect(confianzaGlobal([l(undefined)], 'mezcla')).toBe('baja');
  });
});

describe('transcribirConOpenAI y prioridad de proveedores', () => {
  const entorno = { ...process.env };
  afterEach(() => { vi.unstubAllGlobals(); process.env = { ...entorno }; });
  const respuesta = (cuerpo: unknown, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(cuerpo) }) as any;
  const verbose = { language: 'es', words: [{ word: 'hola', start: 0, end: 0.5 }], segments: [{ start: 0, end: 1, text: ' hola mundo cruel', avg_logprob: -0.1 }] };

  function mp3Temporal() {
    const ruta = path.join(os.tmpdir(), `voz_test_${Date.now()}.mp3`);
    fs.writeFileSync(ruta, Buffer.from('ID3fake'));
    return ruta;
  }

  it('envía multipart con verbose_json, palabras y frases, temperatura 0 y la clave', async () => {
    const f = vi.fn(async () => respuesta(verbose));
    vi.stubGlobal('fetch', f);
    const ruta = mp3Temporal();
    const r = await transcribirConOpenAI(ruta, 'sk-test', 'es');
    expect(r.modelo).toBe('openai/whisper-1');
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
    const form: FormData = init.body;
    expect(form.get('model')).toBe('whisper-1');
    expect(form.get('response_format')).toBe('verbose_json');
    expect(form.get('temperature')).toBe('0');
    expect(form.getAll('timestamp_granularities[]')).toEqual(['word', 'segment']);
    expect(form.get('language')).toBe('es');
    fs.unlinkSync(ruta);
  });

  it('error de OpenAI → mensaje con el motivo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ error: { message: 'Incorrect API key' } }, 401)));
    const ruta = mp3Temporal();
    await expect(transcribirConOpenAI(ruta, 'mala')).rejects.toThrow(/401.*Incorrect API key/);
    fs.unlinkSync(ruta);
  });

  it('con OPENAI_API_KEY usa OpenAI primero y NO llama a Replicate', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REPLICATE_API_TOKEN = 't';
    const f = vi.fn(async () => respuesta(verbose));
    vi.stubGlobal('fetch', f);
    const ruta = mp3Temporal();
    const r = await transcribirLetra('https://x/voz.mp3', { archivoLocal: async () => ruta });
    expect(r.modelo).toBe('openai/whisper-1');
    expect((f.mock.calls as any[]).every(([u]) => String(u).includes('openai.com'))).toBe(true);
    fs.unlinkSync(ruta);
  });

  it('si OpenAI falla, cae a Replicate', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REPLICATE_API_TOKEN = 't';
    delete process.env.WHISPER_REPLICATE_MODEL;
    const info = { latest_version: { id: 'v', openapi_schema: { components: { schemas: { Input: { properties: { audio: {}, timestamp: {} } } } } } } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('openai.com')) return respuesta({ error: { message: 'cuota agotada' } }, 429);
      if (String(url).includes('/models/')) return respuesta(info);
      return respuesta({ id: 'p', status: 'succeeded', output: { chunks: [{ timestamp: [0, 2], text: ' una frase con varias palabras ' }] } });
    }));
    const ruta = mp3Temporal();
    const r = await transcribirLetra('https://x/voz.mp3', { archivoLocal: async () => ruta });
    expect(r.modelo).toBe(modelosWhisper()[0]);
    fs.unlinkSync(ruta);
  });

  it('si fallan todos, el error recoge el de OpenAI y el de Replicate', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.REPLICATE_API_TOKEN = 't';
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({ error: { message: 'caído' }, detail: 'caído' }, 500)));
    const ruta = mp3Temporal();
    const err = await transcribirLetra('https://x/voz.mp3', { archivoLocal: async () => ruta }).catch((e) => e);
    expect(String(err.message)).toContain('openai:');
    expect(String(err.message)).toContain('openai/whisper');
    fs.unlinkSync(ruta);
  });
});
