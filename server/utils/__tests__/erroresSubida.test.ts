import { describe, expect, it } from 'vitest';
import { MENSAJE_TIPO_NO_PERMITIDO, mensajeFirmaNoValida } from '../erroresSubida';

describe('erroresSubida', () => {
  it('la firma no válida nombra el formato y dice qué hacer, sin jerga técnica', () => {
    const m = mensajeFirmaNoValida('mp3');
    expect(m).toContain('MP3');
    expect(m).toContain('Expórtalo de nuevo');
    expect(m).not.toMatch(/magic|bytes|firma binaria/i);
  });
  it('sin extensión sigue siendo legible', () => {
    expect(mensajeFirmaNoValida('')).toContain('no es un');
  });
  it('el tipo no permitido lista los formatos admitidos', () => {
    expect(MENSAJE_TIPO_NO_PERMITIDO).toContain('MP3');
    expect(MENSAJE_TIPO_NO_PERMITIDO).toContain('PDF');
  });
});
