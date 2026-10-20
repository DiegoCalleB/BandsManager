---
id: server_utils_seo_avisoIdioma
title: "server/utils/seo/avisoIdioma.ts"
layer: service
domain: system
file: "server/utils/seo/avisoIdioma.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/avisoIdioma.ts

> **Ubicación:** `server/utils/seo/avisoIdioma.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aviso discreto en las páginas públicas de SEO cuando el idioma del navegador no es el de la página:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_rutas|server/utils/seo/rutas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_idiomaNavegador|src/utils/idiomaNavegador.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_seo_cabeza|server/utils/seo/cabeza.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/avisoIdioma.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
