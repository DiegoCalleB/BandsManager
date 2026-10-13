# Sincronía de labios · cómo está preparado

Objetivo: que en unos pocos planos clave el personaje mueva los labios con su voz, para que se parezca a una película de verdad.
El resto de la película sigue con voz en off, clips en movimiento y avatares que laten con el volumen.

## Flujo

1. Cerrar el guion (`GUION_REVISION.md`; se regenera con `python3 presentacion/tools/guion/revision.py`).
2. Generar las voces buenas, una sola vez: `python3 presentacion/tools/voces.py` (necesita `ELEVENLABS_API_KEY`).
3. Preparar los planos: `python3 presentacion/tools/lipsync_preparar.py`.
   Deja en `presentacion/lipsync/<id>/` el audio (`audio.mp3`), la imagen de referencia, un `prompt.txt` y una `ficha.json`,
   y un `lipsync/INDICE.md` con el estado de cada plano (lista, pendiente de voz, bloqueada).
4. Subir cada carpeta a la herramienta elegida (Hedra, HeyGen, Sync Labs, o LatentSync/Wav2Lip en local con GPU) y guardar el
   resultado como `lipsync/<id>/plano.mp4`.
5. Colocar el plano en la escena (se hace en `generar.py`, igual que los clips de `video/actores/`).

## Qué planos
Están en `tools/lipsync/planos.json` (id = escena.frase). Si el guion cambia y los números se mueven, el script avisa de «NO EXISTE».
Para añadir o quitar un plano, se edita ese fichero.

## Consentimiento (importante)
- `real: true`: el personaje lleva la cara de una **persona real**. El script **no prepara** ese plano sin `--con-permiso <id,id>`,
  y solo debe usarse con su permiso por escrito (también para Diego con su propia cara, si lo decide él).
- `real: "confirmar"`: se prepara, pero hay que confirmar de quién es la foto antes de generar nada.
- `real: false`: personaje de ficción.
- La presentación se ve fuera del círculo de la escuela en una URL pública: con caras reales y frases inventadas hace falta cuidado.

## Límites
- Hace falta GPU o una cuenta de pago en alguna de las herramientas anteriores: desde el entorno de Claude no se generan los planos.
- Veo 3 puede generar vídeo con diálogo, pero con su propia voz, no con la de ElevenLabs.
