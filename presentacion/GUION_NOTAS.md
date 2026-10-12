# Notas de la revisión del guion

## (a) Cambios de estructura recomendados

1. **Mover «Y mucho más» antes de «Lo han visto todo».** Ahora va después de «Las noches»: tras el momento más íntimo («Gracias, Iago. De verdad.») entra un listado de funciones y Brais gritando, y eso pisa la emoción. El orden bueno es: Gira → Y mucho más → Lo han visto todo → Las noches → Esto lo necesitan todos. El texto nuevo funciona en cualquiera de los dos órdenes.
2. **«Prólogo · La llamada» (Peláez) podría ir antes de «Jueves, 23:47».** Así el «Dadme hasta el sábado» quedaría como última frase del prólogo, justo antes de abrir el portátil. Es opcional: tal como está ahora también se entiende.
3. **El prólogo ya es mínimo:** el dolor del setlist pasa a «Una hoja para cada músico», y del jueves solo queda lo de la sala del 14 que nadie contesta (cadena de «yo pensaba que…»). Si queréis recortar más, «Prólogo · Sábado, 11:00» se puede fundir con «Capítulo 1» (en total son tres líneas).
4. **Un hueco que conviene cerrar:** El Faro contesta a las 11:35, solo 35 minutos después de enviar. Ahora es un chiste («La última vez tardaron tres semanas»). Pero el resumen antiguo decía «tres semanas después». Si preferís el salto de tiempo, hay que cambiar el rótulo y quitar la línea de Brais.
5. **«Capítulo 5 · Cómo lo hacemos»** ahora tiene una sola línea muy corta («Vamos por partes, chavales»). Se podría eliminar la tarjeta y entrar directamente en «Para darlo a conocer».
6. **«Gracias»:** ahora tiene 4 líneas de voz para Diego. En `index.html` hay que añadir un `<ul class="dlg">` (o reproducir solo las voces sobre la portada). La última línea coincide con el `sign-msg` que ya está en pantalla.

## (b) Callbacks y dónde caen

| Gag | Se planta | Vuelve |
|---|---|---|
| La sala del 14 | Jueves 23:47 | Capítulo 1 («la herida»), mapa («la del catorce, también»), La sala contestó (El Faro = la del 14), Otro jueves |
| Álvaro adivina mal | La banda («nunca fallo»), Viernes («base de datos de salas») | Todas las salas («¡Te lo dije!» / «Casi»), Iris («Por fin aciertas una»), Y mucho más («Con cosas» / «Casi, tío. Casi.») |
| El calendario de Brais | Viernes («el calendario compartido», sin decir Google) | Calendario de la banda («¡Te lo dije! ¡Google Calendar!»), Post-créditos («Mira el calendario») |
| Los miércoles libro | Date Swap | Choques («me ha salvado el miércoles» + «el de los metaleros, ¿no, traidor?»), Otro jueves, Post-créditos («el miércoles ensayo con MoP») |
| ¡Traidor! | Date Swap | Choques, Otro jueves |
| El 30 % de Peláez | La llamada | La sala contestó, Dossier («una que no se queda el 30 %»), Esto lo necesitan todos («de porcentajes ya sé un rato»), Cómo ganamos dinero («¿más o menos que Peláez?»), Festival, Post-créditos (Guglio) |
| Croquetas | Acuerdo | La sala contestó, Festival (rider) |
| El Faro y el fax | Acuerdo | La sala contestó, A quién se lo vendemos («Mirad El Faro: 35 minutos») |
| El bajo que nadie oye | La banda | Iris («por fin se oye el bajo»), Lo han visto todo («el que nadie mira»), Gracias («os pongo al bajo: total, no lo oye nadie») |
| Café | La decisión | Lo han visto todo |
| Tú decides / ideas locas | La decisión | Post-créditos (Claudio y Guglio) |
| La Ribeira y la balada | Curva de energía | Del concierto al disco |
| Las madres como público | Bandas amigas | Capítulo 3, Merchan / reels («mi vieja») |
| Hoja con el tono | Una hoja para cada músico | Festival («Mi menor, en tu hoja»), Otro jueves, Gracias («Os llevo vuestros setlists personalizados») |
| Abren el dossier | La IA escribe | Qué viene (el Resurrection abre el dossier) |
| Miami | Esto lo necesitan todos | Para darlo a conocer (el Lambo) |
| Nos falta batería | Date Swap (voz_mop) | Un sueño (h2), El reto |
| Ensayamos el sábado | Otro jueves | Gracias (cierre) |

## (c) Incoherencias corregidas

- Los «¡Te lo dije!» de Álvaro (base de datos) y de Brais (Google Calendar) no tenían setup en la película: las adivinanzas solo estaban en `guion_hablado.py`. Las he añadido en el Viernes. Brais dice «calendario compartido» para que Google Calendar solo se nombre en su escena.
- Iago decía «Ya he dejado dos grupos». En «Mis bandas» salen seis, así que lo he cambiado a «varios».
- «Guardaos su cara, que va a volver»: el cantante de Master of Prompts no vuelve a salir. Ahora es «Guardaos el nombre» (la banda sí vuelve).
- Post-créditos: «mañana ensayo con MoP» un domingo a las 03:12 contradecía «los miércoles libro». Ahora es «el miércoles».
- «Para darlo a conocer»: Brais preguntaba «¿cómo sabes todo esto?» antes de que Iago explicara nada, y «os cuento la estrategia» salía tres veces seguidas (capítulo y escena). Lo he reordenado y quitado las repeticiones.
- Curva de energía: decía que «la IA vigila las transiciones» y luego el profesor de armonía decía que «los datos los calcula el código». Ahora las transiciones las vigila la app.
- Etiquetas fuera de la lista ([suspicious], [dramatically], [laughs nervously]) cambiadas por otras de la lista. He quitado todas las etiquetas de Iago y de Diego ([sighs], [firmly], [laughs], [softly]).
- Palabrotas fuera: «carallo» y el «co[pi]» tapado.
- «Ultimate Guitar: te has copiado» ahora es «es como Ultimate Guitar, pero con nuestras canciones». Delante de un tribunal es mejor no sugerir copia.
- «Y mucho más» repetía funciones ya enseñadas (reels, dossier, armonías). Ahora nombra lo que sale en la ráfaga (ideas, ficha del bolo).
- Radio: una frase de 45 palabras pasa a cuatro frases cortas.
- Subtítulos: «band mánayer punto io» en minúscula y «el mánayer» no los corrige `ESCRITO`. Los he puesto como «Band Mánayer» y «Mánayer», que sí se convierten. **Recomiendo añadir `[/mánayer\b/g, 'mánager']` a ESCRITO**: así no dependemos de las mayúsculas.

## (d) Dudas para el autor

1. **Horas de las líneas nuevas en escenas con hora** (el campo `txt` no las lleva): Viernes (Álvaro 22:12, Brais 22:15), Otro jueves (Alan «Traidor» 23:52), Post-créditos (Claudio y Guglio 03:13). Los textos de los jueves los he cambiado, pero el número de líneas y sus horas se mantienen.
2. **Etiqueta del mánager:** la burbuja pone «Mánager · Os Herdeiros do Código», pero él dice que es el mánager de Master of Prompts y programador de El Faro. Tiene sentido si en el festival ya es su mánager (porque aceptaron su oferta), pero en «La sala contestó» se lee raro. ¿Cambiamos la etiqueta en `reparto.js` a «Mánager · Master of Prompts · El Faro»?
3. **«Cinco planes, de 0 a 79 €»:** la pantalla lo dice y la voz lo mantiene para no contradecirla. Pero `src/utils/planPermissions.ts` tiene seis precios (tres de 0 €). ¿Hay un plan oculto, o hay que corregir la pantalla?
4. **«La entrenas con estrellas»** y **«comisión voluntaria»:** los mantengo porque ya estaban. Confirma que existen en la app tal cual se dicen.
5. **«Rock FM»** es una emisora real. ¿Os parece bien usarla en una ficción, o mejor un nombre inventado (p. ej. «Radio Riff»)?
6. **«Paula»:** se queda como chiste cariñoso, sin premio concreto. Confirma que es la persona a la que va dirigido y que le hará gracia.
7. **«Del rojo al verde»** (Alan, La sala contestó) venía de la hoja de cálculo, que ya no sale. ¿La pantalla de esa escena muestra el estado de la sala cambiando de color? Si no, lo cambio por «¡Del 'sin respuesta' al 'confirmado'!».
8. Los `txt` de Prólogo · La banda (nombre+cargo) los he dejado tal cual: son metadatos de la tarjeta, no burbujas.
