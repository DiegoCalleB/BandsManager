# 📋 BACKLOG.md — Ideas y Tareas Pendientes

> Backlog de producto: ideas, mejoras y features pendientes de evaluar o construir.
> Para directivas técnicas/arquitectura obligatorias, ver `AGENTS.md`.
> Para riesgos legales detectados, ver `AGENTS.md` §8.

Formato de cada entrada: **qué es**, **por qué importa** (impacto real, no "estaría bien"), y **estado**.

---

## 💡 Ideas por explorar

### Subida de vídeo de fans vía QR como gancho de conversión hacia el landing
* **Qué:** en el QR del concierto (cartel, entrada, escenario), añadir la opción de que el asistente suba su propio clip de 15" grabado durante el show.
* **Por qué importa:** el valor principal no es el vídeo en sí — es que **da un motivo activo para escanear el QR** más allá de "mirar el dossier". Alguien que quiere subir su clip entra sí o sí a la landing, y una vez dentro ve el resto: fan landing, EPK/dossier, próximos conciertos. Convierte una acción pasiva (escanear por curiosidad) en una con intención, y de paso aumenta las visitas reales a todo lo demás que ya tenéis montado en esa página (captación de fans, calendario).
* **Relacionado:** `PublicFanCapture.tsx` (ya tiene el patrón de consentimiento RGPD que habría que reutilizar aquí si se guardan los clips), mapa de energía del setlist (para priorizar qué clips destacar si más adelante se monta un reel con ellos).
* **Estado:** idea capturada, sin diseñar. Nota: el "reel editado automáticamente con IA a partir de los clips" es una fase posterior y más compleja — esto de aquí es solo el gancho de entrada al QR, no depende de que exista el editor de IA para tener valor por sí solo.

### Analizador de acordes/armonía real a partir de audio (no texto)
* **Qué:** hoy `SongChordsViewerModal.tsx` trabaja con cifrado escrito a mano o inferido por IA a partir de la letra/estructura (`chordUtils.ts`). La idea es que la IA "escuche" el audio real de la canción y saque la progresión de acordes de verdad, detecte modulaciones y genere un párrafo de análisis armónico ("aquí hay un acorde prestado que no pertenece a la tonalidad, por eso suena así").
* **Por qué importa:** es la única feature que le habla directamente a un perfil analista musical (tipo Shountrack/Rick Beato) — convierte a la app en generadora de su propio contenido de análisis, no solo en herramienta de booking/gestión.
* **Viabilidad (no es trivial, pero tampoco investigación de frontera):**
  * Técnica base: extraer chroma (energía por nota) por compás y comparar contra plantillas de acorde por similitud — MIR clásico, no hace falta deep learning para una v1.
  * **Ventaja real que ya tenemos:** pasar primero por **Iris** (separador de pistas) y analizar el stem de guitarra/piano + bajo por separado, no la mezcla completa — la batería es lo que más rompe la precisión de estos algoritmos, y ya tenemos cómo quitarla de en medio.
  * Librería a evaluar antes de escribir DSP a mano: **`essentia.js`** (WASM, MIT, ya trae detección de acordes integrada) — correría en el backend Node sin reinventar chroma/CQT desde cero.
  * La parte de "explícame por qué funciona" es la fácil: una vez hay secuencia de acordes, es texto generado por Gemini sobre datos estructurados, mismo patrón que el análisis IA del setlist ya existente.
  * **Riesgo de alcance:** acordes complejos (7maj9, sus4, inversiones, jazz) son mucho más difíciles de acertar que triadas simples. MVP recomendado: tónica + mayor/menor por compás (cubre la mayoría de rock/pop/indie), dejar acordes extendidos para una v2.
* **Estado:** idea capturada, sin prototipar. Siguiente paso si se retoma: probar `essentia.js` contra un stem de guitarra ya separado por Iris y medir precisión real antes de comprometer tiempo de desarrollo en la UI.

---

## 🔨 En curso

_(vacío)_

---

## ✅ Hecho

_(vacío — mover aquí con fecha cuando se implemente algo de arriba)_
