---
id: sec_prompt_safety
title: "Prompt Injection Sanitizer"
layer: security
domain: system
file: "server/utils/promptSafety.ts"
tags: ["security", "owasp-llm", "prompt-safety"]
---

# 📌 Prompt Injection Sanitizer

> **Ubicación:** `server/utils/promptSafety.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/system`

## 📖 Descripción
Sanitiza datos externos de salas y correos entrantes antes de inyectarlos en prompts de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[agent_lector|Lector Agent (Listener)]] *(Layer: #agent, Domain: #booking)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
