/**
 * Tipos de facturación (billing.ts): la banda registrada con sus campos de suscripción y los
 * campos de los eventos de Stripe que el SDK actual ya no declara.
 */
import type Stripe from 'stripe';
import type { BandaRegistradaGuardada } from '../stateTypes.js';

/** Banda registrada con los campos de plan, créditos y suscripción que gestiona la facturación. */
export type BandaFacturable = BandaRegistradaGuardada & {
  plan_pendiente?: string | null;
  fecha_cambio_plan?: string | null;
  estado_suscripcion?: string;
  creditos_periodo?: number;
  creditos_usados?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  ciclo_facturacion?: string;
  fecha_renovacion?: string;
};

/**
 * Campos de una factura en las versiones de la API de Stripe anteriores a 2025-03-31: el SDK
 * actual los movió (a `parent.subscription_details` y `pricing`), pero los webhooks llegan con
 * la versión de la API del endpoint, que puede ser antigua.
 */
export interface FacturaStripeLegada {
  subscription?: string | Stripe.Subscription | null;
  subscription_details?: { metadata?: Stripe.Metadata | null } | null;
  lines?: { data?: { price?: { recurring?: { interval?: string } | null } | null }[] };
}

/** Suscripción con `current_period_end` en la raíz (API antigua; ahora va en cada item). */
export interface SuscripcionStripeLegada {
  current_period_end?: number;
}

/** Sesión de checkout con los metadatos de `subscription_data` reflejados (API antigua). */
export interface SesionCheckoutLegada {
  subscription_data?: { metadata?: Stripe.Metadata | null } | null;
}
