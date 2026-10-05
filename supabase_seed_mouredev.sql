-- ====================================================================
-- SEED DIRECTO PARA SUPABASE POSTGRESQL (MOUREDEV / TFM)
-- ====================================================================
-- Bandas y Miembros:
-- 1. Os Herdeiros do Código (band-os-herdeiros-do-codigo) - Rock Bravú / Punk Rock
--    - Brais Moure: Batería (El motor rítmico de la banda)
--    - Alan Buscaglia: Voz principal y frontman (Pura energía escénica)
--    - Aris Guimerá: Bajo (Groove ágil y dinámico)
--    - Xavi Portilla: Guitarra solista (Punteos afilados y solos rápidos)
--    - Carlos Azaustre: Guitarra rítmica y coros (Base armónica sólida)
--
-- 2. Master of Prompts (band-master-of-prompts) - Heavy Metal / Thrash / Industrial
--    - Brais Moure: Batería de doble bombo (Pegada más pesada)
--    - Daniela Maissi: Bajo contundente (Línea de graves robusta e infranqueable)
--    - Nerea Luis: Teclados, sintetizadores y samplers IA (Atmósferas futuristas)
--    - Francisco Palomares: Guitarra solista (Ejecución milimétrica)
--    - Martín Cristóbal: Voz gutural y guitarra rítmica (Fuerza pura)
-- ====================================================================

-- 1. REGISTERED BANDS
INSERT INTO registered_bands (id, band_id, user_id, nombre_banda, email, plan, contacto_nombre, estilo_musical, localizacion, telefono, instagram, spotify_youtube, aforo_promedio, estado_cuenta, notas)
VALUES 
  (
    'reg-os-herdeiros-do-codigo',
    'band-os-herdeiros-do-codigo',
    'usr-brais-moure',
    'Os Herdeiros do Código',
    'mouredev@gmail.com',
    'cabeza_de_cartel',
    'Brais Moure',
    'Rock Bravú / Punk-Rock Galaico',
    'A Coruña (Galicia)',
    '+34 688 101 010',
    '@mouredev',
    'https://open.spotify.com/artist/mouredev',
    1500,
    'activo',
    'Banda de Rock Bravú galaico: Brais Moure (Batería), Alan Buscaglia (Voz/Frontman), Aris Guimerá (Bajo), Xavi Portilla (Guitarra Solista) y Carlos Azaustre (Guitarra Rítmica).'
  ),
  (
    'reg-master-of-prompts',
    'band-master-of-prompts',
    'usr-brais-moure',
    'Master of Prompts',
    'mouredev@gmail.com',
    'cabeza_de_cartel',
    'Brais Moure',
    'Heavy Metal / Thrash / Industrial (210 BPM)',
    'A Coruña (Galicia)',
    '+34 688 101 010',
    '@mouredev',
    'https://open.spotify.com/artist/mouredev',
    2500,
    'activo',
    'Banda de Metal Industrial/Thrash: Brais Moure (Batería doble bombo), Daniela Maissi (Bajo), Nerea Luis (Sintetizadores IA), Francisco Palomares (Guitarra Solista) y Martín Cristóbal (Voz gutural/Rítmica).'
  )
ON CONFLICT (band_id) DO UPDATE SET
  nombre_banda = EXCLUDED.nombre_banda,
  email = EXCLUDED.email,
  plan = EXCLUDED.plan,
  contacto_nombre = EXCLUDED.contacto_nombre,
  estilo_musical = EXCLUDED.estilo_musical,
  localizacion = EXCLUDED.localizacion,
  aforo_promedio = EXCLUDED.aforo_promedio,
  notas = EXCLUDED.notas;

-- 2. USUARIOS (MIEMBROS DE LAS BANDAS)
INSERT INTO users (id, username, name, role, plan, band_name, band_id, email, instrument, avatar_color)
VALUES 
  -- Os Herdeiros do Código
  ('usr-brais-moure', 'mouredev', 'Brais Moure', 'leader', 'cabeza_de_cartel', 'Os Herdeiros do Código', 'band-os-herdeiros-do-codigo', 'mouredev@gmail.com', 'Batería: El motor rítmico de la banda', '#3B82F6'),
  ('usr-alan-buscaglia', 'alanbuscaglia', 'Alan Buscaglia', 'member', 'cabeza_de_cartel', 'Os Herdeiros do Código', 'band-os-herdeiros-do-codigo', 'alan.buscaglia@devmail.com', 'Voz principal y frontman', '#EF4444'),
  ('usr-aris-guimera', 'arisguimera', 'Aris Guimerá', 'member', 'cabeza_de_cartel', 'Os Herdeiros do Código', 'band-os-herdeiros-do-codigo', 'aris.guimera@devmail.com', 'Bajo: Groove ágil y dinámico', '#10B981'),
  ('usr-xavi-portilla', 'xaviportilla', 'Xavi Portilla', 'member', 'cabeza_de_cartel', 'Os Herdeiros do Código', 'band-os-herdeiros-do-codigo', 'xavi.portilla@devmail.com', 'Guitarra solista: Punteos afilados y solos rápidos', '#F59E0B'),
  ('usr-carlos-azaustre', 'carlosazaustre', 'Carlos Azaustre', 'member', 'cabeza_de_cartel', 'Os Herdeiros do Código', 'band-os-herdeiros-do-codigo', 'carlos.azaustre@devmail.com', 'Guitarra rítmica y coros: Base armónica sólida', '#8B5CF6'),

  -- Master of Prompts
  ('usr-daniela-maissi', 'danielamaissi', 'Daniela Maissi', 'member', 'cabeza_de_cartel', 'Master of Prompts', 'band-master-of-prompts', 'daniela.maissi@metalmail.com', 'Bajo contundente: Graves robustos e infranqueables', '#EC4899'),
  ('usr-nerea-luis', 'nerealuis', 'Nerea Luis', 'member', 'cabeza_de_cartel', 'Master of Prompts', 'band-master-of-prompts', 'nerea.luis@metalmail.com', 'Teclados, sintetizadores y samplers IA', '#06B6D4'),
  ('usr-francisco-palomares', 'franciscopalomares', 'Francisco Palomares', 'member', 'cabeza_de_cartel', 'Master of Prompts', 'band-master-of-prompts', 'francisco.palomares@metalmail.com', 'Guitarra solista: Ejecución milimétrica y distorsión', '#F97316'),
  ('usr-martin-cristobal', 'martincristobal', 'Martín Cristóbal', 'member', 'cabeza_de_cartel', 'Master of Prompts', 'band-master-of-prompts', 'martin.cristobal@metalmail.com', 'Voz gutural y guitarra rítmica: Fuerza pura', '#6366F1')
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  plan = EXCLUDED.plan,
  band_name = EXCLUDED.band_name,
  band_id = EXCLUDED.band_id,
  email = EXCLUDED.email,
  instrument = EXCLUDED.instrument,
  avatar_color = EXCLUDED.avatar_color;

-- 3. USER_BANDS (ASIGNACIÓN MULTI-BANDA)
INSERT INTO user_bands (id, user_id, band_id, role)
SELECT 
  'ub-' || u.username || '-' || b.band_id,
  u.id,
  b.band_id,
  CASE WHEN u.username = 'mouredev' THEN 'leader' ELSE 'member' END
FROM users u
CROSS JOIN (
  VALUES 
    ('band-os-herdeiros-do-codigo'),
    ('band-master-of-prompts')
) AS b(band_id)
WHERE 
  (u.username = 'mouredev')
  OR (b.band_id = 'band-os-herdeiros-do-codigo' AND u.username IN ('alanbuscaglia', 'arisguimera', 'xaviportilla', 'carlosazaustre'))
  OR (b.band_id = 'band-master-of-prompts' AND u.username IN ('danielamaissi', 'nerealuis', 'franciscopalomares', 'martincristobal'))
ON CONFLICT (user_id, band_id) DO UPDATE SET
  role = EXCLUDED.role;

-- 4. EPK CONFIGS (DOSSIER WEB CON BIOGRAFÍA, MIEMBROS, VÍDEOS, RIDERS Y DATOS DE CONTRATACIÓN)
INSERT INTO epk_configs (
  band_id,
  biografia,
  logo_url,
  band_photos,
  miembros,
  rider_tecnico,
  dossier_texto_extra,
  videos,
  datos_contratacion,
  enlaces_redes,
  contacto_booking,
  temas_destacados_ids,
  incentivo_fans,
  plantilla
)
VALUES 
  (
    'band-os-herdeiros-do-codigo',
    'Os Herdeiros do Código é unha banda de Rock Bravú e Punk-Rock galaico nada en A Coruña (Galicia), formada por Brais Moure (Batería: motor rítmico), Alan Buscaglia (Voz principal e frontman), Aris Guimerá (Bajo: groove ágil), Xavi Portilla (Guitarra solista: punteos afilados) e Carlos Azaustre (Guitarra rítmica e coros: base armónica sólida). Co espírito irónico e festeiro do movemento bravú dos 90 combinado con letras sobre a cultura do software, a intelixencia artificial e a retranca galega, a banda ofrece un directo de 75 minutos arrollador pensado para desatar pogos e facer cantar a todo o público de principio a fin.',
    '/images/logo_herdeiros_do_codigo.svg',
    '["/images/logo_herdeiros_do_codigo.svg"]'::jsonb,
    '[
      {"id":"hdc-m-1","nombre":"Brais Moure","rol":"Batería","bio":"El motor rítmico de la banda, marcando el compás y los tiempos a toda velocidad.","instagram":"@mouredev"},
      {"id":"hdc-m-2","nombre":"Alan Buscaglia","rol":"Voz principal y frontman","bio":"La cara visible del grupo, pura energía escénica y entrega vocal.","instagram":"@alanbuscaglia"},
      {"id":"hdc-m-3","nombre":"Aris Guimerá","rol":"Bajo","bio":"Encargado de sostener el groove ágil y dinámico para que la banda nunca pierda tracción.","instagram":"@arisguimera"},
      {"id":"hdc-m-4","nombre":"Xavi Portilla","rol":"Guitarra solista","bio":"El responsable de los punteos más afilados y los solos rápidos.","instagram":"@xaviportilla"},
      {"id":"hdc-m-5","nombre":"Carlos Azaustre","rol":"Guitarra rítmica y coros","bio":"Aporta la base armónica sólida y la estructura constante de cada canción.","instagram":"@carlosazaustre"}
    ]'::jsonb,
    '- Batería profesional (Pearl / Tama) con bombo de 22", 2 toms aéreos, 1 goliath, caixa e 4 pés de prato (Brais Moure)
- 1 Micrófono vocal inalámbrico Shure Beta 58A para voz principal (Alan Buscaglia)
- 1 Cabezal Marshall JCM800 a válvulas con pantalla 4x12 Celestion V30 para guitarra solista (Xavi Portilla)
- 1 Amplificador Fender Twin Reverb / Hot Rod Deluxe + micro vocal para guitarra rítmica e coros (Carlos Azaustre)
- 1 Cabezal Ampeg SVT-CL a válvulas con pantalla 8x10 para baixo + Caixa de Inxección DI Radial J48 (Aris Guimerá)
- 5 Envíos de monitores independentes ou sistema IEM sen fíos
- PA mínima recomendada: 4000W RMS para salas, 12000W para festivais',
    'Dossier de Prensa & Hitos 2026:
- Cabeza de cartel en Festival Revenidas (15.000 asistentes) y Castelo Rock.
- Más de 60.000 oyentes en plataformas digitales y videoclips virales en la comunidad tech y gallega.
- Colaboraciones oficiales con Tonhito de Poi (Heredeiros da Crus) y Dakidarría.
- Presentación en salas con fechas cerradas en Sala Capitol (Santiago) y Sala Mon Live (Madrid).',
    '[
      {"id":"hdc-v-1","titulo":"Compila ou Morre (Videoclip Oficial 4K)","url":"https://youtube.com/watch?v=mouredev-compila","tipo":"youtube"},
      {"id":"hdc-v-2","titulo":"Directo no Porto de Vilaxoán (Festival Revenidas)","url":"https://youtube.com/watch?v=mouredev-revenidas-live","tipo":"youtube"}
    ]'::jsonb,
    '{
      "cache_orientativo_salas": "1.500€ - 2.200€",
      "cache_orientativo_festivales": "3.500€ - 5.000€",
      "duracion_show_minutos": 75,
      "personal_en_gira": "5 músicos + 1 técnico de sonido FOH + 1 road manager",
      "requisitos_hospitality": "Catering caliente para 7 personas, agua mineral sin gas, café, fruta y bebidas."
    }'::jsonb,
    '{"spotify":"https://open.spotify.com/artist/mouredev","youtube":"https://youtube.com/@mouredev","instagram":"https://instagram.com/mouredev","tiktok":"https://tiktok.com/@mouredev","website":"https://moure.dev","whatsapp":"+34688101010"}'::jsonb,
    '{"nombre":"Brais Moure (Management & Booking)","email":"mouredev@gmail.com","telefono":"+34 688 101 010"}'::jsonb,
    '["hdc-song-1","hdc-song-2","hdc-song-3"]'::jsonb,
    '{"mensajeAgradecimiento":"¡Moitas grazas por apoiar a Os Herdeiros do Código! Aquí tes o teu agasallo exclusivo en descarga directa.","enlaceDescarga":"https://moure.dev/descargas/compila-ou-morre-directo.flac","codigoDescuento":"BRAVU-DEV"}'::jsonb,
    'stage'
  ),
  (
    'band-master-of-prompts',
    'Master of Prompts es una apisonadora de Heavy Metal, Thrash e Industrial forjada en A Coruña (Galicia). La banda está integrada por Brais Moure (Batería de doble bombo y pegada demoledora), Martín Cristóbal (Voz gutural y guitarra rítmica), Francisco Palomares (Guitarra solista: virtuosismo y ejecución milimétrica), Daniela Maissi (Bajo contundente: línea de graves robusta e infranqueable) y Nerea Luis (Teclados, sintetizadores analógicos y samplers IA: arquitecturas sonoras futuristas).

Inspirados en la época dorada del thrash metal de 1986 (Master of Puppets, Reign in Blood) y combinando elementos industriales contemporáneos (Rammstein, Fear Factory), la propuesta escénica de Master of Prompts se distingue por una velocidad constante a 210 BPM en técnica estricta de downpicking, compases asimétricos y líricas conceptuales centradas en la arquitectura de compiladores, la ingeniería de software de bajo nivel, la concurrencia distribuida y la singularidad de la inteligencia artificial.

Con un directo de 75 minutos de intensidad ininterrumpida y una producción de sonido calibrada al milímetro, Master of Prompts se ha posicionado como una de las formaciones más originales y contundentes del metal estatal contemporáneo.',
    '/images/logo_master_of_prompts.svg',
    '["/images/logo_master_of_prompts.svg"]'::jsonb,
    '[
      {"id":"mop-m-1","nombre":"Brais Moure","rol":"Batería de doble bombo","bio":"Haciendo doblete al fondo del escenario para castigar los parches con la pegada más pesada y doble bombo a 212 BPM.","instagram":"@mouredev"},
      {"id":"mop-m-2","nombre":"Daniela Maissi","rol":"Bajo contundente","bio":"Una línea de graves robusta, pesada e infranqueable que sostiene el muro sónico de la banda.","instagram":"@danielamaissi"},
      {"id":"mop-m-3","nombre":"Nerea Luis","rol":"Teclados, sintetizadores y samplers IA","bio":"Responsable de las atmósferas futuristas, capas melódicas polifónicas y texturas electrónicas industriales.","instagram":"@nerealuis"},
      {"id":"mop-m-4","nombre":"Francisco Palomares","rol":"Guitarra solista","bio":"Ejecución milimétrica de escalas complejas, solos neoclásicos afilados y distorsión calibrada al detalle.","instagram":"@franciscopalomares"},
      {"id":"mop-m-5","nombre":"Martín Cristóbal","rol":"Voz gutural y guitarra rítmica","bio":"Fuerza pura al frente del escenario con registros vocales desgarrados y precisión rítmica en downpicking.","instagram":"@martincristobal"}
    ]'::jsonb,
    '- Batería acústica profesional (Tama Starclassic / Pearl Masters) con DOBLE BOMBO de 22", 3 toms y 2 goliaths (Brais Moure)
- 1 Micrófono vocal dinámico Shure Beta 58A / Shure SM7B para voz gutural + Cabezal Mesa Boogie Dual Rectifier 4x12 (Martín Cristóbal)
- 1 Cabezal EVH 5150 / Mesa Boogie con pantalla 4x12 Celestion V30 para guitarra solista (Francisco Palomares)
- 1 Cabezal Ampeg SVT-CL a válvulas con pantalla 8x10 para bajo contundente + DI Radial J48 activa (Daniela Maissi)
- 2 Líneas estéreo balanceadas DI / Jack para teclados, sintetizadores y samplers IA (Nerea Luis)
- 5 Envíos estéreo de monitores inalámbricos In-Ear (Sennheiser G4 IEM)
- PA mínima requerida: 6000W RMS estéreo para salas y 20000W para festivales',
    'Dossier de Prensa & Hitos 2026:
- Apertura en el Main Stage del Resurrection Fest 2026 (40.000 asistentes) antes de Megadeth.
- Actuación confirmada en Leyendas del Rock (Mark Reale Stage) ante 18.000 espectadores.
- Estreno exclusivo de singles en Radio 3 (El Vuelo del Fénix con Juanma Sánchez) y portada en MariskalRock & La Heavy.
- Gira nacional de salas con Angelus Apatrida, Crisix y Dark Embrace (Sala Capitol, Sala BUT Madrid, Santana 27 Bilbao).
- Más de 96.000 visualizaciones en YouTube y streams especiales de divulgación de ingeniería y música con DotCSV (Carlos Santana).',
    '[
      {"id":"mop-v-1","titulo":"Master of Prompts - Live at Resurrection Fest Main Stage (2026)","url":"https://youtube.com/watch?v=mouredev-mop-live-resu","tipo":"youtube"},
      {"id":"mop-v-2","titulo":"Seek & Refactor (Official 4K Music Video)","url":"https://youtube.com/watch?v=mouredev-seek-refactor","tipo":"youtube"},
      {"id":"mop-v-3","titulo":"Ride the Lightning Model (Studio Session & Samplers)","url":"https://youtube.com/watch?v=mouredev-ride-lightning-model","tipo":"youtube"}
    ]'::jsonb,
    '{
      "cache_orientativo_salas": "2.500€ - 3.500€",
      "cache_orientativo_festivales": "4.500€ - 6.000€",
      "duracion_show_minutos": 75,
      "personal_en_gira": "5 músicos + 1 ingeniero de sonido FOH + 1 técnico de luces/visuales + 1 tour manager",
      "requisitos_hospitality": "Catering caliente para 8 personas, toallas de escenario, agua mineral, isotónicos y camerino con toma de corriente 220V."
    }'::jsonb,
    '{"spotify":"https://open.spotify.com/artist/mouredev","youtube":"https://youtube.com/@mouredev","instagram":"https://instagram.com/mouredev","tiktok":"https://tiktok.com/@mouredev","website":"https://moure.dev","whatsapp":"+34688101010"}'::jsonb,
    '{"nombre":"Brais Moure (Management & Booking)","email":"mouredev@gmail.com","telefono":"+34 688 101 010"}'::jsonb,
    '["mop-song-1","mop-song-2","mop-song-3"]'::jsonb,
    '{"mensajeAgradecimiento":"¡Grazas por apoiar a Master of Prompts no concerto! Aquí tes a descarga do noso directo en formato FLAC de alta resolución.","enlaceDescarga":"https://moure.dev/master-of-prompts-live.flac","codigoDescuento":"PROMPT-METAL"}'::jsonb,
    'stage'
  )
ON CONFLICT (band_id) DO UPDATE SET
  biografia = EXCLUDED.biografia,
  miembros = EXCLUDED.miembros,
  rider_tecnico = EXCLUDED.rider_tecnico,
  dossier_texto_extra = EXCLUDED.dossier_texto_extra,
  videos = EXCLUDED.videos,
  datos_contratacion = EXCLUDED.datos_contratacion,
  enlaces_redes = EXCLUDED.enlaces_redes,
  contacto_booking = EXCLUDED.contacto_booking,
  temas_destacados_ids = EXCLUDED.temas_destacados_ids,
  incentivo_fans = EXCLUDED.incentivo_fans,
  plantilla = EXCLUDED.plantilla;

-- 5. CANCIONES (SONGS)
INSERT INTO songs (
  id, band_id, titulo, duracion, duracion_segundos, tonalidad, bpm, afinacion, album_disco, estado_tema, es_version_covers, audio_principal_url, notas_internas, energia
)
VALUES
  -- Os Herdeiros do Código
  ('hdc-song-1', 'band-os-herdeiros-do-codigo', 'Compila ou Morre', '3:15', 195, 'Em', 185, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_03_fuego_asfalto.mp3', 'Trallazo punk bravú de apertura. Batería de Brais a piñón fixo sen descansos e voz desgarrada de Alan.', 18),
  ('hdc-song-2', 'band-os-herdeiros-do-codigo', 'O Bug da Ribeira', '3:42', 222, 'G', 160, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_01_groove_apertura.mp3', 'Riff festivo estilo rock bravú clásico con coros tabernarios de Carlos e Aris.', 14),
  ('hdc-song-3', 'band-os-herdeiros-do-codigo', 'Git Push Force no Prod', '2:58', 178, 'A', 172, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_05_cierre_triunfal.mp3', 'Hardcore punk rápido sobre o perigo de desplegar en venres pola tarde. Punteo afiado de Xavi Portilla.', 17),
  ('hdc-song-4', 'band-os-herdeiros-do-codigo', 'Licor Café & Null Pointer', '4:10', 250, 'D', 145, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_04_brisa_mediterranea.mp3', 'Ska-punk bailable para facer chimpar a toda a sala con liña de baixo áxil de Aris.', 12),
  ('hdc-song-5', 'band-os-herdeiros-do-codigo', 'Merge Conflict no Camerino', '3:30', 210, 'E', 168, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_01_groove_apertura.mp3', 'Colaboración vocal gravada con Tonhito de Poi e dueto con Alan Buscaglia.', 16),
  ('hdc-song-6', 'band-os-herdeiros-do-codigo', 'Fisterra 404', '4:45', 285, 'Bm', 128, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_02_balada_medianoche.mp3', 'Medio tempo épico con guitarras melódicas e solo con whammy de Xavi.', 8),
  ('hdc-song-7', 'band-os-herdeiros-do-codigo', 'Stack Overflow na Verbena', '3:20', 200, 'G', 175, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_03_fuego_asfalto.mp3', 'Tema festeiro ideal para o fin de festa con ritmos acelerados.', 16),
  ('hdc-song-8', 'band-os-herdeiros-do-codigo', 'A Revolta das IAs en Riazor', '3:50', 230, 'Em', 190, 'E Standard', 'Compila ou Morre (2026)', 'listo', false, '/audio/samples/sample_05_cierre_triunfal.mp3', 'Himno punk de peche con coro de toda a banda ao unísono.', 19),

  -- Master of Prompts
  ('mop-song-1', 'band-master-of-prompts', 'Master of Prompts', '8:36', 516, 'Em', 212, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_03_fuego_asfalto.mp3', 'Rítmicas demoledoras en downpicking estricto a 212 BPM con doble bombo implacable de Brais y voz gutural de Martín.', 18),
  ('mop-song-2', 'band-master-of-prompts', 'Seek & Refactor', '6:55', 415, 'Em', 204, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_05_cierre_triunfal.mp3', 'Himno thrash veloz con solos milimétricos de Francisco Palomares y texturas industriales de Nerea Luis.', 19),
  ('mop-song-3', 'band-master-of-prompts', 'Ride the Lightning Model', '6:36', 396, 'F#m', 160, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_01_groove_apertura.mp3', 'Riffs inspirados en el clásico del 84 con graves infranqueables de Daniela Maissi.', 15),
  ('mop-song-4', 'band-master-of-prompts', 'Enter Daemon', '5:31', 331, 'Em', 123, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_03_fuego_asfalto.mp3', 'Riff pesado con pedal wah-wah y samplers electrónicos oscuros.', 13),
  ('mop-song-5', 'band-master-of-prompts', 'For Whom the Thread Spawns', '5:09', 309, 'Em', 118, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_02_balada_medianoche.mp3', 'Campanas fúnebres sintetizadas por Nerea y base marcial pesadísima.', 11),
  ('mop-song-6', 'band-master-of-prompts', 'Fade to Dark Mode', '6:56', 416, 'Bm', 144, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_04_brisa_mediterranea.mp3', 'Arpegios acústicos limpios sobre la soledad del programador ante la pantalla.', 6),
  ('mop-song-7', 'band-master-of-prompts', 'The Unhandled Exception', '6:27', 387, 'Am', 138, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_02_balada_medianoche.mp3', 'Medio tiempo melancólico y pesado con melodías vocales desgarradas.', 9),
  ('mop-song-8', 'band-master-of-prompts', 'Deadlock Terminal', '6:36', 396, 'Em', 198, 'E Standard', 'Master of Prompts (2026)', 'listo', false, '/audio/samples/sample_05_cierre_triunfal.mp3', 'Final apoteósico a doble bombo continuo y dueto de guitarras.', 20)
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  duracion = EXCLUDED.duracion,
  duracion_segundos = EXCLUDED.duracion_segundos,
  tonalidad = EXCLUDED.tonalidad,
  bpm = EXCLUDED.bpm,
  afinacion = EXCLUDED.afinacion,
  album_disco = EXCLUDED.album_disco,
  estado_tema = EXCLUDED.estado_tema,
  audio_principal_url = EXCLUDED.audio_principal_url,
  notas_internas = EXCLUDED.notas_internas,
  energia = EXCLUDED.energia;

-- 6. SETLISTS
INSERT INTO setlists (
  id, band_id, nombre, descripcion, tipo_formato, duracion_total_estimada_minutos, items
)
VALUES
  (
    'hdc-setlist-1',
    'band-os-herdeiros-do-codigo',
    'Directo Festivais Galegos 2026 (45 min)',
    'Repertorio concentrado de máxima tralla para Revenidas e Castelo Rock',
    'festival',
    45,
    '[
      {"id":"hdc-item-1","songId":"hdc-song-1","tipoItem":"cancion","notaTema":"Entrada directa de batería sen intro"},
      {"id":"hdc-item-2","songId":"hdc-song-3","tipoItem":"cancion","notaTema":"Empalmar baixo sen tregua con Aris"},
      {"id":"hdc-item-3","songId":"hdc-song-2","tipoItem":"cancion","notaTema":"Alan pide palmas ao público"},
      {"id":"hdc-item-4","tipoItem":"bloque","tituloCustom":"Chapa / Saúdo a Vilaxoán e brinde con Licor Café","duracionEstimadaMinutos":2},
      {"id":"hdc-item-5","songId":"hdc-song-7","tipoItem":"cancion","notaTema":"Pogo xeral na pista"},
      {"id":"hdc-item-6","songId":"hdc-song-5","tipoItem":"cancion","notaTema":"Solo con Tonhito de Poi se sube"},
      {"id":"hdc-item-7","songId":"hdc-song-8","tipoItem":"cancion","notaTema":"Trallazo final e foto co público"}
    ]'::jsonb
  ),
  (
    'hdc-setlist-2',
    'band-os-herdeiros-do-codigo',
    'Noite Bravú en Salas (75 min)',
    'Setlist completo con balada, solos e todos os temas do álbum',
    'sala_larga',
    75,
    '[
      {"id":"hdc-item-10","songId":"hdc-song-1","tipoItem":"cancion"},
      {"id":"hdc-item-11","songId":"hdc-song-2","tipoItem":"cancion"},
      {"id":"hdc-item-12","songId":"hdc-song-4","tipoItem":"cancion"},
      {"id":"hdc-item-13","tipoItem":"bloque","tituloCustom":"Descanso e afinación / Solo de batería de Brais","duracionEstimadaMinutos":4},
      {"id":"hdc-item-14","songId":"hdc-song-6","tipoItem":"cancion","notaTema":"Bloque emotivo a Fisterra 404"},
      {"id":"hdc-item-15","songId":"hdc-song-7","tipoItem":"cancion"},
      {"id":"hdc-item-16","songId":"hdc-song-3","tipoItem":"cancion"},
      {"id":"hdc-item-17","songId":"hdc-song-5","tipoItem":"cancion"},
      {"id":"hdc-item-18","songId":"hdc-song-8","tipoItem":"cancion","notaTema":"BIS final"}
    ]'::jsonb
  ),
  (
    'mop-setlist-1',
    'band-master-of-prompts',
    'Directo Resurrection Fest 2026 (45 min)',
    'Ataque frontal a piñón fijo para festivales metaleros',
    'festival',
    45,
    '[
      {"id":"mop-item-1","songId":"mop-song-1","tipoItem":"cancion","notaTema":"Entrada brutal con downpicking a 212 BPM"},
      {"id":"mop-item-2","songId":"mop-song-2","tipoItem":"cancion","notaTema":"Empalmar batería sin tregua"},
      {"id":"mop-item-3","songId":"mop-song-4","tipoItem":"cancion","notaTema":"Solo con wah-wah desatado"},
      {"id":"mop-item-4","tipoItem":"bloque","tituloCustom":"Presentación de la banda & Saludo a Galicia","duracionEstimadaMinutos":2},
      {"id":"mop-item-5","songId":"mop-song-3","tipoItem":"cancion","notaTema":"Clímax eléctrico"},
      {"id":"mop-item-6","songId":"mop-song-8","tipoItem":"cancion","notaTema":"Mosh pit final con doble bombo"}
    ]'::jsonb
  ),
  (
    'mop-setlist-2',
    'band-master-of-prompts',
    'Gira Gallega de Salas (75 min)',
    'Setlist completo con interludio acústico y solos extendidos',
    'sala_larga',
    75,
    '[
      {"id":"mop-item-10","songId":"mop-song-1","tipoItem":"cancion"},
      {"id":"mop-item-11","songId":"mop-song-5","tipoItem":"cancion"},
      {"id":"mop-item-12","songId":"mop-song-7","tipoItem":"cancion"},
      {"id":"mop-item-13","tipoItem":"bloque","tituloCustom":"Interludio / Solo de sintetizadores y bajo de Daniela","duracionEstimadaMinutos":4},
      {"id":"mop-item-14","songId":"mop-song-6","tipoItem":"cancion","notaTema":"Bloque acústico a Fade to Dark Mode"},
      {"id":"mop-item-15","songId":"mop-song-3","tipoItem":"cancion"},
      {"id":"mop-item-16","songId":"mop-song-2","tipoItem":"cancion"},
      {"id":"mop-item-17","songId":"mop-song-8","tipoItem":"cancion"}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  tipo_formato = EXCLUDED.tipo_formato,
  duracion_total_estimada_minutos = EXCLUDED.duracion_total_estimada_minutos,
  items = EXCLUDED.items;

-- 7. ENSAYOS (REHEARSALS CON LOS MIEMBROS REALES)
INSERT INTO rehearsals (
  id, band_id, band_name, fecha, hora, lugar, asistentes, notas, estado
)
VALUES
  -- Os Herdeiros do Código
  ('hdc-reh-1', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-08-18', '17:00 - 20:30', 'Estudios Mans (A Coruña)', '["Brais Moure","Alan Buscaglia","Aris Guimerá","Xavi Portilla","Carlos Azaustre"]'::jsonb, 'Ensaio xeral previo ao Festival Revenidas. Axustar o final de "Git Push Force no Prod" e os coros de Carlos e Aris.', 'completado'),
  ('hdc-reh-2', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-09-08', '18:00 - 21:00', 'Locales Garufa (A Coruña)', '["Brais Moure","Alan Buscaglia","Aris Guimerá","Xavi Portilla","Carlos Azaustre"]'::jsonb, 'Proba dos novos in-ears e claqueta a 185 BPM para Brais na batería.', 'programado'),
  ('hdc-reh-3', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-11-05', '17:30 - 21:00', 'Estudios Mans (A Coruña)', '["Brais Moure","Alan Buscaglia","Aris Guimerá","Xavi Portilla","Carlos Azaustre"]'::jsonb, 'Ensaio intensivo do setlist de 75 min para a presentación en Sala Capitol.', 'programado'),

  -- Master of Prompts
  ('mop-reh-1', 'band-master-of-prompts', 'Master of Prompts', '2026-06-28', '16:00 - 21:00', 'Estudios Mans (A Coruña)', '["Brais Moure","Martín Cristóbal","Francisco Palomares","Daniela Maissi","Nerea Luis"]'::jsonb, 'Ensayo general a 210 BPM para el Main Stage de Resurrection Fest.', 'completado'),
  ('mop-reh-2', 'band-master-of-prompts', 'Master of Prompts', '2026-10-10', '17:00 - 20:30', 'Locales Rock Palace (Madrid)', '["Brais Moure","Martín Cristóbal","Francisco Palomares","Daniela Maissi","Nerea Luis"]'::jsonb, 'Ajuste del setlist completo, samplers de Nerea y guitarras Mesa Boogie.', 'programado'),
  ('mop-reh-3', 'band-master-of-prompts', 'Master of Prompts', '2026-11-20', '18:00 - 21:30', 'Estudios Mans (A Coruña)', '["Brais Moure","Martín Cristóbal","Francisco Palomares","Daniela Maissi","Nerea Luis"]'::jsonb, 'Calentamiento para Madrid y Bilbao.', 'programado')
ON CONFLICT (id) DO UPDATE SET
  fecha = EXCLUDED.fecha,
  hora = EXCLUDED.hora,
  lugar = EXCLUDED.lugar,
  asistentes = EXCLUDED.asistentes,
  notas = EXCLUDED.notas,
  estado = EXCLUDED.estado;

-- 8. CONCIERTOS (CONCERTS)
INSERT INTO concerts (
  id, band_id, band_name, fecha, ciudad, sala, direccion, cache, aforo_vendido, aforo_total, contrato_firmado, estado_pago, notas, tipo
)
VALUES
  -- Os Herdeiros do Código
  ('hdc-con-1', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-08-22', 'Vilaxoán de Arousa (Pontevedra)', 'Festival Revenidas (Escenario Principal)', 'Porto de Vilaxoán', 3500, 12000, 15000, true, 'anticipo', 'Anticipo del 50% (1.750€) cobrado por transferencia.', 'festival'),
  ('hdc-con-2', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-09-12', 'Muros (A Coruña)', 'Castelo Rock', 'Recinto Castelo de Muros', 2800, 3800, 5000, true, 'anticipo', 'Doble cartel con Terbutalina y Bala.', 'festival'),
  ('hdc-con-3', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-11-13', 'Santiago de Compostela', 'Sala Capitol', 'Rúa de Concepción Arenal, 5', 1800, 620, 800, true, 'pendiente', 'Presentación oficial del disco en Santiago.', 'sala'),
  ('hdc-con-4', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-11-20', 'A Coruña', 'Playa Club', 'Andén de Riazor, s/n', 1500, 450, 600, true, 'pendiente', 'Jugando en casa. Sorteo de merchandising en Twitch.', 'sala'),
  ('hdc-con-5', 'band-os-herdeiros-do-codigo', 'Os Herdeiros do Código', '2026-12-05', 'Madrid', 'Sala Mon Live', 'Calle Hilarión Eslava, 36', 2200, 710, 800, true, 'anticipo', 'Comunidad de programadores y gallegos en Madrid.', 'sala'),

  -- Master of Prompts
  ('mop-con-1', 'band-master-of-prompts', 'Master of Prompts', '2026-07-04', 'Viveiro (Lugo)', 'Resurrection Fest (Main Stage)', 'Campo de Fútbol de Celeiro', 6000, 38000, 40000, true, 'anticipo', 'Slot de apertura antes de Megadeth. Backline Mesa Boogie.', 'festival'),
  ('mop-con-2', 'band-master-of-prompts', 'Master of Prompts', '2026-08-08', 'Villena (Alicante)', 'Leyendas del Rock (Mark Reale Stage)', 'Polideportivo Municipal', 4500, 14000, 18000, true, 'anticipo', 'Actuación nocturna con pirotecnia de escenario.', 'festival'),
  ('mop-con-3', 'band-master-of-prompts', 'Master of Prompts', '2026-10-17', 'Santiago de Compostela', 'Sala Capitol', 'Rúa de Concepción Arenal, 5', 2500, 780, 800, true, 'anticipo', 'Sold Out rozando el límite. Grabación en directo.', 'sala'),
  ('mop-con-4', 'band-master-of-prompts', 'Master of Prompts', '2026-11-27', 'Madrid', 'Sala BUT / Mon Live', 'Calle de Barceló, 11', 3200, 950, 1000, true, 'pendiente', 'Fecha clave con Angelus Apatrida como invitados.', 'sala'),
  ('mop-con-5', 'band-master-of-prompts', 'Master of Prompts', '2026-12-12', 'Bilbao', 'Sala Santana 27', 'Telleria Kalea, 27', 2800, 1100, 1500, true, 'pendiente', 'Cierre de la gira de salas en el País Vasco.', 'sala')
ON CONFLICT (id) DO UPDATE SET
  band_name = EXCLUDED.band_name,
  fecha = EXCLUDED.fecha,
  ciudad = EXCLUDED.ciudad,
  sala = EXCLUDED.sala,
  cache = EXCLUDED.cache,
  aforo_vendido = EXCLUDED.aforo_vendido,
  aforo_total = EXCLUDED.aforo_total,
  contrato_firmado = EXCLUDED.contrato_firmado,
  estado_pago = EXCLUDED.estado_pago,
  notas = EXCLUDED.notas;
