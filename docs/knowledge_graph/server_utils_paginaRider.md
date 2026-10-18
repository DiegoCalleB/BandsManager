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
Página pública de SEO «plantilla de rider técnico» (`/plantilla-rider-tecnico` y `/en/technical-rider-template`),

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_textos|server/utils/seo/textos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/paginaRider.test.ts`
- `server/utils/seo/__tests__/guias.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
