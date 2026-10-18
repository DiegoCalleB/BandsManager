---
id: server_utils_paginaRider
title: "server/utils/paginaRider.ts"
layer: service
domain: system
file: "server/utils/paginaRider.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/paginaRider.ts

> **Ubicación:** `server/utils/paginaRider.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Página pública de SEO «plantilla de rider técnico» (`/plantilla-rider-tecnico`), generada en el servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_utils_seo_indice|server/utils/seo/indice.ts]] *(from #service)*
- [[server_utils_seo_render|server/utils/seo/render.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/paginaRider.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
