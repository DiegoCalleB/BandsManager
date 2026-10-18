import type { ReactNode } from 'react';
import { PdfExportContext, type PdfExportContextValue } from './PdfExportContext';

/**
 * Proveedor del contexto del exportador PDF.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function PdfExportProvider({ value, children }: { value: PdfExportContextValue; children: ReactNode }) {
  return <PdfExportContext.Provider value={value}>{children}</PdfExportContext.Provider>;
}
