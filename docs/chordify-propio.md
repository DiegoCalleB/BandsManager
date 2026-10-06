# Chordify propio: plan y estado

Objetivo: acordes sincronizados con el audio (cursor que avanza con la música), con corrección manual.

## Honestidad sobre el alcance
- Acordes: **no se puede garantizar «perfecto»**. Ningún sistema (Chordify incluido) lo logra; el estado del arte ronda el 80 % en triadas y baja con extensiones, inversiones y mezclas densas. Por eso la corrección manual es parte del producto, no un extra.
- Letra: la transcripción con timestamps necesita un modelo de voz (Whisper o similar). No se hace con DSP propio. Funciona bien en inglés y razonablemente en español; mal con voces gritadas, coros o idiomas minoritarios (gallego).

## Fases
1. **Motor de acordes** (hecho): `server/utils/chordDetection.ts`. Croma por frames + plantillas mayor/menor + Viterbi + prior diatónico opcional. Devuelve `{t0, t1, acorde, confianza}`; lo que no alcanza el umbral sale «N». Séptimas opcionales (`incluirSeptimas`), desactivadas por defecto por falsos positivos con el 7.º armónico.
2. **Endpoint + modelo de datos**: ruta que analice el stem de armonía de Iris (o la mezcla), guarde `chordTimeline` en la canción y lo tenga disponible para el visor. Cola en segundo plano y caché por hash del contenido.
3. **Visor con cursor**: resalta el acorde actual y el siguiente, auto-scroll, clic para saltar, bucle de sección, diagramas (ya existen), transposición y capo.
4. **Corrección manual**: editar acorde/tiempo de un segmento y guardar como fuente de verdad.
5. **Letra con tiempos**: transcripción por voz (stem de voz de Iris) con timestamps por palabra, alineada a la rejilla de acordes.
6. **Compases y beats**: seguimiento de pulso para alinear acordes a compases.

## Cómo medir (obligatorio antes de tocar el algoritmo)
`npx tsx scripts/detectar-acordes.ts cancion.mp3 --tono Am --verdad verdad.txt` imprime los segmentos y el acierto por tiempo contra una verdad escrita a mano («inicio fin acorde» por línea). Fijar una línea base con 5-10 canciones reales de la banda.

## Resultados conocidos
- Sintético (triadas con armónicos): >90 % de acierto por tiempo, invariante a transposición.
- Audio de ejemplo del repo (`sample_02`, 30 s): progresión coherente Em-C-D-Em-C-G-Am-Em-C-G, sin verdad escrita todavía, sin cifra medible.

## Medidas (sintético «rock denso»: power chords distorsionados + bajo + batería + voz)
| Detector | Acierto por tiempo |
|---|---|
| v1: croma completo + plantillas + Viterbi | 0-38 % (en una canción real de 3 min colapsó en un único acorde) |
| v2: + croma de graves (el bajo toca la raíz) + tonalidad estimada del audio si no se indica | 91-100 % (75-88 % con ruido o distorsión extremos) |

Por qué fallaba v1: en una guitarra distorsionada la quinta del acorde y el tercer armónico de la raíz suenan igual (La se confunde con Mi). El bajo desempata la raíz, y la tonalidad desempata mayor/menor cuando no hay tercera.
Red de seguridad: si el resultado no es creíble (un acorde en una canción larga, o casi todo sin acorde) no se guarda y se explica por qué.
**Sigue sin medirse sobre canciones reales con verdad escrita a mano.**
