import { describe, it, expect } from 'vitest';
import {
  elegirEmail,
  firmaBajaValida,
  idiomaDeUsuario,
  renderizarEmail,
  urlBaja,
  VENTANA_MAX_DIAS,
} from '../emailsCicloVida.js';

const AHORA = new Date('2026-10-20T12:00:00Z');
const haceDias = (n: number) => new Date(AHORA.getTime() - n * 86_400_000);
const base = { ahora: AHORA, enviados: new Set<string>(), tieneConcierto: false, tieneEpk: false };

describe('elegirEmail', () => {
  it('no escribe el primer día ni a cuentas antiguas', () => {
    expect(elegirEmail({ ...base, creadoEn: haceDias(1) })).toBeNull();
    expect(elegirEmail({ ...base, creadoEn: haceDias(VENTANA_MAX_DIAS + 1) })).toBeNull();
  });
  it('a los 2 días propone el primer concierto si no tiene ninguno', () => {
    expect(elegirEmail({ ...base, creadoEn: haceDias(2.5) })).toBe('primer_concierto');
  });
  it('si ya tiene concierto, salta al EPK a partir del día 5', () => {
    expect(elegirEmail({ ...base, creadoEn: haceDias(3), tieneConcierto: true })).toBeNull();
    expect(elegirEmail({ ...base, creadoEn: haceDias(5.5), tieneConcierto: true })).toBe('epk');
  });
  it('no repite lo ya enviado y pasa al siguiente', () => {
    const enviados = new Set(['primer_concierto']);
    expect(elegirEmail({ ...base, enviados, creadoEn: haceDias(3) })).toBeNull();
    expect(elegirEmail({ ...base, enviados, creadoEn: haceDias(6) })).toBe('epk');
    expect(elegirEmail({ ...base, enviados: new Set(['primer_concierto', 'epk']), creadoEn: haceDias(8) })).toBeNull();
  });
  it('respeta la baja y no escribe a quien ya hizo todo', () => {
    expect(elegirEmail({ ...base, enviados: new Set(['baja']), creadoEn: haceDias(6) })).toBeNull();
    expect(elegirEmail({ ...base, creadoEn: haceDias(6), tieneConcierto: true, tieneEpk: true })).toBeNull();
  });
  it('una fecha inválida no envía nada', () => {
    expect(elegirEmail({ ...base, creadoEn: 'no-es-fecha' })).toBeNull();
  });
});

describe('idiomaDeUsuario', () => {
  it('inglés solo si está guardado; el resto, español', () => {
    expect(idiomaDeUsuario({ idioma: 'en' })).toBe('en');
    expect(idiomaDeUsuario({ idioma: 'fr' })).toBe('es');
    expect(idiomaDeUsuario(null)).toBe('es');
  });
});

describe('baja firmada', () => {
  it('la firma solo vale para su usuario', () => {
    const url = new URL(urlBaja('https://bandmanager.io', 'user-1'));
    const f = url.searchParams.get('f');
    expect(url.searchParams.get('u')).toBe('user-1');
    expect(firmaBajaValida('user-1', f)).toBe(true);
    expect(firmaBajaValida('user-2', f)).toBe(false);
    expect(firmaBajaValida('user-1', 'x'.repeat(32))).toBe(false);
    expect(firmaBajaValida('user-1', undefined)).toBe(false);
  });
});

describe('renderizarEmail', () => {
  const datos = { tipo: 'epk' as const, nombre: 'Ana <b>', banda: 'Los "Tigres"', base: 'https://bandmanager.io', userId: 'u1' };
  it('en español lleva UTM, enlace de baja y escapa los datos del usuario', () => {
    const { asunto, html } = renderizarEmail({ ...datos, idioma: 'es' });
    expect(asunto).toContain('EPK');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('utm_campaign=epk');
    expect(html).toContain('/api/emails/baja?u=u1');
    expect(html).toContain('Darme de baja');
    expect(html).not.toContain('Ana <b>');
    expect(html).toContain('Ana &lt;b&gt;');
  });
  it('en inglés traduce asunto, texto y baja', () => {
    const { asunto, html } = renderizarEmail({ ...datos, tipo: 'primer_concierto', idioma: 'en' });
    expect(asunto).toBe('Your first gig on BandManager, in 2 minutes');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('Add my first gig');
  });
});
