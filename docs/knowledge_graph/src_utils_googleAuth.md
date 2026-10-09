---
id: src_utils_googleAuth
title: "src/utils/googleAuth.ts"
layer: security
domain: auth
file: "src/utils/googleAuth.ts"
tags: ["security", "auth", "auto"]
---

# 📌 src/utils/googleAuth.ts

> **Ubicación:** `src/utils/googleAuth.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
Exporta: GoogleUserInfo, signInWithGoogleIdentity.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*
- [[src_components_SimplePromoLoginModal|src/components/SimplePromoLoginModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
