/**
 * Instrumento con el que se dibujan los acordes (guitarra / piano / bajo) y sus etiquetas.
 * Separado de AcordeEnInstrumento.tsx para que ese fichero exporte solo componentes.
 */
import { useState } from 'react';
import { instrumentoDelUsuario } from '../../utils/instrumentoProfesor';
import type { VistaAcorde } from '../../utils/vistaAcordes';
import type { NivelAcorde } from '../../utils/voicings';

/** Nombre visible de cada vista de acorde. */
export const ETIQUETA_VISTA: Record<VistaAcorde, string> = { guitarra: 'Guitarra', teclado: 'Piano', bajo: 'Bajo' };

const CLAVE_VISTA = 'bm_vista_acordes';

/** Instrumento con el que se dibujan los acordes: el último que eligió el usuario o, si no, el de su perfil. */
export function useVistaAcordes(): [VistaAcorde, (v: VistaAcorde) => void] {
  const [vista, setVista] = useState<VistaAcorde>(() => {
    try {
      const g = localStorage.getItem(CLAVE_VISTA);
      if (g === 'guitarra' || g === 'teclado' || g === 'bajo') return g;
    } catch { /* sin almacenamiento */ }
    const i = instrumentoDelUsuario();
    return i === 'teclado' || i === 'bajo' ? i : 'guitarra';
  });
  const cambiar = (v: VistaAcorde) => {
    setVista(v);
    try { localStorage.setItem(CLAVE_VISTA, v); } catch { /* vale solo esta sesión */ }
  };
  return [vista, cambiar];
}

const CLAVE_NIVEL = 'bm_nivel_acordes';

/** Nivel de detalle de los diagramas (Básico · Normal · Pro), recordado entre sesiones. */
export function useNivelAcordes(): [NivelAcorde, (n: NivelAcorde) => void] {
  const [nivel, setNivel] = useState<NivelAcorde>(() => {
    try {
      const g = localStorage.getItem(CLAVE_NIVEL);
      if (g === 'basico' || g === 'normal' || g === 'pro') return g;
    } catch { /* sin almacenamiento */ }
    return 'normal';
  });
  const cambiar = (n: NivelAcorde) => {
    setNivel(n);
    try { localStorage.setItem(CLAVE_NIVEL, n); } catch { /* vale solo esta sesión */ }
  };
  return [nivel, cambiar];
}

/** Cómo se lee la pestaña de letra y acordes del Atril: el cifrado de siempre o la rejilla de compases. */
export type VistaAtril = 'cifrado' | 'compases';

const CLAVE_VISTA_ATRIL = 'bm_vista_atril';

/** Vista elegida en la pestaña de letra y acordes, recordada en este dispositivo (preferencia de interfaz). */
export function useVistaAtril(): [VistaAtril, (v: VistaAtril) => void] {
  const [vista, setVista] = useState<VistaAtril>(() => {
    try {
      return localStorage.getItem(CLAVE_VISTA_ATRIL) === 'compases' ? 'compases' : 'cifrado';
    } catch {
      return 'cifrado';
    }
  });
  const cambiar = (v: VistaAtril) => {
    setVista(v);
    try { localStorage.setItem(CLAVE_VISTA_ATRIL, v); } catch { /* vale solo esta sesión */ }
  };
  return [vista, cambiar];
}
