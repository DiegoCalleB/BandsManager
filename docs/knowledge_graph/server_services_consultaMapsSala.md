---
id: server_services_consultaMapsSala
title: "server/services/consultaMapsSala.ts"
layer: service
domain: system
file: "server/services/consultaMapsSala.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/consultaMapsSala.ts

> **Ubicación:** `server/services/consultaMapsSala.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Consulta a Google Places (New) del estado de una sala. Es el adaptador real de `ConsultaMaps`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_verificarSalasEnMaps|server/services/verificarSalasEnMaps.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_estadoNegocio|server/utils/estadoNegocio.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
