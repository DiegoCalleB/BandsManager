import { describe, it, expect } from 'vitest';
import { rutaAlmacenamientoClip } from '../storage';

describe('rutaAlmacenamientoClip', () => {
  it('mete el clip en una carpeta propia de la banda', () => {
    expect(rutaAlmacenamientoClip('band-ruta-66', 'clip_123.mp4')).toBe('reels/band-ruta-66/clip_123.mp4');
  });

  it('sanea caracteres que no son seguros para una ruta de almacenamiento', () => {
    // Sin esto, un nombre de banda o de archivo con espacios, barras o puntos raros podría
    // acabar escribiendo fuera de la carpeta que le corresponde.
    expect(rutaAlmacenamientoClip('band con espacios/../etc', 'clip raro?.mp4')).toBe(
      'reels/band_con_espacios____etc/clip_raro_.mp4'
    );
  });

  it('nunca deja la banda o el archivo vacíos', () => {
    expect(rutaAlmacenamientoClip('', '')).toBe('reels/sin-banda/clip.mp4');
  });

  it('bandas distintas no pueden colisionar en la misma ruta', () => {
    const a = rutaAlmacenamientoClip('band-a', 'clip.mp4');
    const b = rutaAlmacenamientoClip('band-b', 'clip.mp4');
    expect(a).not.toBe(b);
  });
});
