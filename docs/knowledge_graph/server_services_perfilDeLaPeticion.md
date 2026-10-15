---
id: server_services_perfilDeLaPeticion
title: "server/services/perfilDeLaPeticion.ts"
layer: service
domain: system
file: "server/services/perfilDeLaPeticion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/perfilDeLaPeticion.ts

> **Ubicación:** `server/services/perfilDeLaPeticion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Perfil de la banda de la petición (nombre, estilo, tono, enlaces) para inyectarlo en los

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_reelsTexto|server/routes/reelsTexto.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
