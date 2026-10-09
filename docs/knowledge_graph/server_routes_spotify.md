---
id: server_routes_spotify
title: "server/routes/spotify.ts"
layer: route
domain: system
file: "server/routes/spotify.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/spotify.ts

> **Ubicación:** `server/routes/spotify.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Integración con Spotify: estado, previsualización, búsqueda e importación de discografía.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
