import { describe, it, expect } from 'vitest';
import { anotarProcedencia, camposPorConfirmar, camposRellenados, instantanea, olvidarProcedencia, procedenciaValida, CONFIANZA_POR_FUENTE } from '../procedenciaDatos.js';

const AHORA = new Date('2026-10-18T12:00:00Z');

describe('camposRellenados', () => {
  it('detecta solo los campos que estaban vacíos y ahora tienen valor', () => {
    const antes = instantanea({ email_contacto: '', telefono: '910000000', aforo: 0, website: undefined, instagram: null });
    const ahora = instantanea({ email_contacto: 'booking@sala.es', telefono: '910000000', aforo: 300, website: 'https://sala.es', instagram: null });
    expect(camposRellenados(antes, ahora).sort()).toEqual(['aforo', 'email_contacto', 'website']);
  });

  it('un campo que ya tenía valor no cuenta aunque cambie', () => {
    expect(camposRellenados(instantanea({ telefono: '1' }), instantanea({ telefono: '2' }))).toEqual([]);
  });

  it('ignora campos que no son enriquecibles', () => {
    expect(camposRellenados(instantanea({}), instantanea({ pitch_generado: 'hola', notas: 'x' } as object))).toEqual([]);
  });
});

describe('anotarProcedencia', () => {
  it('anota fuente, confianza y momento, y no modifica el mapa de partida', () => {
    const base = {};
    const mapa = anotarProcedencia(base, ['email_contacto'], 'ia', AHORA);
    expect(mapa).toEqual({ email_contacto: { fuente: 'ia', confianza: 'baja', en: AHORA.toISOString() } });
    expect(base).toEqual({});
  });

  it('conserva lo anotado antes y sobrescribe el campo que se vuelve a rellenar', () => {
    const antes = anotarProcedencia({}, ['telefono', 'website'], 'places', AHORA);
    const despues = anotarProcedencia(antes, ['website'], 'web', new Date('2026-10-19T00:00:00Z'));
    expect(despues.telefono.fuente).toBe('places');
    expect(despues.website).toMatchObject({ fuente: 'web', confianza: 'alta' });
  });

  it('ignora campos desconocidos, incluidos los que intentan colarse en el prototipo', () => {
    const mapa = anotarProcedencia({}, ['__proto__', 'constructor', 'notas', 'aforo'], 'web', AHORA);
    expect(Object.keys(mapa)).toEqual(['aforo']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('la confianza sale de la fuente: la IA nunca es «alta»', () => {
    expect(CONFIANZA_POR_FUENTE.ia).toBe('baja');
    expect(CONFIANZA_POR_FUENTE.places).toBe('alta');
  });
});

describe('procedenciaValida (entrada no fiable)', () => {
  it('descarta lo que no es un objeto, los campos y fuentes desconocidos y las fechas inválidas', () => {
    expect(procedenciaValida(null)).toEqual({});
    expect(procedenciaValida('texto')).toEqual({});
    expect(procedenciaValida([1, 2])).toEqual({});
    const sucia = {
      email_contacto: { fuente: 'ia', en: AHORA.toISOString() },
      telefono: { fuente: 'inventada', en: AHORA.toISOString() },
      website: { fuente: 'web', en: 'ayer' },
      notas: { fuente: 'web', en: AHORA.toISOString() },
      instagram: 'web',
    };
    expect(Object.keys(procedenciaValida(sucia))).toEqual(['email_contacto']);
  });

  it('nadie se puede apuntar una confianza que su fuente no tiene', () => {
    const mapa = procedenciaValida({ email_contacto: { fuente: 'ia', confianza: 'alta', en: AHORA.toISOString() } });
    expect(mapa.email_contacto.confianza).toBe('baja');
  });
});

describe('olvidarProcedencia y camposPorConfirmar', () => {
  it('al editar a mano un campo deja de figurar como enriquecido', () => {
    const mapa = anotarProcedencia({}, ['email_contacto', 'telefono'], 'ia', AHORA);
    expect(Object.keys(olvidarProcedencia(mapa, ['email_contacto']))).toEqual(['telefono']);
  });

  it('solo los datos de una IA quedan por confirmar', () => {
    const mapa = anotarProcedencia(anotarProcedencia({}, ['email_contacto'], 'ia', AHORA), ['website', 'telefono'], 'places', AHORA);
    expect(camposPorConfirmar(mapa)).toEqual(['email_contacto']);
    expect(camposPorConfirmar(undefined)).toEqual([]);
  });
});

describe('avisos de un dato', () => {
  const con = (aviso: unknown) => ({ email_contacto: { fuente: 'ia', en: AHORA.toISOString(), aviso } });

  it('conserva un aviso válido ligado al valor', () => {
    expect(procedenciaValida(con({ tipo: 'dominio_inexistente', para: 'a@b.xyz' })).email_contacto.aviso).toEqual({ tipo: 'dominio_inexistente', para: 'a@b.xyz' });
  });

  it('descarta avisos de un tipo desconocido, sin valor, vacíos o desmesurados', () => {
    for (const aviso of [{ tipo: 'otro', para: 'a@b.xyz' }, { tipo: 'dominio_inexistente' }, { tipo: 'dominio_inexistente', para: '' }, { tipo: 'dominio_inexistente', para: 'a'.repeat(300) }, 'texto', null]) {
      expect(procedenciaValida(con(aviso)).email_contacto.aviso).toBeUndefined();
    }
  });

  it('volver a rellenar el campo borra el aviso anterior', () => {
    const mapa = anotarProcedencia(procedenciaValida(con({ tipo: 'dominio_inexistente', para: 'a@b.xyz' })), ['email_contacto'], 'web', AHORA);
    expect(mapa.email_contacto.aviso).toBeUndefined();
  });
});
