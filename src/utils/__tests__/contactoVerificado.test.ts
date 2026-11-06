import { describe, it, expect } from 'vitest';
import { tieneEmailVerificado } from '../contactoVerificado';

const f = (fuente: string, extra = {}) => ({ email_contacto: 'info@x.es', datos_fuentes: { email_contacto: { fuente, ...extra } } });

describe('tieneEmailVerificado', () => {
  it('sin email no', () => expect(tieneEmailVerificado({ email_contacto: '' })).toBe(false));
  it('web, places y catálogo sí', () => {
    for (const fu of ['web', 'places', 'catalogo']) expect(tieneEmailVerificado(f(fu))).toBe(true);
  });
  it('IA o buscador no', () => {
    expect(tieneEmailVerificado(f('ia'))).toBe(false);
    expect(tieneEmailVerificado(f('buscador'))).toBe(false);
  });
  it('el que escribió una persona (sin procedencia) sí', () => expect(tieneEmailVerificado({ email_contacto: 'a@b.es' })).toBe(true));
  it('con aviso de dominio inexistente no', () => {
    expect(tieneEmailVerificado(f('web', { aviso: { tipo: 'dominio_inexistente', para: 'info@x.es' } }))).toBe(false);
  });
});
