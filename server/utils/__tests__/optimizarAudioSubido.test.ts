import { describe, it, expect } from 'vitest';
import { debeRecodificar, detectMimeType } from '../optimizarAudioSubido';

describe('debeRecodificar: solo lo que de verdad pesa de más', () => {
  const MB = 1024 * 1024;
  it('WAV y FLAC siempre', () => {
    expect(debeRecodificar('wav', 40 * MB, null)).toBe(true);
    expect(debeRecodificar('flac', 30 * MB, null)).toBe(true);
  });
  it('un MP3 de 128 kbps NO se recodifica (antes sí, a 256 kbps: más grande y peor)', () => {
    expect(debeRecodificar('mp3', 6 * MB, 128)).toBe(false);
    expect(debeRecodificar('mp3', 9 * MB, 256)).toBe(false);
  });
  it('un MP3 de 320 kbps sí se aligera', () => {
    expect(debeRecodificar('mp3', 15 * MB, 320)).toBe(true);
  });
  it('un MP3 pequeño o de bitrate desconocido se deja tal cual', () => {
    expect(debeRecodificar('mp3', 1 * MB, 320)).toBe(false);
    expect(debeRecodificar('mp3', 6 * MB, null)).toBe(false);
  });
  it('detectMimeType sigue igual', () => {
    expect(detectMimeType('mp3')).toBe('audio/mpeg');
    expect(detectMimeType('xyz', 'application/octet-stream')).toBe('application/octet-stream');
  });
});
