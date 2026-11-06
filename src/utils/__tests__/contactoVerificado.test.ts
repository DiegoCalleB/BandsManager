import { describe, it, expect } from 'vitest';
import { estadoDelEmail, tieneEmailVerificado } from '../contactoVerificado';

const f = (fuente: string, extra = {}) => ({ email_contacto: 'info@x.es', datos_fuentes: { email_contacto: { fuente, ...extra } } });

describe('estadoDelEmail', () => {
  it('sin email', () => expect(estadoDelEmail({ email_contacto: ' ' })).toBe('sin_email'));
  it('web, places y catálogo = verificado', () => {
    for (const fu of ['web', 'places', 'catalogo']) expect(estadoDelEmail(f(fu))).toBe('verificado');
  });
  it('IA o buscador = sin comprobar', () => {
    expect(estadoDelEmail(f('ia'))).toBe('sin_comprobar');
    expect(estadoDelEmail(f('buscador'))).toBe('sin_comprobar');
  });
  it('sin procedencia = estado propio: el Enviador lo trata como escrito por una persona', () => {
    expect(estadoDelEmail({ email_contacto: 'a@b.es' })).toBe('sin_procedencia');
  });
  it('con aviso de dominio inexistente = sin comprobar', () => {
    expect(estadoDelEmail(f('web', { aviso: { tipo: 'dominio_inexistente', para: 'info@x.es' } }))).toBe('sin_comprobar');
  });
  it('tieneEmailVerificado solo es cierto para verificado', () => {
    expect(tieneEmailVerificado(f('web'))).toBe(true);
    expect(tieneEmailVerificado({ email_contacto: 'a@b.es' })).toBe(false);
  });
});
