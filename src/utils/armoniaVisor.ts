import { analizarAcorde, type Funcion, type Tonalidad } from './teoriaArmonica';
import { normalizarAcorde } from './lineaTiempoAcordes';

export interface InfoChip {
  grado: string;
  funcion: Funcion;
  secundario?: string;
}

/**
 * Grado y función de un acorde TAL COMO SE VE en pantalla («Sim», «F#m», «Bb»…, ya transpuesto y en
 * español o inglés) respecto a la tonalidad que se ve (tónica + transposición). Los grados no
 * dependen de la transposición: transponer cambia el nombre del acorde y la tónica a la vez.
 */
export function infoDeAcordeVisible(acordeVisible: string, tonalidad: Tonalidad, semitonosTranspuestos: number, siguiente?: string | null): InfoChip | null {
  const n = normalizarAcorde(acordeVisible);
  if (!n || n === 'N') return null;
  const tonicaVista = (((tonalidad.tonica + semitonosTranspuestos) % 12) + 12) % 12;
  const sig = siguiente ? normalizarAcorde(siguiente) : null;
  const a = analizarAcorde(n, { ...tonalidad, tonica: tonicaVista }, sig && sig !== 'N' ? sig : null);
  return a ? { grado: a.grado, funcion: a.funcion, ...(a.secundario ? { secundario: a.secundario } : {}) } : null;
}
