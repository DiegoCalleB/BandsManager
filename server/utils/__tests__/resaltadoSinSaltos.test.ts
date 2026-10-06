/**
 * Regresión del fallo visto en producción: en versos con 4 cambios de acorde el resaltado «nunca pasaba por
 * el cuarto». Causa: el cifrado repite el acorde vigente al empezar cada frase, ese acorde no tenía pareja en
 * el audio (no hay cambio) y nunca se resaltaba.
 */
import { it, expect } from 'vitest';
import { construirCifradoSincronizado } from '../cifradoSincronizado';
import { alinearCifradoConAudio, tiemposDeAcordes, acordeActivoPorTiempo, acordesDelCifrado } from '../../../src/utils/alineacionAcordes';

let sem = 3;
const az = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
const ACORDES = ['E', 'G', 'A', 'D', 'Bm', 'F#m', 'C#m', 'B'];

function caso() {
  const segs: any[] = [];
  let t = 0;
  let prev = '';
  while (t < 60) {
    let a = ACORDES[Math.floor(az() * ACORDES.length)];
    if (az() < 0.1) a = 'N';
    const d = 0.45 + az() * 2.5;
    segs.push({ t0: t, t1: t + d, acorde: a, confianza: 1 });
    t += d; prev = a;
  }
  const lineas: any[] = [];
  let u = 1;
  while (u < 55) {
    const n = 3 + Math.floor(az() * 7);
    const palabras: any[] = [];
    let w = u;
    for (let i = 0; i < n; i++) { const d = 0.25 + az() * 0.7; const len = 2 + Math.floor(az() * 8); palabras.push({ texto: 'abcdefghij'.slice(0, len).replace(/./g, (c, k) => 'aeioulmnrstp'[(k * 7 + len + i) % 12]), t0: w, t1: w + d }); w += d + 0.05 + az() * 0.2; }
    lineas.push({ t0: palabras[0].t0, t1: palabras[n - 1].t1, texto: palabras.map((p) => p.texto).join(' '), palabras });
    u = w + az() * 4;
  }
  return { segs, lineas };
}

it('en 100 canciones aleatorias el resaltado pasa por TODOS los acordes del cifrado (ninguno se salta)', () => {
  let casos = 0, conSalto = 0, acordesTotal = 0, saltados = 0, sinPareja = 0, ejemplo = '';
  for (let k = 0; k < 100; k++) {
    const { segs, lineas } = caso();
    const cif = construirCifradoSincronizado(lineas, segs);
    const texto = acordesDelCifrado(cif);
    const al = alinearCifradoConAudio(cif, segs);
    if (!al || !al.usable) continue;
    casos++;
    const vistos = new Set<number>();
    const tiempos = tiemposDeAcordes(al, segs);
    for (let t = 0; t < 75; t += 0.02) vistos.add(acordeActivoPorTiempo(tiempos, t));
    const falt = texto.map((_, i) => i).filter((i) => !vistos.has(i));
    acordesTotal += texto.length;
    saltados += falt.length;
    sinPareja += al.pares.filter((p) => p.segmento === null).length;
    if (falt.length) { conSalto++; if (!ejemplo) ejemplo = `texto=${texto.join(' ')} faltan=${falt.join(',')} pares=${al.pares.map((p) => p.segmento).join(',')} | audio=${segs.map((s, i) => i + ':' + s.acorde).join(' ')}`; }
  }
  expect(casos).toBeGreaterThan(40);
  expect({ saltados, conSalto, ejemplo: ejemplo.slice(0, 600) }).toEqual({ saltados: 0, conSalto: 0, ejemplo: '' });
  expect(sinPareja).toBeGreaterThan(0); // el caso difícil (acorde repetido al empezar frase) sí aparece en el fuzz
});
