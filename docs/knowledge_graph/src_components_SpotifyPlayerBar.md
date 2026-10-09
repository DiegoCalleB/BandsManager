---
id: src_components_SpotifyPlayerBar
title: "src/components/SpotifyPlayerBar.tsx"
layer: frontend
domain: system
file: "src/components/SpotifyPlayerBar.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/SpotifyPlayerBar.tsx

> **Ubicación:** `src/components/SpotifyPlayerBar.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SpotifyPlayerBar.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useTonePitchShift|src/hooks/useTonePitchShift.ts]] *(Layer: #hook, Domain: #booking)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_crossfade|src/utils/crossfade.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_GlobalPlayer|src/components/GlobalPlayer.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
