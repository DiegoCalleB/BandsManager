import { describe, expect, it } from 'vitest';
import { candidatos, diaEnMadrid, formatoDeMedio, sanearMedios } from '../instagramMedios';

const m = (id: string, timestamp: string, extra: Record<string, unknown> = {}) => ({ id, timestamp, media_type: 'IMAGE', media_product_type: 'FEED', permalink: 'https://www.instagram.com/p/x/', caption: 'Hola', ...extra });

describe('instagramMedios', () => {
  it('traduce los tipos de Instagram y descarta las stories', () => {
    expect(formatoDeMedio('REELS', 'VIDEO')).toBe('reel');
    expect(formatoDeMedio('FEED', 'CAROUSEL_ALBUM')).toBe('carrusel');
    expect(formatoDeMedio('FEED', 'IMAGE')).toBe('post');
    expect(formatoDeMedio('STORY', 'IMAGE')).toBeNull();
  });

  it('el día es el de Madrid, no el UTC', () => {
    expect(diaEnMadrid('2026-10-28T22:30:00+0000')).toBe('2026-10-28');
    expect(diaEnMadrid('2026-10-28T23:30:00+0000')).toBe('2026-10-29');
    expect(diaEnMadrid('no es una fecha')).toBeNull();
  });

  it('sanea la lista: sin ids raros, sin permalinks ajenos, textos cortos', () => {
    const medios = sanearMedios({ data: [
      m('12345678', '2026-10-28T10:00:00+0000', { permalink: 'https://evil.test/', caption: 'a'.repeat(200) }),
      m('../x', '2026-10-28T10:00:00+0000'), m('99999999', '2026-10-28T10:00:00+0000', { media_product_type: 'STORY' }),
    ] });
    expect(medios).toHaveLength(1);
    expect(medios[0].permalink).toBe('');
    expect(medios[0].resumen.length).toBeLessThanOrEqual(70);
    expect(sanearMedios(null)).toEqual([]);
  });

  it('propone las del mismo día o el siguiente, primero las del mismo formato', () => {
    const medios = sanearMedios({ data: [
      m('11111111', '2026-10-27T10:00:00+0000'), m('22222222', '2026-10-28T10:00:00+0000'),
      m('33333333', '2026-10-28T11:00:00+0000', { media_product_type: 'REELS', media_type: 'VIDEO' }), m('44444444', '2026-10-29T10:00:00+0000', { media_product_type: 'REELS', media_type: 'VIDEO' }),
      m('55555555', '2026-10-31T10:00:00+0000'),
    ] });
    expect(candidatos({ fecha: '2026-10-28', formato: 'reel' }, medios).map((x) => x.id)).toEqual(['33333333', '44444444', '22222222']);
  });
});
