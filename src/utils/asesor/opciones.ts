/**
 * Qué publicar hoy: varias ideas por modo para que la banda elija, ordenadas por lo que le suele
 * funcionar a ESA banda. Lógica pura y determinista: el mismo día, los mismos datos y el mismo
 * historial dan las mismas opciones (el servidor las recalcula para validar lo que pide el cliente).
 *
 * Aprendizaje sencillo y explicable: un formato que la banda salta más de lo que hace baja puestos;
 * nunca desaparece del todo (se queda en "otras ideas"), y los hitos de un bolo no se mueven.
 */
import { diasEntre, planificarCampana } from '../campanaConcierto';
import type { Diagnostico } from './diagnostico';
import type { EstrategiaMarketing, HorasSemana } from './estrategia';
import type { Formato, Red, TipoContenido } from './reglasFormato';

export type Accion = 'hecho' | 'saltado';

export interface AccionRegistrada {
  /** AAAA-MM-DD. */
  fecha: string;
  tarjetaId: string;
  formato: Formato;
  accion: Accion;
}

export interface Tarjeta {
  id: string;
  formato: Formato;
  redes: Red[];
  tipo: TipoContenido;
  titulo: string;
  /** Qué hacer, en una o dos frases. */
  idea: string;
  porque: string;
  esfuerzoMin: number;
  /** Atajo a otra pantalla de la app que ya resuelve la pieza. */
  atajo: { vista: 'carteleria'; concertId: string } | null;
  hecha: boolean;
}

export interface OpcionesDeHoy {
  recomendadas: Tarjeta[];
  alternativas: Tarjeta[];
}

/** Cuántas recomendadas caben en un día según el tiempo real de la banda. */
export const TARJETAS_POR_HORAS: Record<HorasSemana, number> = { 1: 1, 3: 2, 6: 3 };
export const MAX_ALTERNATIVAS = 3;
export const ESFUERZO_MIN: Record<Formato, number> = { stories: 5, post: 10, carrusel: 30, reel: 45 };
/** Días de historial que cuentan para aprender. */
export const DIAS_APRENDIZAJE = 30;
const MAX_PENALIZACION = 3;

const AMBAS: Red[] = ['instagram', 'tiktok'];
const IG: Red[] = ['instagram'];

interface Idea extends Omit<Tarjeta, 'esfuerzoMin' | 'hecha' | 'atajo'> {
  atajo?: Tarjeta['atajo'];
  /** Prioridad dentro del modo: más alto, antes. Los hitos de un bolo van muy por encima. */
  base: number;
}

/** Cómo grabar un vídeo respetando a quien no quiere salir hablando. */
function comoGrabar(e: EstrategiaMarketing): string {
  return e.camara === 'nadie'
    ? 'Sin hablar a cámara: planos de manos e instrumentos y texto en pantalla.'
    : 'Una frase a cámara para abrir y el resto, música.';
}

/** Semana del año: rota los temas propios para no repetir siempre el mismo. */
function semanaDelAnio(hoy: string): number {
  return Math.floor(diasEntre(`${hoy.slice(0, 4)}-01-01`, hoy) / 7);
}

const storyDelDia: Idea = {
  id: 'stories-dia', formato: 'stories', redes: IG, tipo: 'humano', base: 3,
  titulo: 'La story del día', idea: 'Lo que estéis haciendo hoy, tal cual, con un sticker de pregunta.',
  porque: 'Una story al día os mantiene arriba en la barra de quien ya os sigue.',
};

function ideasConcierto(d: Diagnostico, e: EstrategiaMarketing, hoy: string): Idea[] {
  const c = d.concierto!;
  const atajo = { vista: 'carteleria' as const, concertId: c.id };
  const hito = planificarCampana(c.fecha, hoy).find((h) => h.estado === 'hoy');
  const ideas: Idea[] = [
    { id: 'bolo-teaser', formato: 'reel', redes: AMBAS, tipo: 'promocional', base: 6, titulo: 'Un adelanto del directo',
      idea: `15 segundos de una canción que tocaréis, empezando por el estribillo. ${comoGrabar(e)}`,
      porque: 'Los reels llegan a gente que aún no os sigue: es la forma de llenar con caras nuevas.' },
    { id: 'bolo-encuesta', formato: 'stories', redes: IG, tipo: 'participativo', base: 5, atajo, titulo: 'Stories con cuenta atrás',
      idea: 'El cartel, un sticker de cuenta atrás y una encuesta: «¿qué canción no puede faltar?»',
      porque: 'Quien activa la cuenta atrás recibe aviso el día del bolo, y quien vota os verá antes.' },
    { id: 'bolo-setlist', formato: 'carrusel', redes: IG, tipo: 'cultural', base: 4, titulo: 'Lo que vais a escuchar',
      idea: 'Cinco slides: una canción por slide con una frase de por qué está en el setlist, y la última con fecha y entradas.',
      porque: 'Un carrusel se guarda, y lo guardado vuelve a salir justo antes del bolo.' },
    storyDelDia,
  ];
  if (hito) {
    ideas.unshift({ id: `hito-${hito.id}`, formato: 'post', redes: IG, tipo: 'promocional', base: 10, atajo,
      titulo: `${hito.titulo} del bolo`, idea: 'El cartel con fecha, sala y enlace a entradas.', porque: hito.objetivo });
  }
  return ideas;
}

function ideasLanzamiento(d: Diagnostico, e: EstrategiaMarketing): Idea[] {
  if ((d.dias ?? 0) >= 0) {
    return [
      { id: 'lanz-teaser', formato: 'reel', redes: AMBAS, tipo: 'promocional', base: 6, titulo: 'Teaser del estreno',
        idea: `Los mejores 10 segundos de la canción, sin darla entera. ${comoGrabar(e)}`, porque: 'Calentar antes para que el primer día suene.' },
      { id: 'lanz-cuenta', formato: 'stories', redes: IG, tipo: 'participativo', base: 5, titulo: 'Cuenta atrás del estreno',
        idea: 'Sticker de cuenta atrás con el título y una pregunta: «¿de qué creéis que va?»', porque: 'Quien activa el aviso la escucha el primer día.' },
      { id: 'lanz-origen', formato: 'carrusel', redes: IG, tipo: 'humano', base: 4, titulo: 'Cómo nació la canción',
        idea: 'De la primera nota en el local a la versión final, en cinco slides con fotos del proceso.', porque: 'La historia detrás hace que la escuchen con otros oídos.' },
      storyDelDia,
    ];
  }
  return [
    { id: 'lanz-historia', formato: 'carrusel', redes: IG, tipo: 'cultural', base: 6, titulo: 'La historia de la canción',
      idea: 'De qué va, cómo nació y una frase de la letra en la última slide con el enlace.', porque: 'Una historia con principio y final se guarda, y guardar es lo que más premia el algoritmo.' },
    { id: 'lanz-local', formato: 'reel', redes: AMBAS, tipo: 'humano', base: 5, titulo: 'La canción en el local',
      idea: `La canción nueva tocada en el local de ensayo, sin producir. ${comoGrabar(e)}`, porque: 'Lo crudo y real convierte más que lo pulido.' },
    { id: 'lanz-frase', formato: 'stories', redes: IG, tipo: 'participativo', base: 4, titulo: '¿Cuál es vuestra frase?',
      idea: 'Una frase de la letra sobre fondo de color y un sticker de pregunta con el enlace a la canción.', porque: 'Las respuestas os dan ideas y suben vuestra prioridad en su feed.' },
    storyDelDia,
  ];
}

function ideasReactivar(e: EstrategiaMarketing): Idea[] {
  return [
    { id: 'reactivar', formato: 'stories', redes: IG, tipo: 'participativo', base: 6, titulo: 'Volver sin presión',
      idea: 'Una foto del último ensayo y una pregunta: «¿qué queréis escuchar en el próximo bolo?»', porque: 'Cinco minutos para que el algoritmo y la gente os vuelvan a ver.' },
    { id: 'reactivar-loop', formato: 'reel', redes: AMBAS, tipo: 'humano', base: 5, titulo: 'Siete segundos en bucle',
      idea: `Un riff o un golpe de batería que empiece y acabe igual, para que se vea en bucle. ${comoGrabar(e)}`, porque: 'Un vídeo corto que se repite suma tiempo visto, y eso es lo que mira el algoritmo.' },
    { id: 'reactivar-foto', formato: 'post', redes: IG, tipo: 'humano', base: 4, titulo: 'Una foto con historia',
      idea: 'La mejor foto que tengáis del último bolo y dos líneas de lo que pasó esa noche.', porque: 'Lo más fácil para volver a aparecer sin tener que grabar.' },
  ];
}

function ideasFondo(e: EstrategiaMarketing, hoy: string): Idea[] {
  const pilar = e.pilares.length ? e.pilares[semanaDelAnio(hoy) % e.pilares.length] : null;
  return [
    { id: 'fondo-pilar', formato: 'reel', redes: AMBAS, tipo: 'humano', base: 6,
      titulo: pilar ? `Tema de la semana: ${pilar}` : 'Detrás de escena del ensayo',
      idea: `Gancho en los 3 primeros segundos y algo real, no perfecto. ${comoGrabar(e)}`, porque: 'Los reels son lo que os enseña a gente que aún no os sigue.' },
    { id: 'fondo-carrusel', formato: 'carrusel', redes: IG, tipo: 'cultural', base: 5,
      titulo: pilar ? `${pilar}, en cinco slides` : 'Cinco cosas que no sabéis de nosotros',
      idea: 'Una idea por slide, la primera como gancho y la última con una pregunta para comentar.', porque: 'Lo que se guarda vuelve a salir: es contenido que trabaja semanas.' },
    { id: 'fondo-pregunta', formato: 'stories', redes: IG, tipo: 'participativo', base: 4, titulo: 'Que elijan ellos',
      idea: 'Una encuesta entre dos canciones vuestras: «¿cuál abre el próximo bolo?»', porque: 'Quien vota se siente parte de la banda, y os verá antes la próxima vez.' },
    storyDelDia,
  ];
}

function ideasDeHoy(d: Diagnostico, e: EstrategiaMarketing, hoy: string): Idea[] {
  if (d.modo === 'concierto' && d.concierto) return ideasConcierto(d, e, hoy);
  if (d.modo === 'lanzamiento') return ideasLanzamiento(d, e);
  if (d.modo === 'reactivar') return ideasReactivar(e);
  return ideasFondo(e, hoy);
}

/** Cuánto baja cada formato: saltos menos hechos en el último mes, entre 0 y 3. */
export function penalizacionPorFormato(historial: AccionRegistrada[], hoy: string): Partial<Record<Formato, number>> {
  const neto: Partial<Record<Formato, number>> = {};
  for (const a of historial) {
    const dias = diasEntre(a.fecha, hoy);
    if (!(dias >= 0 && dias <= DIAS_APRENDIZAJE)) continue;
    neto[a.formato] = (neto[a.formato] ?? 0) + (a.accion === 'saltado' ? 1 : -1);
  }
  const pen: Partial<Record<Formato, number>> = {};
  for (const [f, n] of Object.entries(neto) as Array<[Formato, number]>) pen[f] = Math.min(MAX_PENALIZACION, Math.max(0, n));
  return pen;
}

export function opcionesDeHoy(d: Diagnostico, e: EstrategiaMarketing, hoy: string, historial: AccionRegistrada[] = []): OpcionesDeHoy {
  const deHoy = historial.filter((a) => a.fecha === hoy);
  const saltadas = new Set(deHoy.filter((a) => a.accion === 'saltado').map((a) => a.tarjetaId));
  const hechas = new Set(deHoy.filter((a) => a.accion === 'hecho').map((a) => a.tarjetaId));
  const pen = penalizacionPorFormato(historial, hoy);

  const ordenadas = ideasDeHoy(d, e, hoy)
    .filter((i) => !saltadas.has(i.id))
    .map((i, orden) => ({ i, orden, puntos: i.base - (pen[i.formato] ?? 0) }))
    .sort((a, b) => b.puntos - a.puntos || a.orden - b.orden)
    .map(({ i: { base: _base, atajo, ...resto } }): Tarjeta => ({ ...resto, atajo: atajo ?? null, esfuerzoMin: ESFUERZO_MIN[resto.formato], hecha: hechas.has(resto.id) }));

  const n = TARJETAS_POR_HORAS[e.horasSemana];
  return { recomendadas: ordenadas.slice(0, n), alternativas: ordenadas.slice(n, n + MAX_ALTERNATIVAS) };
}

/**
 * La idea de hoy con ese id, haya salido o no entre las opciones (una saltada también vale, para
 * poder deshacer). Es lo que valida el servidor: el cliente solo manda el id, nunca la idea.
 */
export function buscarTarjeta(d: Diagnostico, e: EstrategiaMarketing, hoy: string, id: unknown): Tarjeta | null {
  if (typeof id !== 'string') return null;
  const idea = ideasDeHoy(d, e, hoy).find((i) => i.id === id);
  if (!idea) return null;
  const { base: _base, atajo, ...resto } = idea;
  return { ...resto, atajo: atajo ?? null, esfuerzoMin: ESFUERZO_MIN[resto.formato], hecha: false };
}

/** Piezas hechas cada uno de los últimos 7 días (el último es hoy), para la Onda de la semana. */
export function semana(historial: AccionRegistrada[], hoy: string): Array<{ fecha: string; hechas: number }> {
  const dias = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(`${hoy}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (6 - k));
    return d.toISOString().slice(0, 10);
  });
  return dias.map((fecha) => ({ fecha, hechas: historial.filter((a) => a.fecha === fecha && a.accion === 'hecho').length }));
}
