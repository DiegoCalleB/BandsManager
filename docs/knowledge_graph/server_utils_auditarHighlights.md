---
id: server_utils_auditarHighlights
title: "server/utils/auditarHighlights.ts"
layer: service
domain: system
file: "server/utils/auditarHighlights.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/auditarHighlights.ts

> **Ubicación:** `server/utils/auditarHighlights.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Auditoría del copy del análisis inicial. Los highlights que devuelve el modelo traen el texto de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_auditoriaCopyReel|server/utils/auditoriaCopyReel.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/auditarHighlights.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
