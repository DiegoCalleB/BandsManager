---
id: server_routes_reels
title: "server/routes/reels.ts"
layer: route
domain: social
file: "server/routes/reels.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/reels.ts

> **Ubicación:** `server/routes/reels.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Reels & Social Content Generator: metadatos de YouTube, análisis de momentos virales, corte de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_reelStrategy|server/utils/reelStrategy.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsRoute.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
