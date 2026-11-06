/**
 * Qué hacer con un email guardado tras comprobarlo en la web de su sala (auditoría de emails de leads y catálogo).
 *
 *  - verificado: aparece escrito en una página de la propia sala y su dominio recibe correo.
 *  - vaciar:     lo aportó una IA o un buscador (o no se sabe de dónde salió y se ha pedido vaciar esos) y no se puede
 *                comprobar: es una suposición.
 *  - revisar:    no se puede comprobar, pero no se toca solo: viene de la web, de Google Maps o del catálogo, o de una
 *                persona. Va al informe para que alguien lo mire.
 */
import type { ResultadoEvidencia, MotivoDescarte } from './emailConEvidencia.js';
import type { FuenteDato } from './procedenciaDatos.js';

export type PlanDeEmail =
  | { accion: 'verificado'; evidencia: string }
  | { accion: 'vaciar'; motivo: MotivoDescarte }
  | { accion: 'revisar'; motivo: MotivoDescarte };

export function planificarEmail(entrada: { fuente: FuenteDato | undefined; resultado: ResultadoEvidencia; tambienSinOrigen?: boolean }): PlanDeEmail {
  const { fuente, resultado, tambienSinOrigen } = entrada;
  if ('evidencia' in resultado) return { accion: 'verificado', evidencia: resultado.evidencia };
  const esSuposicion = fuente === 'ia' || fuente === 'buscador' || (fuente === undefined && tambienSinOrigen === true);
  return { accion: esSuposicion ? 'vaciar' : 'revisar', motivo: resultado.motivo };
}
