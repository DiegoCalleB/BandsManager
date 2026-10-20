# Salas de conciertos pendientes de verificar

Lista de trabajo para contrastar y ampliar el catálogo de salas (`catalogo_salas`, ADR 0044 y 0046). Procede de un listado por comunidades
que **no está verificado** (apariencia de generado por IA: puede incluir salas cerradas, con el nombre mal escrito o que ya no programan música en
directo). Por eso **no se ha insertado nada en la base**: lo que hay en `catalogo_salas` alimenta las sugerencias a las bandas y a los agentes, y
una sala inexistente es un email que rebota.

Una sala pasa al catálogo solo cuando alguien comprueba en su web oficial (o en Google Maps) que existe, dónde está y que programa conciertos, y
anota la fuente y la fecha. Los contactos no se guardan aquí: los resuelve el catálogo.

**Contraste del 2026-10-19 con producción:** 195 entradas, 44 probablemente ya están en el catálogo y 151 no aparecen.
La coincidencia es aproximada (nombre sin «sala/club/teatro…» y ciudad); la clave real de identidad es `claveSala` (nombre + ciudad
exactos), así que algunas «ya está» se crearían igualmente como duplicados si se insertasen tal cual (p. ej. «Sala El Sol» frente a «El Sol»).
Revísalas a mano antes de fusionar.

| Comunidad | Zona o ciudad | Sala (como en la lista) | En el catálogo | Estado |
|---|---|---|---|---|
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Sala El Sol | El Sol (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Siroco | Siroco (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Wurlitzer Ballroom | Wurlitzer (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Café La Palma | Café La Palma (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Sala Clamores | Clamores (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | El Intruso | Intruso Bar (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Maravillas Club | Maravillas Club (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Sala Vesta | Vesta (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Tempo Club | Tempo Audiophile Club (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | BarCo Bar | BarCo (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Sala 0 (Palacio de la Prensa) | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Ruidismo Club | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Centro / Malasaña / Chueca / Sol | Sala BarCo | BarCo (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | La Riviera | La Riviera (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Mon Live (Antigua Penelope) | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Sala Copérnico | Copérnico (The Club) (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Gruta 77 | Gruta 77 (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Sala Loading | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Moby Dick Club | Moby Dick Club (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Sala Caracol (Histórica) | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Norte / Cuatro Caminos / Tetuán / Chamartín | Wizink Center (Recinto masivo) | WiZink Center (La Sala / Pista) (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | Independiente Club | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | Sala Live! (Carabanchel) | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | Rock Palace | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | Barracudas Rock Bar | — | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | El Perro de la Parte de Atrás del Coche | El Perro de la Parte de Atrás del Coche (Madrid) | pendiente |
| Comunidad de Madrid | Madrid Capital · Sur / Este / Periferia y Otros Barrios | Sala Creedence | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Alcalá de Henares | Sala Green | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Alcalá de Henares | Teatro Salón Cervantes | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Alcalá de Henares | Vaya Vaya | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Móstoles / Alcorcón / Fuenlabrada | Sala Custom Sur | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Móstoles / Alcorcón / Fuenlabrada | Teatro Municipal de Tías | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Getafe / Leganés | Rock & Rolla | — | pendiente |
| Comunidad de Madrid | Comunidad de Madrid (Municipios) · Getafe / Leganés | Teatro Rigoberta Menchú | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Razzmatazz (Salas 1, 2, 3 y 4) | Razzmatazz (Sala 2) (Barcelona) | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Sala Apolo / La [2] de Apolo | Apolo (Barcelona) | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Sidecar | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Almo2bar | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | La Paloma | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Sala Upload (Poble Espanyol) | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Vol | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Freedonia | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Aclam Club | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Big Bang Bar | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Taro | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Nevermind (Bar/Club directo) | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Paral·lel 62 (Antiguo Teatre Apolo) | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Jamboree (Jazz & Live) | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Koitton Club | — | pendiente |
| Cataluña | Barcelona Capital · Gràcia / Eixample / Poble Sec / Ciutat Vella | Nevermind Raval | — | pendiente |
| Cataluña | Barcelona Capital · Grandes Recintos Barcelona | Palau Sant Jordi / Sant Jordi Club | — | pendiente |
| Cataluña | Barcelona Capital · Grandes Recintos Barcelona | CCIB (Centre de Convencions Internacional de Barcelona) | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Girona | La Mirona (Salt) | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Girona | Teatre Municipal de Girona | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Girona | El Groove | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Girona | Sala Platea | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Lleida | Cafè del Teatre de l'Escorxador | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Lleida | Sala Manolita | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Lleida | Cotton Club Lleida | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Tarragona / Reus | Sala Zero | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Tarragona / Reus | Lo Submarino (Ramon) | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Tarragona / Reus | Sala Gatzara | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Tarragona / Reus | La Palma de Reus | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Vic / Manresa / Sabadell / Terrassa | L'Auditori de Vic | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Vic / Manresa / Sabadell / Terrassa | Stroika (Manresa) | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Vic / Manresa / Sabadell / Terrassa | Sala 2046 (Sabadell) | — | pendiente |
| Cataluña | Provincia de Barcelona y Resto de Cataluña · Vic / Manresa / Sabadell / Terrassa | Faktoria d'Arts (Terrassa) | — | pendiente |
| Andalucía | Sevilla | Sala X | — | pendiente |
| Andalucía | Sevilla | Sala Custom | Custom (Sevilla) | pendiente |
| Andalucía | Sevilla | Malandar Music Club | — | pendiente |
| Andalucía | Sevilla | La Carbonería | — | pendiente |
| Andalucía | Sevilla | Sala Even | — | pendiente |
| Andalucía | Sevilla | Long Rock Sevilla | — | pendiente |
| Andalucía | Sevilla | Cartuja Center CITE | — | pendiente |
| Andalucía | Málaga y Costa del Sol | Paris 15 | — | pendiente |
| Andalucía | Málaga y Costa del Sol | Sala Trinchera | Trinchera (Málaga) | pendiente |
| Andalucía | Málaga y Costa del Sol | Velvet Club | — | pendiente |
| Andalucía | Málaga y Costa del Sol | Cochera Cabaret | — | pendiente |
| Andalucía | Málaga y Costa del Sol | Sala Eventual Music | — | pendiente |
| Andalucía | Málaga y Costa del Sol | Sala Hangar (Málaga) | — | pendiente |
| Andalucía | Granada | Industrial Copera | Industrial Copera (Clubbing & Live Set) (Granada) | pendiente |
| Andalucía | Granada | Planta Baja | — | pendiente |
| Andalucía | Granada | Lemon Rock Bar & Hostel | — | pendiente |
| Andalucía | Granada | Sala El Tren | El Tren (Granada) | pendiente |
| Andalucía | Granada | Boogaloo Club | — | pendiente |
| Andalucía | Granada | RockNRolla Granada | — | pendiente |
| Andalucía | Cádiz y Provincia | Momart Sala Club (Cádiz) | Momart Theatre (Cádiz) | pendiente |
| Andalucía | Cádiz y Provincia | Supersonic (Jerez de la Frontera) | — | pendiente |
| Andalucía | Cádiz y Provincia | Sala Pelícano (Cádiz) | — | pendiente |
| Andalucía | Cádiz y Provincia | El Gramófono (Algeciras) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Ambigú Axerquía (Córdoba) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Sala M100 (Córdoba) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Madchester Club (Almería) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Berlín Social Club (Almería) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Rock States (Jaén) | — | pendiente |
| Andalucía | Córdoba, Almería y Jaén | Sala Kharma (Jaén) | — | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Kafe Antzokia | Kafe Antzokia (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Santana 27 (Fever Club) | Santana 27 (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Cotton Club | Cotton Club Bilbao (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Stage Live | Stage Live (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Muelle Bilbao | — | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Azkena Bilbo | Azkena (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Bilborock | Bilborock (Bilbao) | pendiente |
| País Vasco y Navarra | Vizcaya (Bilbao y alrededores) | Sala Shake! | — | pendiente |
| País Vasco y Navarra | Guipúzcoa (San Sebastián / Donostia) | Dabadaba | — | pendiente |
| País Vasco y Navarra | Guipúzcoa (San Sebastián / Donostia) | Intxaurrondo K.E. | — | pendiente |
| País Vasco y Navarra | Guipúzcoa (San Sebastián / Donostia) | Kutxa Beltza (Gaba) | — | pendiente |
| País Vasco y Navarra | Guipúzcoa (San Sebastián / Donostia) | Victoria Eugenia Antzokia | — | pendiente |
| País Vasco y Navarra | Guipúzcoa (San Sebastián / Donostia) | Bukowski Bar | — | pendiente |
| País Vasco y Navarra | Álava (Vitoria-Gasteiz) | Hell Dorado | — | pendiente |
| País Vasco y Navarra | Álava (Vitoria-Gasteiz) | Urban Rock Concept | — | pendiente |
| País Vasco y Navarra | Álava (Vitoria-Gasteiz) | Jimmy Jazz Gasteiz | Jimmy Jazz Gasteiz (Vitoria-Gasteiz) | pendiente |
| País Vasco y Navarra | Álava (Vitoria-Gasteiz) | Helldorado Club | — | pendiente |
| País Vasco y Navarra | Navarra (Pamplona / Iruña) | Totem Aretoa (Villava) | — | pendiente |
| País Vasco y Navarra | Navarra (Pamplona / Iruña) | Zentral Kafe Antzokia | — | pendiente |
| País Vasco y Navarra | Navarra (Pamplona / Iruña) | El Infiernito Guitar Shop | — | pendiente |
| País Vasco y Navarra | Navarra (Pamplona / Iruña) | Garazi Taberna | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | 16 Toneladas | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Loco Club | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Jerusalem Club | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Sala Repvblicca (Mislata) | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | El Volcán | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Peter Rock | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Sala Moon | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Auditori de Burjassot | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Rock City (Almàssera) | — | pendiente |
| Comunidad Valenciana y Murcia | Valencia Capital y Provincia | Wah Wah Club (Histórica / Reconfigurada) | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Stereo Alicante | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Sala The One (San Vicente del Raspeig) | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Las Cigarreras (Centro Cultural) | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Magma Club | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Sala Marearock (Alicante) | — | pendiente |
| Comunidad Valenciana y Murcia | Alicante y Provincia (Elche, Benidorm, etc.) | Discoteca Penélope / KM (Benidorm - formatos live) | — | pendiente |
| Comunidad Valenciana y Murcia | Castellón | Sala Four Seasons | — | pendiente |
| Comunidad Valenciana y Murcia | Castellón | Opal | — | pendiente |
| Comunidad Valenciana y Murcia | Castellón | Terra (Castellón) | — | pendiente |
| Comunidad Valenciana y Murcia | Región de Murcia | Garaje Beat Club | — | pendiente |
| Comunidad Valenciana y Murcia | Región de Murcia | 12 & Medio | — | pendiente |
| Comunidad Valenciana y Murcia | Región de Murcia | Revolver Club | — | pendiente |
| Comunidad Valenciana y Murcia | Región de Murcia | Sala REM | REM (Murcia) | pendiente |
| Comunidad Valenciana y Murcia | Región de Murcia | Teatro Circo Murcia | — | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | Sala López | López (Zaragoza) | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | Las Armas | — | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | Rock & Blues Café | — | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | Oasis Club Teatro | — | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | Sala Creedence Zaragoza | Creedence (Zaragoza) | pendiente |
| Aragón, La Rioja y Cantabria | Zaragoza | El Zorro Ceniciento | — | pendiente |
| Aragón, La Rioja y Cantabria | Huesca y Teruel | El Veintiuno (Huesca) | — | pendiente |
| Aragón, La Rioja y Cantabria | Huesca y Teruel | Sala Corleone (Sabiñánigo) | — | pendiente |
| Aragón, La Rioja y Cantabria | Huesca y Teruel | El Sótano (Teruel) | — | pendiente |
| Aragón, La Rioja y Cantabria | La Rioja (Logroño) | Sala Fundición | — | pendiente |
| Aragón, La Rioja y Cantabria | La Rioja (Logroño) | Stereorock | — | pendiente |
| Aragón, La Rioja y Cantabria | La Rioja (Logroño) | Gota de Leche | — | pendiente |
| Aragón, La Rioja y Cantabria | Cantabria (Santander y Torrelavega) | Escenario Santander | — | pendiente |
| Aragón, La Rioja y Cantabria | Cantabria (Santander y Torrelavega) | Sala Black Bird | — | pendiente |
| Aragón, La Rioja y Cantabria | Cantabria (Santander y Torrelavega) | El Desván de la Utopía | — | pendiente |
| Aragón, La Rioja y Cantabria | Cantabria (Santander y Torrelavega) | Sala Wood | — | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Sala Mardi Gras (A Coruña) | Mardi Gras (A Coruña) | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Garufa Club (A Coruña) | Garufa Club (A Coruña) | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Inn Club (A Coruña) | Inn Club (A Coruña) | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Sala Playa Club (A Coruña) | Playa Club (A Coruña) | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Capitol (Santiago de Compostela) | Capitol (Santiago de Compostela) | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Riquela Club (Santiago de Compostela) | — | pendiente |
| Galicia y Asturias | A Coruña y Santiago de Compostela | Sala Malatesta (Santiago de Compostela) | Sala Malatesta (Santiago de Compostela) | pendiente |
| Galicia y Asturias | Vigo y Pontevedra | La Iguana Club (Vigo) | — | pendiente |
| Galicia y Asturias | Vigo y Pontevedra | Masterclub (Vigo) | Sala Masterclub (Vigo) | pendiente |
| Galicia y Asturias | Vigo y Pontevedra | La Fábrica de Chocolate (Vigo) | — | pendiente |
| Galicia y Asturias | Vigo y Pontevedra | El Náutico de San Vicente (O Grove) | El Náutico de San Vicente (O Grove) | pendiente |
| Galicia y Asturias | Vigo y Pontevedra | Teatrex (Pontevedra) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | Sala Acapulco (Gijón) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | Sala Albéniz (Gijón) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | Tribeca Live (Oviedo) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | La Salvaje (Oviedo) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | El Manglar (Gijón) | — | pendiente |
| Galicia y Asturias | Asturias (Oviedo, Gijón, Avilés) | Centro Niemeyer (Avilés) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Sala Porta Caeli (Valladolid) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | El Hangar (Burgos) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Studio 54 (León) | Studio 54 (León) | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Gran Café (León) | El Gran Café (León) | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Potemkin (Salamanca) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Café Bar Las Pistas (Salamanca) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla y León (Valladolid, Burgos, León, Salamanca) | Palíndromo (Zamora) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla-La Mancha (Toledo, Albacete, Ciudad Real) | Círculo de Arte (Toledo) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla-La Mancha (Toledo, Albacete, Ciudad Real) | Sala Pícaro (Toledo) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla-La Mancha (Toledo, Albacete, Ciudad Real) | Clandestino (Albacete) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla-La Mancha (Toledo, Albacete, Ciudad Real) | La Cachorra Ye-Yé (Albacete) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Castilla-La Mancha (Toledo, Albacete, Ciudad Real) | Zahora Magestic (Ciudad Real) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Baleares (Mallorca, Ibiza, Menorca) | Es Gremi (Palma de Mallorca) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Baleares (Mallorca, Ibiza, Menorca) | Sala Vandenberg (Palma) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Baleares (Mallorca, Ibiza, Menorca) | Can Tixedó (Ibiza) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Baleares (Mallorca, Ibiza, Menorca) | Teatre Principal de Maó (Menorca) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Canarias (Tenerife y Gran Canaria) | Aguere Espacio Cultural (La Laguna, Tenerife) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Canarias (Tenerife y Gran Canaria) | Lone Star (Santa Cruz de Tenerife) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Canarias (Tenerife y Gran Canaria) | Paper Club (Las Palmas de Gran Canaria) | — | pendiente |
| Castilla y León, Castilla-La Mancha, Baleares y Canarias | Islas Canarias (Tenerife y Gran Canaria) | Mojo Club (Las Palmas) | — | pendiente |
