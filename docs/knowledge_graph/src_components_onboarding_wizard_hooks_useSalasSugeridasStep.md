---
id: src_components_onboarding_wizard_hooks_useSalasSugeridasStep
title: "src/components/onboarding/wizard/hooks/useSalasSugeridasStep.ts"
layer: frontend
domain: system
file: "src/components/onboarding/wizard/hooks/useSalasSugeridasStep.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/wizard/hooks/useSalasSugeridasStep.ts

> **Ubicación:** `src/components/onboarding/wizard/hooks/useSalasSugeridasStep.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Paso «Salas para empezar»: carga las salas del catálogo compartido que encajan con la ciudad y el género de la banda

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_services_apiCatalogo|src/services/apiCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_steps_StepSalasSugeridas|src/components/onboarding/steps/StepSalasSugeridas.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
