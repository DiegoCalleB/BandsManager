---
id: src_utils_offlineSync
title: "src/utils/offlineSync.ts"
layer: service
domain: system
file: "src/utils/offlineSync.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/offlineSync.ts

> **Ubicación:** `src/utils/offlineSync.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cola mínima de reintento para ediciones de setlist hechas sin conexión (típico: cambiar el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useRepertorioSync|src/hooks/useRepertorioSync.ts]] *(from #hook)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
