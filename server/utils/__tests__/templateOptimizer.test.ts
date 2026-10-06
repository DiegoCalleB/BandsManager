import { describe, it, expect } from 'vitest';
import {
  countUnoptimizedFeedback,
  resolveBandNameAndBio,
  buildTemplateOptimizationPrompt,
  AUTO_OPTIMIZE_FEEDBACK_THRESHOLD
} from '../templateOptimizer';

describe('countUnoptimizedFeedback', () => {
  it('cuenta las valoraciones del mánager desde el final hasta la última optimización', () => {
    const logs = [
      { timestamp: 't1', source: 'manager_ui', comment: 'a' },
      { timestamp: 't2', source: 'ai_optimization', comment: 'optimizada' },
      { timestamp: 't3', source: 'manager_ui', comment: 'b' },
      { timestamp: 't4', source: 'manager_ui', comment: 'c' }
    ] as any;
    expect(countUnoptimizedFeedback(logs)).toBe(2);
  });

  it('cuenta todo el historial si nunca se ha optimizado', () => {
    const logs = [
      { timestamp: 't1', source: 'manager_ui' },
      { timestamp: 't2', source: 'manager_ui' },
      { timestamp: 't3', source: 'manager_ui' }
    ] as any;
    expect(countUnoptimizedFeedback(logs)).toBe(3);
  });

  it('devuelve 0 si la última entrada ya es una optimización', () => {
    const logs = [
      { timestamp: 't1', source: 'manager_ui' },
      { timestamp: 't2', source: 'ai_optimization' }
    ] as any;
    expect(countUnoptimizedFeedback(logs)).toBe(0);
  });

  it('aguanta undefined/vacío sin romper', () => {
    expect(countUnoptimizedFeedback(undefined)).toBe(0);
    expect(countUnoptimizedFeedback([])).toBe(0);
  });

  it('el umbral de auto-optimización es un entero positivo razonable', () => {
    expect(AUTO_OPTIMIZE_FEEDBACK_THRESHOLD).toBeGreaterThan(0);
    expect(Number.isInteger(AUTO_OPTIMIZE_FEEDBACK_THRESHOLD)).toBe(true);
  });
});

describe('resolveBandNameAndBio', () => {
  it('resuelve nombre y bio desde registeredBands', () => {
    const state = {
      registeredBands: [{ band_id: 'banda-test', nombre_banda: 'Banda Test', biografia: 'Somos una banda' }]
    };
    const { bandName, bandBio } = resolveBandNameAndBio(state, 'banda-test');
    expect(bandName).toBe('Banda Test');
    expect(bandBio).toBe('Somos una banda');
  });

  it('cae a un nombre capitalizado a partir del bandId si no hay datos', () => {
    const { bandName } = resolveBandNameAndBio({ registeredBands: [] }, 'mi-banda-nueva');
    expect(bandName).toBe('Mi-banda-nueva');
  });
});

describe('buildTemplateOptimizationPrompt', () => {
  it('incluye la plantilla actual, la instrucción del mánager y el nombre de categoría legible', () => {
    const prompt = buildTemplateOptimizationPrompt({
      bandName: 'Banda Test',
      bandBio: 'Bio de prueba',
      category: 'medios',
      currentSubject: 'Asunto actual',
      currentBody: 'Cuerpo actual',
      currentGuidelines: 'Pautas actuales',
      toneRating: 2,
      contentRating: 4,
      customInstruction: 'Sé más breve',
      globalMemory: 'Sin historial',
      feedbackCount: 5
    });

    expect(prompt).toContain('Banda Test');
    expect(prompt).toContain('Medios de Comunicación, Radio y Prensa');
    expect(prompt).toContain('Asunto actual');
    expect(prompt).toContain('Sé más breve');
    expect(prompt).toContain('2/5 estrellas');
    expect(prompt).toContain('4/5 estrellas');
  });
});
