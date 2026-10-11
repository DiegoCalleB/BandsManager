/**
 * Semillas de demostración del servidor.
 *
 * La banda de ejemplo de la plataforma (`band-demo`): su EPK vive aquí, aislado, y no en las
 * rutas de lectura. Toda banda que no tenga EPK guardado recibe la base vacía.
 */
export const EMPTY_EPK_CONFIG = {
  biografia: "",
  logoUrl: "",
  bandPhotos: [],
  riderTecnico: "",
  enlacesRedes: {},
  contactoBooking: {},
  temasDestacadosIds: [],
  incentivoFans: {},
  ciudadesConfig: [],
};

const DEMO_EPK_BY_BAND: Record<string, Record<string, unknown>> = {
  demo: {
    biografia:
      "Banda Demo es una propuesta vibrante de mestizaje, balkan-ska, reggae y electrónica analógica liderada por violín solista, sintetizadores, percusión en vivo, bajo y voz. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Banda Demo ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.",
    logoUrl: "/logo_demo.jpg",
    bandPhotos: ["/logo_demo.jpg"],
    riderTecnico:
      "- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 2 Micrófonos dinámicos vocal (Shure SM58)\n- Líneas de inyección DI para violín solista y sintetizadores analógicos/secuencias\n- Microfonía para percusión y batería estándar en vivo (Kick, Snare, 2 Toms, Overheads)\n- 1 Línea DI para bajo eléctrico",
    enlacesRedes: {
      spotify: "",
      youtube: "https://youtube.com/@banda_demo",
      instagram: "https://instagram.com/banda_demo",
      tiktok: "https://tiktok.com/@banda_demo",
      appleMusic: "",
      bandcamp: "https://banda-demo.bandcamp.com",
      website: "https://bandmanager.io",
      whatsapp: "+34612345678",
      facebook: "https://facebook.com/bandademo",
      twitter: "https://x.com/banda_demo",
    },
    contactoBooking: {
      nombre: "Booking & Management",
      email: "",
      telefono: "",
    },
    firmaEmail: {
      nombreRemitente: "Booking & Management",
      cargo: "Booking & Management",
      telefono: "",
      email: "",
      textoPie: "Música en directo y conciertos",
      incluirIconosRedes: true,
      adjuntarDossierPorDefecto: true,
      redesSociales: {
        spotify: "",
        youtube: "https://youtube.com/@banda_demo",
        instagram: "https://instagram.com/banda_demo",
        tiktok: "https://tiktok.com/@banda_demo",
        appleMusic: "",
        bandcamp: "https://banda-demo.bandcamp.com",
        website: "https://bandmanager.io",
        whatsapp: "+34612345678",
      },
    },
    temasDestacadosIds: ["s-1", "s-2", "s-3"],
    incentivoFans: {
      mensajeAgradecimiento:
        "¡Muchas gracias por unirte a la familia de Banda Demo! Aquí tienes tu regalo exclusivo por apoyarnos en el concierto.",
      enlaceDescarga:
        "https://bandmanager.io/descargas/tema-inedito-directo.mp3",
      codigoDescuento: "DEMO-FAN-10",
    },
    ciudadesConfig: [
      "Madrid",
      "Sevilla",
      "Barcelona",
      "Málaga",
      "Valencia",
      "Granada",
      "Cádiz",
    ],
  },
};

/** EPK a usar cuando la banda aún no ha guardado ninguno. */
export function defaultEpkConfigFor(cleanBandId: string) {
  return DEMO_EPK_BY_BAND[cleanBandId] ?? EMPTY_EPK_CONFIG;
}
