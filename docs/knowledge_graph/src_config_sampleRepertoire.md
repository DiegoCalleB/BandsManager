---
id: src_config_sampleRepertoire
title: "src/config/sampleRepertoire.ts"
layer: service
domain: repertoire
file: "src/config/sampleRepertoire.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/config/sampleRepertoire.ts

> **Ubicación:** `src/config/sampleRepertoire.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SAMPLER_ALBUM_NAME, SAMPLER_COVER_URL, SAMPLER_SONGS, SAMPLER_SETLISTS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
