---
id: src_utils_gmail
title: "src/utils/gmail.ts"
layer: service
domain: system
file: "src/utils/gmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/gmail.ts

> **Ubicación:** `src/utils/gmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: auth, initAuth, googleSignIn, getAccessToken, logout, fetchGmailThreadsForEmail, EmailAttachment, buildRawMimeMessage.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useGmailIntegration|src/hooks/useGmailIntegration.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
