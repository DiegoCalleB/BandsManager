---
id: src_hooks_useRepertorioShortcutsAndEvents
title: "src/hooks/useRepertorioShortcutsAndEvents.ts"
layer: hook
domain: system
file: "src/hooks/useRepertorioShortcutsAndEvents.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useRepertorioShortcutsAndEvents.ts

> **Ubicación:** `src/hooks/useRepertorioShortcutsAndEvents.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: UseRepertorioShortcutsAndEventsProps, useRepertorioShortcutsAndEvents.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useRepertorioShortcutsAndEvents.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
