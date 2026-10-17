// Dónde va cada cosa en el cartel. Puro: recibe un medidor de texto (en el navegador,
// `ctx.measureText`; en los tests, uno falso) y devuelve líneas, QR, marca y las zonas
// donde hay texto (para medir el contraste del fondo justo ahí).
//
// Todo se expresa en `u` = ancho / 1080, así el mismo diseño escala de la vista previa al A4. Las piezas
// comunes viven en `layoutBase.ts` y las tres composiciones en `composiciones.ts`.

import type { DefFormato } from './formatos';
import { composicionBase, composicionCentrada, composicionVentana } from './composiciones';
import { contexto, type DatosCartel, type LayoutCartel, type Medidor, type OpcionesLayout } from './layoutBase';

export * from './layoutBase';

export function calcularLayout(def: DefFormato, ancho: number, datos: DatosCartel, opciones: OpcionesLayout, medir: Medidor): LayoutCartel {
  const c = contexto(def, ancho, datos, opciones, medir);
  switch (opciones.composicion) {
    case 'centrada':
      return composicionCentrada(c);
    case 'base':
      return composicionBase(c);
    default:
      return composicionVentana(c);
  }
}
