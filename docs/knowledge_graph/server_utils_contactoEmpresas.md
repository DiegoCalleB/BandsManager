---
id: server_utils_contactoEmpresas
title: "server/utils/contactoEmpresas.ts"
layer: service
domain: system
file: "server/utils/contactoEmpresas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/contactoEmpresas.ts

> **Ubicación:** `server/utils/contactoEmpresas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Contacto de empresas (plan B2B de la landing). Validación pura, sin red ni BD, para poder probarla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_interesados|server/utils/interesados.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_contactoEmpresas|server/routes/contactoEmpresas.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/contactoEmpresas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
