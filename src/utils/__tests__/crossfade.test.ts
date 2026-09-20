import { describe, it, expect } from 'vitest';
import { CROSSFADE_SECONDS, computeCrossfadeGains, getCrossfadeStartTime, shouldCrossfade } from '../crossfade';

describe('crossfade', () => {
 it('computeCrossfadeGains empieza en la pista de origen a máximo volumen y la de destino en silencio', () => {
 const { fromGain, toGain } = computeCrossfadeGains(0, 5000);
 expect(fromGain).toBeCloseTo(1, 5);
 expect(toGain).toBeCloseTo(0, 5);
 });

 it('computeCrossfadeGains termina con la pista de destino a máximo volumen y la de origen en silencio', () => {
 const { fromGain, toGain } = computeCrossfadeGains(5000, 5000);
 expect(fromGain).toBeCloseTo(0, 5);
 expect(toGain).toBeCloseTo(1, 5);
 });

 it('computeCrossfadeGains a mitad de camino no suma más de 1 (curva de potencia constante)', () => {
 const { fromGain, toGain } = computeCrossfadeGains(2500, 5000);
 expect(fromGain).toBeCloseTo(Math.SQRT1_2, 5);
 expect(toGain).toBeCloseTo(Math.SQRT1_2, 5);
 // La suma de cuadrados (energía percibida) se mantiene constante en toda la curva.
 expect(fromGain * fromGain + toGain * toGain).toBeCloseTo(1, 5);
 });

 it('computeCrossfadeGains resiste tiempos fuera de rango (clamp a 0-1)', () => {
 expect(computeCrossfadeGains(-100, 5000).fromGain).toBeCloseTo(1, 5);
 expect(computeCrossfadeGains(999999, 5000).toGain).toBeCloseTo(1, 5);
 });

 it('getCrossfadeStartTime resta la ventana de fundido a la duración total', () => {
 expect(getCrossfadeStartTime(180, CROSSFADE_SECONDS)).toBe(175);
 expect(getCrossfadeStartTime(200)).toBe(195); // usa CROSSFADE_SECONDS por defecto
 });

 it('getCrossfadeStartTime nunca es negativo para canciones más cortas que el fundido', () => {
 expect(getCrossfadeStartTime(3, CROSSFADE_SECONDS)).toBe(0);
 });

 it('shouldCrossfade es true solo cuando la canción dura más que la ventana de fundido', () => {
 expect(shouldCrossfade(180)).toBe(true);
 expect(shouldCrossfade(4, CROSSFADE_SECONDS)).toBe(false);
 expect(shouldCrossfade(CROSSFADE_SECONDS, CROSSFADE_SECONDS)).toBe(false); // límite exacto: sin hueco real
 });
});
