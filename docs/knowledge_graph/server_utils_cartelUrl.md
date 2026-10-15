---
id: server_utils_cartelUrl
title: "server/utils/cartelUrl.ts"
layer: service
domain: system
file: "server/utils/cartelUrl.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/cartelUrl.ts

> **Ubicación:** `server/utils/cartelUrl.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Dónde viven los carteles en Supabase Storage y qué URL se acepta como «de un cartel de esta banda».

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/cartelUrl.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
