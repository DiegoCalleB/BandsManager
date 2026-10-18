---
id: server_utils_redesBanda
title: "server/utils/redesBanda.ts"
layer: service
domain: system
file: "server/utils/redesBanda.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/redesBanda.ts

> **Ubicación:** `server/utils/redesBanda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Identificadores de redes sacados de los enlaces guardados de una banda (lógica pura, sin red).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_enlacesBandas|server/utils/enlacesBandas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_instagramDescubrimiento|server/services/instagramDescubrimiento.ts]] *(from #service)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/redesBanda.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
