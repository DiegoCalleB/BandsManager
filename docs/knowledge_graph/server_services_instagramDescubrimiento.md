---
id: server_services_instagramDescubrimiento
title: "server/services/instagramDescubrimiento.ts"
layer: service
domain: social
file: "server/services/instagramDescubrimiento.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/instagramDescubrimiento.ts

> **Ubicación:** `server/services/instagramDescubrimiento.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Seguidores de las cuentas de Instagram de las bandas amigas con `business_discovery` (API oficial de Meta).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_redesBanda|server/utils/redesBanda.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/instagramDescubrimiento.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
