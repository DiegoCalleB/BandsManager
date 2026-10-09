---
id: server_services_sentimentAnalysis
title: "server/services/sentimentAnalysis.ts"
layer: service
domain: system
file: "server/services/sentimentAnalysis.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/sentimentAnalysis.ts

> **Ubicación:** `server/services/sentimentAnalysis.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Motor de análisis de sentimiento, intención y temperatura comercial para el Agente Lector.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
