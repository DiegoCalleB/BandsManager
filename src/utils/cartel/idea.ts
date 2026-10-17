// La «idea» que la persona tiene del cartel, en cinco campos cortos y todos opcionales. Cuanto más
// cuente, más fiel sale el fondo. La usan el cliente (el formulario y sus ejemplos) y el servidor
// (que la traduce al inglés y la convierte en un brief de arte): el mismo saneador en los dos lados.
//
// Es texto libre de una persona, es decir, DATO: el servidor lo marca como tal y nunca lo trata como
// una orden para la IA (AGENTS.md §2.2.6).

export const MAX_CAMPO_IDEA = 200;

/** Lo que se le pide a la IA, en inglés y por partes (lo calcula el servidor a partir de la idea). */
export interface BriefIdea {
  scene: string;
  mood: string;
  palette: string;
  avoid: string;
  composition: string;
}

export interface IdeaCartel {
  /** Qué se ve: un objeto, una escena. */
  escena: string;
  /** Ambiente o época. */
  ambiente: string;
  /** Colores que les gustan. */
  colores: string;
  /** Lo que NO quieren ver. */
  evitar: string;
  /** «Se parece a…»: el tipo de cartel que tienen en la cabeza. */
  parecido: string;
}

export type CampoIdea = keyof IdeaCartel;

export const IDEA_VACIA: IdeaCartel = { escena: '', ambiente: '', colores: '', evitar: '', parecido: '' };

export const CAMPOS_IDEA: Array<{ id: CampoIdea; etiqueta: string; ejemplo: string }> = [
  { id: 'escena', etiqueta: '¿Qué se ve en el cartel?', ejemplo: 'Una guitarra con alas sobre una carretera del desierto' },
  { id: 'ambiente', etiqueta: 'Ambiente o época', ejemplo: 'Años 70, polvo y sol bajo' },
  { id: 'colores', etiqueta: 'Colores', ejemplo: 'Rojo oxidado, mostaza y crema' },
  { id: 'evitar', etiqueta: 'Qué NO quieres', ejemplo: 'Sin personas ni neones' },
  { id: 'parecido', etiqueta: 'Se parece a…', ejemplo: 'Un cartel de gira de rock americano, en serigrafía' },
];

/** Ideas completas para empezar a tocar: enseñan cuánto detalle ayuda. */
export const EJEMPLOS_IDEA: Array<{ nombre: string; idea: IdeaCartel }> = [
  {
    nombre: 'Rock de carretera',
    idea: {
      escena: 'Una guitarra con alas sobre una carretera del desierto al atardecer',
      ambiente: 'Años 70, polvo y sol bajo',
      colores: 'Rojo oxidado, mostaza y crema',
      evitar: 'Sin personas ni neones',
      parecido: 'Un cartel de gira de rock americano, en serigrafía',
    },
  },
  {
    nombre: 'Punk de sótano',
    idea: {
      escena: 'Recortes de periódico y una mano con un megáfono',
      ambiente: 'Fotocopia, hazlo tú mismo, sótano',
      colores: 'Negro y un rojo fosforito',
      evitar: 'Nada brillante ni degradados',
      parecido: 'Un fanzine pegado con cinta',
    },
  },
  {
    nombre: 'Jazz de club',
    idea: {
      escena: 'Un saxofón de perfil en una sala con humo',
      ambiente: 'Club pequeño de los 60, íntimo',
      colores: 'Azul noche y dorado',
      evitar: 'Nada recargado',
      parecido: 'Una portada de disco de jazz con mucho aire',
    },
  },
];

const sinControl = (s: string) =>
  Array.from(s)
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c >= 32 && c !== 127;
    })
    .join('');
const campo = (v: unknown) => (typeof v === 'string' ? sinControl(v).trim().slice(0, MAX_CAMPO_IDEA) : '');

/** Una idea válida a partir de cualquier cosa (o null si no es un objeto). */
export function sanearIdea(raw: unknown): IdeaCartel | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  return { escena: campo(r.escena), ambiente: campo(r.ambiente), colores: campo(r.colores), evitar: campo(r.evitar), parecido: campo(r.parecido) };
}

export const ideaVacia = (i: IdeaCartel) => Object.values(i).every((v) => !v);

/** Cuántos campos ha rellenado: para animar a contar más sin obligar. */
export const camposRellenos = (i: IdeaCartel) => Object.values(i).filter(Boolean).length;
