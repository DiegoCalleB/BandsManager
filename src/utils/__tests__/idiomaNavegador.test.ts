import { describe, expect, it } from 'vitest';
import { idiomaSugerido } from '../idiomaNavegador';

describe('idiomaSugerido', () => {
  it.each([
    [['es-ES'], 'es'], [['es-MX', 'en-US'], 'es'], [['es'], 'es'],
    [['ca-ES'], 'es'], [['gl'], 'es'], [['eu-ES'], 'es'],
    [['en-US'], 'en'], [['en-GB', 'es'], 'en'],
    [['ja-JP'], 'en'], [['ja', 'en-US', 'en'], 'en'], [['de-DE'], 'en'], [['pt-BR'], 'en'], [['fr'], 'en'], [['zh-CN'], 'en'],
  ] as const)('%j → %s', (preferidos, esperado) => {
    expect(idiomaSugerido(preferidos)).toBe(esperado);
  });
  it('sin información se queda en español, el idioma por defecto del sitio', () => {
    expect(idiomaSugerido([])).toBe('es');
    expect(idiomaSugerido([''])).toBe('es');
    expect(idiomaSugerido(undefined as unknown as string[])).toBe('es');
  });
  it('es insensible a mayúsculas', () => {
    expect(idiomaSugerido(['ES-es'])).toBe('es');
    expect(idiomaSugerido(['JA'])).toBe('en');
  });
});
