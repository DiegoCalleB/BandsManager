import { describe, expect, it } from 'vitest';
import { agendaASetlist, agendaItemASetlistItem } from '../agendaASetlist';
import type { RehearsalAgendaItem } from '../../types';

const item = (p: Partial<RehearsalAgendaItem>): RehearsalAgendaItem => ({
  id: 'a1',
  tipo: 'cancion',
  titulo: 'Tema',
  duracionEstimadaMin: 5,
  ...p,
});

describe('agendaItemASetlistItem', () => {
  it('una canción con songId sigue siendo canción y conserva el id', () => {
    const r = agendaItemASetlistItem(item({ songId: 's1', enfoque: 'Segunda voz' }));
    expect(r).toMatchObject({ id: 'a1', tipoItem: 'cancion', songId: 's1', notas: 'Segunda voz' });
  });
  it('una canción sin songId pasa a bloque (no rompe el visor)', () => {
    const r = agendaItemASetlistItem(item({ songId: undefined }));
    expect(r).toMatchObject({ tipoItem: 'bloque', bloqueSubtipo: 'otro', tituloCustom: 'Tema' });
  });
  it('pausa → descanso, improvisación → solo, calentamiento → otro', () => {
    expect(agendaItemASetlistItem(item({ tipo: 'pausa' })).bloqueSubtipo).toBe('descanso');
    expect(agendaItemASetlistItem(item({ tipo: 'improvisacion' })).bloqueSubtipo).toBe('solo_performance');
    expect(agendaItemASetlistItem(item({ tipo: 'calentamiento' })).bloqueSubtipo).toBe('otro');
  });
});

describe('agendaASetlist', () => {
  it('mantiene el orden y el tamaño de la agenda y no mezcla ids con setlists reales', () => {
    const s = agendaASetlist({ id: 'r1', band_id: 'b1', fecha: '2026-10-08' }, [
      item({ id: 'x', songId: 's1' }),
      item({ id: 'y', tipo: 'pausa' }),
    ]);
    expect(s.id).toBe('ensayo-r1');
    expect(s.band_id).toBe('b1');
    expect(s.items.map((i) => i.id)).toEqual(['x', 'y']);
  });
});
