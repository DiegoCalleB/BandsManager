import { describe, expect, it } from 'vitest';
import { campoConfirmable, confirmarEmailPorPersona } from '../confirmarEmail';
import { fiabilidadDelEmail } from '../fiabilidadEmail';
import { estadoDeContacto } from '../estadoDeContacto';

const ahora = new Date('2026-11-09T10:00:00Z');
const hace = (n: number) => new Date(ahora.getTime() - n * 86_400_000).toISOString();
const caducado = { email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { fuente: 'web', en: hace(300), verificado_en: hace(200) } } };

describe('confirmarEmailPorPersona', () => {
  it('un email caducado pasa a enviable al confirmarlo y conserva su origen', () => {
    expect(estadoDeContacto(caducado, ahora).estado).toBe('revisar');
    const fuentes = confirmarEmailPorPersona(caducado.datos_fuentes, 'email_contacto', ahora);
    expect(fuentes.email_contacto).toMatchObject({ fuente: 'persona', en: hace(300), verificado_en: ahora.toISOString() });
    expect(estadoDeContacto({ ...caducado, datos_fuentes: fuentes }, ahora).estado).toBe('enviable');
  });

  it('la confirmación también caduca a los 90 días', () => {
    const fuentes = confirmarEmailPorPersona({}, 'email_contacto', ahora);
    const f = (dias: number) => fiabilidadDelEmail({ email: 'a@b.es', procedencia: fuentes.email_contacto as never }, new Date(ahora.getTime() + dias * 86_400_000));
    expect(f(30).puntos).toBe(85);
    expect(f(120).nivel).toBe('caducado');
  });

  it('no toca el resto de campos de procedencia', () => {
    const fuentes = confirmarEmailPorPersona({ instagram: { fuente: 'web' } }, 'email_contacto', ahora);
    expect(fuentes.instagram).toEqual({ fuente: 'web' });
  });
});

describe('campoConfirmable', () => {
  it('solo se confirma lo caducado: no lo ya enviable ni lo de IA o con dominio roto', () => {
    expect(campoConfirmable(caducado, ahora)).toBe('email_contacto');
    expect(campoConfirmable({ email_contacto: 'a@b.es' }, ahora)).toBeNull();
    expect(campoConfirmable({ email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { fuente: 'ia', en: hace(1) } } }, ahora)).toBeNull();
    const roto = { email_contacto: 'a@b.es', datos_fuentes: { email_contacto: { fuente: 'web', en: hace(300), aviso: { tipo: 'dominio_inexistente', para: 'a@b.es' } } } };
    expect(campoConfirmable(roto, ahora)).toBeNull();
  });

  it('elige el secundario si el principal no es confirmable', () => {
    const lead = { email_contacto: 'x@b.es', email_secundario: 'y@b.es', datos_fuentes: { email_contacto: { fuente: 'ia', en: hace(1) }, email_secundario: { fuente: 'web', en: hace(300) } } };
    expect(campoConfirmable(lead, ahora)).toBe('email_secundario');
  });
});
