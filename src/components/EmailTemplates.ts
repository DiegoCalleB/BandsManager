export const EMAIL_TEMPLATES = {
  sala: {
    subject: 'Propuesta de concierto 2026: {bandName} en {{nombre_sala}}',
    body: `Hola equipo de booking de {{nombre_sala}},

Nos dirigimos a vosotros desde {bandName}, proyecto independiente de música en directo ({estilo}).

Seguimos la programación de {{nombre_sala}} y creemos que nuestro directo encaja perfectamente con vuestra línea artística. Ofrecemos un espectáculo enérgico, festivo y muy bailable con cuarteto compacto (violín solista, sintetizadores analógicos, percusión en vivo, bajo y voz).

Puntos clave:
- Montaje ágil y rider técnico limpio (30-45 min).
- Enlaces oficiales de directo y dossier EPK: {enlace_videos}
- Flexibilidad total en taquilla o caché y colaboración con bandas locales de {{ciudad}}.

¿Tenéis disponibilidad en los próximos meses para valorar una fecha?

Un saludo cordial,
{bandName} Agent Manager IA`,
  },
  festival: {
    subject: 'Propuesta de cartel / contratación 2026: {bandName} (Live Set)',
    body: `Estimada organización de {{nombre_sala}},

Escribimos en representación de {bandName} para presentar nuestra propuesta artística ({estilo}) de cara a la próxima edición de vuestro festival.

{bandName} es un proyecto de alto impacto para escenarios de festivales, destacando por un directo arrollador de 75-90 minutos liderado por violín solista, electrónica analógica y percusión en vivo.

Ventajas técnicas y de producción:
- Espectáculo dinámico de alta intensidad para hacer bailar a todo el público.
- Montaje limpio y cambio de escenario ultra-rápido.
- Dossier completo y directos en YouTube: {enlace_videos}

Estaríamos encantados de enviaros rider técnico detallado y propuesta económica.

Atentamente,
{bandName} Agent Manager IA`,
  },
  discoteca: {
    subject: 'Propuesta Live Set nocturno: {bandName} en {{nombre_sala}}',
    body: `Hola equipo de programación de {{nombre_sala}},

Os escribimos desde {bandName} para presentar nuestro formato especial de **Live Set nocturno** ({estilo}), diseñado específicamente para la sesión de madrugada en discotecas y clubs.

El show combina secuencias electrónicas, percusión en vivo y violín enérgico, creando el puente perfecto entre un directo potente y la pista de baile.

Dossier y vídeos en directo: {enlace_videos}

¿Cómo tenéis la agenda para los próximos meses para coordinar una fecha?

Saludos cordiales,
{bandName} Agent Manager IA`,
  },
  medio: {
    subject: '[Nota de Prensa / Dossier] {bandName} presenta su gira 2026 y nuevos lanzamientos',
    body: `Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde {bandName} ({estilo}) para haceros llegar nuestro dossier promocional y últimos lanzamientos con motivo de nuestra gira 2026.

Nos ponemos a vuestra total disposición para:
- Enviaros temas en máxima calidad (WAV/broadcast) para su emisión en vuestro programa.
- Entrevistas, directos acústicos en estudio o reseñas de la gira.

Dossier EPK interactivo y videoclips: {enlace_videos}

Muchas gracias por vuestro apoyo a la música independiente en directo,
{bandName} Comunicación & Prensa`,
  },
  grupo: {
    subject: 'Propuesta de concierto compartido e intercambio de fechas (Date Swap): {bandName} x {{nombre_sala}}',
    body: `¡Buenas chavales de {{nombre_sala}}! 🎸🔥

Os escribimos desde {bandName} ({estilo}). Nos mola mucho vuestro proyecto y creemos que nuestros directos conectarían genial en una fecha compartida.

Queremos proponeros un **intercambio de fechas / co-booking**:
1. Os invitamos a tocar con nosotros en nuestra ciudad compartiendo sala, backline y taquilla al 50%.
2. Coordinamos la fecha de vuelta en {{ciudad}} en vuestro espacio habitual para sumar ambos públicos locales y compartir gastos.

Podéis escuchar lo que hacemos aquí: {enlace_videos}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos una breve llamada?

¡Un fuerte abrazo!
{bandName}`,
  },
};
