---
id: fn_ensayos
title: "Ensayos"
layer: feature
domain: repertoire
file: "src/components/ensayos/EnsayosManager.tsx"
tags: ["feature", "repertoire", "auto"]
---

# 📌 Ensayos

> **Ubicación:** `src/components/ensayos/EnsayosManager.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Convocatorias, orden del día, acta y seguimiento del ensayo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_mergeWithExisting|server/db/mergeWithExisting.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useSeguimientoEnsayo|src/hooks/useSeguimientoEnsayo.ts]] *(Layer: #hook, Domain: #system)*
- [[tabla_band_letras_auto|tabla band_letras_auto]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_letras_jobs|tabla letras_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_rehearsals|tabla rehearsals]] *(Layer: #schema, Domain: #system)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
