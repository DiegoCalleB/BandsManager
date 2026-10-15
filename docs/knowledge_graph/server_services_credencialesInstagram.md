---
id: server_services_credencialesInstagram
title: "server/services/credencialesInstagram.ts"
layer: service
domain: social
file: "server/services/credencialesInstagram.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/credencialesInstagram.ts

> **Ubicación:** `server/services/credencialesInstagram.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Credenciales de Instagram de UNA banda (las que guardó al conectar Instagram en Métricas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_services_publicadores_instagramReels|server/services/publicadores/instagramReels.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
