// Donaciones (Stripe Checkout) y apoyo a acuerdos (`deal-support`). Con `donationRateLimiter`;
// excepción de TDD por tocar dinero (AGENTS.md §5.3.1).

import express from "express";
import Stripe from "stripe";
import { dbGetAiDebtCents } from "../db.js";
import { requireAuth } from "../state.js";
import { donationRateLimiter } from "../middleware/rateLimiter.js";
import { getOriginHost } from "./billing.js";
import { bandaFacturableDelUsuario } from "../utils/bandAccess.js";
import { dbGetDealById } from "../db/deals.js";
import { dbListSupportableDeals, dbDealHasSupport } from "../db/dealSupport.js";
import {
  apoyoPropuestoCents,
  APOYO_MIN_CENTS,
  APOYO_MAX_CENTS
} from "../utils/dealSupport.js";

const router = express.Router();

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is missing");
  }
  return new Stripe(secretKey);
};

// Mínimo de Stripe para EUR (50 céntimos). Por debajo de esto la API de
// Checkout rechaza la sesión directamente, así que es también el suelo que
// usamos como importe "sugerido" cuando la deuda real es menor o cero -
// nunca se cobra sin que el usuario decida subir la cifra él mismo.
const STRIPE_MIN_EUR_CENTS = 50;
// Techo del "pay what you want": sin él, `custom_unit_amount.maximum` queda
// sin fijar y Stripe deja escribir un importe arbitrario en el checkout.
const MAX_DONATION_CENTS = 50000; // 500 €

/** Importe por defecto a mostrar en el checkout: la deuda real, nunca por debajo del mínimo de Stripe. */
export function defaultDonationCents(owedCents: number): number {
  return Math.min(MAX_DONATION_CENTS, Math.max(STRIPE_MIN_EUR_CENTS, Math.round(owedCents) || 0));
}

// GET /api/donations/status - deuda viva de la banda del usuario autenticado.
router.get("/donations/status", requireAuth, async (req, res) => {
  try {
    const banda = bandaFacturableDelUsuario(req);
    if (!banda) {
      return res.status(403).json({ success: false, error: "No tienes acceso a la facturación de esta banda." });
    }

    let owedCents = 0;
    try {
      owedCents = await dbGetAiDebtCents(banda.bandId);
    } catch (innerErr: any) {
      console.warn("[Donations] Error no crítico al calcular deuda IA, usando 0:", innerErr?.message);
    }

    return res.json({
      success: true,
      owed_cents: owedCents,
      owed_eur: owedCents / 100,
      suggested_cents: defaultDonationCents(owedCents)
    });
  } catch (err: any) {
    console.error("[Donations] Error al calcular la deuda de IA:", err);
    return res.json({
      success: true,
      owed_cents: 0,
      owed_eur: 0,
      suggested_cents: STRIPE_MIN_EUR_CENTS
    });
  }
});

// POST /api/donations/create-checkout-session
//
// La banda sale SIEMPRE de la sesión (bandaFacturableDelUsuario), nunca del body: igual
// que en billing.ts, aceptar un bandId del cliente aquí dejaría a cualquiera generar una
// sesión de pago "a cuenta" de la deuda de otra banda.
router.post("/donations/create-checkout-session", requireAuth, donationRateLimiter, async (req, res) => {
  try {
    const banda = bandaFacturableDelUsuario(req);
    if (!banda) {
      return res.status(403).json({ success: false, error: "No tienes acceso a la facturación de esta banda." });
    }

    const owedCents = await dbGetAiDebtCents(banda.bandId);
    const suggestedCents = defaultDonationCents(owedCents);
    const host = getOriginHost(req);
    const stripe = getStripe();

    // "Pay what you want" en Checkout no admite `custom_unit_amount` dentro de
    // `line_items[].price_data` (eso es solo para importes fijos): hay que crear
    // primero un Price real con el rango habilitado y referenciarlo por id.
    // Se crea uno nuevo por sesión porque el rango (preset = deuda del mes)
    // cambia con cada usuario/momento; Stripe no permite mutar un Price ya creado.
    const donationPrice = await stripe.prices.create({
      currency: "eur",
      custom_unit_amount: {
        enabled: true,
        minimum: STRIPE_MIN_EUR_CENTS,
        maximum: MAX_DONATION_CENTS,
        preset: suggestedCents
      },
      product_data: {
        name: "Apoyo a BandManager.io — consumo de IA",
        metadata: { kind: "ai_donation" }
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: banda.email || undefined,
      line_items: [{ price: donationPrice.id, quantity: 1 }],
      custom_text: {
        submit: {
          message: `El consumo de IA de tu banda este mes es de ${(owedCents / 100).toFixed(2)} €. Cualquier cantidad ayuda; superarlo desbloquea el nivel Sponsor.`
        }
      },
      // El bandId viaja en metadata, no en el importe: el webhook vuelve a
      // calcular la deuda contra la BD en el momento de liquidar, no se fía
      // de lo que esta sesión creyera que se debía al crearla.
      metadata: {
        kind: "ai_donation",
        bandId: banda.bandId
      },
      success_url: `${host}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/?donation=cancelled`
    });

    return res.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error("[Donations] Error creando la sesión de Checkout:", err);
    return res.status(500).json({ success: false, error: err?.message || "Error al crear la sesión de pago." });
  }
});

// ---------------------------------------------------------------------------
// Aportación VOLUNTARIA al cerrar un bolo (sustituye, de momento, a la comisión).
//
// La banda sale siempre de la sesión y el acuerdo se lee de la BD acotado a esa banda: ni el
// importe ni la banda vienen del cliente. El importe sugerido es solo eso, una sugerencia: en el
// checkout (pay what you want) la banda puede poner lo que quiera dentro del rango, o cerrarlo.
// ---------------------------------------------------------------------------

// GET /api/donations/deal-support - bolos firmados y recientes que aún no tienen aportación.
router.get("/donations/deal-support", requireAuth, async (req, res) => {
  try {
    const banda = bandaFacturableDelUsuario(req);
    if (!banda) {
      return res.status(403).json({ success: false, error: "No tienes acceso a la facturación de esta banda." });
    }
    const deals = await dbListSupportableDeals(banda.bandId);
    return res.json({
      success: true,
      min_cents: APOYO_MIN_CENTS,
      max_cents: APOYO_MAX_CENTS,
      deals: deals.map((d) => ({
        deal_id: d.id,
        lugar_sala: d.lugar_sala,
        ciudad: d.ciudad || "",
        fecha_evento: d.fecha_evento,
        total_acordado: Number(d.total_acordado ?? d.cache_base ?? 0),
        // Lo que eligió la banda al crear el acuerdo (o la sugerencia por defecto si no eligió)
        suggested_cents: apoyoPropuestoCents(Number(d.total_acordado ?? d.cache_base ?? 0), d.apoyo_porcentaje ?? null),
        apoyo_porcentaje: d.apoyo_porcentaje ?? null
      }))
    });
  } catch (err: any) {
    // Función opcional: ante cualquier fallo, simplemente no se ofrece nada.
    console.warn("[Donations] No se pudo listar bolos apoyables:", err?.message);
    return res.json({ success: true, min_cents: APOYO_MIN_CENTS, max_cents: APOYO_MAX_CENTS, deals: [] });
  }
});

// POST /api/donations/deal-support/create-checkout-session  { dealId }
router.post("/donations/deal-support/create-checkout-session", requireAuth, donationRateLimiter, async (req, res) => {
  try {
    const banda = bandaFacturableDelUsuario(req);
    if (!banda) {
      return res.status(403).json({ success: false, error: "No tienes acceso a la facturación de esta banda." });
    }
    const dealId = typeof req.body?.dealId === "string" ? req.body.dealId.trim() : "";
    if (!dealId) {
      return res.status(400).json({ success: false, error: "Falta el bolo al que quieres dedicar la aportación." });
    }

    const deal = await dbGetDealById(dealId, banda.bandId);
    if (!deal || deal.estado !== "confirmado") {
      return res.status(404).json({ success: false, error: "Ese bolo no existe o todavía no está firmado por la sala." });
    }
    if (await dbDealHasSupport(dealId, banda.bandId)) {
      return res.status(409).json({ success: false, error: "Ya has apoyado BandManager con este bolo. ¡Gracias!" });
    }

    const total = Number(deal.total_acordado ?? deal.cache_base ?? 0);
    const suggestedCents = Math.max(APOYO_MIN_CENTS, apoyoPropuestoCents(total, deal.apoyo_porcentaje ?? null));
    const host = getOriginHost(req);
    const stripe = getStripe();

    const price = await stripe.prices.create({
      currency: "eur",
      custom_unit_amount: {
        enabled: true,
        minimum: APOYO_MIN_CENTS,
        maximum: APOYO_MAX_CENTS,
        preset: suggestedCents
      },
      product_data: {
        name: `Apoyo a BandManager.io — bolo en ${String(deal.lugar_sala).slice(0, 60)}`,
        metadata: { kind: "deal_support" }
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: banda.email || undefined,
      line_items: [{ price: price.id, quantity: 1 }],
      custom_text: {
        submit: {
          message: "Aportación voluntaria: BandManager es gratis en tus bolos. Pon la cifra que te parezca justa."
        }
      },
      metadata: { kind: "deal_support", bandId: banda.bandId, dealId },
      success_url: `${host}/?apoyo=success`,
      cancel_url: `${host}/?apoyo=cancelled`
    });

    return res.json({ success: true, url: session.url });
  } catch (err: any) {
    console.error("[Donations] Error creando la sesión de apoyo al bolo:", err);
    return res.status(500).json({ success: false, error: err?.message || "Error al crear la sesión de pago." });
  }
});

export default router;
