import { describe, it, expect } from 'vitest';
import { currentHourAndDay } from '../agentScheduler';

describe('agentScheduler currentHourAndDay', () => {
  it('calcula la hora y el día ISO (1=lunes..7=domingo) correctos en Europe/Madrid', () => {
    // 2026-08-18 es un martes. 10:30 UTC = 12:30 en Madrid (horario de verano, UTC+2).
    const tuesdayMorningUtc = new Date('2026-08-18T10:30:00Z');
    const result = currentHourAndDay('Europe/Madrid', tuesdayMorningUtc);
    expect(result.hour).toBe(12);
    expect(result.dayIso).toBe(2); // martes
    expect(result.dateKey).toBe('2026-08-18');
  });

  it('trata la medianoche correctamente (Intl puede devolver "24" en vez de "0")', () => {
    // Medianoche exacta en Madrid un día sin cambio de horario relevante.
    const midnightUtc = new Date('2026-01-15T23:00:00Z'); // 00:00 en Madrid (invierno, UTC+1)
    const result = currentHourAndDay('Europe/Madrid', midnightUtc);
    expect(result.hour).toBe(0);
  });

  it('usa Europe/Madrid por defecto si no se pasa timezone', () => {
    const someUtc = new Date('2026-08-18T10:30:00Z');
    const result = currentHourAndDay('', someUtc);
    expect(result.hour).toBe(12);
  });
});
