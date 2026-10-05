# Diseño: cobro de bolos y comisión de BandManager con Stripe Connect

Estado: **propuesta para decidir** · Alcance: cobro online del caché de un bolo y comisión de la plataforma.
Punto de partida: la comisión del 5% ya se calcula y se guarda en el servidor (`concert_deals.comision_*`, `calcularComision()` en `server/db/deals.ts`) pero **no se cobra**: la sala paga a la banda directamente y BandManager nunca toca ese dinero.

> Las cifras de precios de Stripe y los tipos impositivos **no están verificados** (no se pudo consultar la documentación al redactar esto). Todo lo marcado con ⚠️ hay que contrastarlo con Stripe y con un asesor fiscal antes de implementar.

---

## 1. Decisiones que hay que tomar antes de escribir código

| # | Decisión | Recomendación | Alternativa |
|---|---|---|---|
| D1 | Tipo de cargo | **Direct charge** en la cuenta de la banda + `application_fee_amount` | Destination charge (BandManager como comercio) |
| D2 | Tipo de cuenta conectada | **Express** (onboarding y panel alojados por Stripe) | Standard (menos riesgo para ti, más fricción) |
| D3 | Qué se cobra online | **Señal (%) o total** del caché, tras la firma | Solo total |
| D4 | Pago fuera de la plataforma (efectivo, transferencia, ayuntamientos) | **Sin comisión en v1** | Factura de comisión posterior (v2) |
| D5 | Quién asume la comisión | **La banda**, descontada del cobro, mostrada antes de firmar | La sala la suma al precio |
| D6 | Entidad que opera la plataforma | **Sociedad o autónomo propio**, no la persona física del empleo actual ⚠️ | — |

### Por qué direct charges (D1)
- La banda es quien presta el servicio y quien **factura a la sala**; con cargo directo es el comercio de registro y el justificante de Stripe sale a su nombre. Encaja con el marco real: contrato banda ↔ sala, BandManager como intermediario.
- BandManager **no custodia fondos** (los mueve Stripe), lo que evita tratarse como entidad de pago ⚠️ confirmar con asesor.
- Las comisiones de procesamiento de Stripe las paga la banda, no tú. Con destination charge las pagarías tú y habría que repercutirlas.
- Contrapartida: con Express, el riesgo de saldos negativos (reembolsos o disputas mayores que el saldo de la banda) recae finalmente en la plataforma ⚠️ verificar el reparto de responsabilidad vigente. Mitigación: límite de reembolso al saldo, retención de payouts en bandas nuevas, política de cancelación clara.

### Por qué Express (D2)
Stripe hace KYC, recoge NIF/CIF e IBAN y ofrece el panel de pagos a la banda; tú no guardas datos bancarios. Standard exigiría que la banda tenga y gestione su propia cuenta Stripe (más fricción para bandas pequeñas).

---

## 2. Flujo

```
BANDA                      BANDMANAGER                         STRIPE                SALA
  │  Conectar cobros ─────────► crea cuenta Express ─────────► onboarding KYC
  │  ◄── account.updated (webhook Connect) ◄──────────────────── charges_enabled
  │  Crea acuerdo (cobro online + señal%)
  │                              acuerdo ───── enlace /deal/:token ─────────────────────► firma (1 uso, ya implementado)
  │                              POST /api/public/deals/:token/checkout  ◄───────────────── "Pagar señal"
  │                              Checkout Session en la cuenta de la banda
  │                              (application_fee_amount = 5%)  ────────► página de pago ──► paga
  │  ◄─ payout (calendario de Stripe) ◄──────── webhook checkout.session.completed
  │                              deal_payments=pagado · concerts.estado_pago · payments (finanzas)
```

Reglas del flujo:
1. **El importe lo decide siempre el servidor**, leyendo `concert_deals` (nunca el cliente). Solo se puede pagar un acuerdo `confirmado` (firmado).
2. `forma_pago` gana el valor `tarjeta_online`. **`efectivo` y `pago_diferido_ayto` no usan Stripe** (las administraciones públicas pagan por transferencia). La opción solo se ofrece si la banda tiene `charges_enabled`.
3. Comisión = `comision_porcentaje` del acuerdo (hoy 5%) sobre el importe cobrado, en céntimos y redondeada una sola vez en el servidor. Sobre una señal, la comisión es proporcional a lo cobrado.
4. El acuerdo firmado sigue siendo inmutable; los pagos viven en tabla aparte.

---

## 3. Modelo de datos

```sql
-- registered_bands: estado de la cuenta conectada (sin datos bancarios ni de identidad)
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS connect_charges_enabled   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS connect_payouts_enabled   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS connect_details_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS connect_requirements_due  JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS connect_updated_at        TIMESTAMPTZ;

-- concert_deals: configuración del cobro (se fija antes de firmar; luego es inmutable)
ALTER TABLE concert_deals
  ADD COLUMN IF NOT EXISTS cobro_online     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS senal_porcentaje NUMERIC(5,2) DEFAULT 100;

-- Pagos: uno por intento/pago; fuente de verdad del estado de cobro
CREATE TABLE IF NOT EXISTS deal_payments (
  id                        TEXT PRIMARY KEY,
  deal_id                   TEXT NOT NULL REFERENCES concert_deals(id) ON DELETE RESTRICT,
  band_id                   TEXT NOT NULL REFERENCES registered_bands(band_id),
  stripe_account_id         TEXT NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id  TEXT UNIQUE,
  tipo                      TEXT NOT NULL CHECK (tipo IN ('senal','total','resto')),
  importe_cents             INTEGER NOT NULL CHECK (importe_cents > 0),
  comision_cents            INTEGER NOT NULL CHECK (comision_cents >= 0),
  moneda                    TEXT NOT NULL DEFAULT 'eur',
  estado                    TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','pagado','fallido','reembolsado','reembolso_parcial','disputado')),
  reembolsado_cents         INTEGER NOT NULL DEFAULT 0,
  recibo_url                TEXT,
  pagado_en                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
-- Evita dos cobros "total" pagados del mismo acuerdo
CREATE UNIQUE INDEX IF NOT EXISTS uq_deal_payments_total_pagado
  ON deal_payments(deal_id, tipo) WHERE estado = 'pagado' AND tipo IN ('total','senal');
```

Importes siempre en **céntimos enteros** (hoy `concert_deals` usa `NUMERIC(10,2)`; la conversión se hace en un único helper).
Cualquier trigger `BEFORE UPDATE` nuevo debe **devolver `NEW`** (ver el incidente de `fn_capture_row_history`).

---

## 4. Endpoints y eventos

| Endpoint | Auth | Función |
|---|---|---|
| `POST /api/connect/onboard` | `requireAuth` + líder de banda (`getTargetBandId`) | Crea la cuenta Express si no existe y devuelve un Account Link |
| `GET /api/connect/status` | `requireAuth` | Estado (`charges_enabled`, pendientes) |
| `POST /api/connect/dashboard-link` | `requireAuth` + líder | Enlace al panel Express de la banda |
| `POST /api/public/deals/:token/checkout` | token + **rate limiter nuevo** | Crea la Checkout Session (señal o total) y devuelve la URL |
| `POST /api/stripe/connect-webhook` | firma Stripe | Eventos de cuentas conectadas |

El webhook de Connect es **un endpoint distinto** del actual (`/api/billing/webhook`): Stripe firma los eventos de Connect con su propio secreto, así que hace falta una variable nueva, `STRIPE_CONNECT_WEBHOOK_SECRET`. Se reutiliza la tabla `stripe_webhook_events` para idempotencia y se **falla cerrado** si falta el secreto (igual que hoy).

Eventos a tratar (verificar lista vigente ⚠️):
`account.updated`, `account.application.deauthorized`, `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created` / `.closed`.

Creación de la sesión (esquema):

```ts
const session = await stripe.checkout.sessions.create(
  {
    mode: 'payment',
    line_items: [{ price_data: { currency: 'eur', unit_amount: importeCents,
      product_data: { name: `Caché · ${deal.lugar_sala} · ${deal.fecha_evento}` } }, quantity: 1 }],
    payment_intent_data: {
      application_fee_amount: comisionCents,
      metadata: { dealId: deal.id, bandId: deal.band_id, tipo }
    },
    metadata: { dealId: deal.id, bandId: deal.band_id, tipo },
    success_url, cancel_url
  },
  { stripeAccount: banda.stripe_connect_account_id, idempotencyKey: `deal:${deal.id}:${tipo}` }
);
```

---

## 5. Seguridad (obligatorio, según AGENTS.md §2)

- **Importe y comisión solo del servidor**, releídos de BD en el momento de crear la sesión **y** al procesar el webhook (se compara `amount_total` con lo esperado; si no coincide, se registra y no se marca pagado).
- El webhook valida que `event.account` coincide con `stripe_connect_account_id` de la banda del acuerdo.
- Endpoint público de pago con rate limiter propio (clave IP + token) y token de 144 bits ya existente.
- Multi-tenant: `getTargetBandId` en las rutas privadas; nunca `req.body.band_id`.
- Idempotencia: `idempotencyKey` por acuerdo+tipo, índice único por pago pagado y `stripe_webhook_events`.
- Ningún dato de tarjeta toca el servidor (Checkout alojado). No se registran payloads con datos personales en logs.
- Variables nuevas: `STRIPE_CONNECT_WEBHOOK_SECRET`; opcional `CONNECT_FEE_PERCENT` solo como valor por defecto (el del acuerdo manda).
- Tras implementarlo: `/security-review` (toca auth, cobros y webhooks).

---

## 6. Fiscalidad y legal ⚠️ (consultar asesor; esto no es asesoramiento)

1. **Dos relaciones distintas**: (a) banda → sala: la banda factura su actuación; (b) BandManager → banda: servicio de intermediación por el que BandManager factura su comisión.
2. **Factura de la comisión**: `application_fee` no genera factura. Hay que emitir factura (IVA aplicable a determinar) a cada banda, p. ej. **mensual y consolidada** a partir de las `application_fee` del periodo. Decidir si el 5% es "IVA incluido" o "+IVA": cambia el neto real.
3. **El IVA del caché lo determina la banda y su asesor**; BandManager no debe afirmarlo en la UI.
4. **Bandas informales**: Stripe exige una persona responsable (autónomo) o una sociedad. Una banda sin forma jurídica cobra a nombre de un miembro; el reparto interno queda fuera del producto. Hay que explicarlo en el onboarding.
5. **Condiciones y privacidad**: actualizar términos (comisión, comerciante de registro, reembolsos, disputas) y política de privacidad (Stripe como encargado/responsable del KYC). Aceptación explícita de la comisión **antes** de crear el acuerdo.
6. **Entidad**: para operar como plataforma Connect hace falta una entidad verificada por Stripe y cumplir sus condiciones de plataforma/marketplace.

---

## 7. Experiencia de usuario

- La UI actual de `FastDealModal` dice *"Fee BandManager (5% asumido por la banda)… se te devuelve en +X Créditos IA"*. Ese texto **debe retirarse**: no hay código que lo cumpla y con Connect la banda pagará además la comisión de Stripe. Mostrar: *"Cobras ≈ importe − 5% BandManager − comisión de Stripe"*, con el desglose calculado.
- Banda: tarjeta "Cobros online" en ajustes/billing con estados (sin conectar · pendiente de datos · activa) y enlace a su panel.
- Sala: tras firmar, botón **Pagar señal / Pagar total** (si `cobro_online`); la sala ve solo el importe del caché, sin comisión.
- Acuerdos con `pago_diferido_ayto` o `efectivo`: sin botón de pago y con aviso de que BandManager no interviene en el cobro.

---

## 8. Casos límite

| Caso | Tratamiento |
|---|---|
| Sala paga dos veces | Índice único + `idempotencyKey`; el segundo pago se reembolsa automáticamente y se alerta |
| Pago OK pero el webhook se pierde | Reconciliación periódica (cron con `CRON_SECRET`) contra la API de Stripe |
| Banda desconecta su cuenta (`deauthorized`) | `connect_charges_enabled=false`; los acuerdos pendientes dejan de ofrecer pago online |
| Reembolso / cancelación del bolo | Solo la banda (panel Stripe) o endpoint con permiso de líder; política sobre devolver o no la comisión (`refund_application_fee`) — **decisión de negocio** |
| Disputa (chargeback) | Estado `disputado`, aviso a la banda; responsabilidad según tipo de cuenta ⚠️ |
| Banda nueva con saldo 0 y reembolso grande | Retención de payouts los primeros N días / límite de reembolso |
| Fuga de comisión (acuerdan pago en efectivo tras firmar) | Aceptada en v1; se compensa con valor (firma, señal protegida), no con penalizaciones |

---

## 9. Plan por fases

| Fase | Entrega | Criterio de aceptación |
|---|---|---|
| **F0** | Cuenta Stripe de la plataforma con Connect activado (modo test), decisiones D1–D6, asesor fiscal | Decisiones firmadas por escrito |
| **F1** | Onboarding Express + `account.updated` + tarjeta "Cobros online" | Una banda de prueba llega a `charges_enabled` y la UI lo refleja |
| **F2** | Checkout directo + `deal_payments` + webhook + `concerts.estado_pago` + registro en `payments` (ingreso bruto y gasto de comisión) | Pago de prueba de extremo a extremo; el webhook duplicado no duplica nada |
| **F3** | Reembolsos, disputas, reconciliación y factura mensual de comisión | Informe mensual por banda cuadra con `application_fee` de Stripe |
| **F4** | Rate limit, tests e2e, Sentry, runbook, `/security-review`, paso a modo live | Checklist de seguridad cerrado; piloto con 1–2 bandas reales |

Pruebas: modo test de Stripe + Stripe CLI (`stripe listen --forward-connect-to localhost:3000/api/stripe/connect-webhook`), tests unitarios con SDK simulado (como los de `deals`), y un test que reproduzca webhooks duplicados, fuera de orden y con importe manipulado.

---

## 10. Riesgos principales

1. **Fiscal/legal** (facturación de la comisión, IVA, entidad): el más caro de equivocarse. Resolver en F0.
2. **Saldos negativos** a cargo de la plataforma con cuentas Express.
3. **Fuga de comisión**: el valor tiene que venir del contrato y de la protección de la señal, no de obligar a nadie.
4. **Fricción de onboarding** para bandas informales.
