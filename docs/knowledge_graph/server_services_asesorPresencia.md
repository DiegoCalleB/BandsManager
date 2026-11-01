---
id: server_services_asesorPresencia
title: "server/services/asesorPresencia.ts"
layer: service
domain: system
file: "server/services/asesorPresencia.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/asesorPresencia.ts

> **Ubicación:** `server/services/asesorPresencia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Asesor de Marketing: la presencia de la banda. Reúne lo que BandManager ya sabe (perfil, dossier,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_credencialesInstagram|server/services/credencialesInstagram.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_publicadores_instagramReels|server/services/publicadores/instagramReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_enlacesCortos|server/utils/enlacesCortos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_anuncios|src/utils/asesor/anuncios.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_auditoria|src/utils/asesor/auditoria.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_clicsPieza|src/utils/asesor/clicsPieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_presencia|src/utils/asesor/presencia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_seo|src/utils/asesor/seo.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/asesorPresencia.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
