/**
 * Contexto del exportador PDF: reparte estado y acciones del controlador a las vistas del modal.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar decenas de props desde el contenedor.
 */
import { createContext, useContext } from 'react';
import type { Setlist, Song } from '../../../types';
import type { BandMemberOption } from '../../../utils/repertorioUtils';
import type { usePdfExportController } from './hooks/usePdfExportController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type PdfExportController = ReturnType<typeof usePdfExportController>;

/** Props del modal que las vistas también necesitan. */
export interface PdfExportHostProps {
  isOpen: boolean;
  onClose: () => void;
  activeSetlist: Setlist;
  activeSetlistMetrics: {
    formattedTime: string;
    songCount: number;
    avgBpm?: number;
    totalSeconds?: number;
  };
  songs: Song[];
  bandMembers: BandMemberOption[];
  bandName: string;
  bandLogoUrl: string;
  onUpdateSong?: (updatedSong: Song) => void;
}

/** Valor del contexto: controlador + props del modal. */
export type PdfExportContextValue = PdfExportController & PdfExportHostProps;

export const PdfExportContext = createContext<PdfExportContextValue | null>(null);

/**
 * Lee el contexto del exportador PDF.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link PdfExportProvider} (error de programación, falla rápido).
 */
export function usePdfExport(): PdfExportContextValue {
  const value = useContext(PdfExportContext);
  if (!value) throw new Error('usePdfExport debe usarse dentro de <PdfExportProvider>');
  return value;
}
