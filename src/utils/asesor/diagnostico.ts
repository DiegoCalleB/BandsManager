/**
 * El diagnóstico diario del asesor: en qué momento está la banda (modo). Qué publicar dentro de
 * cada modo lo decide `opciones.ts`.
 * Lógica pura y determinista, sin IA: explicable ("te propongo esto porque tocas en 9 días"),
 * testeable y gratis. La IA entra después, para redactar las piezas, no para decidir el plan.
 *
 * Prioridad de los modos: un bolo cercano manda sobre un lanzamiento, y los dos sobre reactivar.
 * Lo que no encaja en ninguno es "fondo": rotar los temas propios y construir comunidad.
 */
import { diasEntre } from '../campanaConcierto';
import type { Lanzamiento } from './estrategia';
import type { Formato } from './reglasFormato';

export type Modo = 'concierto' | 'lanzamiento' | 'rescate' | 'reactivar' | 'fondo';

/** Ventanas de cada modo, en días. */
export const VENTANA = {
  concierto: 21,
  lanzamientoAntes: 30,
  lanzamientoDespues: 14,
  sinPublicar: 10,
} as const;

export interface ConciertoParaAsesor {
  id: string;
  /** AAAA-MM-DD. */
  fecha: string;
  sala: string;
  ciudad: string;
}

export interface EntradaDiagnostico {
  hoy: string;
  conciertos: ConciertoParaAsesor[];
  lanzamiento: Lanzamiento | null;
  /** Última publicación que conocemos (AAAA-MM-DD), o null si no sabemos de ninguna. */
  ultimaPublicacion: string | null;
  /** Si lo que publican lleva tiempo sin funcionar (`detectarCaida`). Sin pasarlo, no hay rescate. */
  rescate?: Rescate | null;
}

/** Lo que lo publicado ha dejado de dar y qué se ha aprendido de lo que sí funcionó (ver `rescate.ts`). */
export interface Rescate {
  motivo: 'tres_semanas' | 'tres_seguidas';
  /** El formato que más han usado en ese tiempo, o null si no se sabe. */
  formatoFlojo: Formato | null;
  /** La pieza que más se guardó en el último mes, para repetir su estructura. */
  mejor: { titulo: string; formato: Formato; tasa: number } | null;
}

export interface Diagnostico {
  modo: Modo;
  /** Una línea para la banda, sin jerga. */
  porque: string;
  concierto: ConciertoParaAsesor | null;
  /** Días hasta el bolo o el lanzamiento (negativo si el lanzamiento ya salió). */
  dias: number | null;
  /** Solo en modo rescate. */
  rescate?: Rescate;
}

const enDias = (n: number) => (n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`);

export function diagnosticar({ hoy, conciertos, lanzamiento, ultimaPublicacion, rescate }: EntradaDiagnostico): Diagnostico {
  const proximo = conciertos
    .map((c) => ({ c, dias: diasEntre(hoy, c.fecha) }))
    .filter(({ dias }) => Number.isFinite(dias) && dias >= 0 && dias <= VENTANA.concierto)
    .sort((a, b) => a.dias - b.dias)[0];
  if (proximo) {
    const { c, dias } = proximo;
    const donde = [c.sala, c.ciudad].filter(Boolean).join(', ');
    return { modo: 'concierto', porque: `Tocáis ${enDias(dias)}${donde ? ` en ${donde}` : ''}: toca llenar la sala.`, concierto: c, dias };
  }

  if (lanzamiento) {
    const dias = diasEntre(hoy, lanzamiento.fecha);
    if (Number.isFinite(dias) && dias <= VENTANA.lanzamientoAntes && dias >= -VENTANA.lanzamientoDespues) {
      const porque = dias >= 0
        ? `«${lanzamiento.titulo}» sale ${enDias(dias)}: hay que calentar el estreno.`
        : `«${lanzamiento.titulo}» salió hace ${-dias} días: ahora toca que se escuche.`;
      return { modo: 'lanzamiento', porque, concierto: null, dias };
    }
  }

  // Un bolo o un estreno mandan; si no hay ninguno y lo que publican no arranca, toca cambiar de rumbo.
  if (rescate) {
    const porque = rescate.motivo === 'tres_semanas'
      ? 'Vuestro alcance lleva tres semanas bajando: toca probar algo distinto, no insistir.'
      : 'Las tres últimas piezas no han arrancado: toca cambiar de formato.';
    return { modo: 'rescate', porque, concierto: null, dias: null, rescate };
  }

  if (ultimaPublicacion) {
    const dias = diasEntre(ultimaPublicacion, hoy);
    if (Number.isFinite(dias) && dias > VENTANA.sinPublicar) {
      return { modo: 'reactivar', porque: `Lleváis ${dias} días sin publicar: volvemos con algo fácil.`, concierto: null, dias: null };
    }
  }

  return { modo: 'fondo', porque: 'Sin bolos ni estrenos a la vista: es el momento de que os conozcan.', concierto: null, dias: null };
}
