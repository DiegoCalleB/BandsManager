---
id: server_utils_optimizeExistingWavs
title: "server/utils/optimizeExistingWavs.ts"
layer: service
domain: system
file: "server/utils/optimizeExistingWavs.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/optimizeExistingWavs.ts

> **Ubicación:** `server/utils/optimizeExistingWavs.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: OptimizationResult, convertWavUrlToMp3, optimizeWavSongsForBand.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
