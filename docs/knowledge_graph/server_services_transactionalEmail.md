---
id: server_services_transactionalEmail
title: "server/services/transactionalEmail.ts"
layer: service
domain: system
file: "server/services/transactionalEmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/transactionalEmail.ts

> **Ubicación:** `server/services/transactionalEmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: getProductionAppUrl, resolveResendApiKey, SendEmailOptions, sendTransactionalEmail, sendWelcomeEmail, sendPasswordResetEmail, sendMemberInvitationEmail, DealVenueEmailOptions.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
