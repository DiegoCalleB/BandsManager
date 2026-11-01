/**
 * Atajos de teclado del Atril: lo que se hace con las dos manos ocupadas (guitarra) se hace sin ratón.
 *
 *   Espacio  reproducir / pausar      ← →  atrasar / adelantar 5 s     R  volver al inicio
 *   − +      bajar / subir un semitono  0  tono original               M  más / menos controles
 *   E        modo escenario            F  pantalla completa
 */
import { useEffect, useRef } from "react";

export type AccionAtajo = "reproducir" | "atras" | "adelante" | "inicio" | "tonoMenos" | "tonoMas" | "tonoOriginal" | "controles" | "escenario" | "pantallaCompleta";

/** Segundos que saltan las flechas. */
export const SALTO_SEGUNDOS = 5;

const ACCIONES: Record<string, AccionAtajo> = {
  " ": "reproducir",
  ArrowLeft: "atras",
  ArrowRight: "adelante",
  r: "inicio",
  "-": "tonoMenos",
  "+": "tonoMas",
  "=": "tonoMas",
  "0": "tonoOriginal",
  m: "controles",
  e: "escenario",
  f: "pantallaCompleta",
};

/** Elementos que ya consumen el teclado (escribir, mover un deslizador, activar un botón con Espacio). */
const PROPIOS_DEL_TECLADO = /^(input|textarea|select|button|a|summary)$/i;

/**
 * Qué acción provoca una pulsación, o `null` si el Atril debe dejarla pasar.
 * @param e Datos de la pulsación (los de un `KeyboardEvent`, y el elemento destino).
 * @returns La acción, o `null` si hay modificadores, se está escribiendo o la tecla no es un atajo.
 */
export function accionDeAtajo(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; target: EventTarget | null }): AccionAtajo | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const el = e.target as HTMLElement | null;
  if (el && (PROPIOS_DEL_TECLADO.test(el.tagName ?? "") || el.isContentEditable || el.closest?.("[role=dialog],[role=menu]"))) return null;
  return ACCIONES[e.key.length === 1 ? e.key.toLowerCase() : e.key] ?? null;
}

/**
 * Engancha los atajos al documento mientras el Atril está abierto.
 * @param ejecutar Cómo se ejecuta cada acción (se lee siempre la última versión, sin reenganchar).
 * @param activo `false` en pestañas sin cifrado (edición, sustituto): ahí el teclado es del texto.
 */
export function useAtajosAtril(ejecutar: (accion: AccionAtajo) => void, activo: boolean): void {
  const ultima = useRef(ejecutar);
  useEffect(() => { ultima.current = ejecutar; });
  useEffect(() => {
    if (!activo) return;
    const alPulsar = (e: KeyboardEvent) => {
      const accion = accionDeAtajo(e);
      if (!accion) return;
      e.preventDefault();
      ultima.current(accion);
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [activo]);
}
