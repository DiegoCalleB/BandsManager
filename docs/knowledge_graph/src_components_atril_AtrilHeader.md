---
id: src_components_atril_AtrilHeader
title: "src/components/atril/AtrilHeader.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/AtrilHeader.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AtrilHeader.tsx

> **Ubicación:** `src/components/atril/AtrilHeader.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Cabecera del Atril: título, tonalidad, ficha del tema y acciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
