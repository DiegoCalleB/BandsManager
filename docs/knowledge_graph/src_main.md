---
id: src_main
title: "src/main.tsx"
layer: service
domain: system
file: "src/main.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/main.tsx

> **Ubicación:** `src/main.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Módulo sin exportaciones con nombre.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_App|src/App.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ErrorBoundary|src/components/ErrorBoundary.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_PublicMusiciansLanding|src/components/PublicMusiciansLanding.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_utils_domTranslatePatch|src/utils/domTranslatePatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorTracking|src/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_referido|src/utils/referido.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_saveErrors|src/utils/saveErrors.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_temaEspectro|src/utils/temaEspectro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
