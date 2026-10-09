---
id: src_hooks_useAuth
title: "src/hooks/useAuth.ts"
layer: security
domain: auth
file: "src/hooks/useAuth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 src/hooks/useAuth.ts

> **Ubicación:** `src/hooks/useAuth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: useAuth.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_referido|src/utils/referido.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_sessionCookie|src/utils/sessionCookie.ts]] *(Layer: #service, Domain: #auth)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
