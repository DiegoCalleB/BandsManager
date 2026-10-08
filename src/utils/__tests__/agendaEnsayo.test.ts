import { describe, expect, it } from 'vitest';
import { actualizarItemAgenda } from '../agendaEnsayo';

const agenda = [
  { id: 'a', titulo: 'Uno' },
  { id: 'b', titulo: 'Dos' },
] as any[];

describe('actualizarItemAgenda', () => {
  it('aplica los cambios solo al ítem indicado', () => {
    const r = actualizarItemAgenda(agenda, 'b', { evaluacion: 'bordada' });
    expect(r[1].evaluacion).toBe('bordada');
    expect(r[0]).toBe(agenda[0]);
  });
  it('no muta la agenda original', () => {
    actualizarItemAgenda(agenda, 'a', { enfoque: 'x' });
    expect(agenda[0].enfoque).toBeUndefined();
  });
  it('id inexistente → mismos contenidos', () => {
    expect(actualizarItemAgenda(agenda, 'z', { enfoque: 'x' })).toEqual(agenda);
  });
});
