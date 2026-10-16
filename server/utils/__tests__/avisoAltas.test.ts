import { describe, expect, it } from 'vitest';
import { correoAvisoAlta, destinoAvisoAltas } from '../avisoAltas';

describe('destinoAvisoAltas', () => {
  it('usa el buzón del proyecto por defecto', () => {
    expect(destinoAvisoAltas({})).toBe('bandmanager.pro.io@gmail.com');
  });
  it('permite cambiarlo con ADMIN_NOTIFY_EMAIL', () => {
    expect(destinoAvisoAltas({ ADMIN_NOTIFY_EMAIL: ' otro@x.com ' })).toBe('otro@x.com');
  });
  it('ignora un valor que no es un email', () => {
    expect(destinoAvisoAltas({ ADMIN_NOTIFY_EMAIL: 'nada' })).toBe('bandmanager.pro.io@gmail.com');
  });
});

describe('correoAvisoAlta', () => {
  it('lleva el email y el origen en asunto y cuerpo', () => {
    const c = correoAvisoAlta({ tipo: 'registro', email: 'a@b.com', nombre: 'Mi Banda', origen: 'registro en la app' });
    expect(c.asunto).toContain('Nuevo registro');
    expect(c.asunto).toContain('a@b.com');
    expect(c.html).toContain('Mi Banda');
    expect(c.html).toContain('registro en la app');
  });
  it('escapa el HTML de lo que escribe el usuario', () => {
    const c = correoAvisoAlta({ tipo: 'espera', email: 'a@b.com', nombre: '<a href="https://phishing">Pulsa</a>' });
    expect(c.html).not.toContain('<a href');
    expect(c.html).toContain('&lt;a href');
  });
  it('el asunto no admite saltos de línea', () => {
    const c = correoAvisoAlta({ tipo: 'espera', email: 'a@b.com\nBcc: x@y.com' });
    expect(c.asunto).not.toMatch(/[\r\n]/);
  });
});
