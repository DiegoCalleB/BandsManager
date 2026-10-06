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

## Letra con tiempos (reconocimiento de voz, nunca generativo)
`POST /api/songs/:id/letra-sincronizada` («Letra del audio» en el visor):
1. Audio: la pista **Voz** aislada de Iris si existe (confianza «media»), si no la mezcla (confianza «baja» y aviso).
2. `server/services/transcripcionLetra.ts`: Whisper en Replicate. El esquema del modelo se **descubre en tiempo de ejecución** (qué parámetros declara: audio, tiempos por palabra, idioma) y la salida se normaliza de las formas conocidas; una salida **sin tiempos se rechaza**. Modelos por defecto: `vaibhavs10/incredibly-fast-whisper`, `openai/whisper`; se puede forzar otro con `WHISPER_REPLICATE_MODEL`. Usa `REPLICATE_API_TOKEN` (ya configurado en Railway).
3. `limpiarLineas`: quita lo que Whisper alucina con música (créditos de subtítulos, marcas ♪, bucles de la misma frase, tramos largos con casi nada de texto). Menos de 8 palabras = «sin letra».
4. `server/utils/cifradoSincronizado.ts`: cada acorde detectado va delante de la palabra que suena cuando cambia; huecos instrumentales como [Instrumental], antes de la primera frase [Intro], después de la última [Outro]. No añade ni una palabra a la transcripción.
5. Se guarda `cifradoTexto` y `analisisAcordes.letra` (líneas con tiempos). Un cifrado ya existente no se sustituye sin confirmar.

Si algo falla (sin token, modelo no disponible, audio no público, salida sin tiempos) se devuelve el error con el motivo de cada modelo y **no se escribe nada**.
La subida de audio (suelta o en lote) solo detecta acordes; la letra se pide siempre a propósito, porque cuesta dinero y tiempo.

Pendiente: probar contra Replicate real con una canción (desde el entorno de desarrollo no hay salida a internet); karaoke línea a línea con `analisisAcordes.letra`; análisis por pista en `PracticeModePanel` sigue usando el generador antiguo (sin songId).

## Detector v3 (caso real: «Born To Be Wild», rock duro) — 2026-10
Fallo visto en producción: un solo acorde en toda la canción. Causa reproducida: batería y guitarra distorsionada dejan el croma **plano** (todas las notas entre 0,2 y 0,4) y con tan poco contraste cualquier penalización por cambiar de acorde lo aplasta todo en uno. Arreglos:
1. **Limpieza armónica/percusiva ligera** de los espectros: mediana en el tiempo por bin (lo tonal persiste, un golpe no) y resta del suelo de ruido en frecuencia. Compresión por raíz cuadrada en vez de logaritmo (el log aplanaba el croma).
2. **Afinación estimada** (media circular de la parte fraccionaria del tono de los picos) y aplicada al croma y al de graves: discos antiguos o guitarras medio semitono flojas ya no emborronan.
3. **Tonalidad estimada de los propios acordes** (primera pasada sin prior) en vez del croma global.
4. **Diagnóstico por análisis en los logs** (`[acordes] fuente= tramos= distintos= dominante= contraste= afinacion= tonalidad=`): permite saber por qué un audio concreto sale mal sin tener el audio.

| Batería de 30 casos (6 progresiones × 5 variantes) | media |
|---|---|
| v2 (bajo + tonalidad) | 96 % (75-94 % en las variantes duras) |
| v3 | 100 % |

| «BTBW» sintético (E-E-A-D…, 146 BPM) | v2 | v3 |
|---|---|---|
| bajo fijo en Mi | 63 % (1 tramo) | 100 % |
| + batería y voz fuertes | 63 % (1 tramo) | 100 % |
| desafinado +40 / −45 cent | 75 % / 63 % | 100 % / 100 % |
| reverb + ruido | 75 % | 100 % |
| sin tonalidad + todo a la vez | 63 % | 75 % |

Sigue sin medirse sobre grabaciones reales con verdad escrita a mano.
