// El color del módulo (--acc) se resuelve por herencia del DOM con [data-modulo]. Las vistas ya
// lo ponen en su contenedor, pero el sidebar (hermano de <main>) y todos los modales (createPortal
// a document.body) quedan fuera de ese contenedor y caían al azul por defecto. Poniéndolo también
// en <body> heredan el acento del módulo activo; las vistas siguen sobrescribiéndolo dentro.
export type Modulo =
  | 'panel'
  | 'booking'
  | 'repertorio'
  | 'discografia'
  | 'sala'
  | 'finanzas'
  | 'reels'
  | 'fans'
  | 'dossier';

const MODULO_POR_VISTA: Record<string, Modulo> = {
  resumen: 'panel',
  calendario: 'panel',
  chat: 'panel',
  planes: 'panel',
  booking: 'booking',
  medios: 'booking',
  management: 'booking',
  bandas: 'booking',
  repertorio: 'repertorio',
  ensayos: 'repertorio',
  catalogo: 'repertorio',
  discografia: 'discografia',
  giras: 'sala',
  finanzas: 'finanzas',
  merchan: 'finanzas',
  reels: 'reels',
  fans: 'fans',
  epk: 'dossier',
};

let vistaActual: string | null = null;
let sobrescritura: Modulo | null = null;

function pintar() {
  if (typeof document === 'undefined') return;
  const modulo = vistaActual ? (sobrescritura ?? MODULO_POR_VISTA[vistaActual]) : undefined;
  if (modulo) document.body.dataset.modulo = modulo;
  else delete document.body.dataset.modulo;
}

/** null = sin sesión / sin módulo (login). */
export function aplicarModuloDeVista(vista: string | null) {
  vistaActual = vista;
  pintar();
}

/** Para vistas con subpestañas que cambian de módulo (Repertorio → Discografía). null la quita. */
export function sobrescribirModulo(modulo: Modulo | null) {
  sobrescritura = modulo;
  pintar();
}
