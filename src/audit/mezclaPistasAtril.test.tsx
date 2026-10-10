import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MezclaPistas } from '../components/chords/MezclaPistas';
import type { AudioTrack } from '../types';
import { leerAtril } from './leerAtril';

const atril = leerAtril();
const pistas = [
  { id: 'a', nombre: 'Bajo' },
  { id: 'b', nombre: 'Batería' },
] as unknown as AudioTrack[];

describe('mezcla por pista en el Atril', () => {
  it('el Atril pasa los ajustes al hook y pinta el mezclador', () => {
    expect(atril).toContain('useMezclaStems(audioRef, pistasSonando, audioUrl, ajustesPistas, semitonosAudio)');
    expect(atril).toContain('<MezclaPistas');
  });

  it('pinta silencio, solo y volumen por pista con su estado', () => {
    const html = renderToStaticMarkup(
      <MezclaPistas pistas={pistas} ajustes={{ a: { muted: true }, b: { volumen: 0.4 } }} onAjustes={() => {}} />,
    );
    expect(html).toContain('aria-label="Silenciar Bajo"');
    expect(html).toContain('aria-label="Solo Batería"');
    expect(html).toContain('aria-label="Volumen de Batería"');
    expect(html).toContain('value="0.4"');
    expect(html).toMatch(/aria-pressed="true"[^>]*aria-label="Silenciar Bajo"|aria-label="Silenciar Bajo"[^>]*aria-pressed="true"/);
    expect(html).not.toContain('border');
  });

  it('sin pistas sonando no pinta nada', () => {
    expect(renderToStaticMarkup(<MezclaPistas pistas={[]} ajustes={{}} onAjustes={() => {}} />)).toBe('');
  });
});
