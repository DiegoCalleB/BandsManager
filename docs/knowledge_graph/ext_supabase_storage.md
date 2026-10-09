---
id: ext_supabase_storage
title: "Supabase Storage"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Supabase Storage

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Buckets de audio, imágenes y PDFs (`storage.from(...)`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*
- [[server_utils_storage|server/utils/storage.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
