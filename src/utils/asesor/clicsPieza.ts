/**
 * Clics del enlace de la bio en las 48 h siguientes a publicar cada pieza. Es una medida honesta
 * pero aproximada: el enlace de la bio es uno solo por red, así que no distingue qué pieza trajo cada
 * clic; lo que enseña es si los días con publicación suben los clics. Lógica pura.
 */
import { diasEntre, sumarDias } from '../campanaConcierto';
import { diaEnMadrid } from './instagramMedios';
import { tituloDe } from './resumen';
import type { Formato, Red } from './reglasFormato';
import type { AccionRegistrada } from './tipos';

export interface EnlaceCanal {
  code: string;
  canal: string;
}
export interface ClicEnlace {
  code: string;
  clicked_at: string;
}

export interface ClicsDePieza {
  fecha: string;
  tarjetaId: string;
  titulo: string;
  formato: Formato;
  /** Clics de los enlaces de las redes de la banda en el día de publicar y el siguiente. */
  total: number;
  porCanal: Record<string, number>;
  /** false mientras no hayan pasado las 48 h: el número todavía puede subir. */
  completa: boolean;
}

export const DIAS_CLICS_PIEZA = 14;
export const MAX_PIEZAS_CLICS = 6;

export function clicsTrasPublicar(
  acciones: AccionRegistrada[],
  enlaces: EnlaceCanal[],
  clics: ClicEnlace[],
  hoy: string,
  redes: readonly Red[],
): ClicsDePieza[] {
  const canalDe = new Map(enlaces.filter((e) => (redes as readonly string[]).includes(e.canal)).map((e) => [e.code, e.canal]));
  const clicsConDia = clics.flatMap((c) => {
    const canal = canalDe.get(c.code);
    const dia = canal ? diaEnMadrid(c.clicked_at) : null;
    return canal && dia ? [{ canal, dia }] : [];
  });

  return acciones
    .filter((a) => a.accion === 'hecho' && diasEntre(a.fecha, hoy) >= 0 && diasEntre(a.fecha, hoy) <= DIAS_CLICS_PIEZA)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, MAX_PIEZAS_CLICS)
    .map((a) => {
      const ventana = new Set([a.fecha, sumarDias(a.fecha, 1)]);
      const porCanal: Record<string, number> = {};
      for (const c of clicsConDia) if (ventana.has(c.dia)) porCanal[c.canal] = (porCanal[c.canal] ?? 0) + 1;
      return {
        fecha: a.fecha, tarjetaId: a.tarjetaId, titulo: tituloDe(a), formato: a.formato,
        total: Object.values(porCanal).reduce((x, y) => x + y, 0), porCanal, completa: diasEntre(a.fecha, hoy) >= 2,
      };
    });
}
