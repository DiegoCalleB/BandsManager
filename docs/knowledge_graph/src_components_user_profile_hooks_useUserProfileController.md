---
id: src_components_user_profile_hooks_useUserProfileController
title: "src/components/user_profile/hooks/useUserProfileController.ts"
layer: frontend
domain: system
file: "src/components/user_profile/hooks/useUserProfileController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/user_profile/hooks/useUserProfileController.ts

> **Ubicación:** `src/components/user_profile/hooks/useUserProfileController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Controlador del perfil de usuario: compone identidad, plan y bandas, y gestiona contraseña,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_hooks_usePlanSummary|src/components/user_profile/hooks/usePlanSummary.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_hooks_useProfileBands|src/components/user_profile/hooks/useProfileBands.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_hooks_useProfileIdentity|src/components/user_profile/hooks/useProfileIdentity.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_utils_temaEspectro|src/utils/temaEspectro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_user_profile_UserProfileContext|src/components/user_profile/UserProfileContext.ts]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
