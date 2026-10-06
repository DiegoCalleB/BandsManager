# Plan: «Profesor de armonía» — colores, grados romanos y ficha tonal de cada canción

> **Estado (2026-10-07): fases 1, 2 y 3 IMPLEMENTADAS** (ver «Implementado» al final). Pendientes: fase 4 (mástil/teclado y práctica) y fase 5 (golden tests con canciones reales, botón «esto está mal»).

Objetivo: que al abrir una canción el músico no solo vea QUÉ acordes suenan, sino que entienda **por qué funcionan**: qué función tiene cada acorde, en qué modo está la canción, qué escalas y notas sirven para improvisar o componer líneas y riffs que encajen, y qué se podría hacer para darle más dinamismo.

## Principio rector: los hechos los calcula código; la IA solo los explica
Un profesor que se inventa la armonía es peor que ninguno (ya nos pasó con la letra). Por eso:

1. **Motor de teoría determinista** (sin IA, testeable): tonalidad, modo, grado romano, función, progresiones, escalas. Mismo audio → mismo resultado.
2. **Narrativa con IA** (Gemini o Claude): recibe **solo ese JSON de hechos** y lo redacta como un profesor. No puede afirmar nada que no esté en los hechos; se valida después (todo acorde que nombre debe existir en la canción).
3. **Sugerencias** claramente etiquetadas como «ideas», nunca como hechos.

Consecuencia honesta: la teoría hereda los errores de la detección (≈75 % de acierto en triadas). Por eso (a) se usan los acordes **corregidos por la banda** cuando existen (`referenciaManual`), (b) cada afirmación lleva su confianza y los tramos dudosos se marcan «revisa», (c) la medición de la detección (`npm run eval:acordes`) sigue siendo prioritaria.

## Lo que ya tenemos y se reutiliza
`analisis_acordes` (acordes con tiempos, `tonalidades` por tramos, `pulso`, `referenciaManual`), cuadrícula de compases y bloques A/B, `GUITAR_CHORD_DATABASE` y diagramas, transposición/notación ES-EN (`chordUtils`), pestañas del visor («Letra y acordes», «Ficha Sustituto»).

**Aviso:** el recuadro «Estructura Rápida para el Músico» (Intro → Verso 1 → Pre-estribillo…) sale hoy de la ficha del sustituto generada por IA y puede ser inventado. La estructura calculada (bloques A/B por repetición de progresión) debe sustituirlo.

---

## Fase 1 — Motor de teoría + colores + números romanos (sin IA, sin SQL)
`src/utils/teoriaArmonica.ts` (puro, con tests):

| Función | Qué devuelve |
|---|---|
| `gradoDeAcorde(acorde, tonalidad)` | Grado y alteración: `I, bII, ii, bIII, iii, IV, #IV, V, bVI, vi, bVII, vii°`; mayúscula = mayor, minúscula = menor, `°` dim, `+` aug, sufijos `7, maj7, sus4…` (ej.: `bVII`, `V7`, `vi`, `V/vi`). |
| `funcionDeGrado` | **Tónica** (I, vi, iii), **Subdominante** (IV, ii), **Dominante** (V, vii°), **Modal/prestado** (bVII, bIII, bVI: «color de otro modo»), **Ajeno** (cromático). Dominantes secundarios (V/x) detectados por la raíz a quinta de un acorde diatónico que le sigue. |
| `estimarModo(segmentos)` | Jónico, eólico, mixolidio, dórico, frigio, lidio… por el conjunto de notas de los acordes ponderado por duración y por anclaje en la tónica. Blues-rock (E7, A7, B7) se etiqueta aparte. |
| `reconocerProgresiones` | Patrones con nombre: `I–IV–V`, `I–V–vi–IV` (eje pop), `vi–IV–I–V`, `I–bVII–IV` (rock mixolidio), `i–bVII–bVI–V` (andaluza), `ii–V–I`, blues de 12 compases, `I–vi–IV–V` (50s); más el **bucle** (qué se repite y cada cuántos compases). |
| `notasDelAcorde` y `escalasSugeridas(acorde, contexto)` | Fundamental/3.ª/5.ª/7.ª y 1-3 escalas por acorde según función y modo (pentatónica menor/mayor, mixolidio, dórico, blues, arpegio). Marca las **notas guía** (3.ª y 7.ª) que dibujan el cambio de acorde. |

**Colores por función** (tokens del sistema de diseño, no colores nuevos; cargar la skill `visual-identity` antes de tocar clases): tónica = reposo, subdominante = movimiento, dominante = tensión, modal/prestado = color, ajeno = aviso. Además de color, **una letra/forma** (T/S/D) para que no dependa solo del color (daltonismo). Leyenda siempre visible.

**Dos esquemas, selector de 3 opciones** («Colorear por: función · grado · nada»): por *función* (recomendado, 4-5 colores, enseña el porqué) y por *grado* (7 tonos, estilo Boomwhackers: I rojo, II naranja…, útil para oído absoluto/relativo).

**Selector de notación** («Mostrar: nombre · grado · ambos»): `Am` / `vi` / `Am·vi`. Respeta ES/EN existente. Los romanos se calculan sobre la **tonalidad del tramo** (si la canción modula, el grado se reinterpreta: un Mi en Do es `III`, en Mi es `I`).

Entregable: chips de acordes del visor (línea de tiempo, carril y cifrado) coloreados y con grado; tests de tabla (≥60 casos: 12 tonalidades × mayor/menor × modos) y de progresiones famosas.
**Esfuerzo:** 1 PR mediano. **Coste:** 0 €.

## Fase 2 — Pestaña «Armonía» determinista (sin IA, sin SQL)
Nueva pestaña junto a «Letra y acordes»:
1. **Resumen tonal**: tonalidad y modo («E mixolidio»), cambios de tono («sube a F# en 2:31»), BPM y compás, ritmo armónico (cambios por compás), % de tiempo en tónica / subdominante / dominante / color.
2. **Mapa de la canción**: bloques A/B/C con su progresión en grados y en acordes (`A: I–bVII–IV–I`), con repeticiones y compases. Sustituye la «Estructura Rápida» inventada.
3. **Acordes de la canción**: tabla con grado, función, notas del acorde, escalas sugeridas, cuánto suena y diagrama (el existente).
4. **Qué tocar**: para cada bloque, escala principal + alternativa y las notas guía de cada cambio («en el D (bVII) apunta a la 7.ª menor del tono: D»).
5. **Confianza**: banner «Basado en acordes detectados automáticamente (X % revisados por ti)»; los tramos de baja confianza salen en gris con «revisa».

**Esfuerzo:** 1 PR grande. **Coste:** 0 €.

## Fase 3 — El «profesor» con IA (narrativa + sugerencias)
**Entrada:** el JSON de hechos de la fase 2 (nunca el audio ni el título como fuente de verdad) + nivel del alumno (principiante / intermedio / avanzado) + instrumento + idioma.
**Salida estructurada** (esquema JSON, validado): `resumen`, `como_funciona` (por bloque), `para_improvisar`, `para_componer` (ideas de riffs/líneas de bajo/voicings en grados, no notas copiadas de la canción), `dinamismo` (lista de ideas), cada una con `refiere_a: [ids de hechos]`.

Qué cubre «dinamismo» (cada idea con ejemplo concreto en los acordes de ESA canción): cambio de tono en el último estribillo, pedal de bajo, stop-time / pausas, intercambio modal (tocar el IV menor), acorde de paso o dominante secundario antes del estribillo, textura (arpegiar el verso, rasgueo abierto en el estribillo), dinámica y contrastes entre bloques, ritmo armónico (acelerar o frenar los cambios).

**Guardarraíles contra el invento:**
- el prompt prohíbe afirmar nada fuera de los hechos y pide «no sé» ante la duda;
- validación posterior: todo acorde, grado o escala mencionado debe existir en los hechos o en la tabla de teoría; si no, se descarta la frase;
- lo opinable (sugerencias) va en su propia sección con la etiqueta «Idea»;
- caché por hash de los hechos en `analisis_acordes.armonia` (JSON dentro de la columna que ya existe): solo se regenera si cambian los acordes; **sin migración SQL**.

**Qué modelo:** el que ya tienes con clave (Gemini Flash o un modelo pequeño de Claude). Una llamada de ~1,5-2 mil tokens por canción: del orden de **céntimos por cada 100 canciones**. Botón «Pedir explicación del profesor» (bajo demanda, no automático) para controlar el gasto.
**Esfuerzo:** 1 PR mediano.

## Fase 4 — Práctica interactiva
- **Mástil / teclado** que ilumina las notas de la escala sugerida y del acorde actual **mientras suena** (ya tenemos tiempos por acorde); selector de instrumento (guitarra, bajo, teclado) y de afinación.
- **Modo práctica por bloque**: bucle de un bloque con metrónomo, y «practica en otra tonalidad» (ya existe transposición).
- Mini-ejercicios generados por reglas: «improvisa con la pentatónica menor de E sobre el bloque A», «toca solo las notas guía».
**Esfuerzo:** 2 PRs. Es lo más vistoso para el TFM.

## Fase 5 — Calidad y aprendizaje continuo
- **Golden tests** con canciones conocidas escritas a mano (acordes y análisis esperado), p. ej.: *Born to Be Wild* (E mixolidio, `I–bVII–IV`), *Smoke on the Water* (blues menor en G), *Hotel California* (`i–V–bVII–IV`…), un 12-compases de blues y un `ii–V–I` de jazz. Si cambia el motor, cambian los resultados esperados *a propósito*.
- Botón «Esto está mal» en cada afirmación: guarda la corrección (como ya hacemos con los acordes) y sirve para medir el profesor.
- Opción de revisión de un músico real (tú o tu banda) de las 10 primeras fichas antes de abrirlo a todos.

---

## Decisiones que necesito de ti
1. **Colores:** ¿función por defecto con opción por grado (mi recomendación) o al revés?
2. **Notación romana:** estándar (`I, bVII, V7, ii°`) o más sencilla para empezar (`1, b7, 5`)?
3. **IA del profesor:** ¿Gemini (ya lo usas) o Claude? Recomiendo el que ya tenga clave en Railway para no abrir otro gasto.
4. **Nivel por defecto** del texto: ¿intermedio (asume que sabes qué es una tónica) o principiante?
5. **Alcance de la fase 4:** ¿mástil de guitarra primero, o teclado/bajo también?

## Riesgos y cómo se tratan
| Riesgo | Mitigación |
|---|---|
| Acordes mal detectados → teoría mal | Se usan los corregidos; confianza visible; «revisa» en tramos dudosos. |
| Modo ambiguo en rock/blues (3.ª mayor y menor a la vez) | Etiqueta «blues-rock» con ambas pentatónicas en vez de forzar un modo. |
| La IA suena segura aunque se equivoque | Solo redacta hechos calculados + validación + sugerencias etiquetadas. |
| Mucho color = ruido visual | 4-5 colores máximo, opción «nada», forma/letra además del color. |
| Coste de IA | Bajo demanda, caché por hash, modelo pequeño. |

## Orden recomendado
**Fase 1 → 2 → 3 → 4**, con la fase 5 creciendo en paralelo. Las fases 1 y 2 no cuestan nada, no necesitan SQL y ya aportan el 70 % del valor; la 3 es la que da la sensación de «profesor».

---

## Implementado (decisiones tomadas por defecto)
Decisiones que se tomaron con la recomendación de este plan: función por defecto con opción «sin color» (el color por *grado* con 7 tonos choca con el sistema de diseño —una sola paleta de tokens— y se resuelve mostrando el grado romano en vez de un color), romanos estándar relativos a la escala mayor (`I, bVII, V7, ii°`), el mismo modelo de IA que ya usa el servidor (Gemini), nivel intermedio por defecto, guitarra primero.

- `src/utils/teoriaArmonica.ts`: grado romano, función (T/S/D/M/X), dominantes secundarios, tonalidad estimada, modo (jónico/mixolidio/lidio/eólico/dórico/frigio), bucle y progresiones con nombre, escalas sugeridas (modo del acorde dentro de la tonalidad, pentatónica, blues), notas guía. 53 tests, incluidas las canciones de ejemplo.
- Colores y grados en el carril de acordes del audio y en el cifrado (`estiloArmonia.ts`, `armoniaVisor.ts`, `SelectorArmonia`): «Acorde / Grado / Ambos» y «Color por función / Sin color», con leyenda (la función lleva letra además de color). Preferencia en `localStorage`. El grado no cambia al transponer.
- Pestaña «Armonía» (`PanelArmonia`, `guiasArmonia.ts`): tonalidad y modo, reparto de funciones, bucle con su nombre, mapa de bloques A/B de la cuadrícula, cada acorde con notas, notas guía y escalas, y guías «Para improvisar y componer» con ideas de dinamismo etiquetadas «Idea». Todo sin IA.
- El profesor con IA (`ProfesorIA`, `services/profesorArmonia.ts`, `POST /api/songs/:id/profesor-armonia`): recibe solo hechos calculados con ids; valida la salida (frases que nombran acordes ajenos a la canción o citan hechos inexistentes se descartan); lo opinable va en secciones «Idea»; caché por huella (hechos + nivel + instrumento) dentro de `analisis_acordes.profesor` (sin SQL); bajo demanda. Requiere haber analizado los acordes del audio.
