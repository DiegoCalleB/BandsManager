"""Subtítulos en inglés (opción del menú de subtítulos de la película).

Una traducción por frase hablada: la clave es el texto que se oye (sin las etiquetas [..]) y el valor, su subtítulo en inglés.
Si una frase no está aquí, el subtítulo en inglés sale en español y main() lo avisa.
Regenera con:  python3 presentacion/tools/guion/subs_en.py
"""
import json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, AQUI)

EN = {
"¿Alguien le ha contestado a la sala del catorce? Che, que yo soy la voz, no la secretaria.":
    "Has anyone answered the room on the 14th? Che, I'm the singer, not the secretary.",
"¿Sala del catorce? Yo pensaba que el catorce era el día del bolo.":
    "The room on the 14th? I thought the 14th was the gig date.",
"Y yo pensaba que éramos una banda. No cuatro tíos que se pasan la pelota. Ya he dejado varios grupos por esto. Con vosotros, no.":
    "And I thought we were a band. Not four guys passing the buck. I've already left a few bands over this. Not this one.",
"Herdeiros. Os escribí hace tres meses, y nadie contestó. Me quedo el treinta por ciento, y el repertorio lo decido yo.":
    "Herdeiros. I wrote to you three months ago and nobody answered. I take thirty percent, and I pick the setlist.",
"No firméis nada, chavales. Los bolos los llevamos nosotros. El sábado os lo demuestro.":
    "Don't sign anything, guys. We book our own gigs. Saturday, I'll prove it.",
"Soy Brais, batería. El que marca el ritmo. Y el que se bebe las birras.":
    "I'm Brais, drums. The one who keeps the beat. And drinks the beers.",
"Alan. Voz y guitarra. Che, la cara bonita de la banda.":
    "Alan. Vocals and guitar. Che, the pretty face of the band.",
"Álvaro, guitarra solista. Nunca fallo.":
    "Álvaro, lead guitar. I never get it wrong.",
"Y yo, Iago, el bajo. Ese instrumento que nadie oye. Hasta hoy.":
    "And I'm Iago, on bass. The instrument nobody hears. Until today.",
"Vale. Para acabar el máster necesito un proyecto. Mi banda necesita un milagro. Y yo, un café.":
    "Right. To finish my master's I need a project. My band needs a miracle. And I need a coffee.",
"¿Y si el proyecto es el milagro, Iago? Tú decides: nosotros proponemos, y tú revisas.":
    "What if the project is the miracle, Iago? You decide: we propose, you review.",
"Yo pongo las ideas locas. Claudio las discute.":
    "I bring the crazy ideas. Claudio argues with them.",
"Hecho, tronco. Empezamos esta noche.":
    "Deal, mate. We start tonight.",
"Chavales, mañana a las once en el local. Tengo que enseñaros algo que flipáis.":
    "Guys, tomorrow at eleven at the rehearsal room. I've got something to show you. I can't believe it myself.",
"Seguro que es una base de datos de salas.":
    "I bet it's a database of venues.",
"O el calendario compartido, neno.":
    "Or he's discovered the shared calendar, neno.",
"Y ojo: mañana a las dos cierran el cartel del Resurrécshon Fest. Si no mandamos nada, no tocamos.":
    "And careful: tomorrow at two they close the Resurrection Fest lineup. If we don't send anything, we don't play.",
"Esto es Band Mánayer. Os voy a enseñar lo que hace por cada uno.":
    "This is BandManager. I'm going to show you what it does for each of you.",
"A ver, neno, enséñanos eso que ni tú te crees.":
    "Go on, neno, show us this thing you can't believe yourself.",
"Empezamos por la herida: la sala del catorce.":
    "We start with the wound: the room on the 14th.",
"Pará. ¿Esto lo hiciste vos? ¿El bajista?":
    "Wait, wait. You made this? The bass player?",
"Con un poco de ayuda. Aquí están las salas y festivales, y cada conversación queda guardada.":
    "With a little help. Here are all the venues and festivals, and every conversation is saved.",
"¡Una base de datos de salas! ¡Te lo dije, tío!":
    "A database of venues! I told you so, man!",
"Casi. Y un agente, el Scaut, busca salas y festivales nuevos por nosotros.":
    "Almost. And an agent, the Scout, finds new venues and festivals for us.",
"Y todos, en el mapa de toda España.":
    "And all of them, on the map of all Spain.",
"¡Ha escrito a tres salas y al Resurrécshon Fest mientras yo afinaba!":
    "It wrote to three venues and Resurrection Fest while I was tuning!",
"Cada correo suena a nosotros, y la inteligencia artificial lo adapta a cada sala.":
    "Every email sounds like us, and the AI tailors it to each venue.",
"¿Y si le escribe una burrada al de la sala?":
    "And what if it writes something outrageous to the venue guy?",
"Nada sale sin mi visto bueno. Y cuando la sala contesta, otro agente me avisa.":
    "Nothing goes out without my approval. And when the venue replies, another agent alerts me.",
"¿Y cómo sabemos si lo han leído?":
    "And how do we know if they've read it?",
"La app te avisa cuando abren el correo o el dossier. Y a la inteligencia artificial la entrenas con estrellas.":
    "The app tells you when they open the email or the dossier. And you train the AI with stars.",
"Así le llega a la sala: en su bandeja, con vuestro logo y el botón al dossier.":
    "That's how it reaches the venue: in their inbox, with your logo and the button to the dossier.",
"¡Pero qué bonito! ¡Si parece el correo de una agencia de verdad!":
    "But how nice! It looks like an email from a real agency!",
"¡Y yo, que firmaba los correos con un besito, boludo!":
    "And I used to sign my emails with a little kiss, boludo!",
"¿Y las otras bandas? Siempre terminamos llamando a los mismos tres amigos del celular.":
    "And the other bands? We always end up calling the same three friends on our phones.",
"Aquí las tengo todas: su estilo, su ciudad, el contacto y el público que llevan.":
    "I've got them all here: their style, their city, their contact and the crowd they bring.",
"¿Y puedo escucharlas antes de proponerles nada?":
    "And can I listen to them before proposing anything?",
"Sí. Le das a escuchar, y suena abajo, desde su Spótifai, sin salir de la app.":
    "Yes. You hit listen, and it plays at the bottom, from their Spotify, without leaving the app.",
"¿Y cómo les va? ¿Llevan público de verdad, o solo a sus madres?":
    "And how are they doing? Do they draw a real crowd, or just their mums?",
"Ves sus métricas del mes, en Spótifai y en Yutub.":
    "You see their monthly metrics, on Spotify and YouTube.",
"Esto es Deit Suap. Le propongo a otra banda cambiar fechas: nosotros en su ciudad, y ellos en la nuestra.":
    "This is Date Swap. I propose to another band that we swap dates: us in their city, them in ours.",
"Os leo, Herdeiros. Nosotros vamos a Santiago, y vosotros venís a Vigo. ¡Cartel doble!":
    "I read you, Herdeiros. We go to Santiago, and you come to Vigo. Double bill!",
"¿Y quién es ese? ¿Tiene más pelo que yo?":
    "And who's this guy? Does he have more hair than me?",
"El cantante de Máster of Prompts. Guardaos el nombre, que va a volver.":
    "The singer of Master of Prompts. Remember the name, he'll be back.",
"Y oye, Brais: nos falta batería. ¿Te vienes a Máster of Prompts?":
    "And hey, Brais: we need a drummer. Do you want to join Master of Prompts?",
"¿Yo? Pero si ya tengo banda… Bueno, los miércoles libro.":
    "Me? But I already have a band… Well, Wednesdays I'm free.",
"¡Traidor! ¡Nos deja por unos metaleros, che!":
    "Traitor! He's leaving us for a bunch of metalheads, che!",
"Tranquilo, Alan: Brais toca en las dos bandas, sin liarse. Mirad su cuenta.":
    "Relax, Alan: Brais plays in both bands without getting mixed up. Look at his account.",
"Un momento… ahí arriba pone Brais Moure. ¿Esa es mi cuenta?":
    "Wait a second… up there it says Brais Moure. Is that my account?",
"Sí, Brais: una cuenta, y varias bandas. Se cambia como los perfiles de una plataforma de cine. ¿Quién toca hoy? Máster of Prompts.":
    "Yes, Brais: one account, several bands. You switch like profiles on a streaming platform. Who's playing today? Master of Prompts.",
"¡Ché, cambió todo! ¡El logo, el calendario, hasta las salas!":
    "Che, everything changed! The logo, the calendar, even the venues!",
"Y lo de una banda no se ve nunca en la otra. Primera regla de la casa.":
    "And what belongs to one band never shows up in the other. First rule of the house.",
"¿Y si la sala nos cambia el caché el mismo día del bolo? Que acabamos cobrando en croquetas.":
    "And what if the venue changes our fee on the day of the gig? We ended up getting paid in croquettes.",
"Por eso el acuerdo se cierra desde la plataforma: fecha, caché, ráider y camerino, por escrito.":
    "That's why the agreement is closed on the platform: date, fee, rider and dressing room, in writing.",
"¿Y la sala tiene que instalarse algo?":
    "And does the venue have to install anything?",
"Nada. Abrir un enlace y firmar con el dedo.":
    "Nothing. Open a link and sign with your finger.",
"¡Se acabaron las sorpresas el día del bolo!":
    "No more surprises on gig day!",
"Chicos, soy el programador de la Sala El Faro. Me ha llegado vuestro correo: ¡el catorce de noviembre es vuestro!":
    "Guys, I'm the programmer at Sala El Faro. Your email reached me: the 14th of November is yours!",
"¡La sala del catorce! ¡Y encima el día catorce!":
    "The room on the 14th! And on the 14th, too!",
"¿En treinta y cinco minutos? La última vez tardaron tres semanas. Y era para decir que no.":
    "In thirty-five minutes? Last time they took three weeks. And it was to say no.",
"Y ahora, lo bueno: la música.":
    "And now, the good part: the music.",
"Vale, ¿y los ensayos? Llevamos tres sin saber qué tocamos.":
    "Right, and what about rehearsals? We've gone three without knowing what we're playing.",
"Imprimo el setlist, y sale una hoja distinta para cada uno.":
    "I print the setlist, and each of you gets a different sheet.",
"Y al imprimirlo, sale una hoja distinta para cada uno.":
    "And when you print it, each of you gets a different sheet.",
"Y la mía, con el tono de cada tema. Por fin sé en qué tono canto.":
    "And mine, with the key of each song. Finally I know what key I sing in.",
"Cada tema tiene su energía. La app dibuja la curva del concierto, y te propone el setlist perfecto.":
    "Every song has its energy. The app draws the curve of the whole gig, and suggests the perfect setlist.",
"¡Ché, un setlist que sube como un cohete!":
    "Che, a setlist that climbs like a rocket!",
"Dale al play, Álvaro. Los acordes y la letra siguen la canción solos.":
    "Press play, Álvaro. The chords and lyrics follow the song on their own.",
"¡Pero tío! ¡Es como Últimeit Guitar, pero con nuestras canciones! ¡Pellízcame! ¡Esto es mejor que un solo de Eslash!":
    "But man! It's like Ultimate Guitar, but with our own songs! Pinch me! This beats a Slash solo!",
"Espera, chaval, que esto es solo la intro. ¡Todavía no ha entrado la batería!":
    "Wait, mate, this is just the intro. The drums haven't come in yet!",
"Subo una canción, e Iris separa la voz, la batería, el bajo y las guitarras.":
    "I upload a song, and Iris splits the vocals, drums, bass and guitars.",
"¡Mi voz sola! ¡Canto como un ángel, boludo!":
    "My voice, alone! I sing like an angel, boludo!",
"¡Espera! ¿Esto no será un Moisés?":
    "Wait! Isn't this a Moises?",
"¡Sí, tío! Por fin aciertas una. Y encima, ¡por fin se oye el bajo!":
    "Yes, man! You finally got one right. And on top of that, you can finally hear the bass!",
"Y aquí se juntan las bandas: un calendario con los ensayos y los bolos de todas, sincronizado con Gúgel Calendar.":
    "And here the bands come together: a calendar with everyone's rehearsals and gigs, synced with Google Calendar.",
"¡Te lo dije! ¡Gúgel Calendar!":
    "I told you! Google Calendar!",
"Cada fecha tiene su ficha, con la meteo y el aviso de puente o festivo.":
    "Every date has its sheet, with the weather and a warning for long weekends or holidays.",
"¡Por fin sé cuándo ensayamos y cuándo tocamos!":
    "Finally I know when we rehearse and when we play!",
"Y ahora, que nos conozca más gente.":
    "And now, let's get more people to know us.",
"¿Que ahora tenemos una web? ¡Como los de verdad!":
    "So now we have a website? Like the real ones!",
"¡Pero si está guapísima! ¡Salgo con mi mejor perfil!":
    "It looks amazing! I'm showing my best side!",
"Es el dossier de la banda: fotos, formación y contacto. Se edita desde la aplicación.":
    "It's the band's dossier: photos, lineup and contact. You edit it from the app.",
"Esto ya no es un local de ensayo, es una discográfica. Una que no se queda el treinta por ciento.":
    "This isn't a rehearsal room anymore, it's a record label. One that doesn't take thirty percent.",
"¿Cómo? ¿Que ponemos este cú-erre y la gente nos sigue en redes?":
    "What? We put this QR at the gig and people follow us on social media?",
"¡Sí! Y pueden apoyarnos, comprar merchan, ver los próximos bolos y entrar en nuestra web.":
    "Yes! And they can support us, buy merch, see the next gigs and visit our website.",
"Y dejan su correo, con su permiso, y se llevan un regalo: un descuento o una descarga.":
    "And they leave their email, with their permission, and get a gift: a discount or a download.",
"¿Una lista de gente que nos quiere de verdad? ¡Dónde firmo, che!":
    "A list of people who really love us? Where do I sign, che!",
"¿Y esto qué es?":
    "And what's this?",
"Un generador de reels para Instagram, TikTok y Yutub, hecho con inteligencia artificial.":
    "A reel generator for Instagram, TikTok and YouTube, made with artificial intelligence.",
"¿O sea que le subes el concierto entero y te saca los trozos más virales?":
    "So you upload the whole concert and it pulls out the most viral clips?",
"¡Eso es! Y los deja listos, con el formato de cada red.":
    "That's it! And it leaves them ready, in each platform's format.",
"¿Y luego los subimos a mano?":
    "And then we upload them by hand?",
"Qué va. Programas cada reel en cada red, con su día y su hora.":
    "No way. You schedule every reel on every network, with its day and time.",
"Con la grabación entera del bolo de la Ribeira, la inteligencia artificial separa las canciones de lo que hablamos con el público.":
    "With the full recording of the Ribeira gig, the AI separates the songs from what we say to the crowd.",
"¡Un disco en vivo, sin mis chistes malos! ¡Qué genio!":
    "A live album without my bad jokes! What a genius!",
"Y sin la balada que vació el bar.":
    "And without the ballad that emptied the bar.",
"Y al final, lo que nunca nos cuadra: las cuentas.":
    "And finally, the thing that never adds up: the money.",
"Aquí está lo que entra por cada bolo, los gastos, y lo que le toca a cada uno.":
    "Here's what comes in from each gig, the expenses, and what each one gets. On a single screen.",
"¡Las cuentas claras! ¡Y salen números positivos!":
    "Clear accounts! And they're positive! For the first time in this band's history!",
"Y para las giras le meteré algo tipo Traicaunt, para que Brais no nos haga el lío de las birras.":
    "And for tours, I'll add something like Tricount, so Brais doesn't mess up the beer money like always.",
"¡Oye! ¡Que fue solo una vez!":
    "Hey! That only happened once!",
"Y hay más, chavales: los medios de comunicación, las métricas de redes, tu discografía de Spótifai, las ideas de cada canción, la ficha de cada bolo… Todo en la misma app.":
    "And there's more, guys: media outlets, social media metrics, your Spotify discography, the ideas for each song, each gig's sheet… All in the same app.",
"Vale, ya lo tengo: es una base de datos de salas. Con cosas.":
    "Right, got it: it's a database of venues. With extras.",
"Casi, tío. Casi.":
    "Almost, man. Almost.",
"¡Pero si no le falta de nada!":
    "It's missing nothing!",
"¿Pero cuándo has podido hacer todo esto, si estás con tus dos hijas?":
    "But when did you have time to do all this, if you're with your two daughters?",
"Han sido unos meses duros, la verdad.":
    "It's been a rough few months, honestly.",
"¡Y encima Netflix me ha pedido una peli documental sobre Band Mánayer! ¡Estoy flipando!":
    "And on top of that, Netflix asked me for a documentary about BandManager! I can't believe it!",
"¡Sos un genio, Iago! ¡Yo voy a la alfombra roja con la camisa de flores!":
    "You're a genius, Iago! I'm walking the red carpet in my flowered shirt!",
"Pero no me da la vida, chavales. Quiero estar con mi familia y con vosotros.":
    "But I can't do it all, guys. I want to be there for my family and for you.",
"Pero, ¿cuándo, Iago? ¿A qué hora, si no paras?":
    "But when, Iago? What time, if you never stop?",
"Casi siempre de noche, cuando las niñas ya dormían. Cerraba el portátil, las miraba un momento… y volvía a abrirlo.":
    "Almost always at night, when the girls were already asleep. I'd close the laptop, look at them for a moment… and open it again.",
"Neno… no teníamos ni idea.":
    "Neno… we had no idea.",
"Y nosotros, discutiendo por las birras.":
    "And we were arguing about beers.",
"Gracias, Iago. De verdad.":
    "Thank you, Iago. Truly.",
"Iago, esto es una locura. Lo necesitan todos los grupos, los mánayers, las productoras.":
    "Iago, this is crazy. Every band needs it, every manager, every production company.",
"¡Pero neno, te vas a forrar! Ya te veo en Miami, en descapotable.":
    "But neno, you're going to be rich! I can already see you in Miami, in a convertible.",
"Si me hago rico, una buena parte va para la banda. ¡Os Herdeiros do Código lo va a petar, chavales!":
    "If I get rich, a good part goes to the band. Os Herdeiros do Código is going to blow up, guys!",
"¿Una buena parte de cuánto? Que yo de porcentajes ya sé un rato.":
    "A good part of how much? I know a thing or two about percentages.",
"Vamos por partes, chavales.":
    "Let's take it step by step, guys.",
"Primero, que se entere todo el mundo. Por eso me acabo de apuntar al máster de Marketing Digital de la Big Scul.":
    "First, let everyone know. That's why I just enrolled in The Big School's Digital Marketing master's.",
"¿Otro máster? Pero home, ¿tú cuándo duermes?":
    "Another master's? Home, when do you sleep?",
"Dormir está en mi lista de pendientes, neno. Y sale más barato que darle el treinta por ciento a Peláez.":
    "Sleeping is on my to-do list, neno. And it's cheaper than giving thirty percent to Peláez.",
"Hay dos tipos de cliente. El primero, be tu ci: las bandas, los músicos, los deyeis y los solistas. O sea, nosotros.":
    "There are two kinds of customer. First, B2C: bands, musicians, DJs and solo artists. That is, us.",
"¿Y el be tu bi? ¿Eso qué es, un grupo coreano?":
    "And B2B? What's that, a Korean group?",
"No, Brais: be tu bi son los profesionales. Los mánayers y las agencias, y las salas y festivales, que son los que programan.":
    "No, Brais: B2B are the professionals. Managers and agencies, and the venues and festivals that do the booking.",
"Y si es fácil trabajar con nosotros, contestan antes. Mirad El Faro: treinta y cinco minutos.":
    "And if we're easy to work with, they answer sooner. Look at El Faro: thirty-five minutes.",
"¿Y de qué vivimos, entonces? ¿De los aplausos?":
    "So what do we live on, then? Applause?",
"De dos motores. Una suscripción por banda, con seis planes. Y el apoyo voluntario de quien use la app.":
    "Two engines. A per-band subscription, with six plans. And voluntary support from whoever uses the app.",
"¿Y cuánto es ese apoyo? ¿Más o menos que Peláez?":
    "And how much is that support? More or less than Peláez?",
"Muchísimo menos: lo que cada uno quiera. Ya lo he habilitado, para pagar la inteligencia artificial y los servidores.":
    "A lot less: whatever each person wants. I've already enabled it, to pay for the AI and the servers.",
"Y ahora, lo que viene: probarlo con una banda real. La nuestra.":
    "And now, what's next: trying it with a real band. Ours.",
"¡Iago! ¡El móvil! ¡El Resurrécshon Fest acaba de abrir el dossier!":
    "Iago! The phone! Resurrection Fest just opened the dossier!",
"Tres veces en una hora. Eso es que están leyendo. Y el cartel cierra… ahora.":
    "Three times in one hour. That means they're reading. And the lineup closes… now.",
"Cinco minutos, chicos. El ráider está en el camerino, tal y como firmamos. Y croquetas.":
    "Five minutes, guys. The rider is in the dressing room, as signed. And croquettes.",
"Iago, soy Peláez. Os estoy viendo desde la mesa de mezclas. Mi oferta sigue en pie: el treinta por ciento.":
    "Iago, it's Peláez. I'm watching you from the mixing desk. My offer still stands: thirty percent.",
"Gracias, Peláez. Pero los bolos ya los llevamos nosotros. Y el repertorio, también.":
    "Thanks, Peláez. But we already run our own gigs. And our own setlist, too.",
"Escuchad ahí fuera. La app organiza, chavales. Pero esto lo hacéis vosotros.":
    "Listen out there. The app organises, guys. But this you do yourselves.",
"Hace seis meses no sabíamos ni quién contestaba a las salas. Y miradnos ahora. ¡Un, dos, tres, cuatro!":
    "Six months ago we didn't even know who was answering the venues. Look at us now. One, two, three, four!",
"Buenos días, rockeros. Esto es Radio Riff. Una banda que casi se separa por no saber ni quién contestaba el correo acaba de tocar en el Resurrécshon Fest. ¿El secreto? Su bajista, Iago, y la app que ha creado: Band Mánayer punto io.":
    "Good morning, rockers. This is Radio Riff. A band that nearly split up because nobody knew who was answering the email has just played Resurrection Fest. The secret? Their bassist, Iago, and the app he built: BandManager dot io.",
"¿Alguien ha contestado a la sala del catorce?":
    "Has anyone answered the room on the 14th?",
"Cerrao y bien cerrao, chaval. Mirad el calendario.":
    "All sorted, mate. Look at the calendar.",
"Entonces, ensayamos el sábado. Y el miércoles, con los metaleros. ¡Rocanrol!":
    "So, we rehearse on Saturday. And on Wednesday, with the metalheads. Rock and roll!",
"Traidor.":
    "Traitor.",
"Y ahora, Brais, un reto. No para el batería de esta historia: para ti, el de verdad.":
    "And now, Brais, a challenge. Not for the drummer of this story: for you, the real one.",
"Te he preparado el sétlist del primer ensayo de Máster of Prompts. Metal, con letras de coña sobre programar.":
    "I've prepared the setlist for the first rehearsal of Master of Prompts. Metal, with joke lyrics about programming.",
"Y te lo mando como lo mandamos todo: la IA lo redacta, yo lo repaso, y… enviado.":
    "And I'm sending it the way we send everything: the AI writes it, I review it, and… sent.",
"Yo había dejado de tocar. Este máster me devolvió las ganas.":
    "I'd stopped playing. This master's gave me the urge back.",
"Nos falta batería, Brais. Y es tuya: solo tienes que decir que sí.":
    "We need a drummer, Brais. And it's yours: you just have to say yes.",
"Gracias, Brais. Y gracias a todo el profesorado de la Big Scul, por un máster que acaba en una aplicación de verdad.":
    "Thank you, Brais. And thanks to all the faculty at The Big School, for a master's that ends in a real application.",
"Y la invitación sigue en pie. Y es solo para ti. Un batería tan bueno no se deja escapar.":
    "And the invitation still stands. And it's only for you. A drummer this good doesn't get away.",
"Ensayamos el sábado. Te llevo tu sétlist. Tu hoja, con tus notas. Solo las tuyas.":
    "We rehearse on Saturday. I'll bring your setlist. Your sheet, with your notes. Only yours.",
"¿Ya se ha acabado la peli? ¿Y quién paga las birras de la fiesta?":
    "Is the movie over already? And who's paying for the party's beers?",
"Lo de dividir gastos está en mi lista de pendientes, Brais. Justo debajo de cobrarte las birras.":
    "Splitting costs is on my to-do list, Brais. Right below charging you for the beers.",
"¡Pues que las pague la inteligencia artificial!":
    "Let the AI pay for them!",
"Propuesta: las paga Brais. Pero tú decides, Iago.":
    "Proposal: Brais pays. But you decide, Iago.",
"Idea loca: que las pague Peláez. Con su treinta por ciento.":
    "Crazy idea: let Peláez pay. With his thirty percent.",
"Acaba de escribirme Netflix. Quieren más planos del batería y menos del bajista.":
    "Netflix just wrote to me. They want more shots of the drummer and fewer of the bassist.",
"¡Estos de Netflix tienen ojo, chaval!":
    "Those Netflix people have an eye, mate!",
"Brais… la peli va de mí.":
    "Brais… the movie is about me.",
"Por cierto, el miércoles ensayo con Máster of Prompts. ¿A qué hora era?":
    "By the way, on Wednesday I rehearse with Master of Prompts. What time was it?",
"Mira el calendario, Brais. Mira el calendario.":
    "Check the calendar, Brais. Check the calendar.",
"Casi nos separamos. Y no fue por la música. Ni por las birras… Bueno, un poco por las birras.":
    "We almost broke up. And it wasn't the music. Or the beers… Well, a bit the beers.",
"Fue por un correo, che. Un correo que no contestó nadie.":
    "It was an email, che. An email nobody answered.",
"Herdeiros. Os escribí hace tres meses, y nadie contestó. Me quedo el treinta por ciento, y el repertorio lo decido yo. Y fuera baladas.":
    "Herdeiros. I wrote to you three months ago and nobody answered. I take thirty percent, and I pick the setlist. And no ballads.",
"Treinta por ciento, tío. Y elegir lo que tocamos. Eso no es un mánayer: es un okupa.":
    "Thirty percent, man. And choosing what we play. That's not a manager: that's a squatter.",
"Hecho, tronco. Empezamos esta noche. Y no se lo decimos a nadie.":
    "Deal, mate. We start tonight. And we don't tell anyone.",
"No se lo conté a nadie. Si salía mal, mejor que siguieran pensando que el bajo no se oye.":
    "I didn't tell anyone. If it went wrong, better they kept thinking you can't hear the bass.",
"Me llegan cien correos a la semana. Ese era el único con fecha, dossier y ráider. Contesté antes de acabarme el café.":
    "I get a hundred emails a week. That was the only one with a date, a press kit and a rider. I replied before I'd finished my coffee.",
"Treinta y cinco minutos, neno. Yo tardo más en contestar al guasap de mi madre.":
    "Thirty-five minutes, neno. It takes me longer to answer my mum on WhatsApp.",
"Y la mía, con el tono de cada tema, che.":
    "And mine, with the key of every song, che.",
"Doce años cantando, che. Y me vengo a enterar en un local de ensayo de en qué tono canto.":
    "Twelve years singing, che. And I find out in a rehearsal room what key I sing in.",
"Sigue cantando en el que le da la gana. Pero ahora, por lo menos, sale en la hoja.":
    "He still sings in whatever key he likes. But at least now it's on the sheet.",
"Antes, nuestra única fan era mi madre. Ahora tenemos una lista entera. Ella sigue siendo la más pesada.":
    "Our only fan used to be my mum. Now we've got a whole list. She's still the most annoying one.",
"¿Pero cuándo has podido hacer todo esto, Iago? Con el curro, y dos niñas en casa.":
    "But when did you manage to do all this, Iago? With your job, and two little girls at home.",
"Luego miré el historial del código. La hora de cada cambio. Las dos… Las tres… Las cinco menos diez. Y el sábado a las once estaba en el local. El primero. Con los cafés.":
    "Later I looked at the code history. The time of every change. Two a.m.… Three… Ten to five. And on Saturday at eleven he was at the rehearsal room. First one there. With the coffees.",
"No, Brais: los profesionales. Mánayers, agencias, salas y festivales. Si trabajar con nosotros es fácil, contestan antes. Mirad El Faro.":
    "No, Brais: the professionals. Managers, agencies, venues and festivals. If we're easy to work with, they answer sooner. Look at El Faro.",
"Cinco minutos, chicos. Me han pedido que os avise yo: fui el primero en contestaros. El ráider, en el camerino, como firmamos. Y croquetas.":
    "Five minutes, guys. They asked me to be the one to tell you: I was the first to answer you. The rider's in the dressing room, as we signed. And croquetas.",
"Y esta noche, che… abrimos con la balada.":
    "And tonight, che… we open with the ballad.",
"Sigo pensando que el treinta por ciento era un precio justo. Por cierto… ¿esa app cómo se descarga?":
    "I still think thirty percent was a fair price. By the way… how do you download that app?",
"Esta historia me la he inventado un poco. La banda, el festival, Peláez… Lo que no me he inventado son las noches.":
    "I made this story up, a little. The band, the festival, Peláez… What I didn't make up are the nights.",
"Y la app me avisó en el momento en que lo abrió. Yo, mirando el móvil como un adolescente, che.":
    "And the app pinged me the moment he opened it. Me, staring at my phone like a teenager, che.",
"El calendario me avisa si mis dos bandas se pisan. Es el mejor mánayer que he tenido.":
    "The calendar warns me when my two bands clash. Best manager I've ever had.",
"Y los reels: subes el concierto entero, y la inteligencia artificial te saca los mejores trozos. Yo solo tuve que salir guapo.":
    "And the reels: you upload the whole gig and the AI picks the best bits. All I had to do was look good.",
"El bajista soy yo. Necesito volver a tocar.":
    "I'm the bassist. I need to play again.",
"Toqué en varios grupos, y los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado. Hice Band Mánayer para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.":
    "I played in several bands, and left them one by one: no organisation, no management, no time, we weren't going anywhere. I built BandManager to get back on a stage, in front of thousands of people, and make them enjoy our music.",
"Y ya estamos montando un grupo de metal. Nos falta batería… Con muchísima ilusión, y sabiendo que con Band Mánayer toda la gestión va a ir rodada.":
    "And we're already putting together a metal band. We need a drummer… With huge excitement, and knowing that with BandManager the whole management side will run smoothly.",
"Y quién sabe si el día de mañana a mis hijas les da por formar sus grupos… y esto les ayuda a que los comienzos sean mucho más fáciles. Un sueño hecho realidad.":
    "And who knows, one day my daughters might want to start their own bands… and this makes their beginnings so much easier. A dream come true.",
"No, Brais: los que llevan a varias bandas. Mánayers, agencias y productoras. Para ellos, una cuenta con todas sus bandas, y planes de empresa, más caros.":
    "No, Brais: the ones who run several bands. Managers, agencies and production companies. For them, one account with all their bands, and business plans at a higher price.",
"Las salas y los festivales no son clientes: son el canal. Si trabajar con nosotros es fácil, contestan antes. Mirad El Faro.":
    "Venues and festivals aren't customers: they're the channel. If we're easy to work with, they answer sooner. Look at El Faro.",
"¡Iago! ¡Nos han contestado! ¡Estamos dentro!":
    "Iago! They answered us! We're in!",
"¡¿Escenario principal?! ¡Che, escenario principal!":
    "The main stage?! Che, the main stage!",
"Vale. Pero que haya croquetas en el camerino.":
    "Fine, but there'd better be croquetas in the dressing room.",
"Esta vez, nos han contestado.":
    "This time, they answered us.",
"¡Pará, pará, pará! ¿Esto lo hiciste vos? ¿El bajista? ¡Pero esto es de empresa grande, boludo!":
    "Wait, wait, wait! You made this? The bassist? But this is big-company stuff, man!",
"Con un poco de ayuda. Aquí están las salas y festivales, y cada conversación queda guardada. Ni una sala se pierde ya.":
    "With a little help. Here are the venues and festivals, and every conversation is saved. Not one venue gets lost anymore.",
"¡Una base de datos de salas! ¡Te lo dije, tío! ¡Te lo dije! ¡Soy un vidente, soy Nostradamus con pedales!":
    "A venue database! I told you, man! I told you! I'm a seer, I'm Nostradamus with pedals!",
"¡Todas las salas de España en un mapa! ¡Y yo, con el Excel de las siete versiones, llorando!":
    "Every venue in Spain on one map! And me, with the seven-version Excel, crying!",
"¡Ha escrito a tres salas y al Resurrécshon Fest mientras yo afinaba! ¡Mientras yo afinaba, tío! ¡Esto es magia negra!":
    "He wrote to three venues and Resurrection Fest while I was tuning! While I was tuning, man! This is black magic!",
"¡Pero qué bonito! ¡Si parece el correo de una agencia de verdad! ¡De las que cobran el treinta por ciento!":
    "How beautiful! It looks like an email from a real agency! The kind that takes thirty percent!",
"¡Y yo, que firmaba los correos con un besito, boludo! ¡Ahora tengo hasta cargo!":
    "And I used to sign emails with a little kiss, man! Now I even have a job title!",
"¡Ché, cambió todo! ¡El logo, el calendario, hasta las salas! ¡Esto es magia, boludo, magia!":
    "Che, everything changed! The logo, the calendar, even the venues! This is magic, man, magic!",
"¡Se acabaron las sorpresas el día del bolo! ¡Todo firmado, todo por escrito! ¡Ya no cobramos en croquetas!":
    "No more surprises on gig day! Everything signed, everything in writing! We're done getting paid in croquettes!",
"¡Y la mía, con el tono de cada tema, che! ¡Esto es de banda de estadio!":
    "And mine, with the key of every song, che! This is stadium-band stuff!",
"¡Mi hoja, con mis notas! ¡Solo las mías! ¡Nunca había tenido una hoja propia en mi vida!":
    "My sheet, with my notes! Only mine! I'd never had a sheet of my own in my life!",
"Esto ya no es un local de ensayo, es una discográfica. ¡Una que no se queda el treinta por ciento! ¡Que alguien me pellizque!":
    "This isn't a rehearsal room anymore, it's a record label. One that doesn't take thirty percent! Somebody pinch me!",
"¿Una lista de gente que nos quiere de verdad? ¡Dónde firmo, che! ¡Esto es oro puro!":
    "A list of people who really love us? Where do I sign, che! This is pure gold!",
"¿O sea que le subes el concierto entero y te saca los trozos más virales? ¿Incluido mi solo de batería? ¡Ai, mi madriña!":
    "So you upload the whole gig and it picks out the most viral bits? Including my drum solo? Oh my goodness!",
"¡Esto es tener un equipo de marketing entero metido en el bolsillo!":
    "This is having a whole marketing team in your pocket!",
"¡Las cuentas claras! ¡Y salen números positivos! ¡Por primera vez en la historia de esta banda!":
    "The books are clear! And the numbers are positive! For the first time in this band's history!",
"¡Pero si no le falta de nada! ¡Es la navaja suiza de las bandas!":
    "It's missing nothing! It's the Swiss army knife of bands!",
"Iago, esto es una locura. Lo necesitan todos los grupos, los mánayers, las productoras. ¡Todos!":
    "Iago, this is crazy. Every band needs it, the managers, the production companies. Everyone!",
"¿Y si no sé qué escala tocar encima? Porque yo improviso por intuición. Y mi intuición desafina.":
    "What if I don't know which scale to play over it? I improvise by instinct. And my instinct is out of tune.",
"Para eso está el profesor de armonía. Lee los acordes de la canción, y te explica cómo funciona.":
    "That's what the harmony teacher is for. It reads the song's chords and explains how it works.",
"Le dices tu nivel y tu instrumento, y te sugiere qué escala usar para improvisar. Y cómo componer encima.":
    "You tell it your level and your instrument, and it suggests which scale to improvise with. And how to compose over it.",
"¡Pentatónica menor de Mi, y a volar! ¡Me acaba de arreglar el solo! ¡Me acaba de arreglar la vida!":
    "E minor pentatonic, and off we go! It just fixed my solo! It just fixed my life!",
"Eso sí: te lo marca como idea, no como verdad. Las notas las saca la app. La inteligencia artificial solo te las explica.":
    "One thing: it marks it as an idea, not as the truth. The app works out the notes. The AI only explains them.",
"Oye… ¿y si me coinciden dos ensayos a la vez? Uno con cada banda.":
    "Hey… what if two rehearsals clash? One with each band.",
"El calendario te avisa. Si dos eventos se pisan, si no da tiempo a llegar de un sitio a otro, o si vas justo para montar.":
    "The calendar warns you. If two events overlap, if you can't make it from one place to the other, or if you're cutting it fine to set up.",
"¡Ai, mi madriña! ¡Me acaba de salvar el miércoles! ¡Esto vale su peso en oro, neno!":
    "Oh my goodness! It just saved my Wednesday! This is worth its weight in gold, mate!",
"El miércoles. El de los metaleros, ¿no, traidor?":
    "Wednesday. The metalheads' one, right, traitor?",
"Y solo avisa cuando hay una persona en los dos sitios. Si no, no te molesta.":
    "And it only warns you when the same person is in both places. Otherwise, it doesn't bother you.",
"¡Esto es como Tinder, pero para bandas! ¡Y sin tener que hablar con nadie!":
    "This is like Tinder, but for bands! And without having to talk to anyone!",
"Home, ¿y la gasolina de la furgo y de mi coche? Que la última gira la puse yo. Creo.":
    "Hey, what about the petrol for the van and my car? I paid for the last tour. I think.",
"Metes los coches que van en ruta, con su consumo, y te calcula la gasolina de cada parada.":
    "You add the cars on the route, with their consumption, and it works out the petrol for each stop.",
"Y te dice lo que queda limpio de cada bolo, después de gasolina, dietas y hotel.":
    "And it tells you what's left clean from each gig, after petrol, meals and hotel.",
"¡Ni una discusión más en la gasolinera! ¡Esto es amor, tío, amor!":
    "Not one more argument at the petrol station! This is love, mate, love!",
}

def main():
    import revision
    vistas, es = set(), []
    for e in revision.escenas():
        if e['anexo']:
            continue
        for f in e['frases']:
            t = re.sub(r'\[[^\]]*\]\s*', '', f['say']).strip()
            if t not in vistas:
                vistas.add(t); es.append(t)
    falta = [t for t in es if t not in EN]
    for t in falta:
        print('⚠ sin traducción (sale en español):', t)
    mapa = {t: EN[t] for t in es if t in EN}
    open(os.path.join(DECK, 'subs-en.js'), 'w', encoding='utf-8').write('window.SUBS_EN = ' + json.dumps(mapa, ensure_ascii=False, indent=0) + ';\n')
    print('subs-en.js:', len(mapa), 'frases', f'({len(falta)} sin traducir)' if falta else '')

if __name__ == '__main__':
    main()
