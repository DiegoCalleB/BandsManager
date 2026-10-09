---
id: src_components_repertorio_hooks_useRepertorioPersistence
title: "src/components/repertorio/hooks/useRepertorioPersistence.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useRepertorioPersistence.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useRepertorioPersistence.ts

> **Ubicación:** `src/components/repertorio/hooks/useRepertorioPersistence.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Persistencia del repertorio: favoritos, cabeceras de API, guardado local seguro, carga desde el servidor, reintento offline y análisis IA guardado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_config_sampleRepertoire|src/config/sampleRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_offlineSync|src/utils/offlineSync.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
