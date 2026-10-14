# Veo 3 · planos con diálogo (para sincronizar labios)

Adaptación de las ideas de NotebookLM **a nuestro guion real** (los números `NN.k` son los de `GUION_REVISION.md`; si cambias una frase allí, cambia aquí también).

## Ajustes respecto a la propuesta de NotebookLM

| NotebookLM | Nuestra película | Por qué |
|---|---|---|
| Diego es el bajista de la historia | El bajista es **Iago**; **Diego** solo aparece en el giro final (Acto V) | Es el giro: «el bajista soy yo». Si Diego sale antes, se estropea. |
| Brais Moure en el local de ensayo | **Brais** es el batería de la historia; el Brais *real* es el destinatario del reto | Meta-historia de los créditos. |
| Acto III con demo técnica (Demucs, Escrow…) | La demo va en **pantallas reales de la app**, no en vídeo IA | Veo escribe mal el texto y las pantallas inventadas restan credibilidad al producto. En Veo solo va el *local* reaccionando. |
| Resurrection Fest, 02:14 | «El Resu», 02:14 (escena 48) | Igual. |

## Reglas de duración (Veo 3 / Flow)

- Un clip = **8 s** (Veo 3 da 4, 6 u 8). Deja **~0,5 s de aire al principio y al final**: el habla útil por clip es **≤ 7 s ≈ 17 palabras**.
- Estimo ~2,6 palabras/s en castellano + pausas. **Son aproximadas (±15 %)**: la duración exacta sale del mp3 de ElevenLabs (`audio/voces/manifest.json`). Cuando estén las voces, recorto o estiro cada clip a esa duración.
- Los clips que pasen de 7 s los he partido en dos (a/b) para que cuadren.

## Cómo encajar Veo con las voces de ElevenLabs

1. En Veo, el personaje **habla** (pon la frase en el prompt, entre comillas) para que la boca se mueva con naturalidad.
2. Descarta el audio de Veo y pon el mp3 de ElevenLabs.
3. Pasa el clip por lip-sync (ver `LIPSYNC.md`) para que los labios sigan *esa* voz.
4. Al que no habla a cámara (Peláez por altavoz) **no hace falta lip-sync**: se ve el móvil y las caras de la banda.

Prompt base de personaje: copia el bloque «El reparto» de `ACTORES.md` delante de cada prompt. Añade siempre al final: `35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off`.

---

## Acto I · Jueves, 23:47 (escenas 02–03)

### A1a · Peláez por el altavoz — ~5,8 s
- **Plano:** contrapicado, móvil en manos libres sobre un ampli, onda de audio pulsando; al fondo, los cuatro en penumbra.
- **Prompt:** `Cinematic 70mm documentary shot, low-angle medium shot in a cluttered, smoke-stained rock rehearsal room. On a battered amplifier among crumpled beer cans and tangled cables, a smartphone on speakerphone with a pulsating waveform. Four tired indie musicians in their late 30s exchange tense glances in chiaroscuro background. Warm 3200K tungsten light, subtle handheld drift, 35mm film grain. The phone speaks: a calm, smooth man's voice.`
- **Voz (Peláez):** «Herdeiros. Os escribí hace tres meses, y nadie contestó. Así que os llamo.»

### A1b · Peláez, el 30 % — ~5 s (parte b de la frase)
- **Plano:** primer plano del móvil y, en rack focus, la cara de Brais frunciendo el ceño.
- **Voz (Peláez):** «Contrato: yo os llevo los bolos, me quedo el treinta por ciento de cada uno…» ·  **pausa 1 s** · «…y el repertorio lo decido yo.»
- *(Ojo: en el guion actual son dos frases seguidas; si prefieres un solo clip, recorta a «Os ofrezco contrato: me quedo el treinta por ciento… y el repertorio lo decido yo» ≈ 7 s).*

### A1c · Álvaro — ~4,6 s
- **Plano:** medio, Álvaro suspira, mira al suelo.
- **Prompt:** `Medium shot, guitarist with short dark hair, short beard, denim vest with patches, sighs and shrugs, says in Spanish: "Tres meses? Es que el correo… se nos pierde, tío."`
- **Voz (Álvaro):** «¿Tres meses? Es que el correo… se nos pierde, tío.»

### A1d · Iago frena a la banda — ~7,5 s (recortada)
- **Plano:** Iago se levanta, se acerca al móvil. Primer plano, mirada firme.
- **Voz (Iago):** «No firméis nada, chavales. Las canciones son nuestras y los bolos los llevamos nosotros. El sábado os lo demuestro.» *(≈ 7,6 s; si pasa de 8, quita «chavales»)*.
- **Lip-sync:** sí (plano clave **03.3**; el plano **03.1** de `planos.json` es la llamada de Peláez, mejor como A1a/A1b).

## Acto II · Madrugada de código (escenas 06 y «Las noches»)

### A2 · Iago en la cocina, 00:20 → 02:47 — ~7,5 s
- **Prompt:** `Intimate cinematic drama, tight close-up, 50mm anamorphic f/1.4. A man in his mid-30s, short dark hair, clean-shaven, grey t-shirt, sitting at a kitchen table in the dark at night. His face lit only by the cold blue flicker of a laptop. Reflections in tired eyes, slow push-in, shallow depth of field, children's drawings softly out of focus on the fridge. He says in Spanish with a tired half-smile: "Vale. Para acabar el máster necesito un proyecto. Mi banda necesita un milagro. Y yo, un café."`
- **Voz (Iago):** «Vale. Para acabar el máster necesito un proyecto. Mi banda necesita un milagro. Y yo, un café.»
- **Rótulo en postproducción (no en Veo):** `00:20` → `02:47`. Las niñas solo en silueta, nunca de cara.
- **Lip-sync:** sí (plano **06.1**).

## Acto III · El local de ensayo (escena 08 y 19)

La demo del producto va en pantallas reales de la app (ya grabadas). En Veo solo van las reacciones de la banda:

### A3a · Iago presenta — ~6,6 s
- **Prompt:** `Over-the-shoulder medium tracking shot in a cramped rehearsal room with egg-box acoustic foam. Four musicians crowd around a glowing laptop on an amplifier; the bassist (grey t-shirt) says in Spanish: "Esto es Band Mánayer. Os voy a enseñar lo que hace por cada uno de vosotros." Soft daylight, handheld documentary look. Laptop screen not readable.`
- **Voz (Iago):** «Esto es Band Mánayer. Os voy a enseñar lo que hace por cada uno de vosotros.»

### A3b · Brais, escéptico — ~7 s
- **Prompt:** `Close-up, drummer with shaved head, black cap, full beard, tattooed arms, crosses arms and bursts into sarcastic laughter, says in Spanish: "A ver, neno, enséñanos eso que ni tú te crees. Y rápido, que se calienta la birra."`
- **Voz (Brais):** «A ver, neno, enséñanos eso que ni tú te crees. Y rápido, que se calienta la birra.»

### A3c · El programador de El Faro — ~7,5 s (recortada)
- **Plano:** primer plano de un hombre de unos 45 en un despacho de sala de conciertos, carteles de bolos al fondo, teléfono en la mano.
- **Voz (Programador):** «Chicos, soy el programador de la Sala El Faro. Me ha llegado vuestro correo: ¡el catorce de noviembre es vuestro!» *(≈ 8 s; versión corta de 7 s: sin «Chicos»)*.
- **Lip-sync:** sí (plano **19.1**).

## Acto IV · El Resu, 02:14 (escena 48)

### A4a · Pasillo de backstage — ~5,2 s
- **Prompt:** `Epic stadium-rock documentary, wide tracking shot from behind following four musicians through a dark backstage tunnel toward a blinding festival stage. Amber and ice-blue lights through haze, roaring crowd silhouette, 24fps motion blur. A crew member in a headset, turning to them, says in Spanish: "Cinco minutos, chicos. El Faro me ha prestado al festival esta noche."`
- **Voz (Programador):** «Cinco minutos, chicos. El Faro me ha prestado al festival esta noche.»

### A4b · Peláez en la mesa de mezclas — ~8,5 s → recortar
- **Voz (Peláez):** «Iago, soy Peláez. Os veo desde la mesa de mezclas. Mi oferta sigue en pie: el treinta por ciento.» *(≈ 7,6 s con «veo»)*.
- **Plano:** Peláez en la mesa de mezclas entre el público, móvil en la oreja, sonrisa de tiburón. **Lip-sync:** sí (plano **48.2**).

### A4c · Iago rechaza — ~6 s
- **Prompt:** `Close-up, bassist in the dark backstage, glances at his phone, rejects the call with his thumb, smiles, says in Spanish: "Gracias, Peláez. Pero los bolos ya los llevamos nosotros."`
- **Voz (Iago):** «Gracias, Peláez. Pero los bolos ya los llevamos nosotros. Y el repertorio, también.» *(≈ 6 s)*

### A4d · «Un, dos, tres, cuatro» — ~8 s
- **Plano:** Brais, baquetas en alto, sube al escenario; corte a negro con el golpe.
- **Voz (Brais):** «Hace seis meses no sabíamos ni quién contestaba a las salas. Y miradnos ahora. ¡Un, dos, tres, cuatro!» *(≈ 8 s: dejarlo en dos clips si va justo)*.

## Acto V · El giro: Diego a cámara (escenas 51–57)

Diego sale con su propia cara. Cámara fija, mirada directa al objetivo, sonrisa tranquila.

- **Prompt base:** `Intimate direct-to-camera cinematic revelation shot, tight close-up, 85mm portrait lens f/1.4. A 41-year-old man (Diego), rock musician and software engineer, looks directly into the lens with a calm, knowing smile. Clean Rembrandt lighting, authentic eye contact, subtle conversational lip movement, 35mm Kodak texture, zero uncanny valley.`

### A5a · «Yo había dejado de tocar» — ~5,2 s (plano 56.1)
«Brais… yo había dejado de tocar. Este máster me devolvió las ganas.»

### A5b1 · El reto (parte 1) — ~5 s (plano 55.1)
«Y ahora, Brais, un reto. No para el Brais de esta historia: para ti, el de verdad.»

### A5b2 · El reto (parte 2) — ~3,5 s
«En casa le das caña a la batería.»

### A5c · «Nos falta batería» — ~5,6 s (plano 56.2)
«Nos falta batería, Brais. Y es tuya: solo tienes que decir que sí.»

### A5d · Gracias — ~8 s (plano 57.1)
«Gracias, Brais. Y gracias a todo el profesorado de la Big Scul, por un máster que acaba en una aplicación de verdad.»

---

## Resumen

| Clip | Duración habla | Clip Veo | ¿Lip-sync? |
|---|---|---|---|
| A1a Peláez altavoz | 5,8 s | 8 s | No |
| A1b Peláez 30 % | 5 s | 6–8 s | No |
| A1c Álvaro | 4,6 s | 6 s | Sí |
| A1d Iago frena | 7,5 s | 8 s | **Sí (clave)** |
| A2 Iago cocina | 7,5 s | 8 s | **Sí (clave)** |
| A3a Iago presenta | 6,6 s | 8 s | Opcional |
| A3b Brais | 7 s | 8 s | Sí |
| A3c Programador | 7,5 s | 8 s | **Sí (clave)** |
| A4a Programador | 5,2 s | 6–8 s | No (de espaldas) |
| A4b Peláez | 7,6 s | 8 s | **Sí (clave)** |
| A4c Iago rechaza | 6 s | 8 s | Sí |
| A4d Brais cuenta | 8 s | 8 s | Opcional |
| A5a–A5d Diego | 5,2 / 5 / 3,5 / 5,6 / 8 s | 6–8 s c/u | **Sí (todos)** |

Total: **~21 clips de ≤ 8 s ≈ 2,5–3 min de vídeo**. Plan B si Veo da problemas: empezar por los 6 clips marcados «clave».

## Notas

- **Caras reales:** Veo/Flow puede rechazar una foto de referencia con cara de persona real; tu propia cara (Diego) no suele dar problema. Para el batería «Brais», el personaje de la historia es ficticio (miembro-brais.jpg), no el Brais real.
- **Texto en pantalla:** nunca en Veo (lo escribe mal). Rótulos `23:47`, `02:47`, `02:14` van en postproducción.
- **Niñas:** solo siluetas o de espaldas.
- **Music:** la épica tipo *Bohemian Rhapsody* y el «Nothing Else Matters» siguen siendo música opcional (`audio/musica/`), nada de eso va en Veo.


## Reglas de rodaje para que el lip-sync no falle

- **Encuadre.** Todo plano con diálogo y lip-sync: plano medio corto o primer plano, con la cara ocupando al menos un tercio del encuadre. En planos generales o de grupo, la boca no tiene píxeles suficientes y sale borrosa. Los planos de grupo (como `local.mp4`) sirven de reacción, sin lip-sync.
- **Boca despejada.** Sin manos en la cara, sin micrófonos de pie delante de los labios y sin sombras densas sobre la boca. Ángulos frontales o de tres cuartos suaves; los perfiles extremos duplican dientes.
- **24 fps.** Montar a 24 fps exactos (Veo genera a 24). Mezclar 24, 25 y 30 fps provoca deriva del audio. No desvincular el audio del vídeo para moverlo unos fotogramas.
- **Revisión.** Ver cada clip a 1× y a 0,5×: los labios deben cerrarse en P, B y M, y la boca debe quedarse quieta en los silencios.
- **Vestuario fijo** en todos los prompts (para que no cambie de un plano a otro): Iago, camiseta gris; Brais, gorra negra y camiseta negra sin mangas; Alan, camisa de flores; Álvaro, chaleco vaquero con parches sobre camiseta negra; Peláez, traje. Referencias en `ACTORES.md` y `img/miembro-*.jpg`.
- **Fonética de las voces** (ya aplicada en el guion): «Band Mánayer», «sétlist», «ráider», «la Big Scul», «Máster of Prompts», «Resurrécshon Fest».

## Continuidad de personajes (fijada)
- **Alan (voz):** pelo rizado oscuro, **bigote siempre**, camisa de flores de manga corta. Añadir "thick moustache" en cada prompt donde salga su cara.
- **Álvaro (guitarra):** chaleco vaquero con parches (calavera en la espalda), camiseta negra, barba corta.
- **Iago (bajo):** pelo corto oscuro, barba corta, camiseta gris o negra lisa. Es el de `miembro-iago` e `iago-cu`.
- **Brais (batería):** calvo, gorra negra hacia atrás, barba larga, camiseta negra sin mangas, tatuajes en los brazos. Es el de `miembro-brais` y `brais-cu`.
- Luz del local: baja, fría de pantalla + luces de guirnalda cálidas al fondo (los clips luminosos se oscurecen al montar).

## Entrevistas a cámara («seis meses después»)

Son el hilo documental de la película: cada músico habla a cámara, sentado, después del festival. En la película van en las escenas «Entrevista · …» (ver `GUION_REVISION.md`). Mientras no estén, el montaje usa los primeros planos que ya tenemos (`brais-cu`, `alan-cu`…), así que se pueden ir subiendo de una en una: guarda cada clip como `video/actores/<nombre>.mp4` (+ un `.jpg` del primer fotograma) y vuelve a generar.

**Rodaje de una entrevista de documental** (igual para todas, para que parezcan de la misma película):
- **Imagen de referencia:** el `.jpg` indicado (image-to-video), para que la cara sea la misma que en el resto de planos.
- **Encuadre:** plano medio corto (de pecho para arriba), la persona en un tercio y mirando **justo al lado del objetivo**, hacia el entrevistador que no se ve. Brais y Álvaro miran a la izquierda del encuadre; Alan, Iago y Peláez, a la derecha. Así, al cortar de uno a otro parece que se contestan.
- **Cámara fija en trípode**, sin zoom ni movimientos (el acercamiento lento lo pone el montaje).
- **Luz:** suave de ventana o caja de luz a 45°, contra suave por detrás; fondo oscuro con luces cálidas desenfocadas. 50 mm, f/2, fondo desenfocado.
- **Actuación:** natural, como quien recuerda algo; pequeñas pausas, sin gesticular delante de la boca (por el lip-sync).
- Cada frase cabe en un clip de 8 s, salvo la de los commits (dos clips o «extender»).

### E1 · Brais · `ent-brais-correo` — Un correo (~7 s)
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with a sigh, in a tired tone: "Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E2 · Alan · `ent-alan-correo` — Un correo (~4 s)
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Fue por un correo, che. Un correo que no contestó nadie.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Fue por un correo, che. Un correo que no contestó nadie". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E3 · Álvaro · `ent-alvaro-okupa` — El treinta por ciento (~7 s)
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánayer: es un okupa.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánayer: es un okupa". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E4 · Iago · `ent-iago-nadie` — Nadie lo sabía (~7 s)
- **Referencia:** `video/actores/iago-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard and a plain grey t-shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye". Behind him, his kitchen at night, out of focus: a window, a closed laptop on the table, one warm lamp. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E5 · Programador · `ent-programador-cafe` — Treinta y cinco minutos (~8 s)
- **Referencia:** `video/actores/programador-sonrie.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Me llegan cien correos a la semana. Ese era el único con fecha, dossier y ráider. Contesté antes de acabarme el café.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 40s with greying stubble and a black jacket over a black t-shirt sits right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Me llegan cien correos a la semana. Ese era el único con fecha, dossier y ráider. Contesté antes de acabarme el café". Behind him, his small venue office, out of focus: gig posters, a desk lamp, a computer screen. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E6 · Brais · `ent-brais-madre` — Treinta y cinco minutos (~6 s)
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Treinta y cinco minutos, neno. Yo tardo más en contestar al guasap de mi madre.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a relaxed, natural tone: "Treinta y cinco minutos, neno. Yo tardo más en contestar al guasap de mi madre". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E7 · Alan · `ent-alan-tono` — El tono (~7 s)
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E8 · Álvaro · `ent-alvaro-hoja` — El tono (~7 s)
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a dry, sarcastic tone: "Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E9 · Álvaro · `ent-alvaro-fans` — Los fans (~7 s)
- **Referencia:** `video/actores/alvaro-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A man in his late 30s with short dark hair, a short beard, a denim vest covered in metal band patches over a black t-shirt sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada". Behind him, the rehearsal room, out of focus: amplifiers, a guitar on a stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E10 · Brais · `ent-brais-commits` — Los commits (~13 s)
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez. Y el sábado a las once estaba en el local. El primero. Con los cafés.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish in a soft, quiet tone: "Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez. Y el sábado a las once estaba en el local. El primero. Con los cafés". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E11 · Peláez · `ent-pelaez` — Peláez (~7 s)
- **Referencia:** `video/actores/pelaez.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A well-groomed man in his 50s in a dark tailored suit and open-collar white shirt sits in a leather chair, left of centre, looking just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a calm, self-satisfied tone: "Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?". Behind him, a glass office at night, out of focus: city lights, gold records on the wall. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### Frases añadidas (funciones de la app)

### E13 · Alan · Treinta y cinco minutos · `ent-alan-aviso`
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A a man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a relaxed, amused tone: "Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente.". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E14 · Brais · El tono · `ent-brais-calendario`
- **Referencia:** `video/actores/brais-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «El calendario me avisa si mis dos bandas se pisan. Es el mejor mánager que he tenido.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A bald man in his early 40s with a long full beard, a black cap worn backwards, a black sleeveless t-shirt and tattooed arms sits slightly right of centre and looks just off-lens to frame-left, at an unseen interviewer, and speaks in Spanish with an amused, laughing tone: "El calendario me avisa si mis dos bandas se pisan. Es el mejor mánager que he tenido.". Behind him, the rehearsal room, out of focus: acoustic foam, a drum kit, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

### E15 · Alan · Los fans · `ent-alan-reels`
- **Referencia:** `video/actores/alan-cu.jpg`
- **Frase (la voz final es la de ElevenLabs):** «Y los reels: subes el concierto entero y la IA te saca los mejores trozos. Yo solo tuve que salir guapo.»
- **Prompt:** `Documentary interview, medium close-up, locked-off tripod, 50mm lens at f/2, shallow depth of field. A a man in his late 30s with dark curly shoulder-length hair, a thick moustache and a short-sleeved floral shirt sits slightly left of centre and looks just off-lens to frame-right, at an unseen interviewer, and speaks in Spanish in a playful, vain tone: "Y los reels: subes el concierto entero y la IA te saca los mejores trozos. Yo solo tuve que salir guapo.". Behind him, the rehearsal room, out of focus: acoustic foam, a microphone stand, warm fairy lights. Soft key light from 45 degrees, gentle rim light, dark background, realistic skin texture, subtle natural breathing and blinking, no hand gestures in front of the mouth. 35mm Kodak film grain, 24fps, no on-screen text, no logos, subtitles off.`

## Diego a cámara (lo grabas tú)

Dos entrevistas, con el mismo encuadre y luz que las demás para que al cortar sean «una más» (la diferencia la marca el rótulo **DIEGO DE LA CALLE · El bajista**). Mientras no estén grabadas, el montaje usa tu foto del escenario, y en cuanto dejes los archivos en `video/actores/` con estos nombres y vuelvas a generar, entran solos.

- **Cómo grabar:** móvil en horizontal sobre trípode, a la altura de los ojos, plano de pecho para arriba. Mira **justo al lado de la lente** (no a la lente), ligeramente a la izquierda del encuadre. Luz suave de ventana de lado, fondo oscuro y ordenado con alguna luz cálida; mismo tono sereno y bajito que un testimonio, sin gesticular delante de la boca. Graba la frase entera dos o tres veces y deja un segundo de silencio al principio y al final.
- **Camiseta:** negra lisa o la del grupo; sin logos grandes.
- **Archivos** (`.mp4` 1080p, horizontal; el audio de tu clip se descarta y se pone la voz final, o sirve tu voz si prefieres la tuya):

| Archivo | Frase | Va |
|---|---|---|
| `ent-diego-giro.mp4` | «El bajista soy yo. Necesito volver a tocar.» | Después de «Otro jueves» (el giro) |
| `ent-diego-giro-b.mp4` | «Toqué en varios grupos, y los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado. Hice BandManager para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.» | Sigue al anterior |
| `ent-diego-sueno.mp4` | «Y ya estamos montando un grupo de metal. Nos falta batería… Con muchísima ilusión, y sabiendo que con BandManager toda la gestión va a ir rodada.» | Después de «Mis bandas» |
| `ent-diego-sueno-b.mp4` | «Y quién sabe si el día de mañana a mis hijas les da por formar sus grupos, y les ayuda a que los comienzos sean mucho más fáciles. Un sueño hecho realidad.» | Sigue al anterior |

Puedes grabar cada pareja de seguido, como un solo clip: dime y los parto en dos.

### Repetir · Iago en la cocina de noche (`noches`)
- El clip actual deforma la cara al mirar a cámara. Mismo plano, pero **sin mirar al objetivo**: mirando el portátil, la cara iluminada por la pantalla.
- **Prompt:** `Night, a dark home kitchen, a man in his late 30s with short dark hair, a short beard and a plain dark t-shirt sits at the table typing on a laptop, face lit only by the cold screen glow, eyes on the screen, never looking at the camera. He stops, rubs his eyes, glances towards a hallway with a child's nightlight, then goes back to typing. Static camera, 35mm lens, realistic, 35mm Kodak film grain, 24fps, no on-screen text, no logos.`

### E16 · Confirmados (celebración, opcional) · `confirmados`
- Hoy usa un plano ya existente (`otro-jueves`). Si quieres uno propio: la banda alrededor del portátil estallando de alegría cuando llega el aviso del festival.
- **Referencia:** `video/actores/otro-jueves.jpg` (misma sala, mismos cuatro).
- **Prompt:** `Cinematic handheld medium shot in a dim rehearsal room with acoustic foam and warm fairy lights. Four bandmates around a laptop on a flight case: a bald bearded drummer with a backwards black cap and tattooed arms, a curly-haired man with a moustache in a floral shirt, a man in a denim vest covered in metal patches, and a short-haired bearded bassist in a grey t-shirt. The laptop screen lights their faces. They read the screen, freeze for a second, then explode: the vest guy screams with joy and punches the air, the floral-shirt man grabs his head, the drummer laughs and hugs the bassist. Natural, unforced reactions, 35mm Kodak film grain, 24fps, no on-screen text, no logos.`
