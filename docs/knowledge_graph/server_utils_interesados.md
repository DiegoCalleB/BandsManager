---
id: server_utils_interesados
title: "server/utils/interesados.ts"
layer: service
domain: system
file: "server/utils/interesados.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/interesados.ts

> **Ubicación:** `server/utils/interesados.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lista de novedades de la landing (doble confirmación). Todo aquí es puro, sin red ni BD, para poder probarlo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_utils_contactoEmpresas|server/utils/contactoEmpresas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/interesadosConfirmar.test.ts`
- `server/utils/__tests__/interesados.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
