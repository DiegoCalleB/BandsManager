---
id: src_components_user_profile_BandSelectionSection
title: "src/components/user_profile/BandSelectionSection.tsx"
layer: frontend
domain: system
file: "src/components/user_profile/BandSelectionSection.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/user_profile/BandSelectionSection.tsx

> **Ubicación:** `src/components/user_profile/BandSelectionSection.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Banda principal: lista de bandas, alta y baja.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_user_profile_BandCreateForm|src/components/user_profile/BandCreateForm.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_BandDeleteConfirm|src/components/user_profile/BandDeleteConfirm.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_UserProfileContext|src/components/user_profile/UserProfileContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_user_profile_UserProfileView|src/components/user_profile/UserProfileView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
