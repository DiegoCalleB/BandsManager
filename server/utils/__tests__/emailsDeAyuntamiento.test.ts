import { describe, it, expect } from 'vitest';
import { rolDeEmailMunicipal, elegirEmailDeAyuntamiento } from '../emailsDeAyuntamiento.js';

describe('rolDeEmailMunicipal', () => {
  it('clasifica los buzones que sirven para proponer un concierto', () => {
    expect(rolDeEmailMunicipal('festejos@ayto.es')).toBe('festejos');
    expect(rolDeEmailMunicipal('cultura@ayto.es')).toBe('cultura');
    expect(rolDeEmailMunicipal('juventud@ayto.es')).toBe('juventud');
    expect(rolDeEmailMunicipal('turismo@ayto.es')).toBe('turismo');
    expect(rolDeEmailMunicipal('info@ayto.es')).toBe('general');
    expect(rolDeEmailMunicipal('ayuntamiento@ayto.es')).toBe('general');
    expect(rolDeEmailMunicipal('alcaldia@ayto.es')).toBe('general');
  });
  it('descarta personas y áreas que no contratan música', () => {
    for (const e of ['maria.garcia@ayto.es', 'intervencion@ayto.es', 'urbanismo@ayto.es', 'policia@ayto.es', 'prensa@ayto.es', 'rrhh@ayto.es', 'tesoreria@ayto.es', 'secretaria@ayto.es', 'padron@ayto.es']) {
      expect(rolDeEmailMunicipal(e)).toBe('otro');
    }
  });
  it('reconoce palabras en gallego, catalán y euskera', () => {
    expect(rolDeEmailMunicipal('cultura@concello.gal')).toBe('cultura');
    expect(rolDeEmailMunicipal('festes@ajuntament.cat')).toBe('festejos');
    expect(rolDeEmailMunicipal('kultura@udala.eus')).toBe('cultura');
  });
});

describe('elegirEmailDeAyuntamiento', () => {
  const web = 'https://www.ayuntamientodeejemplo.es/';
  const c = (email: string, pagina = web) => ({ email, pagina });
  it('prefiere festejos, luego cultura, luego juventud, luego general', () => {
    const r = elegirEmailDeAyuntamiento([c('info@ayuntamientodeejemplo.es'), c('cultura@ayuntamientodeejemplo.es'), c('festejos@ayuntamientodeejemplo.es')], web);
    expect(r?.email).toBe('festejos@ayuntamientodeejemplo.es');
    expect(r?.rol).toBe('festejos');
  });
  it('solo del dominio del ayuntamiento', () => {
    expect(elegirEmailDeAyuntamiento([c('cultura@gmail.com'), c('info@otraweb.com')], web)).toBeNull();
  });
  it('acepta el dominio de la diputación o sede (mismo municipio) cuando coincide la marca', () => {
    expect(elegirEmailDeAyuntamiento([c('info@ejemplo.es')], 'https://www.ejemplo.es/')?.email).toBe('info@ejemplo.es');
  });
  it('sin buzón válido, null: nunca se inventa', () => {
    expect(elegirEmailDeAyuntamiento([c('maria@ayuntamientodeejemplo.es'), c('urbanismo@ayuntamientodeejemplo.es')], web)).toBeNull();
  });
});
