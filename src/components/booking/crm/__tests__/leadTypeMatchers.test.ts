import { describe, expect, it } from 'vitest';
import { matchesGruposType, matchesMedioType } from '../leadTypeMatchers';
import type { Lead } from '../../../../types';

const lead = (fields: Partial<Lead>): Lead => ({ id: 'l1', nombre_sala: '', ...fields }) as Lead;

describe('matchesMedioType', () => {
  it('accepts every lead without a filter or with "todos"', () => {
    expect(matchesMedioType(lead({ nombre_sala: 'Sala Lola' }), '')).toBe(true);
    expect(matchesMedioType(lead({ nombre_sala: 'Sala Lola' }), 'todos')).toBe(true);
  });

  it('classifies radio, television and press by their keywords', () => {
    expect(matchesMedioType(lead({ nombre_sala: 'Emisora Sur' }), 'radio')).toBe(true);
    expect(matchesMedioType(lead({ nombre_sala: 'Televisión Local' }), 'tv')).toBe(true);
    expect(matchesMedioType(lead({ nombre_sala: 'Revista Rock' }), 'prensa')).toBe(true);
  });

  it('does not classify an unrelated venue as radio or television', () => {
    expect(matchesMedioType(lead({ nombre_sala: 'Sala Lola' }), 'radio')).toBe(false);
    expect(matchesMedioType(lead({ nombre_sala: 'Sala Lola' }), 'tv')).toBe(false);
  });
});

describe('matchesGruposType', () => {
  it('accepts every lead without a filter or with "todos"', () => {
    expect(matchesGruposType(lead({ nombre_sala: 'Cualquiera' }), 'todos')).toBe(true);
  });

  it('is a pure function of the lead and the filter', () => {
    const candidate = lead({ nombre_sala: 'Sello Indie', notas: 'discográfica' });
    expect(matchesGruposType(candidate, 'sello')).toBe(matchesGruposType(candidate, 'sello'));
  });
});
