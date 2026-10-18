/**
 * Analítica web con Plausible: sin cookies, sin datos personales, sin banner de consentimiento.
 *
 * Apagada por defecto: solo se carga si `VITE_PLAUSIBLE_DOMAIN` está definido (p. ej.
 * `bandmanager.io`). Sin esa variable, todo aquí son no-ops. Los eventos son una lista cerrada y
 * sin propiedades con datos de personas (nada de emails, nombres ni ids): solo el embudo.
 */

export type EventoAnalitica =
  | 'CTA Landing' // pulsa "Empezar/Entrar" en la landing
  | 'Interesado Landing' // deja su email en la landing sin registrarse
  | 'Registro' // cuenta creada
  | 'Fan Suscrito' // un fan deja su email en la página de una banda
  | 'Invitacion Recibida' // llega con ?ref= de otra banda
  | 'Idioma Cambiado'; // cambia el idioma (propiedad: idioma)

type Plausible = ((nombre: string, opciones?: { props: Record<string, string> }) => void) & { q?: unknown[] };

const SCRIPT_ID = 'plausible-script';

/** Carga el script de Plausible una sola vez, si hay dominio configurado. */
export function iniciarAnalitica(): void {
  const dominio = import.meta.env?.VITE_PLAUSIBLE_DOMAIN;
  if (!dominio || typeof document === 'undefined' || document.getElementById(SCRIPT_ID)) return;

  const w = window as Window & { plausible?: Plausible };
  // Cola mientras el script termina de cargar: los eventos tempranos no se pierden.
  w.plausible =
    w.plausible ||
    function (...args: unknown[]) {
      (w.plausible!.q = w.plausible!.q || []).push(args);
    };

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.defer = true;
  script.dataset.domain = dominio;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

/** Registra un evento del embudo. Nunca lanza: la analítica no puede romper la app. */
export function registrarEvento(evento: EventoAnalitica, props?: Record<string, string>): void {
  try {
    const plausible = (window as Window & { plausible?: Plausible }).plausible;
    if (typeof plausible === 'function') plausible(evento, props ? { props } : undefined);
  } catch {
    /* sin analítica no pasa nada */
  }
}
