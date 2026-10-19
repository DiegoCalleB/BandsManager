---
id: src_services_apiCatalogo
title: "src/services/apiCatalogo.ts"
layer: service
domain: system
file: "src/services/apiCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/apiCatalogo.ts

> **Ubicación:** `src/services/apiCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Catálogo compartido de salas: alta en la agenda de la banda. El email y el teléfono de la sala los copia el servidor

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_catalogo|server/routes/catalogo.ts]] *(Layer: #route, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_catalogo_CatalogoSalasModal|src/components/booking/catalogo/CatalogoSalasModal.tsx]] *(from #frontend)*
- [[src_components_booking_catalogo_useCatalogoSalas|src/components/booking/catalogo/useCatalogoSalas.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useCatalogoActions|src/components/chatbot/hooks/useCatalogoActions.ts]] *(from #frontend)*
- [[src_components_onboarding_steps_StepSalasSugeridas|src/components/onboarding/steps/StepSalasSugeridas.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useSalasSugeridasStep|src/components/onboarding/wizard/hooks/useSalasSugeridasStep.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/catalogo/__tests__/CatalogoSalasModal.test.tsx`
- `src/components/onboarding/__tests__/StepSalasSugeridas.behavior.test.tsx`
- `src/services/__tests__/apiCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
