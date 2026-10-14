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

Cada una con su imagen de referencia (`image-to-video`), para que la cara sea la misma que en el resto de planos. **Alan siempre con bigote.**

### 5. Brais · `ent-brais-correo` · prioridad 1
- **Va en:** escena 1 · Un correo · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras.»
- **Referencia:** `video/actores/video/actores/brais-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with a sigh, in a tired tone: "Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 6. Alan · `ent-alan-correo` · prioridad 1
- **Va en:** escena 1 · Un correo · **~4 s**
- **Frase (la voz final es la de ElevenLabs):** «Fue por un correo, che. Un correo que no contestó nadie.»
- **Referencia:** `video/actores/video/actores/alan-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Fue por un correo, che. Un correo que no contestó nadie". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 7. Iago · `ent-iago-nadie` · prioridad 1
- **Va en:** escena 9 · Nadie lo sabía · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye.»
- **Referencia:** `video/actores/video/actores/iago-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard and a plain grey t-shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye". Behind him, his kitchen at night, out of focus: a window, a closed laptop on the table, one warm lamp. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 8. Brais · `ent-brais-commits` · prioridad 1
- **Va en:** escena 40 · Los commits · **~13 s** → **pide 2 clips seguidos o «extender» en Flow**
- **Frase (la voz final es la de ElevenLabs):** «Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez. Y el sábado a las once estaba en el local. El primero. Con los cafés.»
- **Referencia:** `video/actores/video/actores/brais-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a soft, quiet tone: "Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez. Y el sábado a las once estaba en el local. El primero. Con los cafés". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 9. Álvaro · `ent-alvaro-okupa` · prioridad 2
- **Va en:** escena 7 · El treinta por ciento · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánayer: es un okupa.»
- **Referencia:** `video/actores/video/actores/alvaro-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánayer: es un okupa". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 10. Programador de El Faro · `ent-programador-cafe` · prioridad 2
- **Va en:** escena 20 · Treinta y cinco minutos · **~8 s** → **pide 2 clips seguidos o «extender» en Flow**
- **Frase (la voz final es la de ElevenLabs):** «Me llegan cien correos a la semana. Ese era el único con fecha, dossier y ráider. Contesté antes de acabarme el café.»
- **Referencia:** `video/actores/video/actores/programador-sonrie.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 40s with greying stubble and a black jacket over a black t-shirt sits right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Me llegan cien correos a la semana. Ese era el único con fecha, dossier y ráider. Contesté antes de acabarme el café". Behind him, his small venue office, out of focus: gig posters, a desk lamp, a computer screen. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 11. Brais · `ent-brais-madre` · prioridad 2
- **Va en:** escena 20 · Treinta y cinco minutos · **~6 s**
- **Frase (la voz final es la de ElevenLabs):** «Treinta y cinco minutos, neno. Yo tardo más en contestar al guasap de mi madre.»
- **Referencia:** `video/actores/video/actores/brais-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Treinta y cinco minutos, neno. Yo tardo más en contestar al guasap de mi madre". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 12. Alan · `ent-alan-tono` · prioridad 2
- **Va en:** escena 27 · El tono · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto.»
- **Referencia:** `video/actores/video/actores/alan-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 13. Álvaro · `ent-alvaro-hoja` · prioridad 2
- **Va en:** escena 27 · El tono · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja.»
- **Referencia:** `video/actores/video/actores/alvaro-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a dry, sarcastic tone: "Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 14. Peláez · `ent-pelaez` · prioridad 2
- **Va en:** escena 51 · Peláez · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?»
- **Referencia:** `video/actores/video/actores/pelaez.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A well-groomed man in his 50s in a dark tailored suit and open-collar white shirt sits in a leather chair, left of centre, looking just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a calm, self-satisfied tone: "Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?". Behind him, a glass office at night, out of focus: city lights, gold records on the wall. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 15. Alan · `ent-alan-aviso` · prioridad 3
- **Va en:** escena 20 · Treinta y cinco minutos · **~8 s** → **pide 2 clips seguidos o «extender» en Flow**
- **Frase (la voz final es la de ElevenLabs):** «Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente, che.»
- **Referencia:** `video/actores/video/actores/alan-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A a man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a relaxed, amused tone: "Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente.". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 16. Brais · `ent-brais-calendario` · prioridad 3
- **Va en:** escena 27 · El tono · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «El calendario me avisa si mis dos bandas se pisan. Es el mejor mánayer que he tenido.»
- **Referencia:** `video/actores/video/actores/brais-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "El calendario me avisa si mis dos bandas se pisan. Es el mejor mánager que he tenido.". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 17. Álvaro · `ent-alvaro-fans` · prioridad 3
- **Va en:** escena 34 · Los fans · **~7 s**
- **Frase (la voz final es la de ElevenLabs):** «Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada.»
- **Referencia:** `video/actores/video/actores/alvaro-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### 18. Alan · `ent-alan-reels` · prioridad 3
- **Va en:** escena 34 · Los fans · **~8 s** → **pide 2 clips seguidos o «extender» en Flow**
- **Frase (la voz final es la de ElevenLabs):** «Y los reels: subes el concierto entero, y la inteligencia artificial te saca los mejores trozos. Yo solo tuve que salir guapo.»
- **Referencia:** `video/actores/video/actores/alan-cu.jpg`
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A a man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a playful, vain tone: "Y los reels: subes el concierto entero y la IA te saca los mejores trozos. Yo solo tuve que salir guapo.". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

---

## 3. Opcionales (mejoran, no bloquean)

### A. El flashback de la decisión · `decision` · prioridad 3
- **Va en:** escena 8 · Prólogo · La decisión («Ocho meses antes»). Hoy esa escena va sobre una foto fija; con este plano sería un vídeo de Iago abriendo el portátil.
- **Referencia:** `video/actores/viernes.jpg`
- **Prompt:** `Cinematic medium shot, late night, a man in his late 30s with short dark hair, a short beard and a plain grey t-shirt sits on a worn sofa in a dim living room lit by a single warm lamp. He lifts the lid of a laptop, the screen casts a cool glow on his tired face, and he gives a small determined nod. Static camera, shallow depth of field, 35mm Kodak film grain, 24fps, no on-screen text, no logos.`

### B. Iago en la cocina de noche · `noches` · prioridad 3
- **Va en:** escena 39 · Las noches. El clip actual deforma la cara cuando mira a cámara. Mismo plano, pero **sin mirar al objetivo**.
- **Referencia:** `video/actores/noches.jpg`
- **Prompt:** `Night, a dark home kitchen, a man in his late 30s with short dark hair, a short beard and a plain dark t-shirt sits at the table typing on a laptop, face lit only by the cold screen glow, eyes on the screen, never looking at the camera. He stops, rubs his eyes, glances towards a hallway with a child's nightlight, then goes back to typing. Static camera, 35mm lens, realistic, 35mm Kodak film grain, 24fps, no on-screen text, no logos.`

### C. Celebración de «Confirmados» · `confirmados` · prioridad 3
- **Va en:** escena 48 · Confirmados. Hoy usa `otro-jueves.mp4`.
- **Referencia:** `video/actores/otro-jueves.jpg`
- **Prompt:** `Cinematic handheld medium shot in a dim rehearsal room with acoustic foam and warm fairy lights. Four bandmates around a laptop on a flight case: a bald bearded drummer with a backwards black cap and tattooed arms, a curly-haired man with a moustache in a floral shirt, a man in a denim vest covered in metal patches, and a short-haired bearded bassist in a grey t-shirt. The laptop screen lights their faces. They read the screen, freeze for a second, then explode: the vest guy screams with joy and punches the air, the floral-shirt man grabs his head, the drummer laughs and hugs the bassist. Natural, unforced reactions, 35mm Kodak film grain, 24fps, no on-screen text, no logos.`

> Nota: para que `confirmados` entre solo habría que enlazarlo en el montaje (hoy la escena usa `otro-jueves`); dímelo cuando lo tengas.
