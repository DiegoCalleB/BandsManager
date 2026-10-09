---
id: fn_acceso_sesion
title: "Acceso y sesión"
layer: feature
domain: auth
file: "src/components/LoginModal.tsx"
tags: ["feature", "auth", "auto"]
---

# 📌 Acceso y sesión

> **Ubicación:** `src/components/LoginModal.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/auth`

## 📖 Descripción
Login (email o Google), sesión por cookie y multi-banda: de quién es cada petición.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] *(Layer: #external, Domain: #system)*
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] *(Layer: #external, Domain: #system)*
- [[ext_resend|Resend]] *(Layer: #external, Domain: #system)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(Layer: #frontend, Domain: #auth)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[src_utils_googleAuth|src/utils/googleAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
