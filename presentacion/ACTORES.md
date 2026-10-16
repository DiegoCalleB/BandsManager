# Actores en movimiento · prompts para Veo

Clips cortos de vídeo con los personajes moviéndose, estilo «influencer hecho con IA». No hablan a cámara: las voces siguen siendo las de ElevenLabs, y el clip va de fondo (con un velo oscuro) detrás de los diálogos.

**Cómo entran en la película:** deja cada clip en `presentacion/video/actores/<clave>.mp4` (opcional: `<clave>.jpg` como póster) y regenera con `python3 presentacion/tools/guion/generar.py`. Si un clip no existe, la escena se queda con su foto fija, así que puedes ir añadiéndolos de uno en uno. También me los puedes mandar por el chat y yo los coloco y los comprimo.

## Flujo (Gemini / AI Studio)

1. **Fotograma inicial con Gemini (imagen).** Adjunta las fotos de referencia del personaje (`presentacion/img/miembro-*.jpg`, `personaje-sello.jpg`) y pide la escena nueva con *la misma cara, el mismo pelo y la misma ropa*. Haz 3 o 4 versiones y quédate con la mejor.
2. **Anímalo con Veo (imagen a vídeo).** Sube ese fotograma y pega el prompt del plano. 16:9, 8 s, 1080p.
3. **Sin audio y sin texto.** Si Veo genera sonido o voces, da igual: el clip va silenciado. Que no salga texto en pantalla (la IA lo escribe mal).
4. **Exporta en MP4.** Yo lo comprimo a menos de 3 MB.

**Trucos para que no se note la IA:** planos medios (las manos de cerca fallan), cámara lenta o casi fija, poca acción por plano y luz de noche o de escenario (esconde los defectos). Las niñas nunca de cara: de espaldas o en silueta, por privacidad.

## El reparto (para pegar delante de cada prompt)

- **Iago:** hombre español de unos 35, pelo corto oscuro, afeitado, delgado, camiseta gris. Referencia: `miembro-iago.jpg`.
- **Brais:** cabeza rapada con gorra negra, barba poblada, brazos tatuados, camiseta negra sin mangas. Referencia: `miembro-brais.jpg`.
- **Alan:** pelo rizado oscuro, bigote, camisa de flores. Referencia: `miembro-xandre.jpg`.
- **Álvaro:** pelo corto oscuro, barba corta, chaleco vaquero con parches sobre camiseta negra. Referencia: `miembro-alvaro.jpg`.
- **Peláez:** ejecutivo de discográfica. Referencia: `personaje-sello.jpg`.

## Los planos (por orden de prioridad)

| # | Clave | Escena | Qué se ve |
|---|---|---|---|
| 1 | `festival` | El festival, 02:14 | Los cuatro van hacia el escenario por el pasillo del backstage, a cámara lenta ⭐ |
| 2 | `noches` | Las noches | Iago cierra el portátil a las 3 y se asoma al cuarto de sus hijas ⭐ |
| 3 | `jueves` | Prólogo · Jueves, 23:47 | Iago en el sofá, iluminado por el móvil, el chat que no para |
| 4 | `local` | Prólogo · Sábado, 11:00 | Los cuatro alrededor del portátil, alucinando |
| 5 | `decision` | Prólogo · La decisión | Iago abre el portátil en la cocina, de madrugada |
| 6 | `pelaez` | Prólogo · La llamada | Peláez en su despacho, sonrisa de tiburón |
| 7 | `otro-jueves` | Otro jueves, 23:47 | La banda riéndose en el local, relajada |
| 8–11 | `miembro-brais`, `miembro-xandre`, `miembro-alvaro`, `miembro-iago` | Prólogo · La banda | Bucle de 5 s de cada uno tocando, cámara fija (sale de su foto, sin paso 1) |

Con el 1 y el 2 ya se nota muchísimo. El resto, si te sobra tiempo.

### 1 · `festival`
> Cinematic slow-motion tracking shot from behind, then they turn slightly: four musicians of a rock band walk down a dark backstage corridor toward a huge festival stage. Bright stage lights flare through the end of the corridor, haze, silhouettes of crew. They look nervous and excited, one taps another on the shoulder. Handheld camera, anamorphic lens flare, shallow depth of field, night, 24fps film look. No text, no logos.

### 2 · `noches`
> 3 a.m. in a small, dark Madrid apartment. A man in his thirties gently closes a laptop on the kitchen table, rubs his eyes, then walks down a dim corridor and quietly opens a bedroom door a few centimetres; a soft nightlight glows inside, two small children asleep seen only as silhouettes under blankets, faces not visible. He smiles tenderly. Slow push-in, warm and blue mixed light, quiet, emotional, film grain. No text.

### 3 · `jueves`
> Late night, 23:47, a man in his thirties sits on a sofa in a modest Madrid flat. His phone lights his face in blue; notifications keep arriving and he scrolls, frustrated, then exhales and stares at the ceiling. Warm table lamp in the background, cluttered with a bass guitar case. Slight handheld movement, shallow depth of field, cinematic. No readable text on the phone screen.

### 4 · `local`
> Saturday morning in a cramped rehearsal room with egg-box acoustic foam, amplifiers and a drum kit. Four band members crowd around a laptop placed on top of an amplifier; one points at the screen, the others react with surprise, laughter and disbelief, the drummer leans in with his arms crossed then grins. Natural daylight from a small window, handheld documentary style. The laptop screen is not readable.

### 5 · `decision`
> 00:20, a dark kitchen. A man in his thirties sits down at the table, opens a laptop; its light illuminates his determined face. A mug of coffee steams next to him, children's drawings on the fridge in the background, out of focus. He cracks his knuckles and starts typing. Slow dolly-in, moody low light, cinematic. No readable screen.

### 6 · `pelaez`
> Night, a record label executive in an expensive office with city lights behind him. He leans back in a leather chair holding a phone to his ear, a slow, confident shark-like smile. Glass desk, gold records on the wall slightly out of focus. Slow camera orbit, cool tones, cinematic. No text, no logos.

### 7 · `otro-jueves`
> Night in a rehearsal room, four band members relaxed and laughing, one sits on the drum stool spinning a drumstick, another high-fives the bass player, a guitarist tunes and smiles. Warm practical lights, beers on an amplifier, friendly atmosphere. Handheld, shallow depth of field. No text.

### 8–11 · `miembro-*` (sale de su foto de `img/`)
> Subtle cinemagraph-style motion from this exact photo: the musician keeps performing on stage, slight head movement, stage lights flicker and haze drifts, the camera stays almost still. 5 seconds, seamless loop feel, same face and clothes as the photo.
