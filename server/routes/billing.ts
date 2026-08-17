import express from "express";
import Stripe from "stripe";
import { getSupabase, dbUpsertRegisteredBand, normalizePlan, dbIsWebhookEventProcessed, dbRecordWebhookEvent } from "../db.js";
import { loadState, saveState } from "../state.js";

const router = express.Router();

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is missing");
  }
  return new Stripe(secretKey);
};

// Plan credit quotas
const PLAN_CREDITS: Record<string, number> = {
  ensayo: 100,
  local: 300,
  de_gira: 800,
  cabeza_de_cartel: 2500
};

// In-memory idempotency cache for webhooks (prevents duplicate execution)
const processedEvents = new Map<string, number>();
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function isEventProcessed(eventId: string): Promise<boolean> {
  const now = Date.now();
  // Periodic cleanup of old events
  if (processedEvents.size > 1000) {
    for (const [id, time] of processedEvents.entries()) {
      if (now - time > CLEANUP_INTERVAL_MS) {
        processedEvents.delete(id);
      }
    }
  }

  if (processedEvents.has(eventId)) {
    return true;
  }
  processedEvents.set(eventId, now);

  // Persistent check in DB
  const dbChecked = await dbIsWebhookEventProcessed(eventId);
  return dbChecked;
}

// Find registered band helper
export function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function resolveValidEmail(userEmail?: string, bandId?: string): string | undefined {
  if (userEmail && isValidEmail(userEmail)) {
    return userEmail.trim().toLowerCase();
  }
  try {
    const state = loadState();
    if (userEmail && state.users && Array.isArray(state.users)) {
      const matchedUser = state.users.find((u: any) => 
        (u.id === userEmail || u.username?.toLowerCase() === userEmail.toLowerCase() || u.email?.toLowerCase() === userEmail.toLowerCase()) &&
        isValidEmail(u.email)
      );
      if (matchedUser?.email && isValidEmail(matchedUser.email)) {
        return matchedUser.email.trim().toLowerCase();
      }
    }
    if (bandId) {
      const cleanBandId = bandId.replace(/^(band|reg)-/, '').toLowerCase();
      const bandConfig = state.epkConfigsByBand?.[cleanBandId] || (cleanBandId === 'bakandeya' ? state.epkConfig : null);
      if (bandConfig?.contactoBooking?.email && isValidEmail(bandConfig.contactoBooking.email)) {
        return bandConfig.contactoBooking.email.trim().toLowerCase();
      }
    }
  } catch (err) {
    // Ignore lookup errors
  }
  return undefined;
}

function findBandInState(state: any, bandId?: string, customerEmail?: string) {
  if (!state.registeredBands) state.registeredBands = [];
  const cleanBandId = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
  const cleanEmail = (customerEmail || '').toLowerCase().trim();

  let band = state.registeredBands.find((b: any) => {
    const bBid = (b.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
    const bId = (b.id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
    const bName = (b.nombre_banda || b.bandName || b.name || '').toLowerCase().trim();
    const bEmail = (b.email || '').toLowerCase().trim();

    if (cleanBandId && cleanBandId !== 'default') {
      if (b.band_id === bandId || b.id === bandId || bBid === cleanBandId || bId === cleanBandId || (cleanBandId.length > 1 && bName === cleanBandId)) {
        return true;
      }
    }
    if (cleanEmail && bEmail === cleanEmail) {
      return true;
    }
    return false;
  });

  return { band, cleanBandId };
}

// Helper: Immediate Plan Upgrade
export async function applyPlanUpgrade(
  bandId: string,
  planId: string,
  customerEmail?: string,
  details?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    billingInterval?: string;
    renewalDate?: string;
  }
) {
  const normPlan = normalizePlan(planId);
  const state = loadState();
  const { band: foundBand, cleanBandId } = findBandInState(state, bandId, customerEmail);
  const credits = PLAN_CREDITS[normPlan] || 800;

  let bandToSave: any = foundBand;

  if (foundBand) {
    foundBand.plan = normPlan;
    foundBand.plan_pendiente = null;
    foundBand.fecha_cambio_plan = null;
    foundBand.estado_suscripcion = 'activo';
    foundBand.creditos_periodo = credits;
    foundBand.creditos_usados = 0;
    if (details?.stripeCustomerId) foundBand.stripe_customer_id = details.stripeCustomerId;
    if (details?.stripeSubscriptionId) foundBand.stripe_subscription_id = details.stripeSubscriptionId;
    if (details?.billingInterval) foundBand.ciclo_facturacion = details.billingInterval;
    if (details?.renewalDate) foundBand.fecha_renovacion = details.renewalDate;
  } else if (cleanBandId && cleanBandId !== 'default') {
    bandToSave = {
      id: `reg-${cleanBandId}`,
      band_id: `band-${cleanBandId}`,
      nombre_banda: cleanBandId.charAt(0).toUpperCase() + cleanBandId.slice(1),
      email: customerEmail || '',
      plan: normPlan,
      plan_pendiente: null,
      fecha_cambio_plan: null,
      estado_suscripcion: 'activo',
      creditos_periodo: credits,
      creditos_usados: 0,
      stripe_customer_id: details?.stripeCustomerId,
      stripe_subscription_id: details?.stripeSubscriptionId,
      ciclo_facturacion: details?.billingInterval || 'monthly',
      fecha_renovacion: details?.renewalDate,
      fecha_registro: new Date().toISOString()
    };
    state.registeredBands.push(bandToSave);
  }

  // Update in-memory users
  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      const uEmail = (u.email || u.username || '').toLowerCase().trim();
      const uBand = (u.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      if ((customerEmail && uEmail === customerEmail.toLowerCase().trim()) || (cleanBandId && uBand === cleanBandId)) {
        u.plan = normPlan;
        u.plan_pendiente = null;
        u.fecha_cambio_plan = null;
        u.estado_suscripcion = 'activo';
      }
    });
  }
  saveState(state);

  // Sync to Supabase
  try {
    if (bandToSave) {
      try {
        await dbUpsertRegisteredBand(bandToSave);
      } catch (upsertErr) {
        console.warn("[Billing Upgrade] Note upserting registered band:", upsertErr);
      }
    }

    const sb = getSupabase();
    if (cleanBandId && cleanBandId !== 'default') {
      await sb
        .from("registered_bands")
        .update({
          plan: normPlan,
          plan_pendiente: null,
          fecha_cambio_plan: null,
          estado_suscripcion: 'activo',
          creditos_periodo: credits,
          creditos_usados: 0
        })
        .or(`band_id.eq.${bandId},id.eq.${bandId},band_id.eq.band-${cleanBandId},id.eq.band-${cleanBandId},band_id.eq.${cleanBandId},id.eq.${cleanBandId}`);
    }

    if (customerEmail) {
      await sb
        .from("users")
        .update({
          plan: normPlan,
          plan_pendiente: null,
          fecha_cambio_plan: null,
          estado_suscripcion: 'activo'
        })
        .ilike("email", customerEmail.trim());
    }
  } catch (err: any) {
    console.error("[Billing Upgrade] Error updating Supabase tables:", err?.message || err);
  }

  return { success: true, plan: normPlan, status: 'activo' };
}

// Helper: Schedule Plan Downgrade at period end (Non-destructive)
export async function schedulePlanDowngrade(
  bandId: string,
  targetPlan: string,
  effectiveDate: string,
  customerEmail?: string
) {
  const normTarget = normalizePlan(targetPlan);
  const state = loadState();
  const { band: foundBand, cleanBandId } = findBandInState(state, bandId, customerEmail);
  const subStatus = normTarget === 'ensayo' ? 'cancelacion_programada' : 'cambio_programado';

  if (foundBand) {
    foundBand.plan_pendiente = normTarget;
    foundBand.fecha_cambio_plan = effectiveDate;
    foundBand.estado_suscripcion = subStatus;
  }

  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      const uEmail = (u.email || u.username || '').toLowerCase().trim();
      const uBand = (u.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      if ((customerEmail && uEmail === customerEmail.toLowerCase().trim()) || (cleanBandId && uBand === cleanBandId)) {
        u.plan_pendiente = normTarget;
        u.fecha_cambio_plan = effectiveDate;
        u.estado_suscripcion = subStatus;
      }
    });
  }
  saveState(state);

  try {
    const sb = getSupabase();
    if (cleanBandId && cleanBandId !== 'default') {
      await sb
        .from("registered_bands")
        .update({
          plan_pendiente: normTarget,
          fecha_cambio_plan: effectiveDate,
          estado_suscripcion: subStatus
        })
        .or(`band_id.eq.${bandId},id.eq.${bandId},band_id.eq.band-${cleanBandId},id.eq.band-${cleanBandId}`);
    }

    if (customerEmail) {
      await sb
        .from("users")
        .update({
          plan_pendiente: normTarget,
          fecha_cambio_plan: effectiveDate,
          estado_suscripcion: subStatus
        })
        .ilike("email", customerEmail.trim());
    }
  } catch (err: any) {
    console.error("[Billing Schedule Downgrade] Error updating Supabase:", err);
  }

  return { success: true, plan_pendiente: normTarget, fecha_cambio_plan: effectiveDate, status: subStatus };
}

// Helper: Cancellation (Transition to Ensayo without deleting data)
export async function applyPlanCancellation(bandId: string, customerEmail?: string) {
  const state = loadState();
  const { band: foundBand, cleanBandId } = findBandInState(state, bandId, customerEmail);
  const credits = PLAN_CREDITS.ensayo;

  if (foundBand) {
    foundBand.plan = 'ensayo';
    foundBand.plan_pendiente = null;
    foundBand.fecha_cambio_plan = null;
    foundBand.estado_suscripcion = 'cancelado';
    foundBand.creditos_periodo = credits;
    foundBand.creditos_usados = 0;
  }

  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      const uEmail = (u.email || u.username || '').toLowerCase().trim();
      const uBand = (u.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      if ((customerEmail && uEmail === customerEmail.toLowerCase().trim()) || (cleanBandId && uBand === cleanBandId)) {
        u.plan = 'ensayo';
        u.plan_pendiente = null;
        u.fecha_cambio_plan = null;
        u.estado_suscripcion = 'cancelado';
      }
    });
  }
  saveState(state);

  try {
    const sb = getSupabase();
    if (cleanBandId && cleanBandId !== 'default') {
      await sb
        .from("registered_bands")
        .update({
          plan: 'ensayo',
          plan_pendiente: null,
          fecha_cambio_plan: null,
          estado_suscripcion: 'cancelado',
          creditos_periodo: credits
        })
        .or(`band_id.eq.${bandId},id.eq.${bandId},band_id.eq.band-${cleanBandId},id.eq.band-${cleanBandId}`);
    }

    if (customerEmail) {
      await sb
        .from("users")
        .update({
          plan: 'ensayo',
          plan_pendiente: null,
          fecha_cambio_plan: null,
          estado_suscripcion: 'cancelado'
        })
        .ilike("email", customerEmail.trim());
    }
  } catch (err: any) {
    console.error("[Billing Cancellation] Error updating Supabase:", err);
  }

  return { success: true, plan: 'ensayo', status: 'cancelado' };
}

// Helper: Payment Failed alert (non-destructive grace period)
export async function handlePaymentFailed(bandId: string, customerEmail?: string) {
  const state = loadState();
  const { band: foundBand, cleanBandId } = findBandInState(state, bandId, customerEmail);

  if (foundBand) {
    foundBand.estado_suscripcion = 'pago_pendiente';
  }

  if (state.users && Array.isArray(state.users)) {
    state.users.forEach((u: any) => {
      const uEmail = (u.email || u.username || '').toLowerCase().trim();
      const uBand = (u.band_id || '').replace(/^(band|reg)-/, '').toLowerCase().trim();
      if ((customerEmail && uEmail === customerEmail.toLowerCase().trim()) || (cleanBandId && uBand === cleanBandId)) {
        u.estado_suscripcion = 'pago_pendiente';
      }
    });
  }
  saveState(state);

  try {
    const sb = getSupabase();
    if (cleanBandId && cleanBandId !== 'default') {
      await sb
        .from("registered_bands")
        .update({ estado_suscripcion: 'pago_pendiente' })
        .or(`band_id.eq.${bandId},id.eq.${bandId},band_id.eq.band-${cleanBandId},id.eq.band-${cleanBandId}`);
    }
    if (customerEmail) {
      await sb
        .from("users")
        .update({ estado_suscripcion: 'pago_pendiente' })
        .ilike("email", customerEmail.trim());
    }
  } catch (err: any) {
    console.error("[Billing Payment Failed] Error updating Supabase:", err);
  }
}

// Helper: Invoice Paid (Reset monthly credits, apply any pending downgrade when cycle completes)
export async function handleInvoicePaid(bandId: string, customerEmail?: string, invoice?: Stripe.Invoice) {
  const state = loadState();
  const { band: foundBand } = findBandInState(state, bandId, customerEmail);

  // If a pending plan was waiting for renewal, apply it now
  let activePlan = foundBand?.plan || 'local';
  if (foundBand?.plan_pendiente) {
    activePlan = foundBand.plan_pendiente;
  }

  const credits = PLAN_CREDITS[activePlan] || 800;

  return applyPlanUpgrade(bandId, activePlan, customerEmail, {
    stripeCustomerId: invoice?.customer as string,
    stripeSubscriptionId: (invoice as any)?.subscription as string,
    billingInterval: (invoice as any)?.lines?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly'
  });
}

// Helper: Determine origin URL
function getOriginHost(req: express.Request): string {
  let host = req.body?.originUrl || req.headers.origin;
  if (!host || host === "null") {
    if (req.headers.referer) {
      try {
        host = new URL(req.headers.referer).origin;
      } catch (e) {}
    }
  }
  if (!host || host === "null") {
    const forwardedProto = req.headers["x-forwarded-proto"] || "https";
    const forwardedHost = req.headers["x-forwarded-host"] || req.headers.host;
    if (forwardedHost) {
      host = `${forwardedProto}://${forwardedHost}`;
    }
  }
  if (!host || host === "null" || !host.startsWith("http")) {
    host = process.env.APP_URL || "https://ais-dev-qpqrrrbweq7pv4iyd5qrcd-283957839721.europe-west1.run.app";
  }
  return host;
}

// 1. Confirm Payment Success endpoint called by client on return from Stripe Checkout
router.post(["/billing/confirm-success", "/stripe/confirm-success"], async (req, res) => {
  try {
    const { planId, bandId, userEmail } = req.body;
    if (!planId) {
      return res.status(400).json({ success: false, error: "planId is required" });
    }

    const result = await applyPlanUpgrade(bandId || '', planId, userEmail);
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /billing/confirm-success:", err);
    return res.status(500).json({ success: false, error: err?.message || "Error confirming plan upgrade" });
  }
});

// 2. Create Checkout Session
router.post(["/billing/create-checkout-session", "/stripe/create-checkout-session"], async (req, res) => {
  try {
    const { planId, billingInterval = "monthly", bandId, userEmail } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, error: "Plan ID is required" });
    }

    const normalizedPlan = normalizePlan(planId);

    if (normalizedPlan === "ensayo") {
      await applyPlanCancellation(bandId || '', userEmail);
      return res.json({ success: true, free: true, message: "Plan Ensayo gratuito activado" });
    }

    const planPrices: Record<string, { monthly: number; annual: number; name: string }> = {
      local: { monthly: 1500, annual: 14400, name: "Plan LOCAL - BandManager.ai" },
      de_gira: { monthly: 2900, annual: 27800, name: "Plan DE GIRA - BandManager.ai" },
      cabeza_de_cartel: { monthly: 7900, annual: 75800, name: "Plan CABEZA DE CARTEL - BandManager.ai" }
    };

    const planInfo = planPrices[normalizedPlan];
    if (!planInfo) {
      return res.status(400).json({ success: false, error: `Plan "${planId}" no válido para suscripción.` });
    }

    const stripe = getStripe();
    const unitAmount = billingInterval === "annual" ? planInfo.annual : planInfo.monthly;
    const interval = billingInterval === "annual" ? "year" : "month";
    const host = getOriginHost(req);

    // Look up or create Customer in Stripe safely
    let customerId: string | undefined;
    const cleanEmail = resolveValidEmail(userEmail, bandId);
    if (cleanEmail) {
      try {
        const existingCustomers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      } catch (err: any) {
        console.warn("[Billing] Could not lookup existing customer by email in Stripe:", err?.message || err);
      }
    }

    // Check if custom Price IDs are configured in environment variables
    const envPriceKey = `STRIPE_PRICE_${normalizedPlan.toUpperCase()}_${billingInterval.toUpperCase()}`;
    const configuredPriceId = process.env[envPriceKey];

    const lineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          price_data: {
            currency: "eur",
            product_data: {
              name: planInfo.name,
              description: `Suscripción ${billingInterval === "annual" ? "Anual" : "Mensual"} para BandManager.ai`
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval as Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval
            }
          },
          quantity: 1
        };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : (cleanEmail || undefined),
      metadata: {
        bandId: bandId || "default",
        planId: normalizedPlan,
        billingInterval,
        userEmail: userEmail || cleanEmail || ""
      },
      subscription_data: {
        metadata: {
          bandId: bandId || "default",
          planId: normalizedPlan,
          billingInterval,
          userEmail: userEmail || cleanEmail || ""
        }
      },
      line_items: [lineItem],
      success_url: `${host}/?payment=success&plan=${normalizedPlan}&band=${bandId || ''}`,
      cancel_url: `${host}/?payment=cancelled`
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error);
    res.status(500).json({ success: false, error: error.message || "Error al crear la sesión de pago con Stripe" });
  }
});

// 3. Create Stripe Customer Portal Session (delegated subscription, payment method & invoice management)
router.post(["/billing/create-portal-session", "/stripe/create-portal-session"], async (req, res) => {
  try {
    const { userEmail, bandId, returnUrl } = req.body;
    const stripe = getStripe();
    const host = returnUrl || getOriginHost(req);

    let customerId: string | undefined;

    // First check if band already has stripe_customer_id in state
    const state = loadState();
    const { band: foundBand } = findBandInState(state, bandId, userEmail);
    if (foundBand?.stripe_customer_id) {
      customerId = foundBand.stripe_customer_id;
    }

    // Otherwise lookup by email safely
    const cleanEmail = resolveValidEmail(userEmail, bandId);
    if (!customerId && cleanEmail) {
      try {
        const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const newCustomer = await stripe.customers.create({
            email: cleanEmail,
            metadata: { bandId: bandId || "default", userEmail: userEmail || "" }
          });
          customerId = newCustomer.id;
        }
      } catch (err: any) {
        console.warn("[Billing] Could not create/lookup customer for portal:", err?.message || err);
      }
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "No se encontró un cliente de Stripe asociado. Realiza una primera suscripción antes de acceder al portal."
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: host
    });

    return res.json({ success: true, url: portalSession.url });
  } catch (error: any) {
    console.error("Error creating Stripe billing portal session:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al abrir el Portal de Clientes de Stripe"
    });
  }
});

// 4. Webhook Handler (Verified with STRIPE_WEBHOOK_SECRET, Idempotent)
async function handleWebhook(req: express.Request, res: express.Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    const rawBody = (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));
    if (webhookSecret && sig) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check: Ignore duplicate events
  if (event.id && (await isEventProcessed(event.id))) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed. Skipping.`);
    return res.json({ received: true, idempotent: true });
  }

  console.log(`[Stripe Webhook] Processing event ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bandId = session.metadata?.bandId || (session.subscription_data as any)?.metadata?.bandId;
        const planId = session.metadata?.planId || (session.subscription_data as any)?.metadata?.planId;
        const customerEmail = session.customer_email || session.metadata?.userEmail;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (planId) {
          await applyPlanUpgrade(bandId || '', planId, customerEmail, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const bandId = subscription.metadata?.bandId;
        const customerEmail = subscription.metadata?.userEmail;
        const targetPlan = subscription.metadata?.planId || 'de_gira';
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;
        const periodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : new Date().toISOString();

        if (cancelAtPeriodEnd) {
          // Downgrade scheduled to Ensayo at period end
          await schedulePlanDowngrade(bandId || '', 'ensayo', periodEnd, customerEmail);
        } else if (subscription.status === 'active') {
          // Active subscription update (immediate upgrade or cycle renewal)
          await applyPlanUpgrade(bandId || '', targetPlan, customerEmail, {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            renewalDate: periodEnd
          });
        } else if (subscription.status === 'past_due') {
          await handlePaymentFailed(bandId || '', customerEmail);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const bandId = subscription.metadata?.bandId;
        const customerEmail = subscription.metadata?.userEmail;

        // Transition to Ensayo without deleting data
        await applyPlanCancellation(bandId || '', customerEmail);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const bandId = invoice.metadata?.bandId || (invoice.subscription_details as any)?.metadata?.bandId;
        const customerEmail = invoice.customer_email || invoice.metadata?.userEmail;

        await handleInvoicePaid(bandId || '', customerEmail, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const bandId = invoice.metadata?.bandId || (invoice.subscription_details as any)?.metadata?.bandId;
        const customerEmail = invoice.customer_email || invoice.metadata?.userEmail;

        await handlePaymentFailed(bandId || '', customerEmail);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    // Persist event in DB for permanent idempotency
    if (event.id) {
      await dbRecordWebhookEvent(event.id, event.type, event.data?.object);
    }
  } catch (procErr: any) {
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, procErr);
  }

  res.json({ received: true });
}

// 5. Check & Consume AI Credits endpoint
router.post(["/billing/consume-credits", "/stripe/consume-credits"], async (req, res) => {
  try {
    const { bandId, userEmail, creditsAmount = 1, featureName = "AI Task" } = req.body;
    const amount = Math.max(1, Number(creditsAmount) || 1);

    const state = loadState();
    const { band: foundBand, cleanBandId } = findBandInState(state, bandId, userEmail);

    const plan = normalizePlan(foundBand?.plan || 'ensayo');
    const totalCredits = foundBand?.creditos_periodo || PLAN_CREDITS[plan] || 100;
    const currentUsed = Number(foundBand?.creditos_usados || 0);

    if (currentUsed + amount > totalCredits) {
      return res.status(403).json({
        success: false,
        exhausted: true,
        error: `Has agotado tus créditos de IA del periodo (${currentUsed}/${totalCredits}). Pasa a un plan superior para continuar.`,
        plan,
        creditos_usados: currentUsed,
        creditos_periodo: totalCredits,
        featureName
      });
    }

    const newUsed = currentUsed + amount;
    if (foundBand) {
      foundBand.creditos_usados = newUsed;
      foundBand.creditos_periodo = totalCredits;
    }
    saveState(state);

    // Sync to Supabase
    try {
      const sb = getSupabase();
      if (cleanBandId && cleanBandId !== 'default') {
        await sb
          .from("registered_bands")
          .update({ creditos_usados: newUsed, creditos_periodo: totalCredits })
          .or(`band_id.eq.${bandId},id.eq.${bandId},band_id.eq.band-${cleanBandId},id.eq.band-${cleanBandId}`);
      }
    } catch (e) {}

    return res.json({
      success: true,
      creditos_usados: newUsed,
      creditos_periodo: totalCredits,
      creditos_restantes: totalCredits - newUsed
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Error al consumir créditos" });
  }
});

// 6. Get Credits Status endpoint
router.get(["/billing/credits-status", "/stripe/credits-status"], async (req, res) => {
  try {
    const bandId = req.query.bandId as string;
    const userEmail = req.query.userEmail as string;

    const state = loadState();
    const { band: foundBand } = findBandInState(state, bandId, userEmail);

    const plan = normalizePlan(foundBand?.plan || 'ensayo');
    const totalCredits = foundBand?.creditos_periodo || PLAN_CREDITS[plan] || 100;
    const currentUsed = Number(foundBand?.creditos_usados || 0);

    return res.json({
      success: true,
      plan,
      creditos_usados: currentUsed,
      creditos_periodo: totalCredits,
      creditos_restantes: Math.max(0, totalCredits - currentUsed),
      estado_suscripcion: foundBand?.estado_suscripcion || 'activo',
      plan_pendiente: foundBand?.plan_pendiente || null,
      fecha_cambio_plan: foundBand?.fecha_cambio_plan || null
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Error al obtener estado de créditos" });
  }
});

// Mount webhook on both standard Stripe URL paths
router.post("/billing/webhook", handleWebhook);
router.post("/stripe/webhook", handleWebhook);

export default router;

