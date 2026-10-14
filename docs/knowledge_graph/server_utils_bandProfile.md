---
id: server_utils_bandProfile
title: "server/utils/bandProfile.ts"
layer: service
domain: system
file: "server/utils/bandProfile.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bandProfile.ts

> **Ubicación:** `server/utils/bandProfile.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Perfil de banda para los prompts de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_tiposAdn|server/db/tiposAdn.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_reelFeedback|server/utils/reelFeedback.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_services_copyPerfecto|server/services/copyPerfecto.ts]] *(from #service)*
- [[server_services_hookDoctor|server/services/hookDoctor.ts]] *(from #service)*
- [[server_services_perfilDeLaPeticion|server/services/perfilDeLaPeticion.ts]] *(from #service)*
- [[server_utils_musicalDna|server/utils/musicalDna.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/copyPerfecto.test.ts`
- `server/services/__tests__/hookDoctor.test.ts`
- `server/utils/__tests__/bandProfile.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
