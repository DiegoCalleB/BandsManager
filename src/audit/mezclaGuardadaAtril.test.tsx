import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { claveMezclaAtril, leerMezcla, MEZCLA_VACIA, serializarMezcla } from '../utils/mezclaGuardada';
import { ControlVelocidad } from '../components/chords/ControlVelocidad';
import { leerAtril } from './leerAtril';

describe('mezcla y velocidad guardadas del Atril', () => {
  it('ida y vuelta, y nada que guardar si todo está por defecto', () => {
    const m = { ajustes: { a: { muted: true }, b: { volumen: 0.4, solo: true } }, velocidad: 0.75 };
    expect(leerMezcla(serializarMezcla(m))).toEqual(m);
    expect(serializarMezcla(MEZCLA_VACIA)).toBeNull();
  });

  it('descarta datos corruptos o fuera de rango', () => {
    expect(leerMezcla('no es json')).toEqual(MEZCLA_VACIA);
    expect(leerMezcla(null)).toEqual(MEZCLA_VACIA);
    const m = leerMezcla(JSON.stringify({ ajustes: { a: { volumen: 9, muted: 'sí' }, b: 3 }, velocidad: 50 }));
    expect(m.ajustes).toEqual({ a: {} });
    expect(m.velocidad).toBe(1);
  });

  it('la clave es por canción', () => {
    expect(claveMezclaAtril('x')).not.toBe(claveMezclaAtril('y'));
  });

  it('el Atril usa el hook y aplica la velocidad al audio', () => {
    const atril = leerAtril();
    expect(atril).toContain('useMezclaGuardada(song.id)');
    expect(atril).toContain('audioRef.current.playbackRate = velocidad');
  });

  it('el control marca la velocidad activa, sin border', () => {
    const html = renderToStaticMarkup(<ControlVelocidad velocidad={0.75} onVelocidad={() => {}} />);
    expect(html).toContain('50%');
    expect(html).toContain('100%');
    expect(html).not.toContain('border');
  });
});
