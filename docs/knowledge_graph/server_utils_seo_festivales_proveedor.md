---
id: server_utils_seo_festivales_proveedor
title: "server/utils/seo/festivales/proveedor.ts"
layer: service
domain: system
file: "server/utils/seo/festivales/proveedor.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/seo/festivales/proveedor.ts

> **Ubicación:** `server/utils/seo/festivales/proveedor.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
De dónde salen las fichas públicas: la base de datos y, si no responde o aún está vacía, las fichas fijas de `datos.ts`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_seo_festivales_tipos|server/utils/seo/festivales/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/seo/__tests__/festivalesDb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
