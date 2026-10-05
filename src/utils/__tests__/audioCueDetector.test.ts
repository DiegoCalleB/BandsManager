import { describe, it, expect } from 'vitest';
import {
  detectAudioCuesFromFloatChannel,
  detectLiveConcertTrackCues,
  formatCueOffset,
  applyDetectedCuesToSong,
  AudioCueAnalysis,
} from '../audioCueDetector';
import { Song } from '../../types';

describe('audioCueDetector', () => {
  const sampleRate = 44100;

  it('detecta correctamente inicio y final con silencios iniciales y finales', () => {
    // Generar un audio sintetizado de 10 segundos:
    // 0s - 2s: Silencio total (0)
    // 2s - 8s: Tono musical senoidal fuerte (440Hz, amplitud 0.8)
    // 8s - 10s: Silencio total (0)
    const duration = 10;
    const totalSamples = sampleRate * duration;
    const channel = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      if (t >= 2 && t <= 8) {
        // Tono senoidal de 440 Hz
        channel[i] = 0.8 * Math.sin(2 * Math.PI * 440 * t);
      } else {
        channel[i] = 0;
      }
    }

    const analysis = detectAudioCuesFromFloatChannel(channel, sampleRate, duration);

    expect(analysis.duration).toBe(10);
    // Con 1.5s de pre-roll antes del ataque de las 2.0s, cueIn queda en ~0.5s para no entrar de golpe
    expect(analysis.cueIn).toBeGreaterThanOrEqual(0.4);
    expect(analysis.cueIn).toBeLessThanOrEqual(0.7);
    expect(analysis.cueOut).toBeGreaterThanOrEqual(7.9);
    expect(analysis.cueOut).toBeLessThanOrEqual(8.6);
    expect(analysis.introSilenceSec).toBeGreaterThanOrEqual(0.4);
    expect(analysis.outroSilenceSec).toBeGreaterThanOrEqual(1.4);
    expect(analysis.trimmedDuration).toBeGreaterThanOrEqual(7.0);
    expect(analysis.trimmedDuration).toBeLessThanOrEqual(8.5);
    expect(analysis.waveformPeaks.length).toBeGreaterThan(0);
  });

  it('no recorta canciones que empiezan y terminan inmediatamente con música', () => {
    const duration = 5;
    const totalSamples = sampleRate * duration;
    const channel = new Float32Array(totalSamples);

    // Música constante de principio a fin
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      channel[i] = 0.7 * Math.sin(2 * Math.PI * 220 * t);
    }

    const analysis = detectAudioCuesFromFloatChannel(channel, sampleRate, duration);

    expect(analysis.cueIn).toBe(0);
    expect(analysis.cueOut).toBe(5);
    expect(analysis.introSilenceSec).toBe(0);
    expect(analysis.outroSilenceSec).toBe(0);
    expect(analysis.trimmedDuration).toBe(5);
  });

  it('detecta aplausos / ruido de sala al inicio y al final en conciertos en directo', () => {
    // Simular un directo de 12 segundos:
    // 0s - 3s: Aplausos de inicio (ruido blanco aleatorio de alta frecuencia)
    // 3s - 9s: Banda tocando con volumen alto y armónicos
    // 9s - 12s: Ovación del público y aplausos finales
    const duration = 12;
    const totalSamples = sampleRate * duration;
    const channel = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      if (t < 3) {
        // Aplausos (ruido blanco de baja amplitud pero alta frecuencia de cruces)
        channel[i] = (Math.random() * 2 - 1) * 0.12;
      } else if (t >= 3 && t <= 9) {
        // Música potente (acorde)
        channel[i] = 0.6 * Math.sin(2 * Math.PI * 150 * t) + 0.3 * Math.sin(2 * Math.PI * 300 * t);
      } else {
        // Aplausos de despedida
        channel[i] = (Math.random() * 2 - 1) * 0.15;
      }
    }

    const analysis = detectAudioCuesFromFloatChannel(channel, sampleRate, duration);

    expect(analysis.hasApplauseIntro).toBe(true);
    expect(analysis.hasApplauseOutro).toBe(true);
    // Con ataque musical en 3.0s y pre-roll de 1.5s, cueIn se posiciona en ~1.5s
    expect(analysis.cueIn).toBeGreaterThanOrEqual(1.3);
    expect(analysis.cueIn).toBeLessThanOrEqual(1.8);
    expect(analysis.cueOut).toBeGreaterThanOrEqual(8.9);
    expect(analysis.cueOut).toBeLessThanOrEqual(9.8);
  });

  it('aplica correctamente los puntos CUE a la entidad Song', () => {
    const mockSong: Song = {
      id: 'song-live-1',
      titulo: 'Tema en Directo',
      duracion: '3:30',
      duracionSegundos: 210,
      tonalidad: 'Em',
      bpm: 120,
    };

    const mockAnalysis: AudioCueAnalysis = {
      cueIn: 4.5,
      cueOut: 202.3,
      duration: 210,
      trimmedDuration: 197.8,
      introSilenceSec: 4.5,
      outroSilenceSec: 7.7,
      hasApplauseIntro: true,
      hasApplauseOutro: true,
      confidence: 0.94,
      waveformPeaks: [0.1, 0.5, 0.9, 0.2],
    };

    const updatedSong = applyDetectedCuesToSong(mockSong, mockAnalysis);

    expect(updatedSong.cueIn).toBe(4.5);
    expect(updatedSong.cueOut).toBe(202.3);
    expect(updatedSong.trimSilenceDetectedAt).toBeDefined();
    expect(updatedSong.applauseDetected?.intro).toBe(true);
    expect(updatedSong.applauseDetected?.outro).toBe(true);
    expect(updatedSong.applauseDetected?.introDurationSec).toBe(4.5);
    expect(updatedSong.applauseDetected?.outroDurationSec).toBe(7.7);
  });

  it('gestiona buffers vacíos o inválidos sin errores', () => {
    const emptyChannel = new Float32Array(0);
    const analysis = detectAudioCuesFromFloatChannel(emptyChannel, sampleRate, 0);

    expect(analysis.cueIn).toBe(0);
    expect(analysis.cueOut).toBe(0);
    expect(analysis.confidence).toBe(0);
  });

  it('detectLiveConcertTrackCues ajusta el corte musical con pre-roll ajustado de concierto', () => {
    // 0s-2s silencio, 2s-6s música potente, 6s-8s aplausos
    const duration = 8;
    const totalSamples = sampleRate * duration;
    const channel = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      if (t >= 2 && t <= 6) {
        channel[i] = 0.7 * Math.sin(2 * Math.PI * 440 * t);
      } else if (t > 6) {
        channel[i] = (Math.random() * 2 - 1) * 0.1;
      }
    }

    const analysis = detectLiveConcertTrackCues(channel, sampleRate, duration);
    // Ataque en 2.0s con 0.35s pre-roll -> cueIn ~1.6s a 1.7s
    expect(analysis.cueIn).toBeGreaterThanOrEqual(1.5);
    expect(analysis.cueIn).toBeLessThanOrEqual(1.8);
    expect(analysis.cueOut).toBeGreaterThanOrEqual(5.9);
  });

  it('formatCueOffset formatea correctamente minutos, segundos y decimales', () => {
    expect(formatCueOffset(0)).toBe('0:00.0');
    expect(formatCueOffset(3.5)).toBe('0:03.5');
    expect(formatCueOffset(65.2)).toBe('1:05.2');
  });
});
