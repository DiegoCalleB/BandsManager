export const EMAIL_TEMPLATES = {
  sala: {
    subject: 'Propuesta de concierto: {bandName} (Fusión)',
    body: `Hola equipo de booking de {{nombre_sala}},

Somos {bandName}, banda que fusiona {estilo}. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: {enlace_videos}

Un saludo,
{bandName} Agent Manager IA`
  },
  festival: {
    subject: 'Propuesta de Cartel / Booking Festival: {bandName} (Live)',
    body: `Hola equipo de producción y booking de {{nombre_sala}},

Escribimos de parte de {bandName} para presentar la propuesta de nuestro show directo para la próxima edición de {{nombre_sala}} en {{ciudad}}.

Nuestra propuesta combina una fiesta explosiva con un directo potente y profesional. Hemos formado parte de eventos de gran formato destacando por la conexión total con el público.

Podéis ver nuestro dossier y directo aquí: {enlace_videos}

Quedamos a vuestra disposición para enviar rider técnico y caché de contratación.

Un saludo atento,
{bandName} Agent Manager IA`
  }
  // ... add more as needed
};
