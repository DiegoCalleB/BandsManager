# Voces de la presentación

Cada mensaje del chat tiene una versión hablada (`data-say` en `index.html`) y cada personaje una voz (`tts` en `reparto.js`). Hay dos familias de motores:

- **ElevenLabs** (`motor: 'elevenlabs'`, de pago): voces castellanas naturales que actúan. Campos: `voz` (voice_id), `modelo` (por defecto `eleven_v3`), `estabilidad` (0 creativa · 0.5 natural · 1 estable) y `etiqueta` (indicación de actuación de v3, p. ej. `[excited]`, que no se escribe en la frase). Lee la clave de `$ELEVENLABS_API_KEY` y necesita red hacia `api.elevenlabs.io`; `--voces` lista las voces en español con su acento. Solo se pagan las frases nuevas o cambiadas (el guion entero son unos 14.000 caracteres).

Y los locales, libres y sin claves de API:

- **Kokoro** (multilingüe, castellano): `sid` 29 = em_alex, 53 = em_santa, 28 = ef_dora.
- **Piper** (castellano de España): `es_ES-davefx-medium` y `es_ES-sharvard-medium` (sid 0 hombre, 1 mujer).

Los modelos se descargan solos la primera vez (unos 600 MB) desde las releases de sherpa-onnx en GitHub.

```bash
pip install sherpa-onnx soundfile numpy     # además: ffmpeg (con rubberband) y Node
python3 presentacion/tools/voces.py          # genera solo lo que ha cambiado
python3 presentacion/tools/voces.py --qa     # y comprueba con Whisper que cada frase se entiende
python3 presentacion/tools/voces.py --todo   # lo rehace todo
```

Salida: `presentacion/audio/voces/<hash>.mp3` y `manifest.json`. El hash es de «personaje|frase» (el mismo que calcula `voces.js`), así que al cambiar una frase o un músico solo se regenera lo que ha cambiado y los audios huérfanos se borran.

**Cambiar a un músico:** edita su ficha en `reparto.js` (nombre, foto y `tts`) y vuelve a ejecutar el generador. Revisa con `--qa` las frases que salgan con nota baja.

**Escribir para el oído:** en `data-say` los números van en letra y los nombres extranjeros como suenan («Spótifai», «Yutub», «be pe eme»). `[pi]` mete un pitido de censura.

**Boca:** el manifiesto guarda también la envolvente de volumen de cada frase (`e`, un dígito 0-9 cada 40 ms). `voces.js` la usa para que el avatar se mueva al ritmo de la voz, sin pasar el audio por Web Audio (así funciona también abriendo el HTML desde disco).

**Si falta un audio:** `voces.js` usa la voz española del navegador o, si no hay, deja el tiempo de leer la frase.
