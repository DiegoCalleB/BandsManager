---
id: ext_replicate
title: "Replicate"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Replicate

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Separación de pistas (Iris) y transcripción de letras.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(from #service)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(from #service)*
- [[server_services_transcripcionLetra|server/services/transcripcionLetra.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
