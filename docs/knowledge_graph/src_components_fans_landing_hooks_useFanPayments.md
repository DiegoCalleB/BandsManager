---
id: src_components_fans_landing_hooks_useFanPayments
title: "src/components/fans_landing/hooks/useFanPayments.ts"
layer: frontend
domain: finances
file: "src/components/fans_landing/hooks/useFanPayments.ts"
tags: ["frontend", "finances", "auto"]
---

# 📌 src/components/fans_landing/hooks/useFanPayments.ts

> **Ubicación:** `src/components/fans_landing/hooks/useFanPayments.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/finances`

## 📖 Descripción
Enlaces y datos de pago/donación (Revolut, PayPal, Bizum) y URL del dossier EPK.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_SocialPlatformsList|src/components/SocialPlatformsList.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_utils_safeUrl|src/utils/safeUrl.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_hooks_useFansLandingController|src/components/fans_landing/hooks/useFansLandingController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
