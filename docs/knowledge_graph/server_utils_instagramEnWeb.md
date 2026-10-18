---
id: server_utils_instagramEnWeb
title: "server/utils/instagramEnWeb.ts"
layer: service
domain: social
file: "server/utils/instagramEnWeb.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/instagramEnWeb.ts

> **Ubicación:** `server/utils/instagramEnWeb.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Cuentas de Instagram que enlaza una página web, y cuál es la de la sala.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/instagramEnWeb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
