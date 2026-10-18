/** Plantillas de email de booking que ofrece el modal del dashboard (`{bandName}` se sustituye). */
import { Building2, MessageSquareCode, Radio, RefreshCw } from 'lucide-react';

export const EMAIL_TEMPLATES = [
  {
    id: "sala_directa",
    title: "1. Proposal Inicial a Sala de Conciertos (Aforo 200 - 600 pax)",
    type: "Booking directo",
    icon: Building2,
    badgeColor: "bg-[var(--acc)]/20 text-[var(--ink)] ",
    subject: "Propuesta de Concierto - {bandName} en {nombre_sala} (Gira 2026)",
    body: `Hola team de {nombre_sala},

Espero que estéis teniendo una excelente semana.

Os escribo en nombre de la banda {bandName} ({genero}). Estamos cerrando las fechas de nuestra gira para los próximos meses y nos encantaría presentar nuestro directo en {nombre_sala}.

Conocemos vuestra programación y creemos que nuestra propuesta encaja perfectamente con el público de la sala. Ofrecemos un show de entre 60 y 90 minutos con potente energía en escenario, directo muy trabajado y una base de público fiel que responde en cada ciudad.

Adjuntamos nuestro Dossier Promocional con vídeo resumen del directo, Spotify y Rider Técnico:
- Dossier y Vídeo Directo: [Enlace al Dossier EPK]
- Escuchas en Spotify / Youtube: [Enlace a Spotify]

Nos gustaría consultar vuestra disponibilidad para los viernes o sábados del próximo trimestre. Quedamos a vuestra entera disposición para comentar condiciones (taquilla / caché garantizado).

Un cordial saludo,
Mánager Virtual & Booking Team de {bandName}`,
  },
  {
    id: "intercambio_bandas",
    title: "2. Propuesta de Intercambio de Fechas entre Bandas (Co-headlining)",
    type: "Intercambio de bolos",
    icon: MessageSquareCode,
    badgeColor: "bg-[var(--tentative)]/20 text-[var(--tentative)]",
    subject:
      "Propuesta de bolo conjunto e intercambio de sala - {bandName} x {nombre_banda_amiga}",
    body: `¡Hola compas de {nombre_banda_amiga}!

¿Cómo va todo por ahí? Os escribimos desde la banda {bandName}. Nos gusta mucho vuestro estilo y creemos que haríamos un cartel de lujo compartiendo escenario.

Os proponemos una fecha de intercambio:
1. Vosotros venís a tocar con nosotros en nuestra ciudad (nos encargamos de la producción local y promoción).
2. Nosotros vamos a tocar con vosotros en vuestra ciudad.

Así doblamos aforo, compartimos público y abrimos nuevas plazas sin asumir riesgos excesivos.

Si os motiva la idea, decidnos y os pasamos un par de fechas que tenemos pre-reservadas en salas de nuestra zona.

¡Un abrazo fuerte y mucha música!
{bandName}`,
  },
  {
    id: "nota_prensa_medios",
    title: "3. Nota de Prensa & Estreno a Medios y Radios (Radio 3 / Prensa)",
    type: "Prensa & Radios",
    icon: Radio,
    badgeColor: "bg-[var(--alert)]/20 text-[var(--ink)]",
    subject:
      "NOTA DE PRENSA: {bandName} estrena nuevo sencillo y anuncia fechas de gira",
    body: `A la atención del equipo de {nombre_medio},

{bandName}, una de las propuestas más vibrantes del panorama de {genero}, presenta su nuevo lanzamiento y anuncia las primeras fechas de su gira estatal.

Con un sonido fresco que combina ritmos festivos, arreglos orgánicos y letras de fuerte compromiso social, {bandName} se consolida tras sus recientes actuaciones en salas de referencia.

- Escucha en exclusiva el sencillo: [Enlace de Escucha]
- Descarga la portada en alta resolución y fotos de prensa: [Enlace a Drive]
- Biografía y ficha técnica: [Enlace al Dossier EPK]

Estaríamos encantados de coordinar una entrevista, acústico en estudio o reseña del lanzamiento.

Atentamente,
Prensa & Comunicación - {bandName}`,
  },
  {
    id: "seguimiento_sala",
    title: "4. Recordatorio Educado a Sala sin Respuesta (A los 7-10 días)",
    type: "Seguimiento",
    icon: RefreshCw,
    badgeColor: "bg-[var(--acc)]/20 text-[var(--ink)]",
    subject: "Re: Propuesta de Concierto - {bandName} en {nombre_sala}",
    body: `Hola de nuevo, equipo de {nombre_sala},

Os escribo brevemente para hacer un rápido seguimiento del correo que os envié la semana pasada respecto a la fecha para {bandName}.

Entendemos perfectamente que tendréis la bandeja llena de propuestas. Solo queríamos confirmar si pudisteis echarle un ojo al Dossier y si tenéis algún hueco disponible en vuestra programación para los próximos meses.

Quedo atento a vuestra respuesta. ¡Muchas gracias por vuestro tiempo!

Saludos,
{bandName} Booking`,
  },
];
