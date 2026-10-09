---
id: server_utils_setlistFeedback
title: "server/utils/setlistFeedback.ts"
layer: service
domain: repertoire
file: "server/utils/setlistFeedback.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/setlistFeedback.ts

> **Ubicación:** `server/utils/setlistFeedback.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Feedback del usuario sobre un plan/análisis de setlist generado por IA, con memoria

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/setlistFeedback.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
