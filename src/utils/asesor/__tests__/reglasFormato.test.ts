import { describe, expect, it } from 'vitest';
import {
  REGLAS_FORMATO,
  REGLAS_PORTADA,
  REGLAS_TIKTOK,
  bloqueReglasPrompt,
  demasiadaPromocion,
  sanearHashtags,
  type Formato,
} from '../reglasFormato';

describe('sanearHashtags', () => {
  it('quita los genéricos, normaliza y deduplica', () => {
    expect(sanearHashtags(['#fyp', 'RockMadrid', '##rockmadrid', 'indie madrid', '#Viral', 42], 'instagram'))
      .toEqual(['#RockMadrid', '#indiemadrid']);
  });

  it('recorta al máximo de cada red', () => {
    const tags = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'];
    expect(sanearHashtags(tags, 'tiktok')).toHaveLength(3);
    expect(sanearHashtags(tags, 'instagram')).toHaveLength(5);
  });

  it('tolera basura de la IA', () => {
    expect(sanearHashtags(null, 'instagram')).toEqual([]);
    expect(sanearHashtags('rock', 'instagram')).toEqual([]);
  });
});

describe('bloqueReglasPrompt', () => {
  it('añade las reglas de TikTok solo a los reels de TikTok', () => {
    const tiktok = bloqueReglasPrompt('reel', 'tiktok');
    expect(tiktok).toContain(REGLAS_TIKTOK[0].texto);
    expect(tiktok).toContain('Entre 2 y 3 hashtags');
    expect(bloqueReglasPrompt('reel', 'instagram')).not.toContain(REGLAS_TIKTOK[0].texto);
  });

  it('añade las reglas de portada solo a los vídeos', () => {
    expect(bloqueReglasPrompt('reel', 'instagram')).toContain(REGLAS_PORTADA[0].texto);
    expect(bloqueReglasPrompt('carrusel', 'instagram')).not.toContain(REGLAS_PORTADA[0].texto);
  });

  it('todas las reglas citan su fuente y cada formato tiene alguna', () => {
    for (const formato of Object.keys(REGLAS_FORMATO) as Formato[]) {
      expect(REGLAS_FORMATO[formato].reglas.length).toBeGreaterThan(0);
      for (const r of REGLAS_FORMATO[formato].reglas) expect(r.fuente).toBeTruthy();
    }
  });
});

describe('demasiadaPromocion', () => {
  it('avisa cuando más de un tercio del plan es promoción', () => {
    expect(demasiadaPromocion(['promocional', 'humano', 'educativo'])).toBe(false);
    expect(demasiadaPromocion(['promocional', 'promocional', 'humano'])).toBe(true);
    expect(demasiadaPromocion([])).toBe(false);
  });
});
