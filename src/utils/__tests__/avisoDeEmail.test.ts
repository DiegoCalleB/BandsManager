import { describe, it, expect } from 'vitest';
import { avisoDeEmail, TEXTO_AVISO_EMAIL } from '../avisoDeEmail';

const aviso = (para: string) => ({ tipo: 'dominio_inexistente', para });
const lead = (email: string, para = email) => ({ email_contacto: email, datos_fuentes: { email_contacto: { fuente: 'ia', confianza: 'baja', en: '2026-10-18T12:00:00Z', aviso: aviso(para) } } });

describe('avisoDeEmail', () => {
  it('avisa cuando el email actual es el que quedó en duda (sin distinguir mayúsculas ni espacios)', () => {
    expect(avisoDeEmail(lead('info@sala.xyz'))).toBe(TEXTO_AVISO_EMAIL);
    expect(avisoDeEmail(lead('  Info@Sala.XYZ ', 'info@sala.xyz'))).toBe(TEXTO_AVISO_EMAIL);
  });

  it('si la banda edita el email, el aviso deja de aplicarse solo', () => {
    expect(avisoDeEmail({ ...lead('info@sala.xyz'), email_contacto: 'booking@sala.es' })).toBeNull();
  });

  it('sin aviso, sin procedencia o sin email, no avisa', () => {
    expect(avisoDeEmail({ email_contacto: 'a@b.es' })).toBeNull();
    expect(avisoDeEmail({ email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { fuente: 'web' } } })).toBeNull();
    expect(avisoDeEmail({ email_contacto: '', datos_fuentes: lead('a@b.es').datos_fuentes })).toBeNull();
    expect(avisoDeEmail(null)).toBeNull();
    expect(avisoDeEmail(undefined)).toBeNull();
  });

  it('ignora datos mal formados en vez de fallar', () => {
    expect(avisoDeEmail({ email_contacto: 'a@b.es', datos_fuentes: 'texto' })).toBeNull();
    expect(avisoDeEmail({ email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { aviso: { tipo: 'otro', para: 'a@b.es' } } } })).toBeNull();
    expect(avisoDeEmail({ email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { aviso: { tipo: 'dominio_inexistente', para: 5 } } } })).toBeNull();
  });

  it('el aviso del email secundario es independiente del principal', () => {
    const l = { email_contacto: 'ok@sala.es', email_secundario: 'x@raro.xyz', datos_fuentes: { email_secundario: { aviso: aviso('x@raro.xyz') } } };
    expect(avisoDeEmail(l)).toBeNull();
    expect(avisoDeEmail(l, 'email_secundario')).toBe(TEXTO_AVISO_EMAIL);
  });
});
