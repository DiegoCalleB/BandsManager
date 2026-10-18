import { describe, it, expect } from 'vitest';
import { crearIdeaDeAtril, ideasCompatiblesConPistas, pistasBaseDeIdea, ideaConPistasBase, tomasDeCancion, pistasParaToma, ideasConFondo } from '../ideaDeAtril';

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

describe('pistasBaseDeIdea / ideaConPistasBase', () => {
  const stems = ['drums', 'bass', 'vocals'].map((id) => ({ id, nombre: id, audioUrl: `${id}.mp3` }));
  const toma = { ...base, seccion: 'general' as const };

  it('guitarra sobre batería: la toma solo lleva el stem elegido', () => {
    const conBase = ideaConPistasBase(toma, ['drums']);
    expect(pistasBaseDeIdea(conBase, stems).pistas.map((p) => p.id)).toEqual(['drums']);
    expect(conBase.offsetSegundos).toBe(0);
  });
  it('conserva el desfase al cambiar de fondo y sin duplicados', () => {
    const r = ideaConPistasBase({ ...toma, sobrePistas: ['bass'], offsetSegundos: 0.12 }, ['drums', 'drums', 'bass']);
    expect(r.sobrePistas).toEqual(['drums', 'bass']);
    expect(r.offsetSegundos).toBe(0.12);
  });
  it('sin ids la deja en seco', () => {
    const r = ideaConPistasBase({ ...toma, sobrePistas: ['drums'], offsetSegundos: 0.1 }, []);
    expect('sobrePistas' in r).toBe(false);
    expect('offsetSegundos' in r).toBe(false);
  });
  it('un stem borrado sale en faltan y el resto sigue sonando', () => {
    const r = pistasBaseDeIdea({ ...toma, sobrePistas: ['drums', 'guitar'] }, stems);
    expect(r.pistas.map((p) => p.id)).toEqual(['drums']);
    expect(r.faltan).toEqual(['guitar']);
  });
});

describe('tomas con fondo', () => {
  const stems = [
    { id: 'v', nombre: 'Voz', audioUrl: 'v.mp3' },
    { id: 'd', nombre: 'Batería', audioUrl: 'd.mp3' },
    { id: 'b', nombre: 'Bajo', audioUrl: 'b.mp3' },
  ] as any;
  const toma = { id: 't1', titulo: 'Guitarra', audioUrl: 't.webm', sobrePistas: ['d', 'x'] } as any;

  it('tomasDeCancion excluye la idea de Iris y las ideas sin audio', () => {
    const iris = { id: 'i', audioUrl: 'u', pistas: stems } as any;
    const motor = { id: 'm', audioUrl: 'u', stemEngineUsed: 'demucs' } as any;
    const vacia = { id: 'e', audioUrl: '' } as any;
    expect(tomasDeCancion([iris, motor, vacia, toma]).map((i) => i.id)).toEqual(['t1']);
  });

  it('pistasParaToma = solo los stems del fondo que existen + la toma al final', () => {
    const r = pistasParaToma(toma, stems);
    expect(r.map((p) => p.id)).toEqual(['d', 'toma-t1']);
    expect(r[1].audioUrl).toBe('t.webm');
  });

  it('una toma en seco suena sola', () => {
    expect(pistasParaToma({ id: 's', titulo: 'x', audioUrl: 'a' } as any, stems).map((p) => p.id)).toEqual(['toma-s']);
  });

  it('ideasConFondo cambia solo la toma pedida y [] la deja en seco', () => {
    const otra = { id: 't2', titulo: 'o', audioUrl: 'o', sobrePistas: ['v'], offsetSegundos: 1 } as any;
    const r = ideasConFondo([toma, otra], 't1', ['b', 'd']);
    expect(r[0].sobrePistas).toEqual(['b', 'd']);
    expect(r[1]).toBe(otra);
    expect(ideasConFondo([otra], 't2', [])[0].sobrePistas).toBeUndefined();
  });
});
