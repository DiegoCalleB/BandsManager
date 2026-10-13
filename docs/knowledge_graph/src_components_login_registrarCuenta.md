---
id: src_components_login_registrarCuenta
title: "src/components/login/registrarCuenta.ts"
layer: frontend
domain: auth
file: "src/components/login/registrarCuenta.ts"
tags: ["frontend", "auth", "auto"]
---

# 📌 src/components/login/registrarCuenta.ts

> **Ubicación:** `src/components/login/registrarCuenta.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: DatosAlta, registrarCuenta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_analitica|src/utils/analitica.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_sessionCookie|src/utils/sessionCookie.ts]] *(Layer: #service, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
