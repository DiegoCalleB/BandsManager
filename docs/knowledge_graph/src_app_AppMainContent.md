---
id: src_app_AppMainContent
title: "src/app/AppMainContent.tsx"
layer: service
domain: system
file: "src/app/AppMainContent.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/AppMainContent.tsx

> **Ubicación:** `src/app/AppMainContent.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Área principal: campaña activa, aviso de sincronización y vista activa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_ActiveViewRouter|src/app/ActiveViewRouter.tsx]] *(Layer: #service, Domain: #system)*
- [[src_app_AppContext|src/app/AppContext.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_campaign_GlobalCampaignBar|src/components/campaign/GlobalCampaignBar.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_AppShell|src/app/AppShell.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
