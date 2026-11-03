---
id: src_utils_notacionAcordes
title: "src/utils/notacionAcordes.ts"
layer: service
domain: system
file: "src/utils/notacionAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/notacionAcordes.ts

> **Ubicación:** `src/utils/notacionAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Notación de acordes y tonalidades: UNA sola, nunca mezclada.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_components_user_profile_NotacionPreferenceCard|src/components/user_profile/NotacionPreferenceCard.tsx]] *(from #frontend)*
- [[src_hooks_useNotacion|src/hooks/useNotacion.ts]] *(from #hook)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/notacionAcordes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
