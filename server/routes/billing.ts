import express from "express";
import Stripe from "stripe";
import { getSupabase } from "../db.js";

const router = express.Router();

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is missing");
  }
  return new Stripe(secretKey);
};

// Create Checkout Session
router.post("/billing/create-checkout-session", async (req, res) => {
  try {
    const { planId, billingInterval = "monthly", bandId, userEmail } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, error: "Plan ID is required" });
    }

    const stripe = getStripe();

    if (planId === "ensayo") {
      return res.json({ success: true, free: true, message: "Plan gratuito activado" });
    }

    const planPrices: Record<string, { monthly: number; annual: number; name: string }> = {
      local: { monthly: 1200, annual: 11500, name: "Plan LOCAL - BandManager.ai" },
      de_gira: { monthly: 2900, annual: 27800, name: "Plan DE GIRA - BandManager.ai" },
      cabeza_de_cartel: { monthly: 7900, annual: 75800, name: "Plan CABEZA DE CARTEL - BandManager.ai" }
    };

    const planInfo = planPrices[planId];
    if (!planInfo) {
      return res.status(400).json({ success: false, error: "Plan no válido" });
    }

    const unitAmount = billingInterval === "annual" ? planInfo.annual : planInfo.monthly;
    const interval = billingInterval === "annual" ? "year" : "month";

    const host = req.headers.origin || process.env.APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail || undefined,
      metadata: {
        bandId: bandId || "default",
        planId,
        billingInterval
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: planInfo.name,
              description: `Suscripción ${billingInterval === "annual" ? "Anual" : "Mensual"} para BandManager.ai (Modo Test)`
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval
            }
          },
          quantity: 1
        }
      ],
      success_url: `${host}/?payment=success&plan=${planId}`,
      cancel_url: `${host}/?payment=cancelled`
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error);
    res.status(500).json({ success: false, error: error.message || "Error al crear la sesión de pago con Stripe" });
  }
});

// Stripe Webhook handler
router.post("/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bandId = session.metadata?.bandId;
      const planId = session.metadata?.planId;
      console.log(`[Stripe Webhook] Payment successful for session ${session.id}`, { bandId, planId });

      if (bandId && planId) {
        try {
          const sb = getSupabase();
          // Update registered_bands plan in Supabase
          await sb.from("registered_bands").update({ plan: planId }).eq("band_id", bandId);
          console.log(`[Stripe Webhook] Successfully updated band ${bandId} plan to ${planId} in Supabase`);
        } catch (dbErr) {
          console.error("[Stripe Webhook] Error updating band plan in Supabase:", dbErr);
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
