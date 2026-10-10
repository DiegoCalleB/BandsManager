import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { TomasConFondo } from '../components/chords/TomasConFondo';
import type { AudioTrack, SongAudioIdea } from '../types';
import { leerAtril } from './leerAtril';

const atril = leerAtril();
const stems = [
  { id: 'd', nombre: 'Batería', audioUrl: 'd' },
  { id: 'b', nombre: 'Bajo', audioUrl: 'b' },
] as unknown as AudioTrack[];
const toma = { id: 't', titulo: 'Guitarra', audioUrl: 'g', sobrePistas: ['d', 'borrada'] } as unknown as SongAudioIdea;
const pinta = (t = [toma], activaId: string | null = null) =>
  renderToStaticMarkup(<TomasConFondo tomas={t} stems={stems} activaId={activaId} onActiva={() => {}} onFondo={() => {}} />);

describe('tomas con fondo en el Atril', () => {
  it('el Atril pasa la toma activa al hook de mezcla y pinta el selector', () => {
    expect(atril).toContain('<TomasConFondo');
    expect(atril).toContain('pistasParaToma(tomaActiva, stems)');
    expect(atril).toContain('useMezclaStems(audioRef, pistasSonando');
  });
  it('marca los stems del fondo y avisa de los que faltan', () => {
    const html = pinta();
    expect(html).toMatch(/aria-pressed="true"[^>]*>Batería|>Batería/);
    expect(html).toContain('Falta 1 pista del fondo');
    expect(html).not.toContain('border');
  });
  it('marca la toma que se está escuchando', () => {
    expect(pinta([toma], 't')).toContain('Escuchando');
  });
  it('sin tomas o sin stems no pinta nada', () => {
    expect(pinta([])).toBe('');
    expect(renderToStaticMarkup(<TomasConFondo tomas={[toma]} stems={stems.slice(0, 1)} activaId={null} onActiva={() => {}} onFondo={() => {}} />)).toBe('');
  });
});
