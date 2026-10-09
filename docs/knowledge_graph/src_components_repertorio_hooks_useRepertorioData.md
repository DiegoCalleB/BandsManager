---
id: src_components_repertorio_hooks_useRepertorioData
title: "src/components/repertorio/hooks/useRepertorioData.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useRepertorioData.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useRepertorioData.ts

> **Ubicación:** `src/components/repertorio/hooks/useRepertorioData.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Carga inicial y por API de canciones y setlists, saneados por banda sin mezclar datos de otra banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_config_sampleRepertoire|src/config/sampleRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
