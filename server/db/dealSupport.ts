import { getSupabase, cleanBandId } from './core.js';
import { APOYO_VENTANA_DIAS } from '../utils/dealSupport.js';
import type { DealData } from './deals.js';

/**
 * Aportaciones voluntarias de las bandas al cerrar un bolo (tabla deal_support_contributions).
 *
 * Es una función opcional del producto: si la tabla aún no existe (migración sin aplicar) NO se
 * rompe nada. Listar devuelve [] (no se ofrece la aportación) y registrar solo avisa por log, para
 * que un fallo aquí nunca bloquee el cobro ni el webhook de Stripe.
 */

function tablaAusente(error: any): boolean {
  const msg = String(error?.message || '');
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    (/deal_support_contributions/.test(msg) && /not find|does not exist/i.test(msg))
  );
}

/** Acuerdos firmados de la banda, recientes y sin aportación pagada todavía. */
export async function dbListSupportableDeals(bandId: string): Promise<DealData[]> {
  const cleanId = cleanBandId(bandId);
  const sb = getSupabase();
  const desde = new Date(Date.now() - APOYO_VENTANA_DIAS * 24 * 60 * 60 * 1000).toISOString();

  const { data: deals, error } = await sb
    .from('concert_deals')
    .select('*')
    .eq('band_id', cleanId)
    .eq('estado', 'confirmado')
    .gte('firma_timestamp', desde)
    .order('firma_timestamp', { ascending: false });
  if (error) {
    console.warn('[dealSupport] No se pudieron leer los acuerdos:', error.message);
    return [];
  }
  const lista = (deals || []) as DealData[];
  if (lista.length === 0) return [];

  const { data: pagadas, error: errPagos } = await sb
    .from('deal_support_contributions')
    .select('deal_id')
    .eq('band_id', cleanId);
  if (errPagos) {
    if (!tablaAusente(errPagos)) console.warn('[dealSupport] Error leyendo aportaciones:', errPagos.message);
    return []; // sin saber qué está pagado no se ofrece nada: mejor callar que insistir
  }
  const yaApoyados = new Set((pagadas || []).map((p: any) => p.deal_id));
  // La banda que eligió "0 %" al crear el acuerdo no quiere apoyar: no se le vuelve a pedir.
  return lista.filter((d) => d.id && !yaApoyados.has(d.id) && !(Number(d.apoyo_porcentaje) === 0 && d.apoyo_porcentaje !== null));
}

export async function dbDealHasSupport(dealId: string, bandId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('deal_support_contributions')
    .select('deal_id')
    .eq('band_id', cleanBandId(bandId))
    .eq('deal_id', dealId)
    .limit(1);
  if (error) {
    if (!tablaAusente(error)) console.warn('[dealSupport] Error comprobando aportación:', error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/** Idempotente por id de sesión de Stripe (clave primaria): un webhook repetido no duplica. */
export async function dbRecordDealSupport(input: {
  sessionId: string;
  dealId: string;
  bandId: string;
  amountCents: number;
  paymentIntentId?: string | null;
}): Promise<boolean> {
  const { error } = await getSupabase()
    .from('deal_support_contributions')
    .upsert(
      {
        id: input.sessionId,
        deal_id: input.dealId,
        band_id: cleanBandId(input.bandId),
        amount_cents: Math.max(0, Math.round(input.amountCents)),
        stripe_payment_intent_id: input.paymentIntentId || null,
        paid_at: new Date().toISOString()
      },
      // Si el webhook se repite, no se reescribe nada (ni paid_at ni los reembolsos ya anotados).
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (error) {
    // El cobro YA está hecho en Stripe: si no se anota, se pierde. Se lanza para que el webhook
    // responda 500 y Stripe reintente (antes se devolvía false y el webhook respondía 200).
    throw new Error(`No se pudo registrar la aportación ${input.sessionId}: ${error.message}`);
  }
  return true;
}

/**
 * Registra la aportación a partir de una Checkout Session completada (metadata.kind ===
 * 'deal_support'). Devuelve false si la sesión no trae banda/bolo (se ignora con un aviso).
 */
export async function dbRecordDealSupportFromSession(session: {
  id?: string;
  amount_total?: number | null;
  payment_intent?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
}): Promise<boolean> {
  const bandId = session.metadata?.bandId;
  const dealId = session.metadata?.dealId;
  if (!bandId || !dealId || !session.id) {
    console.warn('[dealSupport] Aportación de bolo sin bandId/dealId en metadata; se ignora.');
    return false;
  }
  return dbRecordDealSupport({
    sessionId: session.id,
    dealId,
    bandId,
    amountCents: session.amount_total ?? 0,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  });
}

/**
 * Anota un reembolso (evento charge.refunded de Stripe). `amountRefundedCents` es el ACUMULADO
 * que informa Stripe, no el delta, así que reaplicar el mismo evento es inocuo. Devuelve cuántas
 * aportaciones se actualizaron: 0 si el cobro no era una aportación de bolo (p. ej. una
 * donación de IA o una suscripción), lo cual es normal y se ignora sin ruido.
 */
export async function dbRecordDealSupportRefund(paymentIntentId: string, amountRefundedCents: number): Promise<number> {
  if (!paymentIntentId) return 0;
  const { data, error } = await getSupabase()
    .from('deal_support_contributions')
    .update({ reembolsado_cents: Math.max(0, Math.round(amountRefundedCents)) })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select('id');
  if (error) {
    // Un reembolso que no se anota deja la aportación como pagada: que Stripe reintente.
    throw new Error(`No se pudo anotar el reembolso de ${paymentIntentId}: ${error.message}`);
  }
  return Array.isArray(data) ? data.length : 0;
}
