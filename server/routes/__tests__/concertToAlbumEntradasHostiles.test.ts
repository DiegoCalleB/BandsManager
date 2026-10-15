import { describe, it, expect, vi, afterEach } from 'vitest';
import path from 'path';
import {
  rutaFuenteSegura,
  rutaEnDirectorio,
  indicePistaSeguro,
  esUrlYoutube,
  extraerObjetoJson,
  detectCuesForAudioFile,
  buildAudioOrTextContents,
} from '../concert_to_album';

describe('esUrlYoutube', () => {
  it('acepta los hosts legítimos de YouTube', () => {
    expect(esUrlYoutube('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(esUrlYoutube('https://youtube.com/watch?v=abc')).toBe(true);
    expect(esUrlYoutube('https://m.youtube.com/watch?v=abc')).toBe(true);
    expect(esUrlYoutube('https://youtu.be/abc')).toBe(true);
  });

  it('RECHAZA dominios que solo contienen la cadena', () => {
    expect(esUrlYoutube('https://evil.com/youtube.com')).toBe(false);
    expect(esUrlYoutube('https://evil.com/?u=youtu.be')).toBe(false);
    expect(esUrlYoutube('https://youtube.com.evil.com/x')).toBe(false);
    expect(esUrlYoutube('https://notyoutube.com/x')).toBe(false);
    expect(esUrlYoutube('https://evil.com#@youtube.com')).toBe(false);
    expect(esUrlYoutube('no es una url')).toBe(false);
  });
});

describe('rutaEnDirectorio', () => {
  const base = path.resolve(process.cwd(), 'public', 'uploads', 'temp');

  it('resuelve nombres planos dentro de la base', () => {
    expect(rutaEnDirectorio(base, 'snippet_1_0_30_123.mp3')).toBe(path.join(base, 'snippet_1_0_30_123.mp3'));
    expect(rutaEnDirectorio(base, '01 - Mi tema (en directo).mp3')).toBe(path.join(base, '01 - Mi tema (en directo).mp3'));
  });

  it('RECHAZA saltos de directorio y rutas', () => {
    expect(() => rutaEnDirectorio(base, '../secreto.mp3')).toThrow();
    expect(() => rutaEnDirectorio(base, '../../../etc/passwd')).toThrow();
    expect(() => rutaEnDirectorio(base, 'a/b.mp3')).toThrow();
    expect(() => rutaEnDirectorio(base, '/etc/passwd')).toThrow();
    expect(() => rutaEnDirectorio(base, '..')).toThrow();
    expect(() => rutaEnDirectorio(base, '')).toThrow();
    expect(() => rutaEnDirectorio(base, 'a\0.mp3')).toThrow();
  });
});

describe('indicePistaSeguro', () => {
  it('deja pasar índices normales', () => {
    expect(indicePistaSeguro(3)).toBe(3);
    expect(indicePistaSeguro('12')).toBe(12);
  });

  it('neutraliza cualquier intento de ruta', () => {
    expect(indicePistaSeguro('../../etc/passwd')).toBe(1);
    expect(indicePistaSeguro('../1')).toBe(1);
    expect(indicePistaSeguro(undefined)).toBe(1);
    expect(indicePistaSeguro({})).toBe(1);
    expect(indicePistaSeguro(-4)).toBe(4);
  });
});

describe('extraerObjetoJson', () => {
  it('extrae el objeto envuelto en texto, como la regex voraz anterior', () => {
    expect(extraerObjetoJson('Aquí va:\n```json\n{"a":{"b":1}}\n```')).toBe('{"a":{"b":1}}');
    expect(extraerObjetoJson('{"x":1} y luego {"y":2}')).toBe('{"x":1} y luego {"y":2}');
  });

  it('devuelve null sin objeto', () => {
    expect(extraerObjetoJson('sin json')).toBeNull();
    expect(extraerObjetoJson('} al revés {')).toBeNull();
    expect(extraerObjetoJson('')).toBeNull();
  });

  it('es lineal con entradas patológicas', () => {
    const inicio = Date.now();
    extraerObjetoJson('{'.repeat(200_000));
    extraerObjetoJson('{' + ' '.repeat(200_000));
    expect(Date.now() - inicio).toBeLessThan(500);
  });
});

describe('rutaFuenteSegura con entradas hostiles', () => {
  it('rechaza traversal, rutas absolutas y la propia raíz', () => {
    expect(rutaFuenteSegura('../server/.env')).toBeNull();
    expect(rutaFuenteSegura('uploads/../../package.json')).toBeNull();
    expect(rutaFuenteSegura('/etc/passwd')).toBeNull();
    expect(rutaFuenteSegura('.')).toBeNull();
  });
});

describe('rutas que reciben ficheros de fuera de public/', () => {
  afterEach(() => vi.restoreAllMocks());

  it('detectCuesForAudioFile no abre una ruta fuera de public/', async () => {
    const r = await detectCuesForAudioFile('/etc/passwd');
    expect(r.confidence).toBe(0);
  });

  it('buildAudioOrTextContents no lee ficheros fuera de public/ y cae al texto', () => {
    const contenido = buildAudioOrTextContents('/etc/passwd', 'prompt', 'nota');
    expect(typeof contenido).toBe('string');
    expect(contenido).toContain('prompt');
  });
});
