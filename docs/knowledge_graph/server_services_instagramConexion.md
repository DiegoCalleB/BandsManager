---
id: server_services_instagramConexion
title: "server/services/instagramConexion.ts"
layer: service
domain: social
file: "server/services/instagramConexion.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/instagramConexion.ts

> **Ubicación:** `server/services/instagramConexion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Conexión de la cuenta de Instagram de una banda: verifica un token de Meta, descubre la cuenta

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_tiposMetricas|server/routes/tiposMetricas.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_instagramOAuth|server/routes/instagramOAuth.ts]] *(from #security)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
