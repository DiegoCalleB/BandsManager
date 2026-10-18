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
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_ai|server/ai.ts]] *(from #service)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_routes_tiposChat|server/routes/tiposChat.ts]] *(from #route)*
- [[server_services_agentIntelligence|server/services/agentIntelligence.ts]] *(from #agent)*
- [[server_services_chatCatalogo|server/services/chatCatalogo.ts]] *(from #service)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(from #service)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*
- [[server_utils_conversacionChat|server/utils/conversacionChat.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
