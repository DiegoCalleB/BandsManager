---
id: src_components_SimplePromoLoginModal
title: "src/components/SimplePromoLoginModal.tsx"
layer: frontend
domain: auth
file: "src/components/SimplePromoLoginModal.tsx"
tags: ["frontend", "auth", "auto", "pantalla"]
---

# 📌 src/components/SimplePromoLoginModal.tsx

> **Ubicación:** `src/components/SimplePromoLoginModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: SimplePromoLoginModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_googleAuth|src/utils/googleAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[src_utils_sessionCookie|src/utils/sessionCookie.ts]] *(Layer: #service, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
