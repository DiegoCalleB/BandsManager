/**
 * Set dorado del auditor de copy de Reels. Los "malos" son el tipo de texto que devuelve un
 * modelo sin reglas; los "buenos", copies escritos como los escribiría la banda. Si cambias el
 * auditor y este set empeora, el cambio está mal.
 */
import type { CopyReel } from "../../auditoriaCopyReel.js";

const base: CopyReel = {
  hookText: "La sala cantó sin nosotros",
  recommendedCopy: "Último tema en la Sala Sol. Apagamos los micros y la gente siguió.",
  copyTikTok: "Apagamos los micros y siguieron cantando.",
  copyYouTube: "El público acaba la canción por nosotros",
  copyFacebook: "Último tema en la Sala Sol. Gracias, Madrid.",
  hashtags: ["#directo", "#indiemadrid", "#salasol"]
};

export const MALOS: Array<{ nombre: string; copy: CopyReel }> = [
  { nombre: "cebo comenta sí", copy: { ...base, recommendedCopy: "¿Os ha gustado? Comenta SÍ si quieres más directos así." } },
  { nombre: "cebo dale like", copy: { ...base, copyTikTok: "Dale like si te ha puesto los pelos de punta" } },
  { nombre: "cebo etiqueta", copy: { ...base, copyFacebook: "Etiqueta a ese amigo que tiene que venir al próximo bolo." } },
  { nombre: "momento épico", copy: { ...base, recommendedCopy: "Un momento épico que nunca olvidaremos." } },
  { nombre: "no te lo pierdas", copy: { ...base, copyTikTok: "No te lo pierdas: nuestro nuevo single." } },
  { nombre: "palabra IA (guía)", copy: { ...base, copyFacebook: "Una experiencia inolvidable en el paisaje musical de Madrid." } },
  { nombre: "palabra IA (safety)", copy: { ...base, recommendedCopy: "Un directo cautivador y revolucionario." } },
  { nombre: "hashtags en el texto", copy: { ...base, recommendedCopy: "Qué noche en la Sala Sol #directo #madrid" } },
  { nombre: "hook kilométrico", copy: { ...base, hookText: "Este es el momento en el que toda la sala empezó a cantar con nosotros" } },
  { nombre: "título de Shorts largo", copy: { ...base, copyYouTube: "Así sonó el último tema de nuestro concierto en la Sala Sol de Madrid el sábado" } },
  { nombre: "sígueme para más", copy: { ...base, copyTikTok: "Síguenos para más directos" } }
];

export const BUENOS: Array<{ nombre: string; copy: CopyReel }> = [
  { nombre: "base", copy: base },
  {
    nombre: "pregunta real",
    copy: { ...base, recommendedCopy: "Tocamos esta por primera vez en un ensayo y casi la tiramos.\n\n¿Cuál es la canción que casi no publicáis?" }
  },
  { nombre: "detrás de escena", copy: { ...base, hookText: "Lo que no se vio del ensayo", copyTikTok: "Tercera toma. La buena fue la que nadie grababa." } },
  { nombre: "específico", copy: { ...base, hookText: "Este solo costó tres meses", copyYouTube: "Tres meses para 12 segundos de solo" } },
  { nombre: "un emoji", copy: { ...base, copyTikTok: "Gracias, Madrid 🖤" } },
  { nombre: "anuncio honesto", copy: { ...base, copyFacebook: "El 14 de noviembre volvemos a la Sala Sol. Entradas en la bio." } }
];
