---
id: server_utils_email
title: "server/utils/email.ts"
layer: service
domain: system
file: "server/utils/email.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/email.ts

> **Ubicación:** `server/utils/email.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Validación de direcciones de correo, en un solo sitio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
