/**
 * Instrumento con el que se dibujan los acordes (guitarra / piano / bajo) y sus etiquetas.
 * Separado de AcordeEnInstrumento.tsx para que ese fichero exporte solo componentes.
 */
import { useState } from 'react';
import type { AjusteCompases } from '../../utils/cuadriculaCompases';
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

const CLAVE_AJUSTE = 'bm_ajuste_compases_';

function leerAjuste(cancion: string): AjusteCompases {
  try {
    const bruto = JSON.parse(localStorage.getItem(CLAVE_AJUSTE + cancion) ?? '{}') as AjusteCompases;
    const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
    return {
      ...(num(bruto.bpm) ? { bpm: bruto.bpm } : {}),
      ...(num(bruto.inicio) ? { inicio: bruto.inicio } : {}),
      ...(bruto.tiempos === 3 || bruto.tiempos === 4 ? { tiempos: bruto.tiempos } : {}),
    };
  } catch {
    return {};
  }
}

/** Correcciones del músico a los compases de una canción (BPM, inicio de compás, 3/4 o 4/4), recordadas en este dispositivo. */
export function useAjusteCompases(cancion: string): [AjusteCompases, (a: AjusteCompases) => void] {
  const [guardado, setGuardado] = useState<{ cancion: string; ajuste: AjusteCompases }>(() => ({ cancion, ajuste: leerAjuste(cancion) }));
  // Al cambiar de canción se lee su ajuste en el mismo render, sin efectos.
  const actual = guardado.cancion === cancion ? guardado : { cancion, ajuste: leerAjuste(cancion) };
  if (actual !== guardado) setGuardado(actual);
  const cambiar = (ajuste: AjusteCompases) => {
    setGuardado({ cancion, ajuste });
    try {
      if (Object.keys(ajuste).length) localStorage.setItem(CLAVE_AJUSTE + cancion, JSON.stringify(ajuste));
      else localStorage.removeItem(CLAVE_AJUSTE + cancion);
    } catch { /* vale solo esta sesión */ }
  };
  return [actual.ajuste, cambiar];
}
