---
id: src_components_band_switcher_hooks_useBandActions
title: "src/components/band_switcher/hooks/useBandActions.ts"
layer: frontend
domain: system
file: "src/components/band_switcher/hooks/useBandActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/band_switcher/hooks/useBandActions.ts

> **Ubicación:** `src/components/band_switcher/hooks/useBandActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Salir de una banda, fijar banda principal, subir logo y cambiar de banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_band_switcher_bandSwitcherTypes|src/components/band_switcher/bandSwitcherTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_bandUtils|src/utils/bandUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_band_switcher_hooks_useBandSwitcherController|src/components/band_switcher/hooks/useBandSwitcherController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
