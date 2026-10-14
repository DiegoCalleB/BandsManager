---
id: server_db_tiposEpk
title: "server/db/tiposEpk.ts"
layer: db
domain: epk
file: "server/db/tiposEpk.ts"
tags: ["db", "epk", "auto"]
---

# 📌 server/db/tiposEpk.ts

> **Ubicación:** `server/db/tiposEpk.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/epk`

## 📖 Descripción
Tipos de `epk_configs`: la fila tal como está en Supabase (snake_case) y lo que acepta el guardado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
