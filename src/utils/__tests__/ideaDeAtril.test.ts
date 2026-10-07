import { describe, it, expect } from 'vitest';
import { crearIdeaDeAtril, ideasCompatiblesConPistas } from '../ideaDeAtril';

const base = { id: 'i1', titulo: 'Riff', audioUrl: 'u', subidoPor: 'diego', fecha: '2026-01-01' };

describe('crearIdeaDeAtril', () => {
  it('marca el origen y guarda sobre qué pistas se grabó, sin duplicados', () => {
    const i = crearIdeaDeAtril({ ...base, sobrePistas: ['bajo', 'bajo', 'bateria'], offsetSegundos: -0.12 });
    expect(i.origen).toBe('atril');
    expect(i.sobrePistas).toEqual(['bajo', 'bateria']);
    expect(i.offsetSegundos).toBe(-0.12);
  });
  it('en seco no lleva sobrePistas ni offset', () => {
    const i = crearIdeaDeAtril(base);
    expect(i.sobrePistas).toBeUndefined();
    expect(i.offsetSegundos).toBeUndefined();
  });
  it('offset inválido se queda en 0', () => {
    expect(crearIdeaDeAtril({ ...base, sobrePistas: ['a'], offsetSegundos: NaN }).offsetSegundos).toBe(0);
  });
});

describe('ideasCompatiblesConPistas', () => {
  const a = crearIdeaDeAtril({ ...base, id: 'a', sobrePistas: ['bajo'] });
  const seca = crearIdeaDeAtril({ ...base, id: 'seca' });
  const subida = { ...base, id: 'sub', seccion: 'general' as const };
  it('solo ideas del Atril: las compatibles con las pistas y las grabadas en seco', () => {
    expect(ideasCompatiblesConPistas([a, seca, subida], ['bajo']).map((i) => i.id)).toEqual(['a', 'seca']);
    expect(ideasCompatiblesConPistas([a, seca, subida], ['voz']).map((i) => i.id)).toEqual(['seca']);
  });
});
