// Lo que ocurre justo después de guardar la conexión de Gmail de una banda (callback de OAuth):
// sincronizar el email de acceso con el Gmail conectado y avisar por correo (utils/avisosCuentaEmail.ts).
// Nunca lanza: un fallo aquí no debe tirar abajo una conexión que ya se guardó.

import { getSupabase } from '../db/core.js';
import { esEmailValido } from '../utils/email.js';
import { destinatariosDeAvisos, renderAvisoGmailConectado, renderAvisoEmailDeAccesoCambiado } from '../utils/avisosCuentaEmail.js';
import { sendTransactionalEmail, getProductionAppUrl } from './transactionalEmail.js';

async function enviarAviso(para: string, correo: { subject: string; html: string }): Promise<void> {
  try {
    const r = await sendTransactionalEmail({ to: para, subject: correo.subject, html: correo.html });
    if (!r.success) console.warn(`[gmailConexion] No se pudo enviar el aviso a ${para}: ${r.error}`);
  } catch (e) {
    console.warn(`[gmailConexion] Fallo enviando el aviso a ${para}:`, e);
  }
}

export async function trasConectarGmail(bandId: string, gmailEmail: string): Promise<void> {
  try {
    const sb = getSupabase();
    const { data: banda } = await sb.from('registered_bands').select('nombre_banda, email').eq('band_id', bandId).maybeSingle();
    if (!banda) return;

    const emailAnterior = String(banda.email || '');
    const emailNuevo = gmailEmail.trim().toLowerCase();
    let seCambioElEmailDeAcceso = false;

    // Ese email es la identidad de inicio de sesión: si ya pertenece a OTRA banda no se pisa
    // (dejaría dos cuentas con el mismo login y una podría entrar en la otra).
    if (emailNuevo && esEmailValido(emailNuevo) && emailNuevo !== emailAnterior.trim().toLowerCase()) {
      try {
        const { data: otra } = await sb.from('registered_bands').select('band_id').ilike('email', emailNuevo).neq('band_id', bandId).limit(1);
        if (!otra || otra.length === 0) {
          await sb.from('registered_bands').update({ email: emailNuevo }).eq('band_id', bandId);
          seCambioElEmailDeAcceso = true;
        } else {
          console.warn('[gmailOAuth] El Gmail conectado ya es el email de otra banda: no se sincroniza registered_bands.email.');
        }
      } catch (syncErr) {
        console.warn('[gmailOAuth] No se pudo sincronizar registered_bands.email:', syncErr);
      }
    }

    const nombreBanda = String(banda.nombre_banda || 'tu banda');
    const appUrl = getProductionAppUrl(process.env.APP_URL);
    const { conexion, cambioDeAcceso } = destinatariosDeAvisos({ emailAnterior, gmailEmail: emailNuevo, seCambioElEmailDeAcceso });
    const avisos: Array<Promise<void>> = conexion.map((a) => enviarAviso(a, renderAvisoGmailConectado({ nombreBanda, gmailEmail: emailNuevo, appUrl })));
    if (cambioDeAcceso) {
      avisos.push(enviarAviso(cambioDeAcceso, renderAvisoEmailDeAccesoCambiado({ nombreBanda, emailAnterior: cambioDeAcceso, emailNuevo, appUrl })));
    }
    await Promise.all(avisos);
  } catch (e) {
    console.warn('[gmailConexion] Error tras conectar Gmail (la conexión ya está guardada):', e);
  }
}
