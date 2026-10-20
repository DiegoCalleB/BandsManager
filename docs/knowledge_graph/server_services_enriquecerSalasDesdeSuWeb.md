---
id: server_services_enriquecerSalasDesdeSuWeb
title: "server/services/enriquecerSalasDesdeSuWeb.ts"
layer: service
domain: system
file: "server/services/enriquecerSalasDesdeSuWeb.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/enriquecerSalasDesdeSuWeb.ts

> **Ubicación:** `server/services/enriquecerSalasDesdeSuWeb.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Completa las salas del catálogo con lo que dice su propia web: Instagram (si se parece al nombre de la sala), email de rol,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_datosDeWebSala|server/utils/datosDeWebSala.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/enriquecerSalasDesdeSuWeb.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
