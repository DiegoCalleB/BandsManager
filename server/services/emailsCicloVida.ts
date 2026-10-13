// Envío de los emails de ciclo de vida (onboarding). Apagado por defecto: solo corre con
// EMAILS_CICLO_VIDA=true. La decisión de qué enviar es pura (utils/emailsCicloVida.ts).
import {
  dbBandasConConcierto,
  dbBandasConEpk,
  dbEmailsEnviados,
  dbLiberarEmail,
  dbReservarEmail,
  dbUsuariosRecientes,
} from '../db/emailsCicloVida.js';
import { sendTransactionalEmail, getProductionAppUrl } from './transactionalEmail.js';
import { elegirEmail, idiomaDeUsuario, renderizarEmail, VENTANA_MAX_DIAS } from '../utils/emailsCicloVida.js';
import { captureError } from '../utils/errorTracking.js';

const CADA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

export interface ResultadoCiclo {
  revisados: number;
  enviados: number;
}

/** Una pasada: revisa las altas recientes y envía a cada una, como mucho, el email que le toca. */
export async function procesarEmailsCicloVida(ahora = new Date()): Promise<ResultadoCiclo> {
  const usuarios = await dbUsuariosRecientes(new Date(ahora.getTime() - VENTANA_MAX_DIAS * DIA_MS).toISOString());
  const ids = usuarios.map((u) => u.id);
  const bandas = [...new Set(usuarios.map((u) => u.band_id).filter((b): b is string => !!b))];
  const [enviados, conConcierto, conEpk] = await Promise.all([
    dbEmailsEnviados(ids),
    dbBandasConConcierto(bandas),
    dbBandasConEpk(bandas),
  ]);
  const base = getProductionAppUrl(process.env.APP_URL);

  let total = 0;
  for (const u of usuarios) {
    const tipo = elegirEmail({
      creadoEn: u.created_at,
      ahora,
      enviados: enviados.get(u.id) ?? new Set(),
      tieneConcierto: !!u.band_id && conConcierto.has(u.band_id),
      tieneEpk: !!u.band_id && conEpk.has(u.band_id),
    });
    if (!tipo || !u.email) continue;
    try {
      if (!(await dbReservarEmail(u.id, tipo))) continue;
      const { asunto, html } = renderizarEmail({
        tipo,
        idioma: idiomaDeUsuario(u.ui_preferences),
        nombre: u.name || '',
        banda: u.band_name || '',
        base,
        userId: u.id,
      });
      const r = await sendTransactionalEmail({ to: u.email, subject: asunto, html });
      if (r.success) total++;
      else await dbLiberarEmail(u.id, tipo); // sin envío no hay registro: se reintenta en la próxima pasada
    } catch (e) {
      captureError(e instanceof Error ? e : new Error(String(e)), { servicio: 'emailsCicloVida' });
    }
  }
  return { revisados: usuarios.length, enviados: total };
}

export function startEmailsCicloVidaScheduler(): void {
  if (process.env.EMAILS_CICLO_VIDA !== 'true') {
    console.log('[EmailsCicloVida] Apagado (EMAILS_CICLO_VIDA no es "true").');
    return;
  }
  const pasada = () =>
    procesarEmailsCicloVida().catch((e) =>
      captureError(e instanceof Error ? e : new Error(String(e)), { servicio: 'emailsCicloVida' })
    );
  setTimeout(pasada, 60_000).unref();
  setInterval(pasada, CADA_MS).unref();
}
