/**
 * El diagnóstico diario del asesor: en qué momento está la banda (modo) y qué le toca publicar hoy.
 * Lógica pura y determinista, sin IA: explicable ("te propongo esto porque tocas en 9 días"),
 * testeable y gratis. La IA entra después, para redactar las piezas, no para decidir el plan.
 *
 * Prioridad de los modos: un bolo cercano manda sobre un lanzamiento, y los dos sobre reactivar.
 * Lo que no encaja en ninguno es "fondo": rotar los temas propios y construir comunidad.
 */
import { diasEntre, planificarCampana } from '../campanaConcierto';
import type { EstrategiaMarketing, HorasSemana, Lanzamiento } from './estrategia';
import type { Formato, Red } from './reglasFormato';

export type Modo = 'concierto' | 'lanzamiento' | 'reactivar' | 'fondo';

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
}

export interface Diagnostico {
  modo: Modo;
  /** Una línea para la banda, sin jerga. */
  porque: string;
  concierto: ConciertoParaAsesor | null;
  /** Días hasta el bolo o el lanzamiento (negativo si el lanzamiento ya salió). */
  dias: number | null;
}

const enDias = (n: number) => (n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`);

export function diagnosticar({ hoy, conciertos, lanzamiento, ultimaPublicacion }: EntradaDiagnostico): Diagnostico {
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

  if (ultimaPublicacion) {
    const dias = diasEntre(ultimaPublicacion, hoy);
    if (Number.isFinite(dias) && dias > VENTANA.sinPublicar) {
      return { modo: 'reactivar', porque: `Lleváis ${dias} días sin publicar: volvemos con algo fácil.`, concierto: null, dias: null };
    }
  }

  return { modo: 'fondo', porque: 'Sin bolos ni estrenos a la vista: es el momento de que os conozcan.', concierto: null, dias: null };
}

/* ----------------------------------------------------------------- tarjetas de hoy */

export interface Tarjeta {
  id: string;
  formato: Formato;
  redes: Red[];
  titulo: string;
  /** Qué hacer, en una o dos frases. */
  idea: string;
  porque: string;
  esfuerzoMin: number;
  /** Atajo a otra pantalla de la app que ya resuelve la pieza. */
  atajo: { vista: 'carteleria'; concertId: string } | null;
}

/** Cuántas tarjetas caben en un día según el tiempo real de la banda. */
export const TARJETAS_POR_HORAS: Record<HorasSemana, number> = { 1: 1, 3: 2, 6: 3 };

export const ESFUERZO_MIN: Record<Formato, number> = { stories: 5, post: 10, carrusel: 30, reel: 45 };

const AMBAS: Red[] = ['instagram', 'tiktok'];

/** Semana del año: rota los temas propios para no repetir siempre el mismo. */
function semanaDelAnio(hoy: string): number {
  const d = new Date(`${hoy}T12:00:00Z`);
  return Math.floor(diasEntre(`${d.getUTCFullYear()}-01-01`, hoy) / 7);
}

/** Cómo grabar un vídeo respetando a quien no quiere salir hablando. */
function comoGrabar(e: EstrategiaMarketing): string {
  return e.camara === 'nadie'
    ? 'Sin hablar a cámara: planos de manos e instrumentos y texto en pantalla.'
    : 'Una frase a cámara para abrir y el resto, música.';
}

function tarjeta(t: Omit<Tarjeta, 'esfuerzoMin' | 'atajo'> & Partial<Pick<Tarjeta, 'atajo'>>): Tarjeta {
  return { atajo: null, ...t, esfuerzoMin: ESFUERZO_MIN[t.formato] };
}

function principales(d: Diagnostico, e: EstrategiaMarketing, hoy: string): Tarjeta[] {
  if (d.modo === 'concierto' && d.concierto) {
    const c = d.concierto;
    const hito = planificarCampana(c.fecha, hoy).find((h) => h.estado === 'hoy');
    const atajo = { vista: 'carteleria' as const, concertId: c.id };
    if (hito) {
      return [
        tarjeta({ id: `hito-${hito.id}`, formato: 'post', redes: ['instagram'], titulo: `${hito.titulo} del bolo`, idea: 'El cartel con fecha, sala y enlace a entradas.', porque: hito.objetivo, atajo }),
        tarjeta({ id: 'hito-stories', formato: 'stories', redes: ['instagram'], titulo: 'Stories con cuenta atrás', idea: 'El cartel, un sticker de cuenta atrás y el enlace a entradas.', porque: 'Quien activa el recordatorio recibe aviso el día del bolo.' }),
      ];
    }
    return [
      tarjeta({ id: 'bolo-teaser', formato: 'reel', redes: AMBAS, titulo: 'Un adelanto del directo', idea: `15 segundos de una canción que tocaréis, empezando por el estribillo. ${comoGrabar(e)}`, porque: 'Entre anuncio y recordatorio, que no se olvide el bolo.' }),
      tarjeta({ id: 'bolo-stories', formato: 'stories', redes: ['instagram'], titulo: 'Stories con cuenta atrás', idea: 'Una encuesta: «¿qué canción no puede faltar?»', porque: 'Quien responde verá antes vuestras siguientes publicaciones.', atajo }),
    ];
  }

  if (d.modo === 'lanzamiento') {
    const antes = (d.dias ?? 0) >= 0;
    return antes
      ? [tarjeta({ id: 'lanz-teaser', formato: 'reel', redes: AMBAS, titulo: 'Teaser del estreno', idea: `Los mejores 10 segundos de la canción, sin dar la canción entera. ${comoGrabar(e)}`, porque: 'Calentar antes para que el primer día suene.' })]
      : [tarjeta({ id: 'lanz-historia', formato: 'carrusel', redes: ['instagram'], titulo: 'La historia de la canción', idea: 'De qué va, cómo nació y una frase de la letra en la última slide con el enlace.', porque: 'Una historia con principio y final se guarda, y guardar es lo que más premia el algoritmo.' })];
  }

  if (d.modo === 'reactivar') {
    return [tarjeta({ id: 'reactivar', formato: 'stories', redes: ['instagram'], titulo: 'Volver sin presión', idea: 'Una foto del último ensayo y una pregunta: «¿qué queréis escuchar en el próximo bolo?»', porque: 'Cinco minutos para que el algoritmo y la gente os vuelvan a ver.' })];
  }

  const pilar = e.pilares.length ? e.pilares[semanaDelAnio(hoy) % e.pilares.length] : null;
  return [
    tarjeta({
      id: 'fondo-pilar',
      formato: 'reel',
      redes: AMBAS,
      titulo: pilar ? `Tema de la semana: ${pilar}` : 'Detrás de escena del ensayo',
      idea: `Gancho en los 3 primeros segundos y algo real, no perfecto. ${comoGrabar(e)}`,
      porque: 'Los reels son lo que os enseña a gente que aún no os sigue.',
    }),
  ];
}

/** Lo que toca publicar hoy, ya recortado al tiempo de la banda. */
export function tarjetasDeHoy(d: Diagnostico, e: EstrategiaMarketing, hoy: string): Tarjeta[] {
  const lista = principales(d, e, hoy);
  // Stories a diario (lección de estrategia de IG), si no van ya y si queda tiempo.
  if (!lista.some((t) => t.formato === 'stories')) {
    lista.push(tarjeta({ id: 'stories-diarias', formato: 'stories', redes: ['instagram'], titulo: 'La story del día', idea: 'Lo que estéis haciendo hoy, tal cual, con un sticker de pregunta.', porque: 'Una story al día os mantiene arriba en la barra de quien ya os sigue.' }));
  }
  return lista.slice(0, TARJETAS_POR_HORAS[e.horasSemana]);
}
