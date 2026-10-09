---
id: src_types_tutorial
title: "src/types/tutorial.ts"
layer: service
domain: system
file: "src/types/tutorial.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/types/tutorial.ts

> **Ubicación:** `src/types/tutorial.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TutorialKeyPoint, TutorialUiTargetType, TutorialUiTarget, TutorialStep, ModuleTutorialId, ModuleTutorialConfig.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(from #frontend)*
- [[src_components_common_ModuleTutorialTrigger|src/components/common/ModuleTutorialTrigger.tsx]] *(from #frontend)*
- [[src_config_moduleTutorials|src/config/moduleTutorials.ts]] *(from #service)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
