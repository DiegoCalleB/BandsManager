---
id: src_components_repertorio_accionesDisco
title: "src/components/repertorio/accionesDisco.ts"
layer: frontend
domain: system
file: "src/components/repertorio/accionesDisco.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/accionesDisco.ts

> **Ubicación:** `src/components/repertorio/accionesDisco.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: accionesDeDisco.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_ActionMenu|src/components/ui/ActionMenu.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioDeCancion|src/utils/audioDeCancion.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/accionesDisco.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
