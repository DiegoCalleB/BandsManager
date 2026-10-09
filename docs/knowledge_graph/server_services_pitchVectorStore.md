---
id: server_services_pitchVectorStore
title: "server/services/pitchVectorStore.ts"
layer: service
domain: booking
file: "server/services/pitchVectorStore.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/services/pitchVectorStore.ts

> **Ubicación:** `server/services/pitchVectorStore.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
PITCH VECTOR STORE — RAG VECTORIAL & FEW-SHOT DINÁMICO CON PGVECTOR

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
