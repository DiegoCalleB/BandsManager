---
id: src_hooks_useRepertorioSync
title: "src/hooks/useRepertorioSync.ts"
layer: hook
domain: system
file: "src/hooks/useRepertorioSync.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useRepertorioSync.ts

> **Ubicación:** `src/hooks/useRepertorioSync.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: UseRepertorioSyncParams, UseRepertorioSyncResult, useRepertorioSync.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_config_sampleRepertoire|src/config/sampleRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_offlineSync|src/utils/offlineSync.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useRepertorioSync.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
