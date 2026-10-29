# Benchmark de acordes

Mide el detector propio contra **verdad escrita a mano**, de forma repetible. Es la base de la
sección de evaluación del TFM: sin esto, cada mejora del detector es una opinión.

## Estructura

- `referencias/<cancion>.lab`: verdad anotada a mano, una línea por tramo: `inicio fin acorde` (segundos; formato MIREX, p. ej. `12.4 16.0 A:min`). Admite también `.json` de tramos.
- `predicciones/<cancion>.lab`: lo que dice BandManager para esa canción (mismo nombre de fichero). Exportado de la app o con `scripts/detectar-acordes.ts`; **se versiona la salida, no el audio** (derechos de autor).
- `baseline.json`: métricas congeladas. `--comprobar` falla si el detector empeora.

> `ejemplo-sintetico` es un fixture inventado para probar la herramienta. **No cuenta como resultado**: bórralo cuando haya 10–15 canciones reales.

## Cómo anotar una canción (≈10 min)

1. Abre la canción en el visor, escucha y apunta el segundo de cada cambio de acorde (o usa «Corregir» y exporta `referenciaManual`).
2. Guarda `referencias/<cancion>.lab`. Anota solo lo que oyes; «N» para silencios.
3. Exporta la detección actual a `predicciones/<cancion>.lab`.
4. Elige canciones variadas: rock con distorsión, balada, funk, algo con cejilla/capo, algo con voz sola.

## Uso

```bash
npm run benchmark:acordes                     # tabla por canción + total
npm run benchmark:acordes -- --guardar        # congela la línea base
npm run benchmark:acordes -- --comprobar      # para CI: error si empeora
npm run benchmark:acordes -- --prediccion x/  # compara otro detector (BTC, Chordify exportado a mano…)
```

## Métricas

`may/men` (raíz + mayor/menor, la habitual de MIREX), `raíz`, `cambios≤0,3s` (cambios de la referencia con uno detectado a ≤0,3 s), `error` medio en segundos y `sesgo` (mediana con signo: + = tarde, − = pronto). Ponderadas por segundos en el total.
