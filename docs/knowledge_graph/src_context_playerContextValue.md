---
id: src_context_playerContextValue
title: "src/context/playerContextValue.ts"
layer: service
domain: system
file: "src/context/playerContextValue.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/context/playerContextValue.ts

> **Ubicación:** `src/context/playerContextValue.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del reproductor global y su hook de acceso. Separado de PlayerContext.tsx para que

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_GlobalPlayer|src/components/GlobalPlayer.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPlayers|src/components/repertorio/hooks/useRepertorioPlayers.ts]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
