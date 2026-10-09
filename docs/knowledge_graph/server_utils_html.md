---
id: server_utils_html
title: "server/utils/html.ts"
layer: service
domain: system
file: "server/utils/html.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/html.ts

> **Ubicación:** `server/utils/html.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Escapado de HTML para texto que escribe un usuario y se pinta dentro de un correo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(from #service)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
