import { describe, it, expect } from 'vitest';
import { anotarProcedencia, camposPorConfirmar, camposRellenados, instantanea, olvidarProcedencia, procedenciaValida, CONFIANZA_POR_FUENTE, emailsSinComprobar, emailsEditadosAMano, emailsNoEnviables } from '../procedenciaDatos.js';

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

describe('emailsSinComprobar', () => {
  const ahora = '2026-11-06T10:00:00.000Z';
  it('señala los emails que aportó una IA o un buscador y no los de la web, Google Maps o el catálogo', () => {
    const mapa = {
      email_contacto: { fuente: 'ia', confianza: 'baja', en: ahora },
      email_secundario: { fuente: 'web', confianza: 'alta', en: ahora },
    };
    expect(emailsSinComprobar(mapa)).toEqual(['email_contacto']);
    expect(emailsSinComprobar({ email_contacto: { fuente: 'buscador', confianza: 'media', en: ahora } })).toEqual(['email_contacto']);
    expect(emailsSinComprobar({ email_contacto: { fuente: 'places', confianza: 'alta', en: ahora }, email_secundario: { fuente: 'catalogo', confianza: 'media', en: ahora } })).toEqual([]);
  });

  it('sin procedencia (escrito a mano o un lead antiguo) no hay nada que señalar', () => {
    expect(emailsSinComprobar(undefined)).toEqual([]);
    expect(emailsSinComprobar({})).toEqual([]);
  });
});

describe('emailsEditadosAMano', () => {
  it('un email que la persona cambia deja de ser un dato de la IA: solo los cambiados', () => {
    const existente = { email_contacto: 'ia@sala.es', email_secundario: 'otro@sala.es' };
    expect(emailsEditadosAMano(existente, { email_contacto: 'real@sala.es', email_secundario: 'otro@sala.es' })).toEqual(['email_contacto']);
  });

  it('el mismo valor, o un campo que no viene en la edición, no cuenta', () => {
    const existente = { email_contacto: 'ia@sala.es', email_secundario: '' };
    expect(emailsEditadosAMano(existente, { email_contacto: ' ia@sala.es ' })).toEqual([]);
    expect(emailsEditadosAMano(existente, { notas: 'x' })).toEqual([]);
  });

  it('vaciar el email también es editarlo', () => {
    expect(emailsEditadosAMano({ email_contacto: 'ia@sala.es' }, { email_contacto: '' })).toEqual(['email_contacto']);
  });

  it('sin ficha previa, un email nuevo escrito a mano cuenta', () => {
    expect(emailsEditadosAMano(null, { email_contacto: 'a@b.es' })).toEqual(['email_contacto']);
  });
});

describe('procedenciaValida conserva la re-verificación del agente', () => {
  it('guarda verificado_en y confirmado_por_respuesta si son válidos', () => {
    const m = procedenciaValida({ email_contacto: { fuente: 'web', en: AHORA.toISOString(), verificado_en: AHORA.toISOString(), confirmado_por_respuesta: true } });
    expect(m.email_contacto.verificado_en).toBe(AHORA.toISOString());
    expect(m.email_contacto.confirmado_por_respuesta).toBe(true);
  });
  it('descarta valores que no son fecha o booleano', () => {
    const m = procedenciaValida({ email_contacto: { fuente: 'web', en: AHORA.toISOString(), verificado_en: 'ayer', confirmado_por_respuesta: 'sí' } });
    expect(m.email_contacto.verificado_en).toBeUndefined();
    expect(m.email_contacto.confirmado_por_respuesta).toBeUndefined();
  });
});

describe('emailsNoEnviables', () => {
  const dias = (n: number) => new Date(AHORA.getTime() - n * 86_400_000).toISOString();
  it('deja fuera IA, buscador y web caducada; deja pasar web reciente y lo escrito a mano', () => {
    const lead = {
      email_contacto: 'info@a.es',
      email_secundario: 'booking@a.es',
      datos_fuentes: { email_contacto: { fuente: 'web', en: dias(200) }, email_secundario: { fuente: 'web', en: dias(5) } },
    };
    expect(emailsNoEnviables(lead, AHORA)).toEqual(['email_contacto']);
    expect(emailsNoEnviables({ email_contacto: 'pepe@a.es', datos_fuentes: {} }, AHORA)).toEqual([]);
    expect(emailsNoEnviables({ email_contacto: 'x@a.es', datos_fuentes: { email_contacto: { fuente: 'ia', en: dias(1) } } }, AHORA)).toEqual(['email_contacto']);
  });
  it('una web caducada vuelve a valer cuando el agente la re-verifica', () => {
    const lead = { email_contacto: 'info@a.es', datos_fuentes: { email_contacto: { fuente: 'web', en: dias(300), verificado_en: dias(2) } } };
    expect(emailsNoEnviables(lead, AHORA)).toEqual([]);
  });
});
