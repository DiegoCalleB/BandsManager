import { describe, expect, it } from 'vitest';
import { ESTRATEGIA_INICIAL } from '../estrategia';
import type { Tarjeta } from '../opciones';
import { promptPieza, sanearPieza } from '../pieza';

const tarjeta: Tarjeta = {
  id: 'fondo-pilar', formato: 'reel', redes: ['instagram', 'tiktok'], tipo: 'humano', titulo: 'La furgo', idea: 'Un viaje.',
  porque: 'Porque sí.', esfuerzoMin: 45, atajo: null, hecha: false,
};

describe('sanearPieza', () => {
  const buena = {
    gancho: 'Tres horas de furgo — y un solo bocadillo',
    pasos: [{ titulo: 'Plano 1 · 2 s', detalle: 'La furgo arrancando' }, { titulo: '', detalle: '' }, 'basura'],
    textos: [
      { red: 'instagram', texto: 'Así llegamos a Leganés', hashtags: ['#fyp', 'rockmadrid', 'indieleganes'] },
      { red: 'tiktok', texto: 'Rock en furgo', hashtags: ['rock madrid'] },
      { red: 'youtube', texto: 'No pedida' },
    ],
    cta: 'Guárdalo para el sábado',
    portada: 'La furgo',
  };

  it('limpia guiones largos, pasos vacíos y hashtags genéricos', () => {
    const p = sanearPieza(buena, 'reel', ['instagram', 'tiktok'])!;
    expect(p.gancho).toBe('Tres horas de furgo, y un solo bocadillo');
    expect(p.pasos).toHaveLength(1);
    expect(p.textos.map((t) => t.red)).toEqual(['instagram', 'tiktok']);
    expect(p.textos[0].hashtags).toEqual(['#rockmadrid', '#indieleganes']);
    expect(p.portada).toBe('La furgo');
  });

  it('solo devuelve textos de las redes de la tarjeta', () => {
    expect(sanearPieza(buena, 'reel', ['instagram'])!.textos).toHaveLength(1);
  });

  it('la portada solo existe en los reels', () => {
    expect(sanearPieza(buena, 'carrusel', ['instagram'])!.portada).toBe('');
  });

  it('rechaza lo que no sirve', () => {
    expect(sanearPieza(null, 'reel', ['instagram'])).toBeNull();
    expect(sanearPieza({ ...buena, gancho: '' }, 'reel', ['instagram'])).toBeNull();
    expect(sanearPieza({ ...buena, textos: [] }, 'reel', ['instagram'])).toBeNull();
  });
});

describe('promptPieza', () => {
  it('incluye la estrategia, las reglas de cada red y el momento', () => {
    const prompt = promptPieza({ contextoBanda: 'BANDA: Ruta 66', estrategia: { ...ESTRATEGIA_INICIAL, lineasRojas: ['política'] }, tarjeta, momento: 'Bolo: 31 oct en Leganés' });
    expect(prompt).toContain('BANDA: Ruta 66');
    expect(prompt).toContain('Nunca proponer: política');
    expect(prompt).toContain('Formato: reel en tiktok');
    expect(prompt).toContain('Formato: reel en instagram');
    expect(prompt).toContain('Bolo: 31 oct en Leganés');
  });

  it('lleva la voz aprendida, el tono de cada red y avisa de los campos de otra herramienta', () => {
    const prompt = promptPieza({
      contextoBanda: 'BANDA: Ruta 66', estrategia: ESTRATEGIA_INICIAL, tarjeta, momento: '',
      vozAprendida: 'LO QUE YA SABEMOS\n<voz>\n- NO quieren oír: épico\n</voz>',
      matices: { instagram: 'cercano y con humor', tiktok: 'directo y sin filtro' },
    });
    expect(prompt).toContain('NO quieren oír: épico');
    expect(prompt).toContain('- instagram: cercano y con humor');
    expect(prompt).toContain('- tiktok: directo y sin filtro');
    expect(prompt).toContain('"recommendedCopy"');
  });

  it('en el reintento nombra lo que no puede repetirse', () => {
    const prompt = promptPieza({ contextoBanda: '', estrategia: ESTRATEGIA_INICIAL, tarjeta, momento: '', prohibidos: ['épico', 'increíble'] });
    expect(prompt).toContain('No uses ninguna de estas, ni variantes: épico; increíble');
    expect(promptPieza({ contextoBanda: '', estrategia: ESTRATEGIA_INICIAL, tarjeta, momento: '' })).not.toContain('intento anterior');
  });
});
