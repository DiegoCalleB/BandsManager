# Planos que faltan

Solo lo que **todavía no existe** como clip. Todo lo demás de la película ya está montado. Mientras un plano no exista, la película usa el de la columna «Ahora usa» (un primer plano de la persona que no habla), así que se puede ir subiendo de uno en uno.

**Cómo se sube cada uno:** guarda el vídeo como `presentacion/video/actores/<archivo>.mp4` (horizontal, 1080p) y un `<archivo>.jpg` con su primer fotograma. Después `python3 presentacion/tools/guion/generar.py`: entra solo, sin tocar nada más. El audio del clip se descarta y se pone la voz de ElevenLabs; el lip-sync (después) hace que los labios la sigan.

**Reglas de rodaje** (las mismas para todos, para que parezcan de la misma película): 8 s por clip como máximo, 24 fps, cámara fija en trípode, plano medio corto, mirada justo al lado del objetivo, boca despejada (sin manos delante), luz suave de 45° con contraluz y fondo oscuro con luces cálidas desenfocadas. Vestuario y rostro fijados en `VEO3_PLANOS.md` («Continuidad de personajes»).

## Resumen

| # | Archivo | Quién | Escena | ~Duración | Prioridad | Ahora usa |
|---|---|---|---|---|---|---|
| 1–4 | `ent-diego-giro`, `ent-diego-giro-b`, `ent-diego-sueno`, `ent-diego-sueno-b` | **Diego (lo grabas tú)** | 53 y 55 | 3 + 17 + 10 + 12 s | **1** | Tu foto real (blanco y negro) |
| 5 | `ent-brais-correo` | Brais | 1 · Un correo | 7 s | 1 | `brais-cu.mp4` |
| 6 | `ent-alan-correo` | Alan | 1 · Un correo | 4 s | 1 | `alan-cu.mp4` |
| 7 | `ent-iago-nadie` | Iago | 9 · Nadie lo sabía | 7 s | 1 | `iago-cu.mp4` |
| 8 | `ent-brais-commits` | Brais | 40 · Los commits | 13 s (2 clips) | 1 | `brais-cu.mp4` |
| 9 | `ent-alvaro-okupa` | Álvaro | 7 · El treinta por ciento | 7 s | 2 | `alvaro-cu.mp4` |
| 10 | `ent-programador-cafe` | Programador de El Faro | 20 · Treinta y cinco minutos | 9 s | 2 | `programador-sonrie.mp4` |
| 11 | `ent-brais-madre` | Brais | 20 · Treinta y cinco minutos | 6 s | 2 | `brais-cu.mp4` |
| 12 | `ent-alan-tono` | Alan | 27 · El tono | 7 s | 2 | `alan-cu.mp4` |
| 13 | `ent-alvaro-hoja` | Álvaro | 27 · El tono | 7 s | 2 | `alvaro-cu.mp4` |
| 14 | `ent-pelaez` | Peláez | 51 · Peláez | 7 s | 2 | `pelaez.mp4` |
| 15 | `ent-alan-aviso` | Alan | 20 · Treinta y cinco minutos | 8 s | 3 | `alan-cu.mp4` |
| 16 | `ent-brais-calendario` | Brais | 27 · El tono | 7 s | 3 | `brais-cu.mp4` |
| 17 | `ent-alvaro-fans` | Álvaro | 34 · Los fans | 7 s | 3 | `alvaro-cu.mp4` |
| 18 | `ent-alan-reels` | Alan | 34 · Los fans | 8 s | 3 | `alan-cu.mp4` |

| 20 | `pelaez.mp4` (La llamada) + retrato nuevo | Peláez | 4 · La llamada | 8 s | 1 | El clip con la cara negra |
| 19 | `gracias-mop.jpg` (imagen) + `gracias.mp4` (vídeo) | Diego + Brais | 59 · Gracias | 6–8 s | 1 | Imagen de IA con un Diego que no eres tú |

**Prioridad 1** = lo que más pesa en el efecto documental y en la emoción (la apertura, las noches y Diego). **2** = el cuerpo de la película. **3** = las frases que venden funciones concretas.

---

## 1. Diego a cámara (lo grabas tú) · prioridad 1

Cuatro clips con el mismo encuadre y luz que las demás entrevistas, para que al cortar sean «una más»: la diferencia la marca el rótulo **DIEGO DE LA CALLE · El bajista**.

- **Cómo grabar:** móvil en horizontal sobre trípode, a la altura de los ojos, plano de pecho para arriba. Mira justo al lado de la lente, ligeramente a la izquierda del encuadre. Luz suave de ventana de lado, fondo oscuro y ordenado con luces cálidas. Tono sereno y bajito, como un testimonio. Graba cada frase dos o tres veces y deja un segundo de silencio al principio y al final.
- **Vestuario (importante):** **camiseta negra, chaleco vaquero negro con parches de metal y muñequera**, con tu pelo corto y tu perilla de siempre. El aire metalero lo da el chaleco, no el pelo: así eres tú, y es el mismo vestuario que llevará tu cara en la foto de «Gracias» (más abajo). Si tienes el bajo a mano, déjalo apoyado detrás, desenfocado.
- Puedes grabar cada pareja de seguido como un solo clip; dime y los parto.

| Archivo | Frase | Va |
|---|---|---|
| `ent-diego-giro.mp4` | «El bajista soy yo. Necesito volver a tocar.» | escena 53 · El giro: el bajista soy yo |
| `ent-diego-giro-b.mp4` | «Toqué en varios grupos y los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado. Hice BandManager para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.» | escena 53 · El giro: el bajista soy yo |
| `ent-diego-sueno.mp4` | «Y ya estamos montando un grupo de metal. Nos falta batería… Con muchísima ilusión, y sabiendo que con BandManager toda la gestión va a ir rodada.» | escena 55 · Un sueño hecho realidad |
| `ent-diego-sueno-b.mp4` | «Y quién sabe si el día de mañana a mis hijas les da por formar sus grupos, y les ayuda a que los comienzos sean mucho más fáciles. Un sueño hecho realidad.» | escena 55 · Un sueño hecho realidad |

---

## 1b. Rehacer «Gracias» con tu cara de verdad · prioridad 1

El Diego de la foto actual (pelo largo y suelto) no eres tú. Esta escena es la última imagen de la historia, con Brais, así que tiene que ser tu cara. Se hace en dos pasos, en Omni:

**Paso 1: la imagen.** Sube dos imágenes: la 1 es `presentacion/img/gracias-mop.jpg` (la escena) y la 2 es **una foto tuya de frente, bien iluminada, con el pelo corto y la perilla** (puede ser un fotograma de tu grabación). Prompt (Omni, edición de imagen):

```
Edit image 1. Keep absolutely everything the same: the Resurrection Fest 2027 stage at night with red flare smoke, the huge crowd, the black GitHub flag, the penguin flag and the orange flag, the two cardboard signs "TE QUIERO BRAIS" and "¡MENOS PROMPTS Y MÁS RITMO!", the bearded drummer on the right in a backwards black cap holding two drumsticks and making the horns sign with an Estrella Galicia bottle, the framing, the lens and the lighting. Replace ONLY the long-haired man on the left with the man from image 2: his face, his SHORT dark hair and his small goatee must match image 2 exactly, aged about 40. He keeps the same pose and wardrobe: a black t-shirt, a black denim battle vest covered in metal patches and pins, studded leather wristbands, a bass guitar slung over his shoulder, an Estrella Galicia bottle raised in one hand and a big natural smile. Photorealistic, same colour grade, same crowd. Do not change any text on the signs or the stage banner.
```

**Paso 2: el vídeo** (`gracias.mp4`, vertical 9:16, 6–8 s). Con la imagen nueva como primer fotograma (image-to-video):

```
Vertical 9:16, cinematic handheld selfie-style shot from the edge of the barrier in front of the Resurrection Fest 2027 main stage at night. Two men in the foreground: on the left, a man of about 40 with short dark hair and a small goatee, a black denim battle vest covered in metal patches, a bass guitar on his shoulder, raising an Estrella Galicia bottle with a big smile; on the right, a bearded drummer in a backwards black cap holding two drumsticks, making the horns sign and laughing. 0.0-2.0 s: they look at the lens and cheer. 2.0-5.0 s: the huge crowd behind them waves hands and flags, red flare smoke drifts across the stage lights, the signs "TE QUIERO BRAIS" and "¡MENOS PROMPTS Y MÁS RITMO!" sway slightly. 5.0-8.0 s: they clink bottles, laugh and shout toward the crowd. Slight natural camera sway, shallow depth of field, warm stage lights against the cool night, fine film grain. Keep the faces identical to the reference image for the whole clip. Audio: crowd roar and distant music, no speech. Do not change any text.
```

Cuando los tengas, súbelos y los monto. Hasta entonces la película usa los actuales.

---

## 1c. Peláez nuevo, con la cara visible · prioridad 1

El clip actual (`pelaez.mp4`) tiene la cara completamente negra: no parece contraluz, parece pintada. Probé a levantarle la luz y queda peor (una máscara gris), así que se rehace. Son tres pasos, en Omni, y el orden importa: **primero la cara, después todo lo demás con esa misma cara.**

**Paso 1: el retrato de referencia (imagen).** Genera 3 o 4 y elige el Peláez que más te guste: es el que se usará siempre.

```
Photorealistic cinematic portrait of Mr. Peláez, a 55-year-old Spanish record-label executive. Clean-shaven, a strong jaw, sharp cheekbones, dark slicked-back hair with silver at the temples, calm hooded eyes, a faint knowing half-smile. A tailored dark charcoal suit, a white open-collar shirt without a tie, an expensive watch. He sits in a black leather chair, shoulders slightly angled, face in three-quarter view, looking just off-lens. A glass-walled corner office at night behind him: the city skyline as soft out-of-focus bokeh, framed gold records on the wall. Lighting: soft warm key light on his face from the front-left so his whole face is clearly visible and well exposed, cool blue rim light from the window on the back of his head and shoulders. NOT a silhouette: every feature of his face is readable, natural skin with pores and fine lines. 50mm lens at T2, shallow depth of field, teal-and-amber grade, fine 35mm film grain, 16:9.
```

**Paso 2: el plano de «La llamada» (imagen, con la misma cara).** Sube el retrato elegido como imagen 1 y pide:

```
Same man as in image 1, same suit, same office. He is sitting in the black leather chair in profile to the window, holding a smartphone to his ear, the city skyline glowing behind him and the gold records on the wall. It is a backlit night shot, but his face is NOT black: the cool glow of the phone screen lights his cheek, jaw and nose, and a thin warm edge light catches the line of his face and his slicked-back hair, so his profile is clearly readable in soft shadow. Cinematic, same grade and film grain as image 1, 16:9.
```

**Paso 3: los vídeos** (con esas imágenes como primer fotograma):
- **La llamada** (`pelaez.mp4`, 8 s): con la imagen del paso 2.

```
Static cinematic shot, locked-off tripod, 50mm lens, shallow depth of field. The man from the reference image sits in his black leather chair in profile to the window, a smartphone at his ear. The city lights twinkle softly behind him. 0.0-2.0 s: he listens, perfectly still, only a slow blink. 2.0-5.0 s: a tiny confident smile appears, he shifts his weight slightly and leans back. 5.0-8.0 s: he speaks calmly into the phone, lips moving naturally, then stops with a satisfied half-smile. The glow of the phone keeps lighting his cheek, his face stays readable in soft shadow, never black. Fine 35mm film grain, no on-screen text, no logos. Audio: faint room tone only.
```

- **La entrevista** (`ent-pelaez.mp4`): usa el prompt que ya está más abajo, pero con el **retrato del paso 1** como imagen de referencia, no `pelaez.jpg`.

Cuando los tengas, súbelos (la imagen elegida, `pelaez.mp4` y `ent-pelaez.mp4`) y los monto. Si Omni te saca la cara muy oscura de nuevo, añade al prompt «face lit by a soft key light, exposure on the face at least middle grey».

---

## 2. Entrevistas de los músicos (Veo 3, imagen a vídeo)

**Hecho para Omni 1.1 Flash**, que es con lo que están hechos los clips que ya tenemos: así toda la película comparte el mismo aspecto (grano, color, piel). También valen en Veo 3.1 tal cual; la única diferencia es la duración (Omni, 10 s; Veo, 8 s).

**Antes de empezar**, cuatro cosas que mejoran el resultado:

- **Los prompts van en inglés** (se entienden mejor), **pero la frase que dice cada persona va en español entre comillas**.
- **Cada prompt es autónomo** (describe al personaje entero y la cámara): copia y pega uno entero y sube además la imagen de referencia indicada, para que la cara sea la misma.
- **Omni no genera voz** (según lo que he podido comprobar). Si la boca no se mueve con las palabras, no pasa nada: el lip-sync de después se encarga. Si sale hablando raro o con la boca muy abierta, usa la versión tranquila: cambia la frase «He says in Spanish…» por «He does not speak aloud: subtle breathing, tiny jaw movements, lips mostly closed.» y deja el resto igual.
- **Pega siempre el «Negative prompt»** de más abajo, o añádelo al final como «Avoid: …» si no hay campo para negativos.

**Ajustes:** 16:9, 10 s (la frase más larga es de ~9 s), 1080p. Genera **3 o 4 variantes** de cada plano y quédate con la que tenga mejor cara y mejor boca. Revísalas a 1× y a 0,5×: la boca debe cerrarse en M, B y P y quedarse quieta al final, la cabeza no debe girar y ninguna mano puede tapar los labios.

**Lo bueno de Omni es que se edita conversando.** En vez de regenerar desde cero, escribe en el mismo chat, por ejemplo:
- `Same shot, but keep his hands out of frame and away from his mouth.`
- `Same shot, but he never looks into the camera: eyeline stays just off-lens.`
- `Same shot, but remove all camera movement: locked-off tripod.`
- `Same shot, but make the light softer and warmer on the face, keep the dark background.`
- `Same shot, but start with his mouth closed and end with his mouth closed.`
- `Continue the same shot for 4 more seconds, same framing, light and wardrobe.` (para los planos de más de 10 s)

**Negative prompt (común a todos):**

```
subtitles, captions, any on-screen text, watermark, logo, extra people, extra fingers, hands or objects covering the mouth, microphone in front of the mouth, camera shake, zoom, whip pan, morphing or melting face, plastic over-smoothed skin, cartoon, anime, CGI look, distorted teeth, flicker, changing clothes, changing hair, jump cuts
```

**Si algo sale mal:** *mano en la boca* → añade «his hands rest out of frame below the chest»; *la cara cambia a mitad de clip* → baja la intensidad de la actuación (quita un gesto de la lista) o usa el último fotograma bueno como nueva referencia; *mira a cámara* → repite «eyeline just off-lens, never looking into the camera»; *movimiento de cámara* → repite «locked-off tripod, no movement».

### ent-brais-correo
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase:** «Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Brais, 42: a bald man in a black baseball cap worn backwards, a full thick dark beard with a few grey hairs, a heavy brow and expressive hazel eyes, a black sleeveless t-shirt, a large detailed black-ink tattoo sleeve of tentacles on his upper arm and more tattoos on his forearms, a black fabric wristband on his wrist. Gruff, warm and deadpan, with a drummer's loose, relaxed shoulders. Behind him, out of focus: a distressed dark stage banner and the edge of a cymbal, with a warm magenta-amber stage glow; the corner of a silver laptop is just visible at the lower left. Performance, timed over the clip: 0.0-0.8 s: he settles, a small exhale, eyes drift off-lens. On «Casi nos separamos.» slow, serious, one small nod. On «Y no fue por la música.» a slight shake of the head. On «Ni por las birras…» he pauses and his eyebrows lift. On «Bueno, un poco por las birras.» a sheepish half-smile, his eyes dip down and come back up, a short chuckle through the nose. Last 0.5 s: he holds the smile, mouth closed. He says in Spanish, in a sighing, then amused tone, with a deep, slightly raspy, relaxed voice with a light Galician accent: "Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alan-correo
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase:** «Fue por un correo, che. Un correo que no contestó nadie.»
- **Duración:** ~4 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Alan, 38: voluminous dark-brown curly shoulder-length hair, a big thick moustache, a few days of stubble, tired, half-lidded, very expressive eyes, an open short-sleeved floral shirt (orange and teal flowers on navy) with a little chest hair showing. Charismatic, theatrical and a bit vain. Behind him, out of focus: a wall of grey acoustic foam wedges and strings of warm fairy lights glowing as soft bokeh circles. Performance, timed over the clip: 0.0-0.8 s: he leans back a little, tired eyes. On «Fue por un correo, che.» his eyebrows arch, resigned. On «Un correo que no contestó nadie.» a slow, dramatic shake of the head and a deadpan stare off-lens. Last second: one eyebrow rises and he holds the look, mouth closed. He says in Spanish, in a resigned and theatrical tone, with a warm, melodic Argentine Rioplatense accent (he says «che» and «vos»): "Fue por un correo, che. Un correo que no contestó nadie." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-iago-nadie
- **Referencia:** `video/actores/iago-cu.jpg`
- **Frase:** «No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Iago, 38: short dark textured hair with tapered sides, a short neatly trimmed beard, a plain charcoal-grey crew-neck t-shirt. Quiet, thoughtful, with tired but kind eyes. Behind him, out of focus: a grey rehearsal room with Marshall amplifier stacks, a black flight case and a laptop with its screen glowing faintly. Performance, timed over the clip: 0.0-0.8 s: he looks down, then up toward the interviewer. On «No se lo conté a nadie.» quiet, almost a confession. On «Si salía mal,» a slight shrug of the shoulders. On «mejor que siguieran pensando que el bajo no se oye.» a small self-deprecating smile, he glances away and back. Last second: a soft exhale through the nose, mouth closing. He says in Spanish, in a soft, humble and self-mocking tone, with a soft, calm, low voice with a light Galician accent: "No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-brais-commits-A (parte 1 de 2: esta + la B se unen en `ent-brais-commits.mp4`; o genera la A y pídele «Continue the same shot for 4 more seconds» con la frase B)
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase:** «Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Brais, 42: a bald man in a black baseball cap worn backwards, a full thick dark beard with a few grey hairs, a heavy brow and expressive hazel eyes, a black sleeveless t-shirt, a large detailed black-ink tattoo sleeve of tentacles on his upper arm and more tattoos on his forearms, a black fabric wristband on his wrist. Gruff, warm and deadpan, with a drummer's loose, relaxed shoulders. Behind him, out of focus: a distressed dark stage banner and the edge of a cymbal, with a warm magenta-amber stage glow; the corner of a silver laptop is just visible at the lower left. Performance, timed over the clip: 0.0-0.8 s: he looks down at his own lap as if reading a screen. On «Luego miré el historial del código.» steady, quiet. On «La hora de cada cambio.» small slow nods. On «Las dos… Las tres… Las cinco menos diez.» he counts slowly with pauses between each hour, his voice getting softer and lower, his eyes starting to glisten. Last 0.7 s: he stops, jaw tight, mouth closed, looking at nothing. He says in Spanish, in a soft and moved tone, with a deep, slightly raspy, relaxed voice with a light Galician accent: "Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-brais-commits-B
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase:** «Y el sábado a las once estaba en el local. El primero. Con los cafés.»
- **Duración:** ~6 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Brais, 42: a bald man in a black baseball cap worn backwards, a full thick dark beard with a few grey hairs, a heavy brow and expressive hazel eyes, a black sleeveless t-shirt, a large detailed black-ink tattoo sleeve of tentacles on his upper arm and more tattoos on his forearms, a black fabric wristband on his wrist. Gruff, warm and deadpan, with a drummer's loose, relaxed shoulders. Behind him, out of focus: a distressed dark stage banner and the edge of a cymbal, with a warm magenta-amber stage glow; the corner of a silver laptop is just visible at the lower left. Performance, timed over the clip: CONTINUATION of the previous clip: identical framing, lighting, wardrobe and position; he starts with his mouth closed, eyes glistening. 0.0-0.8 s: he lifts his eyes off-lens and swallows. On «Y el sábado a las once estaba en el local.» a faint, proud half-smile. On «El primero.» one small nod. On «Con los cafés.» his eyes shine, a quick breath and a tiny half-laugh. Last second: he holds a soft smile, mouth closed. He says in Spanish, in a warm, proud, almost breaking tone, with a deep, slightly raspy, relaxed voice with a light Galician accent: "Y el sábado a las once estaba en el local. El primero. Con los cafés." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alvaro-okupa
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase:** «Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánager: es un okupa.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Álvaro, 40: short dark textured hair, thick expressive eyebrows, a neatly trimmed dark beard, a worn black denim vest covered in heavy-metal patches and pins (red embroidered patches, a skull patch) over a black t-shirt. Dry, sarcastic, quick to smirk. Behind him, out of focus: a dim rehearsal room, a window with soft cool light, and warm fairy lights as bokeh. Performance, timed over the clip: 0.0-0.8 s: a slow breath, one eyebrow already raised. On «Treinta por ciento, tío.» a slight incredulous tilt of the head. On «Y elegir lo que tocamos.» both eyebrows rise. On «Eso no es un mánager:» a beat of silence. On «es un okupa.» delivered completely flat, then a one-sided smirk. Last 0.5 s: he holds the smirk, mouth closed. He says in Spanish, in a deadpan tone, with a dry, deadpan Spanish with a light Galician lilt: "Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánager: es un okupa." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-programador-cafe
- **Referencia:** `video/actores/programador-sonrie.jpg`
- **Frase:** «Me llegan cien correos a la semana. Ese era el único con fecha, dossier y rider. Contesté antes de acabarme el café.»
- **Duración:** ~9 s (cabe en un clip de 10 s)

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. The venue programmer, 47: short greying hair, salt-and-pepper stubble, fine lines around pale blue-grey eyes, a black jacket over a black t-shirt. Dry, busy, quietly amused. Behind him, out of focus: a small cluttered venue office, gig posters on the wall, a warm desk lamp, a desktop monitor, a landline phone and papers. Performance, timed over the clip: 0.0-0.8 s: he sits back in his chair and rubs one eye with the back of his wrist (hand away from the mouth). 0.8-3.0 s, on «Me llegan cien correos a la semana.» exasperated, eyebrows up. 3.0-6.0 s, on «Ese era el único con fecha, dossier y rider.» he nods slowly, appreciative, a spark in his eyes. 6.0-8.8 s, on «Contesté antes de acabarme el café.» a growing smile, his eyes flick to a mug just out of frame. Last 1.2 s: a small shrug, the smile held, mouth closed. He says in Spanish, in a tired, then amused tone, with a relaxed Castilian Spanish, friendly and a little sarcastic: "Me llegan cien correos a la semana. Ese era el único con fecha, dossier y rider. Contesté antes de acabarme el café." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-brais-madre
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase:** «Treinta y cinco minutos, neno. Yo tardo más en contestar al WhatsApp de mi madre.»
- **Duración:** ~6 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Brais, 42: a bald man in a black baseball cap worn backwards, a full thick dark beard with a few grey hairs, a heavy brow and expressive hazel eyes, a black sleeveless t-shirt, a large detailed black-ink tattoo sleeve of tentacles on his upper arm and more tattoos on his forearms, a black fabric wristband on his wrist. Gruff, warm and deadpan, with a drummer's loose, relaxed shoulders. Behind him, out of focus: a distressed dark stage banner and the edge of a cymbal, with a warm magenta-amber stage glow; the corner of a silver laptop is just visible at the lower left. Performance, timed over the clip: 0.0-0.7 s: eyebrows lifted, impressed. On «Treinta y cinco minutos, neno.» a fond smirk, he shakes his head in awe. On «Yo tardo más en contestar al WhatsApp de mi madre.» deadpan, a slightly guilty smile and a small shrug of the shoulders. Last 0.5 s: he holds the guilty smile, mouth closed. He says in Spanish, in a deadpan and fond tone, with a deep, slightly raspy, relaxed voice with a light Galician accent: "Treinta y cinco minutos, neno. Yo tardo más en contestar al WhatsApp de mi madre." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alan-tono
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase:** «Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Alan, 38: voluminous dark-brown curly shoulder-length hair, a big thick moustache, a few days of stubble, tired, half-lidded, very expressive eyes, an open short-sleeved floral shirt (orange and teal flowers on navy) with a little chest hair showing. Charismatic, theatrical and a bit vain. Behind him, out of focus: a wall of grey acoustic foam wedges and strings of warm fairy lights glowing as soft bokeh circles. Performance, timed over the clip: 0.0-0.8 s: he draws breath, eyes wide. On «Doce años cantando, che.» an incredulous half-laugh. On «Y me vengo a enterar en un local de ensayo» he leans very slightly toward the lens, outraged. On «de en qué tono canto.» a rueful shake of the head and a laugh. Last second: he exhales, shoulders dropping, mouth closed. He says in Spanish, in a theatrical, outraged and laughing tone, with a warm, melodic Argentine Rioplatense accent (he says «che» and «vos»): "Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alvaro-hoja
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase:** «Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Álvaro, 40: short dark textured hair, thick expressive eyebrows, a neatly trimmed dark beard, a worn black denim vest covered in heavy-metal patches and pins (red embroidered patches, a skull patch) over a black t-shirt. Dry, sarcastic, quick to smirk. Behind him, out of focus: a dim rehearsal room, a window with soft cool light, and warm fairy lights as bokeh. Performance, timed over the clip: 0.0-0.8 s: eyes slide off-lens, unimpressed. On «Sigue cantando en el que le da la gana.» flat, a tiny eye-roll. On «Pero ahora, por lo menos,» a beat of reluctant concession. On «sale en la hoja.» a small nod and a dry smirk. Last 0.5 s: smirk held, mouth closed. He says in Spanish, in a dry and grudgingly fond tone, with a dry, deadpan Spanish with a light Galician lilt: "Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-pelaez
- **Referencia:** el **retrato nuevo del paso 1 de la sección 1c** (el `pelaez.jpg` actual sale casi en silueta: conserva el traje, el sillón y la ciudad de fondo, pero la cara se genera nueva. Cuando una te guste, usa ese fotograma como referencia en sus siguientes planos para que sea siempre el mismo.)
- **Frase:** «Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, in a leather chair, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Mr. Peláez, 55, a record-label executive: clean-shaven, sharp cheekbones, dark slicked-back hair with silver at the temples, a tailored dark charcoal suit and a white open-collar shirt without a tie, an expensive watch. Calm, smooth and faintly smug. Behind him, out of focus: a glass-walled corner office at night, the city skyline as soft bokeh, framed gold records on the wall. Performance, timed over the clip: 0.0-0.8 s: he turns his face fully toward the lens side and settles in his chair, perfectly composed. On «Sigo pensando que el treinta por ciento era un precio justo.» calm, faintly smug, a slow blink. On «Por cierto…» he pauses and glances aside as if checking nobody is listening, then lowers his voice conspiratorially. On «¿esa app cómo se descarga?» one eyebrow rises. Last 0.5 s: a tight, knowing smile, mouth closed. He says in Spanish, in a calm, smug, then conspiratorial tone, with a smooth, measured Madrid Spanish: "Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?" Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alan-aviso
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase:** «Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Alan, 38: voluminous dark-brown curly shoulder-length hair, a big thick moustache, a few days of stubble, tired, half-lidded, very expressive eyes, an open short-sleeved floral shirt (orange and teal flowers on navy) with a little chest hair showing. Charismatic, theatrical and a bit vain. Behind him, out of focus: a wall of grey acoustic foam wedges and strings of warm fairy lights glowing as soft bokeh circles. Performance, timed over the clip: 0.0-0.8 s: he lights up, eyes wide. On «Y la app me avisó en el momento en que lo abrió.» excited, quick, both eyebrows up. On «Yo, mirando el móvil como un adolescente.» he raises an imaginary phone with both hands to chest level (hands well below the mouth) and stares at it, giggling. Last 0.5 s: he looks back at the interviewer, grinning, mouth closed. He says in Spanish, in a excited and giggly tone, with a warm, melodic Argentine Rioplatense accent (he says «che» and «vos»): "Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-brais-calendario
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase:** «El calendario me avisa si mis dos bandas se pisan. Es el mejor mánager que he tenido.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Brais, 42: a bald man in a black baseball cap worn backwards, a full thick dark beard with a few grey hairs, a heavy brow and expressive hazel eyes, a black sleeveless t-shirt, a large detailed black-ink tattoo sleeve of tentacles on his upper arm and more tattoos on his forearms, a black fabric wristband on his wrist. Gruff, warm and deadpan, with a drummer's loose, relaxed shoulders. Behind him, out of focus: a distressed dark stage banner and the edge of a cymbal, with a warm magenta-amber stage glow; the corner of a silver laptop is just visible at the lower left. Performance, timed over the clip: 0.0-0.7 s: a slight frown, as if remembering. On «El calendario me avisa si mis dos bandas se pisan.» gruff, he frowns on «se pisan». On «Es el mejor mánager que he tenido.» he nods slowly, an amused grin spreading under the beard. Last 0.5 s: he holds the grin, mouth closed. He says in Spanish, in a gruff and amused tone, with a deep, slightly raspy, relaxed voice with a light Galician accent: "El calendario me avisa si mis dos bandas se pisan. Es el mejor mánager que he tenido." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alvaro-fans
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase:** «Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada.»
- **Duración:** ~7 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Álvaro, 40: short dark textured hair, thick expressive eyebrows, a neatly trimmed dark beard, a worn black denim vest covered in heavy-metal patches and pins (red embroidered patches, a skull patch) over a black t-shirt. Dry, sarcastic, quick to smirk. Behind him, out of focus: a dim rehearsal room, a window with soft cool light, and warm fairy lights as bokeh. Performance, timed over the clip: 0.0-0.8 s: a dry breath, eyes off-lens. On «Antes, nuestra única fan era mi madre.» deadpan. On «Ahora tenemos una lista entera.» his expression warms, eyebrows rise. On «Ella sigue siendo la más pesada.» a mock-exasperated smile, a small head shake. Last 0.5 s: smile held, mouth closed. He says in Spanish, in a dry, then warm tone, with a dry, deadpan Spanish with a light Galician lilt: "Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-alan-reels
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase:** «Y los reels: subes el concierto entero y la IA te saca los mejores trozos. Yo solo tuve que salir guapo.»
- **Duración:** ~8 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits slightly left of centre, with his eyeline just off-lens toward an unseen interviewer on the right of the frame. Soft large key light from a window-sized softbox at 45 degrees on the right side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. Alan, 38: voluminous dark-brown curly shoulder-length hair, a big thick moustache, a few days of stubble, tired, half-lidded, very expressive eyes, an open short-sleeved floral shirt (orange and teal flowers on navy) with a little chest hair showing. Charismatic, theatrical and a bit vain. Behind him, out of focus: a wall of grey acoustic foam wedges and strings of warm fairy lights glowing as soft bokeh circles. Performance, timed over the clip: 0.0-0.8 s: he straightens, proud. On «Y los reels: subes el concierto entero y la IA te saca los mejores trozos.» brisk and enthusiastic, eyebrows dancing. On «Yo solo tuve que salir guapo.» he flicks his curls back with one hand (hand far from the mouth) and gives a cheeky grin. Last 0.5 s: grin held, mouth closed. He says in Spanish, in a proud, cheeky and vain tone, with a warm, melodic Argentine Rioplatense accent (he says «che» and «vos»): "Y los reels: subes el concierto entero y la IA te saca los mejores trozos. Yo solo tuve que salir guapo." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

---

## 3. Opcionales (mejoran, no bloquean)

### decision · el flashback de la decisión («Ocho meses antes»)
- **Va en:** escena 8 · Prólogo · La decisión. Hoy esa escena va sobre una foto fija.
- **Referencia:** `video/actores/viernes.jpg`

```
Cinematic medium shot, late at night, handheld-steady with a very slow push-in over 8 seconds on a 35mm prime lens at T2. A man in his late 30s with short dark textured hair, a short neatly trimmed beard and a plain grey t-shirt sits on a worn fabric sofa in a dim living room lit by a single warm tungsten table lamp on the left, a guitar leaning against the wall behind him, soft out-of-focus clutter. A closed laptop rests on his knees. 0.0-2.0 s: he stares at it, tired, a long thoughtful breath. 2.0-4.0 s: he lifts the lid; the screen floods his face with a cool blue-white glow against the warm lamp light. 4.0-6.0 s: his eyes scan the screen, then a very small determined nod. 6.0-8.0 s: he starts typing, mouth closed, calm resolve. Teal-and-amber grade, fine 35mm film grain, shallow depth of field, realistic skin with pores and stubble, natural blinking and breathing. Audio: quiet room tone, a faint keyboard click, no music. No on-screen text, no logos.
```

### noches · Iago en la cocina de noche (repetir)
- **Va en:** escena 39 · Las noches. El clip actual deforma la cara cuando mira a cámara. Mismo plano, pero **sin mirar al objetivo**.
- **Referencia:** `video/actores/noches.jpg`

```
Night, a dark home kitchen, medium shot from slightly in front and to the side, locked-off tripod, 35mm lens at T2, shallow depth of field. A man in his late 30s with short dark textured hair, a short neatly trimmed beard and a plain dark t-shirt sits at a small table typing on a laptop; his face is lit only by the cold blue screen glow, the rest of the kitchen in deep shadow with a faint window light and a tiny warm child's nightlight glowing in a hallway at the far left. 0.0-2.5 s: he types steadily, eyes on the screen, never looking into the camera. 2.5-4.5 s: he stops, rubs his eyes with his fingertips, exhales. 4.5-6.0 s: he glances toward the hallway nightlight, a soft look of tenderness. 6.0-8.0 s: he turns back to the screen and starts typing again. Realistic skin with pores and stubble, teal-and-amber grade, fine 35mm film grain, no flicker. Audio: soft keyboard clicks and a distant fridge hum, no music. No on-screen text, no logos.
```

### confirmados · la celebración
- **Va en:** escena 48 · Confirmados. Hoy usa `otro-jueves.mp4`.
- **Referencia:** `video/actores/otro-jueves.jpg`

```
Cinematic handheld medium shot in a dim rehearsal room with grey acoustic foam and warm fairy lights, 35mm lens at T2, a very slight natural camera sway. Four bandmates gather around a laptop on a black flight case: a bald drummer with a full dark beard, a backwards black cap and tattooed arms; a man with curly dark hair, a big moustache and an open floral shirt; a man in a denim vest covered in metal patches; and a short-haired bearded bassist in a grey t-shirt. The laptop screen lights their faces cool blue against the warm room. 0.0-2.5 s: they read the screen in silence, completely still. 2.5-3.5 s: a frozen beat. 3.5-5.5 s: they explode: the vest guy screams with joy and punches the air, the floral-shirt man grabs his head with both hands, the drummer laughs and hugs the bassist. 5.5-8.0 s: shared laughter, shoulder slaps, the bassist smiles quietly with wet eyes. Natural, unforced reactions. Teal-and-amber grade, fine 35mm film grain, realistic skin. Audio: muffled whoops and laughter, no music. No on-screen text, no logos.
```
