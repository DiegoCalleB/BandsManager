---
id: ext_google_oauth_gmail
title: "Google OAuth / Gmail API"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Google OAuth / Gmail API

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Inicio de sesión con Google y lectura/envío de Gmail.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*
- [[server_utils_googleVerify|server/utils/googleVerify.ts]] *(from #service)*
- [[src_utils_gmail|src/utils/gmail.ts]] *(from #service)*
- [[src_utils_googleAuth|src/utils/googleAuth.ts]] *(from #security)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
