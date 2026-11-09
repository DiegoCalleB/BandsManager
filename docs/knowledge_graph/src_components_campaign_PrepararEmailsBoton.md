---
id: src_components_campaign_PrepararEmailsBoton
title: "src/components/campaign/PrepararEmailsBoton.tsx"
layer: frontend
domain: system
file: "src/components/campaign/PrepararEmailsBoton.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/campaign/PrepararEmailsBoton.tsx

> **Ubicación:** `src/components/campaign/PrepararEmailsBoton.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
«Preparar emails»: rellena la plantilla de la campaña con los datos de cada festival (nombre, ciudad, estilos, fecha de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_campaign_GlobalCampaignBar|src/components/campaign/GlobalCampaignBar.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
