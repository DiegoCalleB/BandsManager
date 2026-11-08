---
id: server_utils_oauthEstado
title: "server/utils/oauthEstado.ts"
layer: security
domain: auth
file: "server/utils/oauthEstado.ts"
tags: ["security", "auth", "auto"]
---

# 📌 server/utils/oauthEstado.ts

> **Ubicación:** `server/utils/oauthEstado.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
`state` firmado de los flujos OAuth por banda (Gmail, Instagram).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_instagramOAuth|server/routes/instagramOAuth.ts]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/instagramOAuth.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
