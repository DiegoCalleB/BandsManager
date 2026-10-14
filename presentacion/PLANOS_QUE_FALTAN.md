# Planos que faltan

Solo lo que **todavía no existe** como clip. Todo lo demás de la película ya está montado. Mientras un plano no exista, la película usa el de la columna «Ahora usa» (un primer plano de la persona que no habla), así que se puede ir subiendo de uno en uno.

**Cómo se sube cada uno:** guarda el vídeo como `presentacion/video/actores/<archivo>.mp4` (horizontal, 1080p) y un `<archivo>.jpg` con su primer fotograma. Después `python3 presentacion/tools/guion/generar.py`: entra solo, sin tocar nada más. El audio del clip se descarta y se pone la voz de ElevenLabs; el lip-sync (después) hace que los labios la sigan.

**Reglas de rodaje** (las mismas para todos, para que parezcan de la misma película): 8 s por clip como máximo, 24 fps, cámara fija en trípode, plano medio corto, mirada justo al lado del objetivo, boca despejada (sin manos delante), luz suave de 45° con contraluz y fondo oscuro con luces cálidas desenfocadas. Vestuario y rostro fijados en `VEO3_PLANOS.md` («Continuidad de personajes»).

## Resumen

| # | Archivo | Quién | Escena | ~Duración | Prioridad | Ahora usa |
|---|---|---|---|---|---|---|
| 1–4 | `ent-diego-giro`, `ent-diego-giro-b`, `ent-diego-sueno`, `ent-diego-sueno-b` | **Diego (lo grabas tú)** | 53 y 55 | 3 + 17 + 10 + 12 s | **1** | Tu foto en el escenario |
| 5 | `ent-brais-correo` | Brais | 1 · Un correo | 7 s | 1 | `brais-cu.mp4` |
| 6 | `ent-alan-correo` | Alan | 1 · Un correo | 4 s | 1 | `alan-cu.mp4` |
| 7 | `ent-iago-nadie` | Iago | 9 · Nadie lo sabía | 7 s | 1 | `iago-cu.mp4` |
| 8 | `ent-brais-commits` | Brais | 40 · Los commits | 13 s (2 clips) | 1 | `brais-cu.mp4` |
| 9 | `ent-alvaro-okupa` | Álvaro | 7 · El treinta por ciento | 7 s | 2 | `alvaro-cu.mp4` |
| 10 | `ent-programador-cafe` | Programador de El Faro | 20 · Treinta y cinco minutos | 8 s (2 clips) | 2 | `programador-sonrie.mp4` |
| 11 | `ent-brais-madre` | Brais | 20 · Treinta y cinco minutos | 6 s | 2 | `brais-cu.mp4` |
| 12 | `ent-alan-tono` | Alan | 27 · El tono | 7 s | 2 | `alan-cu.mp4` |
| 13 | `ent-alvaro-hoja` | Álvaro | 27 · El tono | 7 s | 2 | `alvaro-cu.mp4` |
| 14 | `ent-pelaez` | Peláez | 51 · Peláez | 7 s | 2 | `pelaez.mp4` |
| 15 | `ent-alan-aviso` | Alan | 20 · Treinta y cinco minutos | 8 s (2 clips) | 3 | `alan-cu.mp4` |
| 16 | `ent-brais-calendario` | Brais | 27 · El tono | 7 s | 3 | `brais-cu.mp4` |
| 17 | `ent-alvaro-fans` | Álvaro | 34 · Los fans | 7 s | 3 | `alvaro-cu.mp4` |
| 18 | `ent-alan-reels` | Alan | 34 · Los fans | 8 s (2 clips) | 3 | `alan-cu.mp4` |

**Prioridad 1** = lo que más pesa en el efecto documental y en la emoción (la apertura, las noches y Diego). **2** = el cuerpo de la película. **3** = las frases que venden funciones concretas.

---

## 1. Diego a cámara (lo grabas tú) · prioridad 1

Cuatro clips con el mismo encuadre y luz que las demás entrevistas, para que al cortar sean «una más»: la diferencia la marca el rótulo **DIEGO DE LA CALLE · El bajista**.

- **Cómo grabar:** móvil en horizontal sobre trípode, a la altura de los ojos, plano de pecho para arriba. Mira justo al lado de la lente, ligeramente a la izquierda del encuadre. Luz suave de ventana de lado, fondo oscuro y ordenado con alguna luz cálida. Tono sereno y bajito, como un testimonio. Graba cada frase dos o tres veces y deja un segundo de silencio al principio y al final. Camiseta negra lisa o la del grupo.
- Puedes grabar cada pareja de seguido como un solo clip; dime y los parto.

| Archivo | Frase | Va |
|---|---|---|
| `ent-diego-giro.mp4` | «El bajista soy yo. Necesito volver a tocar.» | escena 53 · El giro: el bajista soy yo |
| `ent-diego-giro-b.mp4` | «Toqué en varios grupos y los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado. Hice BandManager para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.» | escena 53 · El giro: el bajista soy yo |
| `ent-diego-sueno.mp4` | «Y ya estamos montando un grupo de metal. Nos falta batería… Con muchísima ilusión, y sabiendo que con BandManager toda la gestión va a ir rodada.» | escena 55 · Un sueño hecho realidad |
| `ent-diego-sueno-b.mp4` | «Y quién sabe si el día de mañana a mis hijas les da por formar sus grupos, y les ayuda a que los comienzos sean mucho más fáciles. Un sueño hecho realidad.» | escena 55 · Un sueño hecho realidad |

---

## 2. Entrevistas de los músicos (Veo 3, imagen a vídeo)

**Antes de empezar**, tres cosas que mejoran el resultado:

- **Los prompts van en inglés** (Veo los entiende mejor), **pero la frase que dice cada persona va en español entre comillas**: así la boca se mueve con las palabras reales. El audio de Veo se tira después y se pone la voz de ElevenLabs con lip-sync.
- **Cada prompt es autónomo** (describe al personaje entero y la cámara): copia y pega uno entero. Sube además la imagen de referencia indicada (*image-to-video* / *Ingredients*) para que la cara sea la misma.
- **Pega siempre el «Negative prompt»** (más abajo) en el campo de negativos de Flow, o añádelo al final del prompt como «Avoid: …» si tu herramienta no tiene el campo.

**Los planos en dos partes (A y B)** se unen después en un solo archivo con el nombre de la tabla (`ent-brais-commits.mp4`, `ent-programador-cafe.mp4`): `ffmpeg -i A.mp4 -i B.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" -r 24 ent-brais-commits.mp4`. La parte B empieza con «CONTINUATION»: sube como referencia el **último fotograma bueno de la A**.

**Ajustes:** 16:9, 8 s (o 4 s donde se indica), 1080p, con audio activado (se descarta). Genera **3 o 4 variantes** de cada plano y quédate con la que tenga mejor cara y boca. Revísalas a 1× y a 0,5×: la boca debe cerrarse en M, B y P y quedarse quieta al final, la cabeza no debe girar y no puede haber ninguna mano delante de los labios.

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

### ent-brais-commits-A
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

### ent-programador-cafe-A
- **Referencia:** `video/actores/programador-sonrie.jpg`
- **Frase:** «Me llegan cien correos a la semana. Ese era el único con fecha, dossier y rider.»
- **Duración:** ~6 s

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. The venue programmer, 47: short greying hair, salt-and-pepper stubble, fine lines around pale blue-grey eyes, a black jacket over a black t-shirt. Dry, busy, quietly amused. Behind him, out of focus: a small cluttered venue office, gig posters on the wall, a warm desk lamp, a desktop monitor, a landline phone and papers. Performance, timed over the clip: 0.0-0.8 s: he sits back in his chair and rubs one eye with the back of his wrist (hand away from the mouth). On «Me llegan cien correos a la semana.» exasperated, eyebrows up. On «Ese era el único con fecha, dossier y rider.» he nods slowly, appreciative, a spark in his eyes. Last 0.6 s: mouth closes, a small satisfied nod. He says in Spanish, in a tired, then appreciative tone, with a relaxed Castilian Spanish, friendly and a little sarcastic: "Me llegan cien correos a la semana. Ese era el único con fecha, dossier y rider." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
```

### ent-programador-cafe-B
- **Referencia:** `video/actores/programador-sonrie.jpg`
- **Frase:** «Contesté antes de acabarme el café.»
- **Duración:** ~2 s · **genera 4 s**

```
Cinematic documentary interview, medium close-up framed from the chest up, shot on a full-frame cinema camera with a 50mm prime lens at T2, locked-off tripod, absolutely no camera movement, no zoom, no pan. 16:9, 24 fps, natural 180-degree shutter motion blur. The subject sits right of centre, with his eyeline just off-lens toward an unseen interviewer on the left of the frame. Soft large key light from a window-sized softbox at 45 degrees on the left side (short lighting), a gentle cool rim light separating the head from a dark background, warm practical lights glowing out of focus behind him. Shallow depth of field. Realistic skin with visible pores and fine stubble, true-to-life micro-expressions, natural blinking and breathing. Slightly desaturated teal-and-amber grade, fine 35mm film grain, subtle halation on the highlights. The venue programmer, 47: short greying hair, salt-and-pepper stubble, fine lines around pale blue-grey eyes, a black jacket over a black t-shirt. Dry, busy, quietly amused. Behind him, out of focus: a small cluttered venue office, gig posters on the wall, a warm desk lamp, a desktop monitor, a landline phone and papers. Performance, timed over the clip: CONTINUATION of the previous clip: identical framing, lighting, wardrobe and position; he starts with his mouth closed and a small nod. 0.0-1.0 s: a beat. On «Contesté antes de acabarme el café.» a growing smile, his eyes flick to a mug just out of frame. Last 2 s: he keeps smiling and gives a small shrug, mouth closed. (Short line: generate 4 s.) He says in Spanish, in a amused and proud tone, with a relaxed Castilian Spanish, friendly and a little sarcastic: "Contesté antes de acabarme el café." Natural mouth movement that matches the Spanish words, lips fully visible, head turned no more than 15 degrees. Audio: only quiet room tone and his natural voice, no music, no sound effects.
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
- **Referencia:** `video/actores/pelaez.jpg` (en la imagen sale casi en silueta: conserva el traje, el sillón y la ciudad de fondo, pero la cara se genera nueva. Cuando una te guste, usa ese fotograma como referencia en sus siguientes planos para que sea siempre el mismo.)
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
