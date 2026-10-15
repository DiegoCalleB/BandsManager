---
id: src_components_user_profile_hooks_usePlanSummary
title: "src/components/user_profile/hooks/usePlanSummary.ts"
layer: frontend
domain: system
file: "src/components/user_profile/hooks/usePlanSummary.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/user_profile/hooks/usePlanSummary.ts

> **Ubicación:** `src/components/user_profile/hooks/usePlanSummary.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Plan efectivo de la banda activa y si el usuario está en un plan promocional.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
