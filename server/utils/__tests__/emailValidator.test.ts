import { describe, it, expect, vi, beforeEach } from 'vitest';

// DNS controlado: sin red real, el resultado no depende de la conexión ni de la carga de la máquina.
// Antes estos tests consultaban MX reales (siroco.es, etc.) y fallaban de forma intermitente.
const registros = vi.hoisted(() => ({ mx: new Map<string, any>(), a: new Map<string, any>() }));

function respuesta(mapa: Map<string, any>, dominio: string, cb: (err: any, res?: any) => void) {
  if (!mapa.has(dominio)) return cb(Object.assign(new Error('ENODATA'), { code: 'ENODATA' }));
  const v = mapa.get(dominio);
  if (v instanceof Error) return cb(v);
  return cb(null, v);
}

vi.mock('dns', () => {
  const resolveMx = (d: string, cb: any) => respuesta(registros.mx, d, cb);
  const resolve4 = (d: string, cb: any) => respuesta(registros.a, d, cb);
  return { default: { resolveMx, resolve4 }, resolveMx, resolve4 };
});

import { isValidEmailSyntax, isValidEmailDomain, isValidEmail, isValidEmailCached } from '../emailValidator.js';

beforeEach(() => {
  registros.mx.clear();
  registros.a.clear();
  registros.mx.set('siroco.es', [{ exchange: 'mx.siroco.es', priority: 10 }]);
  registros.mx.set('salahebevallekas.com', []);
});

describe('emailValidator', () => {
  describe('isValidEmailSyntax', () => {
    it('valida formatos de email estándar', () => {
      expect(isValidEmailSyntax('booking@siroco.es')).toBe(true);
      expect(isValidEmailSyntax('contacto@banda.com')).toBe(true);
      expect(isValidEmailSyntax('user.name+tag@example.co.uk')).toBe(true);
    });

    it('rechaza emails mal formados o nulos', () => {
      expect(isValidEmailSyntax('')).toBe(false);
      expect(isValidEmailSyntax(null as any)).toBe(false);
      expect(isValidEmailSyntax(undefined as any)).toBe(false);
      expect(isValidEmailSyntax('invalid-email')).toBe(false);
      expect(isValidEmailSyntax('missing@domain')).toBe(false);
      expect(isValidEmailSyntax('@nodomain.com')).toBe(false);
      expect(isValidEmailSyntax('spaces in@domain.com')).toBe(false);
    });
  });

  describe('isValidEmailDomain', () => {
    it('devuelve false limpiamente sin advertencias de consola para dominios inexistentes', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const errorSpy = vi.spyOn(console, 'error');

      const result = await isValidEmailDomain('booking@salahebevallekas.com');
      expect(result).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('devuelve false para dominios inventados o expirados', async () => {
      const result = await isValidEmailDomain('contact@balkanboomband.cat');
      expect(result).toBe(false);
    });

    it('devuelve true para dominios conocidos con registros MX válidos', async () => {
      const result = await isValidEmailDomain('booking@siroco.es');
      expect(result).toBe(true);
    });

    it('utiliza la caché para consultas repetidas', async () => {
      const first = await isValidEmailCached('test@salahebevallekas.com');
      const second = await isValidEmailCached('test@salahebevallekas.com');
      expect(first).toBe(false);
      expect(second).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('rechaza directamente si la sintaxis es inválida sin consultar DNS', async () => {
      const result = await isValidEmail('not-an-email');
      expect(result).toBe(false);
    });
  });
});
