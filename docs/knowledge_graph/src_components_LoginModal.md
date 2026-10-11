---
id: src_components_LoginModal
title: "src/components/LoginModal.tsx"
layer: frontend
domain: auth
file: "src/components/LoginModal.tsx"
tags: ["frontend", "auth", "auto"]
---

# 📌 src/components/LoginModal.tsx

> **Ubicación:** `src/components/LoginModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: LoginModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_common_BandNameStylerHelper|src/components/common/BandNameStylerHelper.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_googleAuth|src/utils/googleAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[src_utils_sessionCookie|src/utils/sessionCookie.ts]] *(Layer: #service, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
