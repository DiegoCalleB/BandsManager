---
id: server_utils_invitacion
title: "server/utils/invitacion.ts"
layer: service
domain: system
file: "server/utils/invitacion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/invitacion.ts

> **Ubicación:** `server/utils/invitacion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: asignarInvitacion, invitacionPendiente, tokenInvitacionValido, limpiarInvitacion.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_users_rutasInvitacion|server/routes/users/rutasInvitacion.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/invitacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
