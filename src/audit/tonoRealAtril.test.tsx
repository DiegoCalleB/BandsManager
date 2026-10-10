import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { ControlTonoAudio } from '../components/chords/ControlTonoAudio';
import { leerAtril } from './leerAtril';

const leer = (r: string) => readFileSync(new URL(r, import.meta.url), 'utf8');

describe('cambio de tono real en el Atril', () => {
  it('el audio principal y los stems siguen la transposición de la hoja', () => {
    const atril = leerAtril();
    expect(atril).toContain('const semitonosAudio = audioSigueTono ? transpose : 0;');
    expect(atril).toContain('useMezclaStems(audioRef, pistasSonando, audioUrl, ajustesPistas, semitonosAudio)');
    expect(atril).toContain('useTonoAudio(audioRef, audioUrl, semitonosAudio)');
    expect(atril).toContain('crossOrigin="anonymous"');
  });

  it('no conecta a Web Audio mientras no haga falta', () => {
    expect(leer('../hooks/useTonoAudio.ts')).toContain('semitonos !== 0 || tonoConectado(el)');
    expect(leer('../hooks/useMezclaStems.ts')).toContain('semitonosRef.current !== 0 || tonoConectado(el)');
  });

  it('el control solo aparece con la hoja transpuesta y dice qué hace el audio', () => {
    const f = (t: number, s: boolean) => renderToStaticMarkup(<ControlTonoAudio transpose={t} sigue={s} onSigue={() => {}} />);
    expect(f(0, true)).toBe('');
    expect(f(2, true)).toContain('Audio +2 st');
    expect(f(-3, false)).toContain('Audio original');
    expect(f(2, true)).not.toContain('border');
  });
});
