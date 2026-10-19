---
id: server_utils_seo_festivales_importar
title: "server/utils/seo/festivales/importar.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/importar.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/importar.ts

> **Ubicación:** `server/utils/seo/festivales/importar.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Importa la lista de trabajo (`docs/master/marketing/FESTIVALES_PENDIENTES.md`) como festivales *candidatos*: solo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_slug|server/utils/slug.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivalesDb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
