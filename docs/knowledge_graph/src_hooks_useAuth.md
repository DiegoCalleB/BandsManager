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
Exporta: BandaDeLaSesion, useAuth.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users_rutasSesion|server/routes/users/rutasSesion.ts]] *(Layer: #route, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_services_sesionLocal|src/services/sesionLocal.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_limpiarChatLocal|src/utils/limpiarChatLocal.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_referido|src/utils/referido.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_sessionCookie|src/utils/sessionCookie.ts]] *(Layer: #service, Domain: #auth)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useAuth.behavior.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
