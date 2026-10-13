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
- **Iago (bajo):** calvo, gorra negra, barba, camiseta negra sin mangas, tatuaje en el brazo.
- **Brais (batería):** pelo corto oscuro, barba, camiseta negra.
- Luz del local: baja, fría de pantalla + luces de guirnalda cálidas al fondo (los clips luminosos se oscurecen al montar).
