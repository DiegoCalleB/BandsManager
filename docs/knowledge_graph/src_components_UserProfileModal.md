---
id: src_components_UserProfileModal
title: "src/components/UserProfileModal.tsx"
layer: frontend
domain: system
file: "src/components/UserProfileModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/UserProfileModal.tsx

> **Ubicación:** `src/components/UserProfileModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Perfil de usuario: datos personales, banda principal, plan, apariencia y bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_user_profile_UserProfileProvider|src/components/user_profile/UserProfileProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_UserProfileView|src/components/user_profile/UserProfileView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_typography|src/utils/typography.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*
- [[src_components_user_profile_UserProfileContext|src/components/user_profile/UserProfileContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
