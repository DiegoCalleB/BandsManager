---
id: src_components_user_profile_hooks_useProfileIdentity
title: "src/components/user_profile/hooks/useProfileIdentity.ts"
layer: frontend
domain: system
file: "src/components/user_profile/hooks/useProfileIdentity.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/user_profile/hooks/useProfileIdentity.ts

> **Ubicación:** `src/components/user_profile/hooks/useProfileIdentity.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Identidad del usuario: nombre, instrumento, color, banda principal y logo de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
