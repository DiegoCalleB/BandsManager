/**
 * Separación en sílabas aproximada (español, que sirve razonablemente para inglés): lo justo para
 * colocar un acorde sobre la sílaba en la que cambia. No pretende ser un silabeador completo.
 */

const FUERTES = 'aeoáéóàèò';
const DEBILES = 'iuíúüìù'; // las acentuadas (í, ú) forman hiato con la vocal vecina
const VOCALES = FUERTES + DEBILES + 'yAEIOUÁÉÍÓÚ';
const esVocal = (c: string) => VOCALES.includes(c.toLowerCase()) && c !== '';

/** Grupos de dos consonantes que empiezan sílaba (pr, bl, ch…): no se parten. */
const INICIOS = new Set(['pr', 'pl', 'br', 'bl', 'tr', 'dr', 'cr', 'cl', 'gr', 'gl', 'fr', 'fl', 'ch', 'll', 'rr', 'kr', 'kl', 'th', 'sh', 'ph', 'qu', 'gu']);

/** Posiciones (índice de carácter) donde empieza una sílaba, sin contar el 0. */
export function limitesDeSilaba(palabra: string): number[] {
  const p = palabra.toLowerCase();
  const n = p.length;
  const limites: number[] = [];
  // Núcleos vocálicos: [inicio, fin) de cada grupo de vocales que forma diptongo.
  const nucleos: [number, number][] = [];
  let i = 0;
  while (i < n) {
    if (!esVocal(p[i])) { i++; continue; }
    let j = i + 1;
    while (j < n && esVocal(p[j])) {
      const a = p[j - 1], b = p[j];
      const fuerteA = FUERTES.includes(a), fuerteB = FUERTES.includes(b);
      const acentoDebil = 'íú'.includes(a) || 'íú'.includes(b);
      if ((fuerteA && fuerteB) || acentoDebil) break; // hiato
      j++;
    }
    nucleos.push([i, j]);
    i = j;
  }
  for (let k = 1; k < nucleos.length; k++) {
    const finPrev = nucleos[k - 1][1];
    const iniSig = nucleos[k][0];
    const consonantes = iniSig - finPrev;
    if (consonantes <= 0) limites.push(iniSig); // hiato: vocal contra vocal
    else if (consonantes === 1) limites.push(finPrev); // V-CV
    else {
      const ultimas2 = p.slice(iniSig - 2, iniSig);
      limites.push(INICIOS.has(ultimas2) && consonantes >= 2 ? iniSig - 2 : iniSig - 1); // VC-CV / V-CCV
    }
  }
  return limites;
}

export function silabas(palabra: string): string[] {
  const cortes = [0, ...limitesDeSilaba(palabra), palabra.length];
  const salida: string[] = [];
  for (let k = 0; k < cortes.length - 1; k++) salida.push(palabra.slice(cortes[k], cortes[k + 1]));
  return salida;
}
