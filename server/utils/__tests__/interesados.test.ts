import { describe, expect, it } from 'vitest';
import {
  correoBienvenida,
  correoConfirmacion,
  firmaInteresadoValida,
  idiomaInteresado,
  normalizarEmailInteresado,
  urlInteresado,
} from '../interesados';

describe('normalizarEmailInteresado', () => {
  it('pasa a minúsculas y recorta espacios', () => {
    expect(normalizarEmailInteresado('  Ana@Mail.COM ')).toBe('ana@mail.com');
  });
  it.each(['', 'sin-arroba', 'a@b', 'a b@c.com', '<x>@y.com', 42, null, undefined])('rechaza %j', (v) => {
    expect(normalizarEmailInteresado(v)).toBeNull();
  });
  it('rechaza direcciones de más de 254 caracteres', () => {
    expect(normalizarEmailInteresado(`${'a'.repeat(250)}@x.com`)).toBeNull();
  });
});

describe('enlaces firmados', () => {
  const base = 'https://bandmanager.io';
  const partes = (url: string) => {
    const u = new URL(url);
    return { i: u.searchParams.get('i'), f: u.searchParams.get('f') };
  };

  it('la firma de confirmar valida con su id y su acción', () => {
    const { i, f } = partes(urlInteresado(base, 'confirmar', 'abc-123'));
    expect(firmaInteresadoValida('confirmar', i!, f)).toBe(true);
  });
  it('una firma de confirmar no sirve para darse de baja ni para otro id', () => {
    const { i, f } = partes(urlInteresado(base, 'confirmar', 'abc-123'));
    expect(firmaInteresadoValida('baja', i!, f)).toBe(false);
    expect(firmaInteresadoValida('confirmar', 'otro-id', f)).toBe(false);
  });
  it.each([undefined, '', 'corta', 'z'.repeat(32), 123])('rechaza la firma %j', (f) => {
    expect(firmaInteresadoValida('confirmar', 'abc-123', f)).toBe(false);
  });
});

describe('correos', () => {
  it('la confirmación lleva el enlace y respeta el idioma', () => {
    const es = correoConfirmacion('es', 'https://x.test/c?i=1&f=2');
    const en = correoConfirmacion('en', 'https://x.test/c?i=1&f=2');
    expect(es.html).toContain('https://x.test/c?i=1&amp;f=2');
    expect(es.asunto).toMatch(/Confirma/);
    expect(en.asunto).toMatch(/Confirm/);
  });
  it('la bienvenida lleva enlace de baja', () => {
    const c = correoBienvenida('es', 'https://bandmanager.io', 'https://x.test/baja?i=1&f=2');
    expect(c.html).toContain('Darme de baja');
    expect(c.html).toContain('https://x.test/baja?i=1&amp;f=2');
  });
  it('ningún correo habla de booking, contratos ni escrow', () => {
    const todo = [correoConfirmacion('es', 'u'), correoConfirmacion('en', 'u'), correoBienvenida('es', 'u', 'b'), correoBienvenida('en', 'u', 'b')]
      .map((c) => c.asunto + c.html)
      .join(' ');
    expect(todo).not.toMatch(/booking|contrato|contract|escrow|custodia/i);
  });
});

describe('idiomaInteresado', () => {
  it('solo acepta en; el resto es es', () => {
    expect(idiomaInteresado('en')).toBe('en');
    expect(idiomaInteresado('fr')).toBe('es');
    expect(idiomaInteresado(undefined)).toBe('es');
  });
});
