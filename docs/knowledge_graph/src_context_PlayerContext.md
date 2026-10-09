---
id: src_context_PlayerContext
title: "src/context/PlayerContext.tsx"
layer: service
domain: system
file: "src/context/PlayerContext.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/context/PlayerContext.tsx

> **Ubicación:** `src/context/PlayerContext.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: PlayerProvider, usePlayer.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_GlobalPlayer|src/components/GlobalPlayer.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPlayers|src/components/repertorio/hooks/useRepertorioPlayers.ts]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
