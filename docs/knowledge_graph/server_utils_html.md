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
- [[server_utils_avisoPublicacionFallida|server/utils/avisoPublicacionFallida.ts]] *(from #service)*
- [[server_utils_avisosCuentaEmail|server/utils/avisosCuentaEmail.ts]] *(from #service)*
- [[server_utils_emailsCicloVida|server/utils/emailsCicloVida.ts]] *(from #service)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(from #service)*
- [[server_utils_paginaRider|server/utils/paginaRider.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
