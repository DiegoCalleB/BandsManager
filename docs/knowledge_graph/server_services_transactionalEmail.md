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
- [[ext_resend|Resend]] *(Layer: #external, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasRecuperacion|server/routes/users/rutasRecuperacion.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_services_avisoAltas|server/services/avisoAltas.ts]] *(from #service)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*
- [[server_services_emailsCicloVida|server/services/emailsCicloVida.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/emailsEscapado.test.ts`
- `server/services/__tests__/transactionalEmail.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
