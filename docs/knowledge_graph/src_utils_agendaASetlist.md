---
id: src_utils_agendaASetlist
title: "src/utils/agendaASetlist.ts"
layer: service
domain: repertoire
file: "src/utils/agendaASetlist.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/agendaASetlist.ts

> **Ubicación:** `src/utils/agendaASetlist.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: agendaItemASetlistItem, agendaASetlist.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/agendaASetlist.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
