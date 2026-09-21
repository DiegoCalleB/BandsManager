export const EMAIL_TEMPLATES = {
  sala: {
    subject: 'Propuesta de concierto 2026: {bandName} en {{nombre_sala}}',
    body: `Hola equipo de {{nombre_sala}},

Os escribo desde {bandName} ({estilo}). Seguimos de cerca vuestra programación y nos encantaría valorar fecha en vuestra sala para los próximos meses.

Traemos un directo enérgico y bailable en formato compacto (violín solista, sintetizadores analógicos, percusión, bajo y voz). Nos adaptamos con total flexibilidad a taquilla, co-booking con banda local o caché, y montamos rápido con un rider muy ágil.

Podéis consultar nuestro directo, vídeos y dossier en el enlace de la firma.

¿Cómo tenéis la disponibilidad de agenda para esos meses?

Un saludo,
Booking & Management — {bandName}`
  },
  festival: {
    subject: 'Propuesta de cartel 2026: {bandName} (Live Set)',
    body: `Hola equipo de programación de {{nombre_sala}},

Os escribo desde {bandName} para presentar nuestra propuesta de directo ({estilo}) de cara a la próxima edición de vuestro festival.

Es un show de 75-90 minutos de alta intensidad pensada para hacer bailar al público, con montaje limpio y rotación técnica muy rápida en cambios de escenario.

Tenéis disponible nuestro dossier completo y vídeos de directo en el enlace adjunto.

Estaremos encantados de enviaros propuesta económica y disponibilidad para valorar nuestra entrada en el cartel.

Un saludo,
Booking & Management — {bandName}`
  },
  discoteca: {
    subject: 'Propuesta Live Set nocturno: {bandName} en {{nombre_sala}}',
    body: `Hola equipo de {{nombre_sala}},

Os escribo desde {bandName} para proponer nuestro formato de **Live Set nocturno** ({estilo}), diseñado específicamente para la madrugada en clubes y discotecas.

Combina electrónica, percusión en vivo y violín enérgico, creando el puente perfecto para mantener la pista encendida entre sesiones de DJs.

Podéis consultar el dossier y vídeos de directo en el enlace adjunto.

¿Tenéis hueco en la agenda de los próximos meses para coordinar una fecha?

Un saludo,
Booking & Management — {bandName}`
  },
  medio: {
    subject: '[Nota de prensa] {bandName} presenta gira 2026 y nuevos lanzamientos',
    body: `Hola equipo de redacción de {{nombre_sala}},

Os escribo desde {bandName} ({estilo}) para haceros llegar nuestro dossier promocional y últimos lanzamientos con motivo de nuestra gira 2026.

Nos ponemos a vuestra disposición para:
- Enviaros temas en máxima calidad (WAV/broadcast) para vuestro programa.
- Entrevistas, acústicos en estudio o reseñas de la gira.

Tenéis el dossier EPK interactivo y videoclips en el enlace de la firma.

Muchas gracias por apoyar la música independiente en directo,

Prensa & Comunicación — {bandName}`
  },
  grupo: {
    subject: 'Concierto compartido e intercambio de fechas (Date Swap): {bandName} x {{nombre_sala}}',
    body: `¡Buenas, gente de {{nombre_sala}}!

Os escribo desde {bandName} ({estilo}). Nos gusta mucho vuestro proyecto y creemos que nuestros directos encajarían genial en una fecha compartida.

Queríamos proponeros un intercambio de fechas (date swap): os invitamos a tocar con nosotros en nuestra zona compartiendo sala y taquilla al 50%, y montamos la fecha de vuelta en {{ciudad}} para sumar públicos y compartir gastos.

Podéis escuchar nuestro material en el enlace de abajo.

¿Cómo lo veis? ¿Hablamos por WhatsApp esta semana para cuadrarlo?

¡Un abrazo!
{bandName}`
  }
};
