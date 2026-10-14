// Limpieza de los correos entrantes antes de clasificarlos (Agente Lector).
//
// Dos fallos reales que esto evita:
//  - El texto citado de la respuesta incluye NUESTRO propio pitch ("caché", "fecha", "taquilla"...):
//    el clasificador por palabras clave lo leía como si lo dijera la sala.
//  - Un "fuera de la oficina" o una newsletter con el nombre de la sala en el asunto movía el
//    estado del lead y gastaba una llamada de IA.

// Cabeceras de cita de los clientes de correo habituales: Gmail/Apple (ES, EN, FR, IT, PT, DE, NL)
// y Outlook. Se corta desde la primera que aparezca.
const CABECERAS_DE_CITA: RegExp[] = [
  /^\s*(el|on)\s.{6,200}(escribi[óo]|wrote)\s*:\s*$/i,
  /^\s*le\s.{6,200}a\s+[ée]crit\s*:\s*$/i,
  /^\s*il\s.{6,200}ha\s+scritto\s*:\s*$/i,
  /^\s*(em|no dia)\s.{6,200}escreveu\s*:\s*$/i,
  /^\s*am\s.{6,200}schrieb\s.{0,100}:\s*$/i,
  /^\s*op\s.{6,200}schreef\s.{0,100}:\s*$/i,
  /^\s*-{2,}\s*(original message|mensaje original|message d'origine|messaggio originale|mensagem original)\s*-{2,}\s*$/i,
  /^\s*_{10,}\s*$/,
];

// Outlook: "De: ..." seguido (en las siguientes líneas) de "Enviado:/Sent:/Envoy..." marca el inicio de la cita.
const LINEA_DE = /^\s*(de|from|da|von|van)\s*:\s*.+/i;
const LINEA_ENVIADO = /^\s*(enviado|sent|envoy[ée]|inviato|gesendet|verzonden|enviada)(\s+el)?\s*:/i;

/** Texto propio del mensaje, sin lo citado. Si todo era cita devuelve el original, para no perderlo. */
export function quitarTextoCitado(texto: string): string {
  const lineas = String(texto ?? "").replace(/\r\n/g, "\n").split("\n");
  let corte = lineas.length;
  for (let i = 0; i < lineas.length; i++) {
    if (CABECERAS_DE_CITA.some((re) => re.test(lineas[i]))) { corte = i; break; }
    if (LINEA_DE.test(lineas[i]) && lineas.slice(i + 1, i + 4).some((l) => LINEA_ENVIADO.test(l))) { corte = i; break; }
  }
  const propias = lineas.slice(0, corte).filter((l) => !/^\s*>/.test(l));
  const limpio = propias.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return limpio || String(texto ?? "").trim();
}

export interface DatosDeMensaje {
  subject?: string;
  from?: string;
  text?: string;
  autoSubmitted?: string;
  precedence?: string;
  xAutoreply?: string;
  listUnsubscribe?: string;
}

const ASUNTO_AUTOMATICO = /^\s*((re|rv|aw|sv)\s*:\s*)*(respuesta autom[áa]tica|auto(matic)?[\s-]?reply|autoreply|out of (the )?office|r[ée]ponse automatique|risposta automatica|resposta autom[áa]tica|abwesenheits|automatische antwort|fuera de (la )?oficina|absence du bureau)/i;
const REMITENTE_DE_SISTEMA = /^(no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer-daemon|postmaster|notifications?)@/i;

/** ¿Es un autoresponder, una newsletter o un aviso de sistema? Esos mensajes no cambian el estado de un lead. */
export function esRespuestaAutomatica(m: DatosDeMensaje): boolean {
  const auto = String(m.autoSubmitted || "").trim().toLowerCase();
  if (auto && auto !== "no") return true;
  if (/^(bulk|auto[_-]?reply|junk|list)$/i.test(String(m.precedence || "").trim())) return true;
  if (String(m.xAutoreply || "").trim()) return true;
  if (String(m.listUnsubscribe || "").trim()) return true;
  if (ASUNTO_AUTOMATICO.test(m.subject || "")) return true;
  return REMITENTE_DE_SISTEMA.test(String(m.from || "").trim());
}
