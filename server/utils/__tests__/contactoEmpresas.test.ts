import { describe, expect, it } from 'vitest';
import { validarContactoEmpresa } from '../contactoEmpresas';

const base = { empresa: 'Agencia Norte', email: ' Info@Norte.COM ', tipo: 'agencia', mensaje: 'Somos 8 bandas', consentimiento: true, idioma: 'es' };

describe('validarContactoEmpresa', () => {
  it('acepta un contacto válido y lo normaliza', () => {
    const r = validarContactoEmpresa(base);
    expect(r).toEqual({ ok: true, contacto: { empresa: 'Agencia Norte', email: 'info@norte.com', tipo: 'agencia', mensaje: 'Somos 8 bandas', idioma: 'es' } });
  });
  it('exige email válido, empresa y consentimiento', () => {
    expect(validarContactoEmpresa({ ...base, email: 'nada' })).toMatchObject({ ok: false });
    expect(validarContactoEmpresa({ ...base, empresa: '   ' })).toMatchObject({ ok: false });
    expect(validarContactoEmpresa({ ...base, consentimiento: 'true' })).toMatchObject({ ok: false });
    expect(validarContactoEmpresa({ ...base, consentimiento: undefined })).toMatchObject({ ok: false });
  });
  it('un tipo desconocido pasa a «otro» y el mensaje es opcional', () => {
    const r = validarContactoEmpresa({ ...base, tipo: 'hackeo', mensaje: undefined });
    expect(r).toMatchObject({ ok: true, contacto: { tipo: 'otro', mensaje: '' } });
  });
  it('recorta los textos largos y colapsa saltos de línea', () => {
    const r = validarContactoEmpresa({ ...base, empresa: 'A\nB'.repeat(100), mensaje: 'x'.repeat(5000) });
    if (!r.ok) throw new Error('debería ser válido');
    expect(r.contacto.empresa.length).toBeLessThanOrEqual(120);
    expect(r.contacto.empresa).not.toMatch(/\n/);
    expect(r.contacto.mensaje.length).toBe(1000);
  });
  it.each([null, undefined, 'texto', 42, []])('un cuerpo %j no es válido', (b) => {
    expect(validarContactoEmpresa(b)).toMatchObject({ ok: false });
  });
});
