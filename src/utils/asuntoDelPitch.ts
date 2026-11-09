/**
 * El pitch de una campaña puede llevar su asunto en la primera línea («Asunto: …»). Así el asunto se ve y se edita junto
 * al texto, y el Enviador lo usa al mandar el email en vez de calcularlo de forma genérica. El cuerpo nunca lleva esa línea.
 */
export interface PitchSeparado {
  asunto: string;
  cuerpo: string;
}

const MAX_ASUNTO = 200;

export function separarAsunto(pitch: string | null | undefined): PitchSeparado {
  const texto = pitch ?? '';
  const m = texto.match(/^\s*asunto\s*:[ \t]*([^\n]*)(?:\r?\n|$)/i);
  if (!m) return { asunto: '', cuerpo: texto };
  return { asunto: m[1].replace(/\s+/g, ' ').trim().slice(0, MAX_ASUNTO), cuerpo: texto.slice(m[0].length).replace(/^\s*\n/, '').trimStart() };
}
