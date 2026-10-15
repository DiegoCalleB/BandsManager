---
id: server_utils_aprendizajeReels
title: "server/utils/aprendizajeReels.ts"
layer: service
domain: social
file: "server/utils/aprendizajeReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/aprendizajeReels.ts

> **Ubicación:** `server/utils/aprendizajeReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Aprendizaje por banda a partir de las métricas reales de sus Reels (Fase 5 del plan).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_reelMetricas|server/db/reelMetricas.ts]] *(from #db)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/aprendizajeReels.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
