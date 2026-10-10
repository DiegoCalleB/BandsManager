---
id: ext_gemini
title: "Gemini (Google GenAI)"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Gemini (Google GenAI)

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Modelos de Google para pitch, chat, scouting y análisis musical.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_ai|server/ai.ts]] *(from #service)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
