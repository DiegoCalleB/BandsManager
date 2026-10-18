import { sendTransactionalEmail } from './transactionalEmail.js';
import { correoAvisoAlta, destinoAvisoAltas, type DatosAlta } from '../utils/avisoAltas.js';

/**
 * Avisa por email al responsable del proyecto. Nunca lanza ni retrasa la respuesta al usuario: si el
 * aviso falla se deja constancia en el log y el alta sigue adelante.
 */
export async function avisarAlta(datos: DatosAlta): Promise<void> {
  try {
    const correo = correoAvisoAlta(datos);
    const envio = await sendTransactionalEmail({ to: destinoAvisoAltas(), subject: correo.asunto, html: correo.html });
    if (!envio.success) console.warn(`[AvisoAltas] no se pudo avisar de "${datos.tipo}":`, envio.error);
  } catch (err) {
    console.warn(`[AvisoAltas] error al avisar de "${datos.tipo}":`, err);
  }
}
