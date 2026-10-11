---
id: src_components_onboarding_wizard_hooks_useMusicSetlistStep
title: "src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts"
layer: frontend
domain: repertoire
file: "src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts

> **Ubicación:** `src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Paso de música: Spotify, audio subido, temas manuales y repertorio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_spotify|server/routes/spotify.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_onboarding_types|src/components/onboarding/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
