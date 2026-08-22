import { describe, it, expect } from 'vitest';
import {
  EPK_LANGUAGES,
  EPK_TRANSLATIONS,
  DEFAULT_EPK_LANGUAGE,
  isEpkLanguage,
  idiomaEpkParaLead,
} from '../epkTranslations';
import { interpolate } from '../fansTranslations';

describe('epkTranslations', () => {
  it('todos los idiomas declarados tienen su diccionario', () => {
    for (const l of EPK_LANGUAGES) {
      expect(EPK_TRANSLATIONS[l.code], `falta el diccionario de ${l.code}`).toBeDefined();
    }
    // Y al revés: ningún diccionario suelto sin entrada en el selector, que es el fallo que
    // ya arrastra fansTranslations (tiene un bloque de más que nadie referencia).
    expect(Object.keys(EPK_TRANSLATIONS).sort()).toEqual(EPK_LANGUAGES.map(l => l.code).sort());
  });

  it('ningún idioma se deja claves sin traducir', () => {
    const clavesBase = Object.keys(EPK_TRANSLATIONS[DEFAULT_EPK_LANGUAGE]).sort();
    for (const l of EPK_LANGUAGES) {
      expect(Object.keys(EPK_TRANSLATIONS[l.code]).sort(), `desajuste de claves en ${l.code}`).toEqual(clavesBase);
    }
  });

  it('ninguna traducción está vacía', () => {
    for (const l of EPK_LANGUAGES) {
      for (const [clave, valor] of Object.entries(EPK_TRANSLATIONS[l.code])) {
        expect(valor.trim(), `${l.code}.${clave} está vacía`).not.toBe('');
      }
    }
  });

  it('las variables {bandName}/{n}/{year} existen en todos los idiomas por igual', () => {
    // Si una traducción se come un {bandName}, la página no falla: muestra un texto mutilado
    // en producción y nadie se entera. Mejor que salte aquí.
    const variables = (texto: string) => (texto.match(/\{(\w+)\}/g) || []).sort();
    const base = EPK_TRANSLATIONS[DEFAULT_EPK_LANGUAGE];
    for (const l of EPK_LANGUAGES) {
      for (const clave of Object.keys(base) as (keyof typeof base)[]) {
        expect(variables(EPK_TRANSLATIONS[l.code][clave]), `${l.code}.${String(clave)}`)
          .toEqual(variables(base[clave]));
      }
    }
  });

  it('interpolate rellena las variables del diccionario del EPK', () => {
    expect(interpolate(EPK_TRANSLATIONS.en.insigniaCabecera, { bandName: 'Bakandeya' }))
      .toBe('Bakandeya — EPK / Press Kit');
    expect(interpolate(EPK_TRANSLATIONS.es.fotoPromocional, { n: '3' }))
      .toBe('Foto Promocional #3');
  });

  it('isEpkLanguage solo acepta idiomas soportados', () => {
    expect(isEpkLanguage('en')).toBe(true);
    expect(isEpkLanguage('es')).toBe(true);
    expect(isEpkLanguage('fr')).toBe(false);
    expect(isEpkLanguage(null)).toBe(false);
    expect(isEpkLanguage(undefined)).toBe(false);
    expect(isEpkLanguage('')).toBe(false);
  });
});

describe('idiomaEpkParaLead', () => {
  it('manda a inglés a los leads anglófonos', () => {
    expect(idiomaEpkParaLead({ ciudad: 'London', region: 'England' })).toBe('en');
    expect(idiomaEpkParaLead({ direccion: '12 Main St, Glasgow, Scotland' })).toBe('en');
    expect(idiomaEpkParaLead({ region: 'Estados Unidos' })).toBe('en');
    expect(idiomaEpkParaLead({ ciudad: 'Dublin', region: 'Ireland' })).toBe('en');
  });

  it('deja en español todo lo demás', () => {
    expect(idiomaEpkParaLead({ ciudad: 'Ávila', region: 'Castilla y León' })).toBe('es');
    expect(idiomaEpkParaLead({ ciudad: 'Milano', region: 'Italia' })).toBe('es');
    expect(idiomaEpkParaLead(null)).toBe('es');
    expect(idiomaEpkParaLead(undefined)).toBe('es');
    expect(idiomaEpkParaLead({})).toBe('es');
  });

  it('no confunde "usa" dentro de otra palabra con Estados Unidos', () => {
    // La keyword lleva un espacio delante justo por esto: hay topónimos y calles españolas
    // que contienen "usa" (Sousa, Tarrasa...) y no deben acabar con un EPK en inglés.
    expect(idiomaEpkParaLead({ ciudad: 'Sousa' })).toBe('es');
    expect(idiomaEpkParaLead({ direccion: 'Calle Musa 4' })).toBe('es');
  });
});
