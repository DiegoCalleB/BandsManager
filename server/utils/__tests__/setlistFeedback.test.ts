import { describe, it, expect } from 'vitest';
import { formatGlobalSetlistFeedbackForPrompt, SetlistFeedbackLogEntry } from '../setlistFeedback';

describe('formatGlobalSetlistFeedbackForPrompt', () => {
  it('devuelve cadena vacía sin historial', () => {
    expect(formatGlobalSetlistFeedbackForPrompt(undefined)).toBe('');
    expect(formatGlobalSetlistFeedbackForPrompt(null)).toBe('');
    expect(formatGlobalSetlistFeedbackForPrompt([])).toBe('');
  });

  it('excluye las entradas de alcance "este_setlist" (ajuste puntual, no memoria)', () => {
    const historial: SetlistFeedbackLogEntry[] = [
      { id: '1', fecha: '2026-01-01', comentario: 'Solo para hoy', alcance: 'este_setlist' }
    ];
    expect(formatGlobalSetlistFeedbackForPrompt(historial)).toBe('');
  });

  it('excluye entradas sin señal real (ni comentario ni valoración)', () => {
    const historial: SetlistFeedbackLogEntry[] = [
      { id: '1', fecha: '2026-01-01', comentario: '', alcance: 'global' }
    ];
    expect(formatGlobalSetlistFeedbackForPrompt(historial)).toBe('');
  });

  it('incluye comentario y valoraciones de las entradas globales con señal', () => {
    const historial: SetlistFeedbackLogEntry[] = [
      { id: '1', fecha: '2026-01-01', comentario: 'Evita más de 1 balada seguida', intensidadRating: 2, contenidoRating: 4, alcance: 'global' }
    ];
    const result = formatGlobalSetlistFeedbackForPrompt(historial);
    expect(result).toContain('Instrucción: "Evita más de 1 balada seguida"');
    expect(result).toContain('Intensidad/energía: 2/5');
    expect(result).toContain('Contenido/selección de temas: 4/5');
  });

  it('limita a las 15 entradas más recientes', () => {
    const historial: SetlistFeedbackLogEntry[] = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      fecha: '2026-01-01',
      comentario: `Regla ${i}`,
      alcance: 'global' as const
    }));
    const result = formatGlobalSetlistFeedbackForPrompt(historial);
    expect(result.split('\n').length).toBe(15);
    expect(result).toContain('Regla 0');
    expect(result).not.toContain('Regla 19');
  });
});
