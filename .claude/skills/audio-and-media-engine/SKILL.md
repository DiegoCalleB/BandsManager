---
name: audio-and-media-engine
description: Tone.js Web Audio synthesis, MIDI export, audio key/BPM analysis, and Supabase Storage asset hierarchy for BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini.
---

# 🎵 Skill: Audio, Music & Media Synthesis Engine (Universal Agent Standard)

Estándar para la generación musical con IA (Gemini Lyria), síntesis Web Audio con `Tone.js`, exportación MIDI, análisis de audio y clips de vídeo para redes.

---

## 🎧 1. Síntesis y Reparación Rítmica (`src/utils/instrumentSynth.ts`)

1. **Reparación de Notas AI:** Antes de sintetizar acordes o melodías generadas por LLMs, la secuencia DEBE pasar por la validación de rango y tonalidad para evitar distorsiones de audio clipping:
   ```typescript
   import { repairNotesForSynth } from 'src/utils/instrumentSynth.ts';
   const cleanNotes = repairNotesForSynth(rawAiNotes, keySignature);
   ```
2. **Efectos y Carga Ligera:** Utilizar instancias compartidas de `Tone.PolySynth` y `Tone.Reverb` para evitar fuelles de memoria en el navegador.

---

## 🎼 2. Exportación MIDI (`src/utils/midiExport.ts`)

- Permite a los músicos exportar las ideas y arreglos generados a sus DAWs (Ableton, Logic, Pro Tools).
- Convierte estructuras de acordes y patrones rítmicos a formato `.mid` binario estándar.

---

## 📦 3. Almacenamiento en Supabase Storage

Todo archivo de audio (maquetas, stems aislados, clips de vídeo procesados) DEBE subirse a Supabase Storage con la estructura jerárquica:
`stems/{bandId}/{songHash}/{filename}`

Servir siempre con cabeceras `X-Content-Type-Options: nosniff`.
