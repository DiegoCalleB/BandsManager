---
id: src_utils_printSettings
title: "src/utils/printSettings.ts"
layer: service
domain: system
file: "src/utils/printSettings.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/printSettings.ts

> **Ubicación:** `src/utils/printSettings.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajustes de impresión del setlist que se recuerdan POR BANDA (tabla `band_print_settings`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_printSettings|server/db/printSettings.ts]] *(from #db)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/printSettings.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
