import { describe, expect, it } from 'vitest';
import { contarPorContacto, estadoDeContacto } from '../estadoDeContacto';

const ahora = new Date('2026-11-09T10:00:00Z');
const dias = (n: number) => new Date(ahora.getTime() - n * 86_400_000).toISOString();
const web = (hace: number) => ({ email_contacto: { fuente: 'web', verificado_en: dias(hace) } });

describe('estadoDeContacto', () => {
  it('email publicado en la web y comprobado hace poco → enviable', () => {
    expect(estadoDeContacto({ email_contacto: 'a@b.es', datos_fuentes: web(10) }, ahora).estado).toBe('enviable');
  });

  it('email escrito por la banda (sin procedencia) → enviable, como hace el Enviador', () => {
    expect(estadoDeContacto({ email_contacto: 'a@b.es' }, ahora).estado).toBe('enviable');
  });

  it('email de la web sin comprobar en más de 90 días → revisar', () => {
    expect(estadoDeContacto({ email_contacto: 'a@b.es', datos_fuentes: web(200) }, ahora).estado).toBe('revisar');
  });

  it('email de una IA o con dominio inexistente → no enviable', () => {
    expect(estadoDeContacto({ email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { fuente: 'ia' } } }, ahora).estado).toBe('no_enviable');
    const aviso = { email_contacto: { fuente: 'web', verificado_en: dias(1), aviso: { tipo: 'dominio_inexistente', para: 'a@b.es' } } };
    expect(estadoDeContacto({ email_contacto: 'a@b.es', datos_fuentes: aviso }, ahora).estado).toBe('no_enviable');
  });

  it('si el principal no vale pero el secundario sí → enviable', () => {
    const lead = { email_contacto: 'x@b.es', email_secundario: 'y@b.es', datos_fuentes: { email_contacto: { fuente: 'ia' }, email_secundario: web(5).email_contacto } };
    expect(estadoDeContacto(lead, ahora).estado).toBe('enviable');
  });

  it('sin email se mira el formulario, luego Instagram o teléfono, y si no hay nada → sin vía', () => {
    expect(estadoDeContacto({ notas: 'Formulario de contacto: https://x.es/contacto' }, ahora).estado).toBe('formulario');
    expect(estadoDeContacto({ instagram: '@x' }, ahora).estado).toBe('redes');
    expect(estadoDeContacto({ telefono: '600000000' }, ahora).estado).toBe('redes');
    expect(estadoDeContacto({}, ahora).estado).toBe('sin_via');
  });

  it('cuenta los leads por estado', () => {
    const c = contarPorContacto([{ email_contacto: 'a@b.es' }, { email_contacto: 'c@d.es' }, {}], ahora);
    expect(c).toMatchObject({ enviable: 2, sin_via: 1, revisar: 0 });
  });
});
