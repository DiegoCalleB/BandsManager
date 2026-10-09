---
id: server_utils_leadLanguage
title: "server/utils/leadLanguage.ts"
layer: service
domain: booking
file: "server/utils/leadLanguage.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/leadLanguage.ts

> **Ubicación:** `server/utils/leadLanguage.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Detecta en qué idioma debería escribirse el pitch de booking para un lead,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_i18n_epkTranslations|src/i18n/epkTranslations.ts]] *(Layer: #service, Domain: #epk)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
