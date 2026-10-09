---
id: ext_correo_smtp_imap
title: "Correo SMTP / IMAP"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Correo SMTP / IMAP

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Envío y lectura de correo (nodemailer, imapflow, mailparser).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
