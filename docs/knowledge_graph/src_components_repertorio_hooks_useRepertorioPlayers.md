---
id: src_components_repertorio_hooks_useRepertorioPlayers
title: "src/components/repertorio/hooks/useRepertorioPlayers.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useRepertorioPlayers.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useRepertorioPlayers.ts

> **Ubicación:** `src/components/repertorio/hooks/useRepertorioPlayers.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Agrupa los hooks de compartir, filtros de catálogo, reproductor persistente y reproductor de concierto del módulo Repertorio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useAudioPlayer|src/hooks/useAudioPlayer.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useCatalogFilters|src/hooks/useCatalogFilters.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useShareModal|src/hooks/useShareModal.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
