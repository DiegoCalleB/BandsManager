/**
 * Contexto de la vista de métricas sociales: reparte estado y acciones del controlador a las vistas.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar decenas de props desde el contenedor.
 */
import { createContext, useContext } from 'react';
import type { ReelsMetricsViewProps } from '../ReelsMetricsView';
import type { useReelsMetricsController } from './hooks/useReelsMetricsController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type MetricsController = ReturnType<typeof useReelsMetricsController>;

/** Valor del contexto: controlador + props de la vista (con sus valores por defecto ya resueltos). */
export type MetricsContextValue = MetricsController & ReelsMetricsViewProps;

export const MetricsContext = createContext<MetricsContextValue | null>(null);

/**
 * Lee el contexto de métricas.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link MetricsProvider} (error de programación, falla rápido).
 */
export function useMetrics(): MetricsContextValue {
  const value = useContext(MetricsContext);
  if (!value) throw new Error('useMetrics debe usarse dentro de <MetricsProvider>');
  return value;
}
