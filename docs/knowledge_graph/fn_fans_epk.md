---
id: fn_fans_epk
title: "Fans y EPK"
layer: feature
domain: epk
file: "src/components/FansPanel.tsx"
tags: ["feature", "epk", "auto"]
---

# 📌 Fans y EPK

> **Ubicación:** `src/components/FansPanel.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/epk`

## 📖 Descripción
Captación de fans, landing pública y dossier de prensa (EPK).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(Layer: #db, Domain: #finances)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_contacts|server/db/contacts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_fans|server/db/fans.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_production|server/db/production.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_referidos|server/db/referidos.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tours|server/db/tours.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_fan_link_clicks|tabla fan_link_clicks]] *(Layer: #schema, Domain: #social)*
- [[tabla_fans|tabla fans]] *(Layer: #schema, Domain: #social)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_musicians_waitlist|tabla musicians_waitlist]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
