// Banco de evaluación del Redactor: pitches de ejemplo (buenos y malos) con el veredicto que debería dar la
// auditoría. Mide tres promesas: no inventa datos (precios, fechas, contactos), no pasa de 120 palabras y no
// suena a IA. Determinista, sin red: corre en CI. Misma convención que el Lector: `conocido` marca un fallo
// actual y el test impide fallos nuevos.
import { auditPitchQuality } from "../utils/promptSafety.js";
import { detectarDatosInventados } from "../utils/datosInventados.js";

export const MAX_PALABRAS_PITCH = 120;

export type Veredicto = "ok" | "rechazar";
export type Motivo = "inventa_datos" | "largo" | "cliche" | "guion" | "vacio";

export interface CasoRedactor {
  id: string;
  texto: string;
  esperado: Veredicto;
  /** Motivo por el que debería rechazarse (solo si esperado = rechazar). */
  motivo?: Motivo;
  conocido?: string;
}

/** Hechos reales de la banda de prueba: lo único que el pitch puede citar con cifras. */
export const HECHOS_BANDA =
  "Los Ejemplos, rock mestizo de Madrid, cinco músicos. Caché 900 euros. Contacto booking@losejemplos.example. EPK https://losejemplos.example/epk. Libres el 14 de diciembre y el 21 de diciembre.";

const relleno = (n: number) => Array.from({ length: n }, () => "palabra").join(" ");

export const CASOS_REDACTOR: CasoRedactor[] = [
  // Buenos
  { id: "ok-01", esperado: "ok", texto: "Hola Marta, somos Los Ejemplos, una banda de rock mestizo de Madrid. Hemos visto que programáis música en directo los fines de semana y creemos que encajamos. Tenemos libre el 14 de diciembre. ¿Os cuadra? Os paso el EPK: https://losejemplos.example/epk" },
  { id: "ok-02", esperado: "ok", texto: "Buenas, escribimos desde Los Ejemplos. Tocamos rock mestizo, somos cinco en el escenario y llevamos varios años girando por salas pequeñas. Nos gustaría tocar en vuestra sala. Si os interesa, escribidnos a booking@losejemplos.example y os mandamos el dossier." },
  { id: "ok-03", esperado: "ok", texto: "Hola Jorge, soy de Los Ejemplos. Vimos vuestro cartel de noviembre y nos encantó el ambiente. Podemos el 21 de diciembre y nuestro caché es de 900 euros. Si os encaja, lo hablamos por aquí." },
  { id: "ok-04", esperado: "ok", texto: "Hola, somos Los Ejemplos, de Madrid. Hacemos rock con letras en castellano y mucha energía en directo. ¿Tenéis fechas libres este invierno? Encantados de mandaros el material que necesitéis y de ajustarnos a vuestra programación. Un saludo." },
  { id: "ok-05", esperado: "ok", texto: "Hola, os escribimos desde Los Ejemplos. Somos cinco y tocamos rock mestizo. Buscamos salas en Madrid para este invierno. Podemos el 14 de diciembre." },
  { id: "ok-06", esperado: "ok", texto: "Buenas tardes, Los Ejemplos al habla. Rock mestizo desde Madrid, directo potente y público fiel en la ciudad. Tenemos hueco el 21 de diciembre. ¿Os interesa que hablemos?" },
  { id: "ok-07", esperado: "ok", texto: "Hola Ana, gracias por la respuesta del otro día. Confirmamos que seguimos libres el 14 de diciembre y mantenemos los 900 euros de caché de los que hablamos. Dime qué necesitáis de nuestra parte." },
  { id: "ok-08", esperado: "ok", texto: "Hola, somos Los Ejemplos. Cinco músicos, rock mestizo, Madrid. Nos gusta tocar en salas con buen sonido y vuestra sala tiene fama de cuidarlo. ¿Podemos enviaros nuestro dossier por email?" },

  // Inventan datos
  { id: "inv-01", esperado: "rechazar", motivo: "inventa_datos", texto: "Hola, somos Los Ejemplos, banda de rock mestizo de Madrid. Nuestro caché es de 1200 euros y tenemos libre el 14 de diciembre. ¿Os interesa?" },
  { id: "inv-02", esperado: "rechazar", motivo: "inventa_datos", texto: "Buenas, somos Los Ejemplos. Podemos tocar el 3 de enero en vuestra sala. Somos cinco y llevamos tiempo girando. ¿Hablamos?" },
  { id: "inv-03", esperado: "rechazar", motivo: "inventa_datos", texto: "Hola, soy de Los Ejemplos. Llamadme al 612 345 678 cuando queráis y cerramos la fecha. Tocamos rock mestizo desde Madrid." },
  { id: "inv-04", esperado: "rechazar", motivo: "inventa_datos", texto: "Hola, somos Los Ejemplos. Aquí tenéis nuestro dossier completo: https://losejemplos.example/dossier-2026. Rock mestizo desde Madrid, cinco músicos." },
  { id: "inv-05", esperado: "rechazar", motivo: "inventa_datos", texto: "Buenas, Los Ejemplos. Escribidnos a contacto@otrobooking.example y concretamos. Rock mestizo, Madrid, directo potente." },
  { id: "inv-06", esperado: "rechazar", motivo: "inventa_datos", texto: "Hola, somos Los Ejemplos. Por 500 € os hacemos un concierto completo el 14 de diciembre. Rock mestizo de Madrid." },
  { id: "inv-07", esperado: "rechazar", motivo: "inventa_datos", texto: "Hola, Los Ejemplos de Madrid. Tenemos libre el 28 de febrero y el 14 de diciembre. Somos cinco y tocamos rock mestizo. ¿Os cuadra alguna?" },

  // Demasiado largos
  { id: "lar-01", esperado: "rechazar", motivo: "largo", texto: `Hola, somos Los Ejemplos, banda de rock mestizo de Madrid. ${relleno(125)}` },
  { id: "lar-02", esperado: "rechazar", motivo: "largo", texto: `Buenas, escribimos desde Los Ejemplos para proponeros un concierto. ${relleno(160)}` },

  // Clichés de IA y guiones
  { id: "cli-01", esperado: "rechazar", motivo: "cliche", texto: "Espero que este correo te encuentre bien. Somos Los Ejemplos, una banda de rock mestizo de Madrid y creemos que nuestra propuesta es crucial para vuestra programación. ¿Hablamos?" },
  { id: "cli-02", esperado: "rechazar", motivo: "cliche", texto: "Hola, somos Los Ejemplos. Queremos explorar sinergias con vuestra sala y aprovechar vuestra programación de invierno. Rock mestizo desde Madrid, cinco músicos." },
  { id: "cli-03", esperado: "rechazar", motivo: "guion", texto: "Hola, somos Los Ejemplos — rock mestizo de Madrid — y nos encantaría tocar en vuestra sala. Somos cinco músicos con mucha energía en directo." },
  { id: "cli-04", esperado: "rechazar", motivo: "guion", texto: "Hola, somos Los Ejemplos -- banda de rock mestizo de Madrid. Tenemos fechas libres en diciembre. ¿Os interesa que hablemos?" },

  // Vacío
  { id: "vac-01", esperado: "rechazar", motivo: "vacio", texto: "" },
];

/** Veredicto de la auditoría actual sobre un pitch, con los motivos que lo justifican. */
export function juzgarPitch(texto: string): { veredicto: Veredicto; motivos: Motivo[] } {
  const auditoria = auditPitchQuality(texto);
  const motivos: Motivo[] = [];
  if (auditoria.wordCount === 0) motivos.push("vacio");
  if (auditoria.wordCount > MAX_PALABRAS_PITCH) motivos.push("largo");
  if (auditoria.bannedWordsFound.length > 0) motivos.push("cliche");
  if (auditoria.emDashesFound > 0) motivos.push("guion");
  if (detectarDatosInventados(texto, HECHOS_BANDA).length > 0) motivos.push("inventa_datos");
  return { veredicto: motivos.length ? "rechazar" : "ok", motivos };
}

export interface ResultadoRedactor {
  total: number;
  aciertos: number;
  exactitud: number;
  fallos: Array<{ id: string; esperado: Veredicto; obtenido: Veredicto; motivos: Motivo[]; conocido?: string }>;
  /** Cuántos pitches malos de cada motivo se rechazaron por ese motivo. */
  porMotivo: Record<string, { total: number; detectados: number }>;
}

export function evaluarRedactor(casos: CasoRedactor[] = CASOS_REDACTOR): ResultadoRedactor {
  const fallos: ResultadoRedactor["fallos"] = [];
  const porMotivo: ResultadoRedactor["porMotivo"] = {};
  let aciertos = 0;
  for (const c of casos) {
    const { veredicto, motivos } = juzgarPitch(c.texto);
    const acierta = veredicto === c.esperado && (!c.motivo || motivos.includes(c.motivo));
    if (c.motivo) {
      porMotivo[c.motivo] ??= { total: 0, detectados: 0 };
      porMotivo[c.motivo].total++;
      if (motivos.includes(c.motivo)) porMotivo[c.motivo].detectados++;
    }
    if (acierta) aciertos++;
    else fallos.push({ id: c.id, esperado: c.esperado, obtenido: veredicto, motivos, conocido: c.conocido });
  }
  return { total: casos.length, aciertos, exactitud: casos.length ? aciertos / casos.length : 1, fallos, porMotivo };
}
