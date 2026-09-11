import { ModuleTutorialConfig, ModuleTutorialId } from '../types/tutorial';

export const MODULE_TUTORIALS: Record<ModuleTutorialId, ModuleTutorialConfig> = {
  epk: {
    id: 'epk',
    name: 'Dossier (EPK Digital)',
    badge: 'Kit de Prensa Oficial',
    subtitle: 'Todo lo que programadores, festivales y salas necesitan para contratar a tu banda en un solo enlace.',
    accent: 'purple',
    steps: [
      {
        id: 'epk-1',
        stepNumber: 1,
        badge: 'Paso 1 · Tu cara al mundo',
        title: 'Tu carta de presentación online sin PDFs pesados',
        musicianHook: '🎸 Para el músico: Olvídate de mandar Wetransfers de 200MB o adjuntar PDFs desactualizados que nadie puede leer en el móvil.',
        description: 'Dispones de una página web profesional, rápida y optimizada para móviles que reúne la identidad de tu banda con estética de festival.',
        iconName: 'BookOpen',
        uiTarget: {
          type: 'button',
          label: 'Botones "Ver EPK" y "Copiar URL"',
          location: 'Cabecera superior · Esquina superior derecha',
          actionHint: 'Abre en una pestaña tu web pública o copia el enlace que enviarás por WhatsApp a salas y programadores.',
          selector: '#epk-header-public-btn, #epk-header-copy-btn'
        },
        keyPoints: [
          {
            title: 'Enlace público instantáneo',
            desc: 'Comparte un único link limpio por WhatsApp o email que carga al instante en cualquier pantalla.'
          },
          {
            title: 'Diseño responsive y multi-tema',
            desc: 'Personaliza la portada, paleta de colores y enlaces oficiales a Spotify, YouTube e Instagram.'
          }
        ]
      },
      {
        id: 'epk-2',
        stepNumber: 2,
        badge: 'Paso 2 · Lo que convence en 10 segundos',
        title: 'Vídeos en directo, música y biografía al grano',
        musicianHook: '🎤 En la vida real: Un promotor solo mira los primeros 20 segundos de un vídeo de directo y una bio corta antes de decidir.',
        description: 'Estructura tus mejores argumentos para que el programador vea la energía de vuestro directo sin tener que rebuscar por internet.',
        iconName: 'Mic',
        uiTarget: {
          type: 'tab',
          label: 'Pestañas "Perfil & Bio" y "Música & Vídeos"',
          location: 'Barra de bloques del dossier · Selector superior',
          actionHint: 'Sube la foto principal, escribe la biografía de impacto y añade tus temas de Spotify y vídeos en directo.',
          selector: '#epk-block-tab-perfil, #epk-block-tab-musica'
        },
        keyPoints: [
          {
            title: 'Directos destacados en cabecera',
            desc: 'Elige tu mejor actuación en directo para que se reproduzca en un clic con sonido de calidad.'
          },
          {
            title: 'Temas clave de tu repertorio',
            desc: 'Selecciona los singles más representativos directamente desde tu catálogo.'
          }
        ]
      },
      {
        id: 'epk-3',
        stepNumber: 3,
        badge: 'Paso 3 · Cero sustos en el bolo',
        title: 'Rider técnico & Stage Plot descargables',
        musicianHook: '🎛️ Para el músico: Si el técnico de sonido tiene tu rider actualizado 3 semanas antes, el día de la prueba de sonido todo fluye.',
        description: 'Ofrece a los técnicos de sala la microfonía, canales de mezcla, envíos de monitor y distribución de escenario en formato descargable.',
        iconName: 'Sliders',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Archivos & Documentos" (Rider y PDF)',
          location: 'Barra de bloques del dossier · Selector superior',
          actionHint: 'Sube el Rider Técnico, Stage Plot de colocación en escenario y el Dossier oficial en formato PDF.',
          selector: '#epk-block-tab-archivos'
        },
        keyPoints: [
          {
            title: 'Canales y necesidades técnicas claras',
            desc: 'Especifica micrófonos, DIs, monitores IEM y tomas de corriente sin ambigüedades.'
          },
          {
            title: 'Descarga directa de Rider y Dossier',
            desc: 'El programador o técnico puede descargar el documento oficial con un solo clic.'
          }
        ]
      },
      {
        id: 'epk-4',
        stepNumber: 4,
        badge: 'Paso 4 · Fácil contratación',
        title: 'Contacto directo y contratación',
        musicianHook: '💼 Cierra fechas: Cuanto más fácil sea llamar o escribir a la banda, antes se concretan los conciertos.',
        description: 'Muestra claramente los datos de la persona de contacto de la banda, condiciones logísticas mínimas y opciones de contratación.',
        iconName: 'Share2',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Prensa, Contacto & Donaciones"',
          location: 'Barra de bloques del dossier · Selector superior',
          actionHint: 'Configura el contacto de booking, teléfonos, métodos de pago y visualización en varios idiomas para festivales.',
          selector: '#epk-block-tab-prensa, #epk-block-tab-donaciones'
        },
        keyPoints: [
          {
            title: 'Botones directos de WhatsApp y Correo',
            desc: 'El promotor conecta contigo en un toque de pantalla desde su teléfono móvil.'
          },
          {
            title: 'Dossier multiidioma para festivales',
            desc: 'Visualización y textos adaptados en varios idiomas para programadores y festivales con un solo clic.'
          }
        ]
      }
    ]
  },

  fans: {
    id: 'fans',
    name: 'Captura QR & Base de Fans',
    badge: 'Comunidad en Directo',
    subtitle: 'Convierte al público que te ve en la sala en seguidores reales de por vida sin depender de los algoritmos de redes sociales.',
    accent: 'amber',
    steps: [
      {
        id: 'fans-1',
        stepNumber: 1,
        badge: 'Paso 1 · En el escenario',
        title: 'QR dinámico para proyectar, imprimir o pegar en el bombo',
        musicianHook: '🥁 Para el músico: Cuando terminas un temazo y el público está en éxtasis, ese es el momento exacto para que escaneen tu QR.',
        description: 'Genera códigos QR de ultra alta resolución (PNG 4K y SVG vectorial) y carteles listos para proyectar en el proyector de la sala o poner en la mesa de merchan.',
        iconName: 'QrCode',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Captura en Vivo & QR" + Botón "Descargar Cartel"',
          location: 'Pestaña superior · Panel central del código QR',
          actionHint: 'Genera el QR vectorial de alta resolución y descarga el cartel A4 listo para imprimir o proyectar en sala.',
          selector: '#tab-btn-fans-qr, #fans-qr-export-btn'
        },
        keyPoints: [
          {
            title: 'Exportación vectorial limpia',
            desc: 'Descarga en SVG o PNG nítido para que no se pixele ni en pantallas de festival gigantes.'
          },
          {
            title: 'Flyer imprimible con un clic',
            desc: 'Imprime en tamaño A4 con el logo de tu banda y llamada a la acción irresistible lista para el bolo.'
          }
        ]
      },
      {
        id: 'fans-2',
        stepNumber: 2,
        badge: 'Paso 2 · La experiencia del fan',
        title: 'Landing ultrarrápida con incentivo exclusivo',
        musicianHook: '🎁 El gancho: Nadie deja su email a cambio de nada. Ofréceles un tema inédito, la maqueta acústica o un 10% en camisetas.',
        description: 'Al escanear el QR, el fan aterriza en una página ultra ligera que funciona incluso con mala cobertura en sótanos y salas.',
        iconName: 'Smartphone',
        uiTarget: {
          type: 'section',
          label: 'Bloque "Incentivo & Regalo para el Fan"',
          location: 'Dentro de la pestaña QR · Panel inferior de configuración',
          actionHint: 'Configura la maqueta acústica, descarga digital o código de descuento que el fan recibe al instante en su pantalla.',
          selector: '#fans-incentive-section'
        },
        keyPoints: [
          {
            title: 'Formulario de 10 segundos',
            desc: 'Pide solo lo necesario (nombre y email) con consentimiento RGPD legal automático.'
          },
          {
            title: 'Entrega instantánea de incentivo',
            desc: 'El fan escucha o descarga el regalo de la banda nada más enviar el formulario.'
          }
        ]
      },
      {
        id: 'fans-3',
        stepNumber: 3,
        badge: 'Paso 3 · Inteligencia de gira',
        title: 'Asignación automática por bolo, sala y ciudad',
        musicianHook: '📍 En la vida real: Saber que en Zaragoza metiste 80 fans te permite llenar salas más grandes y negociar mejores condiciones la próxima vez que vuelvas.',
        description: 'Cada escaneo queda etiquetado con la ciudad y el concierto concreto donde se captó al fan, alimentando tu histórico de público.',
        iconName: 'Users',
        uiTarget: {
          type: 'input',
          label: 'Selector "Vincular a Concierto"',
          location: 'Encima del diseño del código QR · Selector desplegable',
          actionHint: 'Asocia el QR a la fecha del concierto para que los registros se clasifiquen automáticamente con esa sala y ciudad.',
          selector: '#fans-concert-selector'
        },
        keyPoints: [
          {
            title: 'Mapa de fans y calor de público',
            desc: 'Visualiza en qué provincias tienes mayor base de seguidores para planificar las paradas de la gira.'
          },
          {
            title: 'Filtrado por concierto o fecha',
            desc: 'Comprueba el ratio de captación exacto conseguido en cada sala.'
          }
        ]
      },
      {
        id: 'fans-4',
        stepNumber: 4,
        badge: 'Paso 4 · El verdadero poder',
        title: 'Tu lista de fans propia: comunícate sin intermediarios',
        musicianHook: '📢 Independencia: En Instagram solo el 5% de tus seguidores ve tus posts. Con tu lista de correo propia, llegas al 100%.',
        description: 'Exporta tus contactos a Excel/CSV o comunícate con ellos directamente cuando anuncies nuevo single o fecha en su ciudad.',
        iconName: 'Zap',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Comunidad & Fans" + Botón "Exportar CSV"',
          location: 'Pestaña superior derecha · Menú de exportación',
          actionHint: 'Revisa todos tus seguidores reales, filtra por provincia o bolo y descarga los contactos limpios en CSV/Excel.',
          selector: '#tab-btn-fans-directory, #fans-export-csv-btn'
        },
        keyPoints: [
          {
            title: 'Exportación a Excel / CSV en un clic',
            desc: 'Descarga tus contactos en cualquier momento sin restricciones ni bloqueos.'
          },
          {
            title: 'Avisos hiperlocales',
            desc: 'Envía un aviso solo a los fans de Bilbao cuando vuelvas a tocar en Euskadi.'
          }
        ]
      }
    ]
  },

  calendario: {
    id: 'calendario',
    name: 'Calendario & Agenda de Directos',
    badge: 'Logística de Banda',
    subtitle: 'Todos los conciertos, ensayos, pruebas de sonido y lanzamientos coordinados para toda la banda sin perderse nada.',
    accent: 'blue',
    steps: [
      {
        id: 'cal-1',
        stepNumber: 1,
        badge: 'Paso 1 · Visión global',
        title: 'Todos los bolos y ensayos en un solo lugar',
        musicianHook: '🗓️ Para el músico: Se acabaron las preguntas en el grupo de WhatsApp de "¿a qué hora era el ensayo?" o "¿cuándo era el bolo en Toledo?".',
        description: 'Una vista unificada mes a mes con código de color instantáneo: conciertos en ámbar/dorado y ensayos en esmeralda.',
        iconName: 'Calendar',
        uiTarget: {
          type: 'button',
          label: 'Botones "+ Concierto" y "+ Ensayo"',
          location: 'Cabecera superior · Esquina superior derecha',
          actionHint: 'Crea una nueva fecha con horarios de prueba, dirección de la sala, caché y notas para los músicos.',
          selector: '#create-concert-btn, #create-rehearsal-btn'
        },
        keyPoints: [
          {
            title: 'Modo 1 o 2 meses',
            desc: 'Alterna entre vista detallada mensual o perspectiva de 60 días para anticipar la carga de trabajo.'
          },
          {
            title: 'Conteo de directos y ensayos en vivo',
            desc: 'Mira de un vistazo cuántos compromisos tiene la banda programados para la temporada.'
          }
        ]
      },
      {
        id: 'cal-2',
        stepNumber: 2,
        badge: 'Paso 2 · Músicos multi-proyecto',
        title: 'Filtro Multi-Banda: tu grupo o todos a la vez',
        musicianHook: '🎸 Para el músico: Si tocas en varios proyectos, necesitas ver si un ensayo de una banda te choca con un directo de otra.',
        description: 'Alterna con un clic entre la agenda exclusiva de tu banda activa o la visión combinada de todos los proyectos en los que tocas.',
        iconName: 'Users',
        uiTarget: {
          type: 'button',
          label: 'Filtro "Esta Banda" / "Todas mis Bandas"',
          location: 'Barra superior de filtros · Junto a la navegación de mes',
          actionHint: 'Alterna entre ver solo los bolos de tu grupo actual o la vista global de todas tus bandas para evitar choques.',
          selector: '#calendar-view-active-band-btn, #calendar-view-all-bands-btn'
        },
        keyPoints: [
          {
            title: 'Modo "Todas las bandas"',
            desc: 'Detecta solapamientos de fechas antes de comprometerte con una sala.'
          },
          {
            title: 'Etiquetas identificativas por banda',
            desc: 'Cada tarjeta indica claramente a qué proyecto pertenece cada evento.'
          }
        ]
      },
      {
        id: 'cal-3',
        stepNumber: 3,
        badge: 'Paso 3 · Hoja de ruta del concierto',
        title: 'Ficha logística: horarios, prueba y sala',
        musicianHook: '⏰ En la vida real: Hora de carga de furgoneta, hora de prueba de sonido, apertura de puertas y dirección con enlace a Google Maps.',
        description: 'Haz clic en cualquier evento para ver el "Run of Show" completo, contrato firmado, horarios de prueba y notas técnicas.',
        iconName: 'FileText',
        uiTarget: {
          type: 'section',
          label: 'Ficha Lateral del Concierto / "Run of Show"',
          location: 'Panel lateral derecho (se abre al hacer clic en cualquier evento)',
          actionHint: 'Muestra horarios de carga y prueba, ubicación en Google Maps, checklist de material y contactos de sala.',
          selector: '#calendar-event-detail-sidebar'
        },
        keyPoints: [
          {
            title: 'Ruta directa en Maps / GPS',
            desc: 'Dirección exacta con botón para abrir navegación GPS desde el móvil en el viaje.'
          },
          {
            title: 'Cronograma del concierto (Run of Show)',
            desc: 'Checklist de horarios: Carga, Prueba, Cena, Concierto y Recogida.'
          }
        ]
      },
      {
        id: 'cal-4',
        stepNumber: 4,
        badge: 'Paso 4 · En tu móvil',
        title: 'Sincronización automática con Google y Apple Calendar',
        musicianHook: '📲 Siempre al día: Añade el feed iCal a tu móvil una vez y cualquier bolo nuevo aparecerá solo en tu calendario personal.',
        description: 'Conexión por enlace iCal estándar compatible con Google Calendar, Apple Calendar en iPhone y Outlook.',
        iconName: 'Radio',
        uiTarget: {
          type: 'button',
          label: 'Botón "Sincronizar Calendario (iCal)"',
          location: 'Cabecera de acciones · Junto a los botones de creación',
          actionHint: 'Obtén el enlace de suscripción iCal para que los eventos aparezcan automáticamente en el calendario de tu móvil.',
          selector: '#export-ics-btn'
        },
        keyPoints: [
          {
            title: 'Feed iCal dinámico',
            desc: 'Se actualiza automáticamente cuando cambias la hora o confirmas una nueva fecha.'
          },
          {
            title: 'Enlace para los miembros de la banda',
            desc: 'Comparte el enlace de sincronización para que todos los músicos lo tengan en su teléfono.'
          }
        ]
      }
    ]
  },

  repertorio: {
    id: 'repertorio',
    name: 'Repertorio, Setlists & Discografía',
    badge: 'Música & Directo',
    subtitle: 'Organiza tus temas con tonalidades y BPMs, diseña setlists para directo, imprime hojas a medida para cada músico y accede sin conexión.',
    accent: 'emerald',
    steps: [
      {
        id: 'rep-1',
        stepNumber: 1,
        badge: 'Paso 1 · Tu catálogo musical',
        title: 'Catálogo & Discografía: ficha musical completa',
        musicianHook: '🎵 Para el músico: Saber la tonalidad para cantar sin forzar la garganta, los BPMs para el metrónomo del batería, la afinación y los discos oficiales de Spotify.',
        description: 'Tus temas organizados por singles y álbumes con duración exacta, afinación, enlaces de audio/maqueta, estado de ensayo y notas para los músicos.',
        iconName: 'Music',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Catálogo & Discografía"',
          location: 'Selector superior · Pestaña "Catálogo"',
          actionHint: 'Registra canciones con su tonalidad, BPM, afinación, duración, notas y organízalas por lanzamientos discográficos.',
          selector: '#tab-btn-catalogo, #btn-add-song'
        },
        keyPoints: [
          {
            title: 'Tonalidad, BPM y Afinación',
            desc: 'Datos musicales esenciales visibles de un vistazo rápido para toda la banda.'
          },
          {
            title: 'Discografía y portadas oficiales',
            desc: 'Agrupa canciones por discos oficiales y vincúlalas a Spotify para el dossier y directo.'
          }
        ]
      },
      {
        id: 'rep-2',
        stepNumber: 2,
        badge: 'Paso 2 · El directo perfecto',
        title: 'Diseñador de Setlists con curva de energía y minutaje',
        musicianHook: '⏱️ En la sala: Si el festival te da 45 minutos y te pasas, el técnico te corta el sonido en el último acorde. Controla el minutaje al segundo.',
        description: 'Arrastra temas al orden del bolo, añade intros o descansos y visualiza la curva de intensidad emocional del show.',
        iconName: 'Layers',
        uiTarget: {
          type: 'tab',
          label: 'Pestaña "Setlists" + Botón "+ Nuevo Setlist"',
          location: 'Selector superior · Pestaña "Setlists"',
          actionHint: 'Arrastra las canciones para armar el concierto, calcula el minutaje total acumulado y equilibra el ritmo del show.',
          selector: '#tab-btn-setlists, #btn-create-setlist'
        },
        keyPoints: [
          {
            title: 'Suma de tiempo en tiempo real',
            desc: 'Calcula al instante la duración exacta acumulada según agregas canciones o bises.'
          },
          {
            title: 'Gráfico de curva de energía',
            desc: 'Evita encadenar tres baladas seguidas o quemar toda la caña en los primeros 10 minutos.'
          }
        ]
      },
      {
        id: 'rep-print',
        stepNumber: 3,
        badge: 'Paso 3 · Hojas de escenario a medida',
        title: 'Impresión y PDF con notas exclusivas por músico',
        musicianHook: '🖨️ En el camerino: El batería necesita saber cuándo entra con caja y el tempo; el guitarra qué cejilla poner; y el cantante cuándo hablar. Genera una hoja a medida para cada uno en 1 clic.',
        description: 'Imprime el setlist en A4 o expórtalo a PDF seleccionando el músico destinatario para incluir sus notas personales, efecto rotulador de escenario y auto-ajuste anti-cortes.',
        iconName: 'Printer',
        uiTarget: {
          type: 'button',
          label: 'Botón "Imprimir" / "Imprimir con notas"',
          location: 'Barra del setlist activo · Botón "Imprimir"',
          actionHint: 'Abre la vista previa de impresión profesional con selector de miembro de la banda, notas manuscritas y ajuste automático a páginas A4.',
          selector: '#btn-print-setlist-header, #btn-print-action'
        },
        keyPoints: [
          {
            title: 'Notas personalizadas por miembro',
            desc: 'Filtra por músico (Batería, Guitarra, Voz, Bajo...) para imprimir hojas con sus recordatorios específicos de cada tema.'
          },
          {
            title: 'Efecto rotulador y auto-ajuste A4',
            desc: 'Tipografía gigante para leer a 2 metros desde el suelo sin que ninguna canción quede partida entre páginas.'
          }
        ]
      },
      {
        id: 'rep-4',
        stepNumber: 4,
        badge: 'Paso 4 · En el escenario',
        title: 'Modo Escenario: teleprompter y 100% offline',
        musicianHook: '🔦 En vivo: En el escenario no hay buena cobertura ni luz. El modo escenario usa fondo negro puro, tipografía gigante y funciona sin internet.',
        description: 'Pon la tablet en el pie de micro o el móvil en el suelo para ver el orden de temas, acordes, notas clave y minutaje restante.',
        iconName: 'Sliders',
        uiTarget: {
          type: 'button',
          label: 'Botón "Modo Escenario" (Atril digital)',
          location: 'Barra del setlist activo · Icono de atril / pantalla completa',
          actionHint: 'Abre la vista en negro puro y letras gigantes para leer notas y acordes en directo 100% sin conexión.',
          selector: '#btn-stage-mode'
        },
        keyPoints: [
          {
            title: 'Diseñado para verse a oscuras',
            desc: 'Contraste ultra alto para leer sin deslumbramientos en mitad del concierto.'
          },
          {
            title: 'Almacenamiento offline automático',
            desc: 'Funciona exactamente igual aunque estés en un sótano sin una sola raya de cobertura.'
          }
        ]
      }
    ]
  },

  song_studio: {
    id: 'song_studio',
    name: 'Song Studio: Taller Creativo',
    badge: 'Composición & Arreglos',
    subtitle: 'Estructura tus canciones bloque a bloque, cifra acordes, genera pistas de referencia con IA y exporta MIDI a tu DAW.',
    accent: 'rose',
    steps: [
      {
        id: 'studio-1',
        stepNumber: 1,
        badge: 'Paso 1 · Mapa de la canción',
        title: 'Estructura visual de secciones: Intro, Estrofa, Solo y Outro',
        musicianHook: '🎼 Para el músico: Visualiza la anatomía de tu tema en una sola pantalla para ver si el estribillo tarda demasiado en entrar.',
        description: 'Organiza la canción por bloques visuales con duraciones orientativas, dinámicas y notas de arreglo para cada instrumento.',
        iconName: 'Layers',
        uiTarget: {
          type: 'section',
          label: 'Lienzo de Estructura de Secciones',
          location: 'Área central del taller · Bloques de partes del tema',
          actionHint: 'Añade y organiza los bloques estructurales (Intro, Verso, Estribillo, Solo, Outro) para definir la dinámica del tema.',
          selector: '#studio-structure-section'
        },
        keyPoints: [
          {
            title: 'Bloques de sección interactivos',
            desc: 'Etiqueta cada sección (Intro, Verso, Estribillo, Solo, Puente, Coda) con su carácter sonoro.'
          },
          {
            title: 'Ideas de audio por sección',
            desc: 'Graba notas de voz o riffs directamente vinculados a una sección concreta.'
          }
        ]
      },
      {
        id: 'studio-2',
        stepNumber: 2,
        badge: 'Paso 2 · Armonía sin líos',
        title: 'Cifrado de acordes y transposición instantánea',
        musicianHook: '🎸 Para el músico: Si el cantante tiene hoy la voz cansada, transpón todo el tema 2 semitonos abajo en un solo clic.',
        description: 'Escribe los acordes sobre la letra o el compás y transpón automáticamente a cualquier tonalidad sin tener que recalcular mentalmente.',
        iconName: 'FileText',
        uiTarget: {
          type: 'button',
          label: 'Controles de Tono "Transponer (+ / -)"',
          location: 'Barra superior de tono · Controles de semitonos',
          actionHint: 'Sube o baja la tonalidad completa en semitonos para adaptar el tema a la voz del cantante al instante.',
          selector: '#studio-transpose-controls'
        },
        keyPoints: [
          {
            title: 'Ficha para músicos sustitutos',
            desc: 'Genera la chuleta con letra y acordes para que un músico suplente se aprenda el tema en una tarde.'
          },
          {
            title: 'Transposición en semitonos (+ / -)',
            desc: 'Cambia la tonalidad completa respetando alteraciones y modulaciones.'
          }
        ]
      },
      {
        id: 'studio-3',
        stepNumber: 3,
        badge: 'Paso 3 · Inspiración musical',
        title: 'Asistente de arreglos y pistas de fondo con IA',
        musicianHook: '🤖 Tu sparring creativo: Si estás atascado buscando un puente o una progresión armónica diferente, pídele ideas a la IA según el estilo de tu banda.',
        description: 'Genera ideas de acordes, arreglos para metales o guitarras y pistas de acompañamiento sintetizadas para practicar en casa.',
        iconName: 'Sparkles',
        uiTarget: {
          type: 'button',
          label: 'Botón "Inspiración IA / Pista de Práctica"',
          location: 'Panel lateral creativo · Generador armónico y rítmico',
          actionHint: 'Genera ideas de progresiones de acordes, arreglos instrumentales y pistas rítmicas para tocar encima con tu instrumento.',
          selector: '#studio-ai-inspire-btn'
        },
        keyPoints: [
          {
            title: 'Compositor IA contextual',
            desc: 'Aporta ideas armónicas respetando la identidad musical de tu proyecto.'
          },
          {
            title: 'Soundtrack & pistas de práctica',
            desc: 'Crea bases rítmicas y colchones sonoros para tocar encima con tu instrumento.'
          }
        ]
      },
      {
        id: 'studio-4',
        stepNumber: 4,
        badge: 'Paso 4 · Hacia el DAW',
        title: 'Exportación MIDI directa para Cubase, Logic y Pro Tools',
        musicianHook: '🎹 Al estudio de grabación: Pasa del boceto al DAW sin tener que volver a programar los acordes y tempos a mano.',
        description: 'Descarga un archivo .MID con el mapa de acordes, tiempos y compases para arrastrarlo directamente a tu software de producción musical.',
        iconName: 'Disc',
        uiTarget: {
          type: 'button',
          label: 'Botón "Exportar MIDI (.mid)"',
          location: 'Barra superior de acciones · Esquina derecha',
          actionHint: 'Descarga el archivo MIDI multipista para abrirlo en Logic, Cubase, Ableton o Pro Tools en tu estudio.',
          selector: '#studio-export-midi-btn'
        },
        keyPoints: [
          {
            title: 'Archivo MIDI estándar (.mid)',
            desc: 'Compatible con Cubase, Logic Pro, Ableton Live, Studio One y Reaper.'
          },
          {
            title: 'Atajos de teclado tipo DAW',
            desc: 'Maneja la reproducción con barra espaciadora, loop y controles clásicos de estudio.'
          }
        ]
      }
    ]
  },
  booking: {
    id: 'booking',
    name: 'Booking CRM & Giras',
    badge: 'Contratación & Salas',
    subtitle: 'Automatiza la búsqueda de salas, redacción de propuestas de concierto y seguimiento comercial con agentes IA.',
    accent: 'blue',
    steps: [
      {
        id: 'booking-1',
        stepNumber: 1,
        badge: 'Paso 1 · Directorio & Segmentación',
        title: 'Gestión de salas, medios y grupos colaboradores',
        musicianHook: '🎸 Para el músico: Deja de apuntar contactos en servilletas o notas sueltas del móvil que se pierden con el tiempo.',
        description: 'Organiza todos tus contactos en 3 categorías clave: Salas/festivales para tocar, Medios de prensa para promoción y Grupos afines para compartir cartel.',
        iconName: 'Users',
        uiTarget: {
          type: 'tab',
          label: 'Pestañas "Salas", "Medios" y "Grupos"',
          location: 'Barra superior de filtros · Centro',
          actionHint: 'Cambia de vista para consultar los escenarios donde tocar, la prensa musical o bandas amigas para girar.',
          selector: '#booking-tabs'
        },
        keyPoints: [
          {
            title: 'Filtros por provincia y género musical',
            desc: 'Encuentra salas afines a vuestro estilo filtrando por comunidad, aforo y cachés habituales.'
          },
          {
            title: 'Historial y notas de contacto',
            desc: 'Apunta si la sala tiene backline propio, técnico de PA, taquilla o condiciones especiales.'
          }
        ]
      },
      {
        id: 'booking-2',
        stepNumber: 2,
        badge: 'Paso 2 · Redacción Inteligente',
        title: 'Propuestas de concierto personalizadas con IA',
        musicianHook: '✍️ Ahorro de horas: Enviar emails genéricos tipo "copia y pega" acaba directo en la papelera del programador.',
        description: 'La IA analiza el estilo de la sala y redacta un pitch adaptado a su programación destacando vuestro directo y EPK.',
        iconName: 'Sparkles',
        uiTarget: {
          type: 'button',
          label: 'Acción "Generar Propuesta IA"',
          location: 'Tarjeta del lead · Botón de redacción',
          actionHint: 'Genera un correo persuasivo listo para revisar y despachar a la sala.',
          selector: '#generate-pitch-btn'
        },
        keyPoints: [
          {
            title: 'Human-in-the-Loop obligatorio',
            desc: 'La IA propone el texto pero nunca se envía sin tu aprobación previa y revisión final.'
          },
          {
            title: 'Integración del dossier EPK',
            desc: 'Enlaza automáticamente tu presskit público para que el programador escuche tus temas en 1 clic.'
          }
        ]
      },
      {
        id: 'booking-3',
        stepNumber: 3,
        badge: 'Paso 3 · Embudo de Contratación',
        title: 'Control del estado de negociación hasta la confirmación',
        musicianHook: '📈 Cero despistes: Visualiza exactamente qué salas han respondido, cuáles están negociando y qué fechas están cerradas.',
        description: 'Mueve tus contactos por las distintas fases del pipeline desde "nuevo" hasta "confirmado" para sincronizar la fecha con el calendario de gira.',
        iconName: 'Zap',
        uiTarget: {
          type: 'section',
          label: 'Selector de Estado del Lead',
          location: 'Ficha de contacto · Desplegable de estado',
          actionHint: 'Actualiza el estado comercial (Contactado, Respondido, Negociando, Confirmado).',
          selector: '#lead-status-selector'
        },
        keyPoints: [
          {
            title: 'Traspaso automático a la gira',
            desc: 'Al marcar un concierto como confirmado, se envía directamente al calendario y logística de gira.'
          },
          {
            title: 'Sincronización con buzón de correo',
            desc: 'El Lector monitoriza las respuestas de las salas para que nunca se te pase una oferta de concierto.'
          }
        ]
      }
    ]
  }
};
