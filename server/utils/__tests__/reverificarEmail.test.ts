import { describe, it, expect } from 'vitest';
import { decidirReverificacion, type LeadAReverificar } from '../reverificarEmail.js';

const AHORA = new Date('2026-11-08T03:00:00Z');
const iso = AHORA.toISOString();
const base: LeadAReverificar = { email_contacto: '', email_secundario: '', instagram: '', telefono: '', datos_fuentes: {} };
const lectura = (extra = {}) => ({ paginas: 3, email: '', evidencia: '', emailsVistos: [] as string[], instagram: '', telefono: '', inicio: '', fin: '', ...extra });

describe('decidirReverificacion', () => {
  it('si la web no abre no toca nada', () => {
    const r = decidirReverificacion({ ...base, email_contacto: 'info@f.es' }, lectura({ paginas: 0 }), { ahora: AHORA });
    expect(r.resultado).toBe('web_caida');
    expect(r.cambios).toEqual({});
  });

  it('el email guardado sigue escrito en su web: se re-verifica con fecha y página', () => {
    const lead = { ...base, email_contacto: 'Info@F.es', datos_fuentes: { email_contacto: { fuente: 'web', confianza: 'alta', en: '2026-01-01T00:00:00.000Z' } } };
    const r = decidirReverificacion(lead, lectura({ emailsVistos: ['info@f.es'], evidencia: 'https://f.es/contacto' }), { ahora: AHORA });
    expect(r.resultado).toBe('reverificado');
    const p = (r.cambios.datos_fuentes as Record<string, Record<string, unknown>>).email_contacto;
    expect(p.verificado_en).toBe(iso);
    expect(p.fuente).toBe('web');
    expect(p.en).toBe('2026-01-01T00:00:00.000Z');
  });

  it('un email de IA que ahora aparece en su web pasa a tener evidencia web', () => {
    const lead = { ...base, email_contacto: 'booking@f.es', datos_fuentes: { email_contacto: { fuente: 'ia', confianza: 'baja', en: '2026-01-01T00:00:00.000Z' } } };
    const r = decidirReverificacion(lead, lectura({ emailsVistos: ['booking@f.es'] }), { ahora: AHORA });
    const p = (r.cambios.datos_fuentes as Record<string, Record<string, unknown>>).email_contacto;
    expect(p.fuente).toBe('web');
    expect(p.confianza).toBe('alta');
  });

  it('sin email guardado y la web publica uno válido: se añade con su evidencia', () => {
    const r = decidirReverificacion(base, lectura({ email: 'hola@f.es', evidencia: 'https://f.es/aviso-legal', emailsVistos: ['hola@f.es'] }), { ahora: AHORA });
    expect(r.resultado).toBe('nuevo');
    expect(r.cambios.email_contacto).toBe('hola@f.es');
  });

  it('el email guardado ya no aparece y hay otro: no se pisa, el nuevo va al secundario', () => {
    const lead = { ...base, email_contacto: 'viejo@f.es', datos_fuentes: { email_contacto: { fuente: 'web', confianza: 'alta', en: '2026-01-01T00:00:00.000Z' } } };
    const r = decidirReverificacion(lead, lectura({ email: 'nuevo@f.es', evidencia: 'https://f.es', emailsVistos: ['nuevo@f.es'] }), { ahora: AHORA });
    expect(r.resultado).toBe('cambio_detectado');
    expect(r.cambios.email_contacto).toBeUndefined();
    expect(r.cambios.email_secundario).toBe('nuevo@f.es');
  });

  it('el email guardado desaparece sin sustituto: no se borra (caducará solo)', () => {
    const lead = { ...base, email_contacto: 'viejo@f.es' };
    const r = decidirReverificacion(lead, lectura(), { ahora: AHORA });
    expect(r.resultado).toBe('desaparecido');
    expect(r.cambios.email_contacto).toBeUndefined();
  });

  it('si el festival respondió desde ese buzón queda confirmado', () => {
    const lead = { ...base, email_contacto: 'info@f.es', datos_fuentes: { email_contacto: { fuente: 'web', confianza: 'alta', en: '2026-01-01T00:00:00.000Z' } } };
    const r = decidirReverificacion(lead, lectura(), { ahora: AHORA, respondio: true });
    expect((r.cambios.datos_fuentes as Record<string, Record<string, unknown>>).email_contacto.confirmado_por_respuesta).toBe(true);
  });

  it('dominio sin MX: deja el aviso que ya entiende la app y el Enviador', () => {
    const lead = { ...base, email_contacto: 'info@f.es', datos_fuentes: { email_contacto: { fuente: 'web', confianza: 'alta', en: '2026-01-01T00:00:00.000Z' } } };
    const r = decidirReverificacion(lead, lectura({ emailsVistos: ['info@f.es'] }), { ahora: AHORA, mx: false });
    expect((r.cambios.datos_fuentes as Record<string, Record<string, unknown>>).email_contacto.aviso).toEqual({ tipo: 'dominio_inexistente', para: 'info@f.es' });
  });

  it('rellena Instagram, teléfono y fechas futuras solo si están vacíos', () => {
    const r = decidirReverificacion({ ...base, telefono: '910000000' }, lectura({ instagram: 'festi', telefono: '600000000', inicio: '2027-07-01', fin: '2027-07-03' }), { ahora: AHORA });
    expect(r.cambios.instagram).toBe('@festi');
    expect(r.cambios.telefono).toBeUndefined();
    expect(r.cambios.festival_start_date).toBe('2027-07-01');
  });

  it('no guarda fechas de ediciones pasadas', () => {
    const r = decidirReverificacion(base, lectura({ inicio: '2025-07-01', fin: '2025-07-03' }), { ahora: AHORA });
    expect(r.cambios.festival_start_date).toBeUndefined();
  });
});
