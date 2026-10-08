import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bpmDeToques } from '../hooks/useMetronomo';

const ensayo = readFileSync(new URL('../components/ensayos/ModoLocalEnVivoTab.tsx', import.meta.url), 'utf8');

describe('metrónomo único del producto', () => {
  it('tap tempo: media de los intervalos y descarte de lo imposible', () => {
    expect(bpmDeToques([0])).toBeNull();
    expect(bpmDeToques([0, 500, 1000, 1500])).toBe(120);
    expect(bpmDeToques([0, 600, 1200])).toBe(100);
    expect(bpmDeToques([0, 10])).toBeNull(); // 6000 bpm
    expect(bpmDeToques([0, 5000])).toBeNull(); // 12 bpm
  });

  it('el visor de ensayo usa useMetronomo y no programa clics a mano', () => {
    expect(ensayo).toContain('useMetronomo(currentSong?.bpm || 120, beatsPerBar)');
    expect(ensayo).toContain('metronomo.tocarTempo');
    expect(ensayo).not.toContain('programarClic');
    expect(ensayo).not.toContain('new AudioCtx()');
  });
});

describe('modos en vivo: mecánicas compartidas', () => {
  const concierto = readFileSync(new URL('../components/SetlistPerformanceView.tsx', import.meta.url), 'utf8');
  it('concierto y ensayo usan el mismo wake lock y los mismos gestos de pasar página', () => {
    for (const src of [ensayo, concierto]) {
      expect(src).toContain('useWakeLock(');
      expect(src).toContain('accionDeTecla(');
      expect(src).toContain('direccionDeSwipe(');
      expect(src).not.toContain('wakeLock.request');
    }
  });
  it('concierto y ensayo comparten la pantalla completa (sin requestFullscreen propio)', () => {
    for (const src of [ensayo, concierto]) {
      expect(src).toContain('useFullscreen(');
      expect(src).not.toContain('requestFullscreen');
    }
  });
  it('concierto y ensayo comparten la navegación por ítems', () => {
    for (const src of [ensayo, concierto]) {
      expect(src).toContain('useNavegacionItems(');
    }
  });
  it('el ensayo delega cronómetro/evaluación/notas en useSeguimientoEnsayo y BotonesEvaluacion', () => {
    expect(ensayo).toContain('useSeguimientoEnsayo(');
    expect(ensayo).toContain('<BotonesEvaluacion');
    expect(ensayo).not.toContain('setInterval');
    expect(ensayo.match(/<BotonesEvaluacion/g)).toHaveLength(2);
  });
  it('el concierto monta la barra de seguimiento solo si viene de un ensayo', () => {
    expect(concierto).toContain('seguimientoEnsayo &&');
    expect(concierto).toContain('<BarraSeguimientoEnsayo');
    expect(concierto).not.toContain('useSeguimientoEnsayo(');
  });
});
