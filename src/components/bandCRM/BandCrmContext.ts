/**
 * Contexto del CRM de bandas: reparte estado y acciones del controlador a las vistas de la pantalla.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar decenas de props desde el contenedor.
 */
import { createContext, useContext } from 'react';
import type { BandCRMProps } from '../BandCRM';
import type { useBandCrmController } from './hooks/useBandCrmController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type BandCrmController = ReturnType<typeof useBandCrmController>;

/** Valor del contexto: controlador + props de la pantalla (con sus valores por defecto ya resueltos). */
export type BandCrmContextValue = BandCrmController & BandCRMProps;

export const BandCrmContext = createContext<BandCrmContextValue | null>(null);

/**
 * Lee el contexto del CRM de bandas.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link BandCrmProvider} (error de programación, falla rápido).
 */
export function useBandCrm(): BandCrmContextValue {
  const value = useContext(BandCrmContext);
  if (!value) throw new Error('useBandCrm debe usarse dentro de <BandCrmProvider>');
  return value;
}
