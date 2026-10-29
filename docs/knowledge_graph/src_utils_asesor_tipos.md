---
id: src_utils_asesor_tipos
title: "src/utils/asesor/tipos.ts"
layer: service
domain: system
file: "src/utils/asesor/tipos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/tipos.ts

> **Ubicación:** `src/utils/asesor/tipos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Tipos compartidos del asesor que no pertenecen a un solo módulo: lo que la banda hace con una idea.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/agenda.test.ts`
- `src/utils/asesor/__tests__/resumen.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
