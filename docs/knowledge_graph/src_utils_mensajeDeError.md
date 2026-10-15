---
id: src_utils_mensajeDeError
title: "src/utils/mensajeDeError.ts"
layer: service
domain: system
file: "src/utils/mensajeDeError.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/mensajeDeError.ts

> **Ubicación:** `src/utils/mensajeDeError.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Un error técnico del servidor («Error 404: Not Found», «Failed to fetch») no se le enseña tal cual a un músico.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilEditing|src/components/atril/hooks/useAtrilEditing.ts]] *(from #frontend)*
- [[src_components_atril_hooks_useChordAnalysis|src/components/atril/hooks/useChordAnalysis.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
