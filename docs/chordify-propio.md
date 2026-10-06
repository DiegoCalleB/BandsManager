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

## Aro de cuenta atrás, compases y bloques
- **Aro por acorde** (`AroAcorde`): como los loops de GarageBand, el aro del acorde actual se llena mientras suena y el número del centro cuenta los segundos que faltan; en el último 0,8 s cambia de color para anticipar el cambio. El acorde siguiente es un aro tenue con su cuenta atrás.
- **Compases y bloques** (`cuadriculaCompases.ts`, `RegletaCompases`): no se detecta el pulso del audio; con el BPM de la ficha se busca el desfase de pulso y el compás (4/4 o 3/4, y en qué tiempo empieza) con los que más cambios de acorde caen sobre un pulso. Se prueban también la mitad del tempo (a 60 solo la mitad de los cambios cae en inicio de compás). Si no encaja (<55 %), no se dibujan compases en vez de inventarlos. Bloques de 4 u 8 compases con letra por progresión (A A B A).
- Limitación: con la ficha al **doble** del tempo real no hay forma de distinguirlo solo con acordes; se respeta la ficha.
- Móvil: el modal se desplaza entero y el cuerpo de la letra tiene altura propia (antes se quedaba en 2 px bajo la cabecera y el panel de acordes).

## Pulso real del audio (`server/utils/pulso.ts`)
- Envolvente de ataques (flujo espectral, 23 ms) → autocorrelación para el tempo → programación dinámica (Ellis) para colocar los pulsos. El BPM de la ficha es la **pista** para escoger entre tempo, mitad y doble (la mitad/doble solo gana si es ≥1,4× mejor).
- Los cambios de acorde a ≤0,1 s de un pulso se llevan a él (`ajustarAPulso`). La rejilla de compases del visor usa el tempo y la fase medidos (`analisis.pulso`); el BPM de la ficha queda de plan B.
- Medido en sintético (batería, rock denso): error de tempo <2 %, fase <0,08 s. Sin ficha puede confundir el tempo con un múltiplo (138 → 92); con ficha no. Rubato fuerte → confianza baja → no se usa.
- Log de Railway: `pulso=…bpm/conf… ficha=…`.

## Medir antes de cambiar (`scripts/evaluar-acordes.ts`)
- **Verdad = correcciones de la banda.** Al corregir en el visor se guardan `segmentosOriginales` (lo que dijo el detector antes de la primera corrección) y `referenciaManual` (los acordes corregidos hasta el último tramo tocado). La referencia **sobrevive a los reanálisis** y a los guardados de la canción con una copia vieja del análisis.
- `npm run eval:acordes` (o `--archivo volcado.json`) da por canción: acierto mayor/menor y de raíz por tiempo (métricas MIREX), cambios encontrados a ≤0,3 s y ≤1 s, error medio y cambios que sobran.
- `--prediccion carpeta/` compara además otro detector (.lab de MIREX o .json), emparejando ficheros por título.

## Comparar con modelos entrenados, gratis (`tools/colab/acordes_btc.py`)
BTC (ISMIR 2019, MIT) en Google Colab: sube los audios con el título de la canción como nombre, ejecuta el script y evalúa los `.lab` con el comando anterior. No se ha podido ejecutar desde el entorno de desarrollo (sin acceso a los pesos): puede necesitar ajustes de versiones. Los pesos están entrenados con datasets académicos: sirve para **medir**; para producción hay que revisar la licencia.

## Plan por coste
1. **Gratis, ya hecho:** detector propio + afinado de fronteras por ataques + pulso propio + edición manual + evaluación.
2. **Gratis, siguiente:** con 20-30 tramos corregidos por canción, medir; comparar con BTC en Colab. Mejoras propias pendientes: acordes por pulso (decodificar por tiempo de compás en vez de ventanas fijas) y tonalidad por tramos (modulaciones).
3. **Barato, solo si gana por números:** worker GPU bajo demanda (Modal/RunPod) con el modelo ganador + Beat This! (MIT) para directos sin claqueta. Coste realista 0,01-0,05 $ por canción contando arranques en frío.
4. **Evitar:** madmom (modelos con licencia no comercial), Essentia (AGPL), APIs de pago por minuto.
