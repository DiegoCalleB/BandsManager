---
id: server_services_asesorMarketing
title: "server/services/asesorMarketing.ts"
layer: service
domain: system
file: "server/services/asesorMarketing.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/asesorMarketing.ts

> **Ubicación:** `server/services/asesorMarketing.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Asesor de Marketing: lo que la banda ve al abrir la pantalla (modo de hoy, opciones y semana),

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_chat|src/utils/asesor/chat.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_rescate|src/utils/asesor/rescate.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_vozAprendida|src/utils/asesor/vozAprendida.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
