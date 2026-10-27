---
id: server_routes_songs_ajusteCompases
title: "server/routes/songs/ajusteCompases.ts"
layer: route
domain: repertoire
file: "server/routes/songs/ajusteCompases.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/songs/ajusteCompases.ts

> **Ubicación:** `server/routes/songs/ajusteCompases.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Ajuste de la rejilla de compases: se guarda en el análisis de la canción para toda la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ajusteCompases|src/utils/ajusteCompases.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server_routes_songs_index|server/routes/songs/index.ts]] *(from #route)*
- [[src_components_atril_hooks_useAtrilEditing|src/components/atril/hooks/useAtrilEditing.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
