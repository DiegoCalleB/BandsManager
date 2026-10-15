import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  LONGITUD_CODIGO_REFERIDO,
  VENTANA_ALTA_RECIENTE_HORAS,
  debeMostrarInsignia,
  decidirReferido,
  esAltaReciente,
  esPlanGratuito,
  generarCodigoReferido,
  normalizarCodigoReferido,
  urlInsignia,
  urlInvitacion,
  type PlanNormalizado,
} from '../referidos';
import { PLANS } from '../../../src/utils/planPermissions';

describe('insignia por plan', () => {
  it('la llevan los planes gratuitos y la quitan los de pago', () => {
    for (const p of ['promo', 'promo_plus', 'ensayo'] as PlanNormalizado[]) expect(debeMostrarInsignia(p)).toBe(true);
    for (const p of ['local', 'de_gira', 'cabeza_de_cartel'] as PlanNormalizado[]) expect(debeMostrarInsignia(p)).toBe(false);
  });

  it('coincide con los planes de «0€» de planPermissions (si cambia un precio, este test avisa)', () => {
    for (const plan of Object.values(PLANS)) {
      const gratis = plan.price.startsWith('0€');
      expect(esPlanGratuito(plan.id), `${plan.id} (${plan.price})`).toBe(gratis);
    }
  });
});

describe('códigos de referido', () => {
  it('genera 8 caracteres sin ambiguos y que se vuelven a normalizar', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigoReferido((n) => crypto.randomBytes(n));
      expect(c).toHaveLength(LONGITUD_CODIGO_REFERIDO);
      expect(c).not.toMatch(/[01OIL]/);
      expect(normalizarCodigoReferido(c)).toBe(c);
    }
  });

  it('acepta también los códigos hexadecimales de la migración y normaliza mayúsculas/espacios', () => {
    expect(normalizarCodigoReferido(' a3f9c21b ')).toBe('A3F9C21B');
    expect(normalizarCodigoReferido('A3F9C21B')).toBe('A3F9C21B');
  });

  it('rechaza lo que no es un código', () => {
    for (const malo of ['', 'ABC', 'A3F9C21B9', 'A3F9-21B', "A3F9C21'", '<script>', undefined, null, 12345678, {}]) {
      expect(normalizarCodigoReferido(malo)).toBeNull();
    }
  });
});

describe('enlaces', () => {
  it('la insignia lleva el código y la procedencia (UTM)', () => {
    const u = new URL(urlInsignia('https://bandmanager.io/', 'a3f9c21b', 'epk'));
    expect(u.origin + u.pathname).toBe('https://bandmanager.io/');
    expect(u.searchParams.get('ref')).toBe('A3F9C21B');
    expect(u.searchParams.get('utm_source')).toBe('insignia');
    expect(u.searchParams.get('utm_medium')).toBe('epk');
  });

  it('sin código válido la insignia sigue funcionando (sin ref)', () => {
    for (const codigo of [null, undefined, '', 'raro', "'; drop"]) {
      const u = new URL(urlInsignia('https://bandmanager.io', codigo, 'fans'));
      expect(u.searchParams.has('ref')).toBe(false);
      expect(u.searchParams.get('utm_medium')).toBe('fans');
    }
  });

  it('la invitación lleva el código', () => {
    expect(new URL(urlInvitacion('https://bandmanager.io', 'ABCD2345')).searchParams.get('ref')).toBe('ABCD2345');
  });
});

describe('decidirReferido', () => {
  const base = { codigo: 'ABCD2345', bandaDelCodigo: 'band-a', bandaNueva: 'band-b', referidoPorActual: null };

  it('atribuye un alta nueva a otra banda', () => {
    expect(decidirReferido(base)).toEqual({ ok: true });
  });

  it('no deja auto-referirse, ni con otro prefijo de id', () => {
    expect(decidirReferido({ ...base, bandaNueva: 'band-a' })).toEqual({ ok: false, motivo: 'auto_referido' });
    expect(decidirReferido({ ...base, bandaNueva: 'reg-a' })).toEqual({ ok: false, motivo: 'auto_referido' });
    expect(decidirReferido({ ...base, bandaNueva: 'A' })).toEqual({ ok: false, motivo: 'auto_referido' });
  });

  it('la primera atribución manda: no se reescribe', () => {
    expect(decidirReferido({ ...base, referidoPorActual: 'band-z' })).toEqual({ ok: false, motivo: 'ya_referida' });
  });

  it('sin código o con un código que no existe, no hay atribución', () => {
    expect(decidirReferido({ ...base, codigo: null })).toEqual({ ok: false, motivo: 'sin_codigo' });
    expect(decidirReferido({ ...base, bandaDelCodigo: null })).toEqual({ ok: false, motivo: 'codigo_desconocido' });
  });
});

describe('esAltaReciente', () => {
  const ahora = new Date('2026-10-16T12:00:00Z');
  it('vale para las últimas 48 h', () => {
    expect(esAltaReciente('2026-10-16T11:59:00Z', ahora)).toBe(true);
    expect(esAltaReciente('2026-10-14T12:01:00Z', ahora)).toBe(true);
    expect(VENTANA_ALTA_RECIENTE_HORAS).toBe(48);
  });
  it('no vale para bandas antiguas', () => {
    expect(esAltaReciente('2026-10-14T11:59:00Z', ahora)).toBe(false);
    expect(esAltaReciente('2026-01-01T00:00:00Z', ahora)).toBe(false);
  });
  it('no vale para fechas futuras lejanas, basura ni vacío', () => {
    expect(esAltaReciente('2026-10-17T12:00:00Z', ahora)).toBe(false);
    for (const raro of ['mañana', '', null, undefined, 42, {}]) expect(esAltaReciente(raro, ahora)).toBe(false);
  });
});
