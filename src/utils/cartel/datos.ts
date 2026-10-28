// Del bolo a los datos del cartel. Puro.
//
// Lineup: vuestra banda + `bandas_compartidas`. Quién es cabeza de cartel no se adivina (si
// sois teloneros, ponerte arriba queda fatal): se pregunta la primera vez y se guarda.
//   cabeza = null      → sin decidir (si hay más bandas, la pantalla pregunta)
//   cabeza = '@todas'  → todas al mismo tamaño
//   cabeza = 'Nombre'  → esa banda grande, el resto debajo

import type { Concert } from '../../types';
import type { BandaCartel, DatosCartel } from './layout';
import { fechaCartel, lineaHorario } from './texto';
import { MAX_EXTRA } from './config';

export const TODAS = '@todas';

export interface AjustesTexto {
  cabeza: string | null;
  extra: string;
  horario: boolean;
  direccion?: boolean;
  /** El nombre y el lugar que la persona escribió a mano (vacío = los del bolo). */
  textos?: { nombre: string; lugar: string };
}

const clave = (s: string) => s.trim().toLocaleLowerCase('es');

/** Vuestra banda primero y luego las compartidas, sin repetidos ni vacíos. */
export function bandasDelBolo(c: Pick<Concert, 'bandas_compartidas'>, banda: string): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const n of [banda, ...(Array.isArray(c.bandas_compartidas) ? c.bandas_compartidas : [])]) {
    const nombre = typeof n === 'string' ? n.trim() : '';
    if (!nombre || vistas.has(clave(nombre))) continue;
    vistas.add(clave(nombre));
    out.push(nombre);
  }
  return out;
}

export function esCompartido(c: Pick<Concert, 'bandas_compartidas'>, banda: string): boolean {
  return bandasDelBolo(c, banda).length > 1;
}

/** Cabeza de cartel primero; el resto en el orden del bolo. Una cabeza que ya no está en el bolo se ignora. */
export function construirLineup(nombres: string[], cabeza: string | null): BandaCartel[] {
  if (nombres.length <= 1) return nombres.map((nombre) => ({ nombre, cabeza: true }));
  const elegida = cabeza && cabeza !== TODAS ? nombres.find((n) => clave(n) === clave(cabeza)) : undefined;
  if (!elegida) return nombres.map((nombre) => ({ nombre, cabeza: false }));
  return [elegida, ...nombres.filter((n) => n !== elegida)].map((nombre) => ({ nombre, cabeza: nombre === elegida }));
}

export function datosDesdeConcierto(c: Concert, banda: string, ajustes: AjustesTexto): DatosCartel {
  const lt = c.logisticaTecnica;
  const nombreEscrito = ajustes.textos?.nombre.trim() ?? '';
  const lugarEscrito = ajustes.textos?.lugar.trim() ?? '';
  // Lo escrito a mano sustituye al nombre de NUESTRA banda en el lineup (las demás se quedan) y al lugar del bolo.
  const nombres = bandasDelBolo(c, banda).map((n, i) => (i === 0 && nombreEscrito ? nombreEscrito : n));
  const cabeza = ajustes.cabeza && nombreEscrito && ajustes.cabeza.trim().toLocaleLowerCase('es') === banda.trim().toLocaleLowerCase('es') ? nombreEscrito : ajustes.cabeza;
  return {
    lineup: construirLineup(nombres, cabeza),
    fecha: fechaCartel(c.fecha),
    horario: ajustes.horario ? lineaHorario(lt?.horaAperturaPuertas, lt?.horaShow) : '',
    sala: lugarEscrito || (c.sala || '').trim(),
    ciudad: lugarEscrito ? '' : (c.ciudad || '').trim(),
    direccion: ajustes.direccion ? (c.direccion || '').trim().slice(0, 70) : '',
    extra: ajustes.extra.trim().slice(0, MAX_EXTRA),
  };
}

/** Bolos de los que tiene sentido hacer cartel: públicos, confirmados, de hoy en adelante, por fecha. */
export function conciertosParaCartel<T extends Pick<Concert, 'fecha' | 'tipo' | 'is_posible'>>(concerts: T[], hoy: string): T[] {
  return concerts
    .filter((c) => c.tipo !== 'privado' && !c.is_posible && (c.fecha || '').slice(0, 10) >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
