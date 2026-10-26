import { useState } from "react";

/** Cómo se lee la pestaña de letra y acordes: el cifrado de siempre o la rejilla de compases. */
export type VistaAtril = "cifrado" | "compases";

const CLAVE = "bm_vista_atril";

/** Vista elegida en la pestaña de letra y acordes, recordada entre sesiones en este dispositivo. */
export function useVistaAtril(): [VistaAtril, (v: VistaAtril) => void] {
  const [vista, setVista] = useState<VistaAtril>(() => {
    try {
      return localStorage.getItem(CLAVE) === "compases" ? "compases" : "cifrado";
    } catch {
      return "cifrado";
    }
  });
  const cambiar = (v: VistaAtril) => {
    setVista(v);
    try { localStorage.setItem(CLAVE, v); } catch { /* vale solo esta sesión */ }
  };
  return [vista, cambiar];
}
