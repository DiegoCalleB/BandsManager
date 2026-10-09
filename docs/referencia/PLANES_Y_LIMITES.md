# Control de Planes de Suscripción y Límites — BandManager.io

Especificación técnica de la jerarquía de planes comerciales, módulos y límites de cuota por banda. Documento de referencia técnica bajo demanda (módulo actualmente en revisión / hibernado).

---

## 1. Jerarquía de Planes y Límites

Valores de referencia de `server/utils/planLimits.ts` (`PLAN_LIMITS`) y `server/routes/billing.ts` (`PLAN_CREDITS`):

| Plan | Fans | Leads | Canciones | Contactos medios | Bandas | Créditos IA/mes |
|---|---|---|---|---|---|---|
| `promo` | 250 | 0 | 25 | 0 | 1 | 0 |
| `promo_plus` | 250 | 0 | 25 | 0 | 1 | 0 |
| `ensayo` | 10 | 10 | 5 | 0 | 1 | 100 |
| `local` | 100 | 50 | 20 | 10 | 1 | 300 |
| `de_gira` | ∞ | ∞ | ∞ | ∞ | 1 | 800 |
| `cabeza_de_cartel` | ∞ | ∞ | ∞ | ∞ | 5 | 2500 |

* `promo_plus` comparte límites cuantitativos con `promo`, diferenciándose en `allowedModules` (añade Setlists y Discografía en UI).
* **Créditos IA:** Contador mensual (`creditos_periodo` / `creditos_usados`, `POST /billing/consume-credits`). No confundir con el ledger de donaciones/deuda de `server/db/aiLedger.ts`.
* **Módulos por plan:** La fuente de verdad para permisos de módulos es `src/utils/planPermissions.ts` (`PLANS`).

---

## 2. Validación en Servidor (`server/utils/planLimits.ts`)

* Toda mutación en API REST que cree registros (leads, medios, canciones, bandas, fans) debe validar los límites en servidor con `checkRecordLimit(...)`.
* Los créditos de IA aplican su control en `server/routes/billing.ts`.
