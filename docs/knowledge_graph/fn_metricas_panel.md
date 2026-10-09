---
id: fn_metricas_panel
title: "Panel y métricas"
layer: feature
domain: system
file: "src/components/Dashboard.tsx"
tags: ["feature", "system", "auto"]
---

# 📌 Panel y métricas

> **Ubicación:** `src/components/Dashboard.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/system`

## 📖 Descripción
Dashboard de la banda con métricas de Spotify, redes y actividad.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
