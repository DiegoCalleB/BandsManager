import { describe, it, expect } from 'vitest';
import { esLaMismaSala, estadoDeGoogle } from '../estadoNegocio.js';

describe('estadoDeGoogle', () => {
  it('traduce los tres estados que conocemos', () => {
    expect(estadoDeGoogle('OPERATIONAL')).toBe('operativo');
    expect(estadoDeGoogle('CLOSED_TEMPORARILY')).toBe('cerrado_temporal');
    expect(estadoDeGoogle('CLOSED_PERMANENTLY')).toBe('cerrado_permanente');
  });
  it('lo desconocido no es un estado', () => {
    expect(estadoDeGoogle(undefined)).toBeNull();
    expect(estadoDeGoogle('BUSINESS_STATUS_UNSPECIFIED')).toBeNull();
  });
});

describe('esLaMismaSala', () => {
  it('con place_id manda el id, aunque el nombre cambie', () => {
    expect(esLaMismaSala({ place_id: 'A', nombre: 'Sala Uno' }, { id: 'A', nombre: 'Otro nombre' })).toBe(true);
    expect(esLaMismaSala({ place_id: 'A', nombre: 'Sala Uno' }, { id: 'B', nombre: 'Sala Uno' })).toBe(false);
  });
  it('sin place_id exige que el nombre de una esté contenido en el de la otra', () => {
    expect(esLaMismaSala({ place_id: null, nombre: 'Moby Dick' }, { id: 'X', nombre: 'Sala Moby Dick Club' })).toBe(true);
    expect(esLaMismaSala({ place_id: null, nombre: 'Moby Dick' }, { id: 'X', nombre: 'Bar La Esquina' })).toBe(false);
  });
  it('un nombre sin palabras comparables no coincide con nada', () => {
    expect(esLaMismaSala({ place_id: null, nombre: 'Q' }, { id: 'X', nombre: 'Q' })).toBe(false);
  });
});

describe('cierre: ocultar o avisar', async () => {
  const { ocultaPorCierre, posiblementeCerrada } = await import('../estadoNegocio.js');

  it('una sala que Google da por cerrada y nadie ha contactado se oculta', () => {
    const s = { estado_negocio: 'cerrado_permanente' as const, bandas_con_respuesta: 0 };
    expect(ocultaPorCierre(s)).toBe(true);
    expect(posiblementeCerrada(s)).toBe(false);
  });

  it('si respondió a alguna banda, no se oculta: se enseña con aviso', () => {
    const s = { estado_negocio: 'cerrado_permanente' as const, bandas_con_respuesta: 1 };
    expect(ocultaPorCierre(s)).toBe(false);
    expect(posiblementeCerrada(s)).toBe(true);
  });

  it('abierta, cerrada temporalmente o sin verificar: ni se oculta ni se avisa', () => {
    for (const estado_negocio of ['operativo', 'cerrado_temporal', 'sin_verificar', undefined] as const) {
      expect(ocultaPorCierre({ estado_negocio, bandas_con_respuesta: 0 })).toBe(false);
      expect(posiblementeCerrada({ estado_negocio, bandas_con_respuesta: 3 })).toBe(false);
    }
  });
});
