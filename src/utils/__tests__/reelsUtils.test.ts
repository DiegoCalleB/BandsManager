import { describe, it, expect } from 'vitest';
import {
  getYouTubeId,
  getStartTimeInSeconds,
  formatSecondsToTime,
  defaultScheduleDate,
  validateScheduleReadiness,
  getCadenceWarnings,
} from '../reelsUtils';

describe('reelsUtils', () => {
  it('extracts YouTube video IDs correctly', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeId('invalid-url')).toBeNull();
  });

  it('parses time range string to seconds', () => {
    expect(getStartTimeInSeconds('01:30 - 02:00')).toBe(90);
    expect(getStartTimeInSeconds('00:45')).toBe(45);
    expect(getStartTimeInSeconds('')).toBe(0);
  });

  it('formats seconds to MM:SS', () => {
    expect(formatSecondsToTime(90)).toBe('01:30');
    expect(formatSecondsToTime(5)).toBe('00:05');
  });

  describe('defaultScheduleDate', () => {
    it('devuelve el día siguiente por defecto, no una fecha fija', () => {
      const hoy = new Date('2026-08-29T12:00:00Z');
      expect(defaultScheduleDate(1, hoy)).toBe('2026-08-30');
    });

    it('acepta cuántos días de margen dar', () => {
      const hoy = new Date('2026-08-29T12:00:00Z');
      expect(defaultScheduleDate(7, hoy)).toBe('2026-09-05');
    });
  });

  describe('validateScheduleReadiness', () => {
    const ahora = new Date('2026-08-29T10:00:00');

    it('sin problemas cuando hay copy con hashtag y fecha futura', () => {
      const problemas = validateScheduleReadiness({
        copy: 'Menudo bolo el de ayer! #MusicaEnDirecto',
        scheduledDate: '2026-08-30',
        scheduledTime: '20:30',
        now: ahora,
      });
      expect(problemas).toEqual([]);
    });

    it('avisa si el copy está vacío', () => {
      const problemas = validateScheduleReadiness({ copy: '', scheduledDate: '2026-08-30', scheduledTime: '20:30', now: ahora });
      expect(problemas).toContain('Falta el texto del copy.');
    });

    it('avisa si no hay ningún hashtag en el copy', () => {
      const problemas = validateScheduleReadiness({
        copy: 'Sin hashtags por aquí',
        scheduledDate: '2026-08-30',
        scheduledTime: '20:30',
        now: ahora,
      });
      expect(problemas).toContain('El copy no lleva ningún hashtag: añade al menos uno.');
    });

    it('avisa si falta fecha u hora', () => {
      expect(validateScheduleReadiness({ copy: '#ok', scheduledDate: '', scheduledTime: '20:30', now: ahora })).toContain(
        'Elige fecha y hora de publicación.'
      );
      expect(validateScheduleReadiness({ copy: '#ok', scheduledDate: '2026-08-30', scheduledTime: '', now: ahora })).toContain(
        'Elige fecha y hora de publicación.'
      );
    });

    it('avisa si la fecha/hora elegida ya pasó', () => {
      const problemas = validateScheduleReadiness({
        copy: '#ok',
        scheduledDate: '2026-08-28',
        scheduledTime: '09:00',
        now: ahora,
      });
      expect(problemas).toContain('La fecha y hora elegidas ya han pasado.');
    });
  });

  describe('getCadenceWarnings', () => {
    it('sin posts previos no hay ningún aviso', () => {
      expect(getCadenceWarnings({ posts: [], platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' })).toEqual([]);
    });

    it('avisa si hay otro post en la misma red muy cerca en el tiempo', () => {
      const posts = [{ fecha: '2026-08-30 21:00', plataforma: 'Instagram' }];
      const avisos = getCadenceWarnings({ posts, platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' });
      expect(avisos.some((a) => a.includes('Instagram'))).toBe(true);
    });

    it('no avisa de cercanía si el otro post es en otra red', () => {
      const posts = [{ fecha: '2026-08-30 21:00', plataforma: 'TikTok' }];
      const avisos = getCadenceWarnings({ posts, platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' });
      expect(avisos.some((a) => a.includes('Instagram'))).toBe(false);
    });

    it('no avisa de cercanía si el otro post está lejos en el tiempo', () => {
      const posts = [{ fecha: '2026-08-28 08:00', plataforma: 'Instagram' }];
      const avisos = getCadenceWarnings({ posts, platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' });
      expect(avisos.some((a) => a.toLowerCase().includes('menos de'))).toBe(false);
    });

    it('avisa de un hueco grande sin publicar nada antes de este post', () => {
      const posts = [{ fecha: '2026-08-01 20:00', plataforma: 'Instagram' }];
      const avisos = getCadenceWarnings({ posts, platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' });
      expect(avisos.some((a) => a.includes('días sin nada programado'))).toBe(true);
    });

    it('no avisa de hueco si el post anterior es reciente', () => {
      const posts = [{ fecha: '2026-08-27 20:00', plataforma: 'Instagram' }];
      const avisos = getCadenceWarnings({ posts, platform: 'Instagram', scheduledDate: '2026-08-30', scheduledTime: '20:30' });
      expect(avisos.some((a) => a.includes('días sin nada programado'))).toBe(false);
    });
  });
});
