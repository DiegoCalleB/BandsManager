// Nadie medía todavía cuántas bandas avanzan de verdad por el embudo de los agentes de booking
// (Scout -> Redactor -> aprobación humana -> Enviador -> respuesta de la sala -> concierto
// confirmado). Sin esto, decidir en qué invertir después (más agentes vs. arreglar la
// conversión) era una apuesta a ciegas. Separado en una función pura para poder testearlo sin
// tocar Supabase - la ruta que junta los datos reales vive en server/routes/agent.ts.
//
// Las mismas transiciones de `estado` que documenta AGENTS.md sección 3.2, pero en el código
// real viven todas en una única columna `leads.estado` (no hay una columna de "sub-estado"
// aparte), así que el embudo se clasifica por pertenencia de ese valor a cada etapa.
export interface FunnelBandInput {
  bandId: string;
  emailConectado: boolean;
  leadsEstados: string[];
}

export interface AgentFunnelResult {
  totalBandas: number;
  bandasConEmailConectado: number;
  bandasConAlMenosUnLead: number;
  bandasConPitchGenerado: number;
  bandasConAprobacionHumana: number;
  bandasConEnvioReal: number;
  bandasConRespuestaDeSala: number;
  bandasConConciertoConfirmado: number;
}

const ESTADOS_PITCH_GENERADO = new Set([
  "pendiente_aprobacion", "aprobado_propuesta", "aprobado_respuesta", "borrador_creado",
  "contactado", "esperando_respuesta", "respondido", "negociando", "confirmado"
]);
const ESTADOS_APROBADO_POR_HUMANO = new Set([
  "aprobado_propuesta", "aprobado_respuesta", "borrador_creado",
  "contactado", "esperando_respuesta", "respondido", "negociando", "confirmado"
]);
// borrador_creado se queda fuera: es un borrador a la espera de que la banda lo mande a mano
// (modo draft_gmail), todavía no ha salido nada.
const ESTADOS_ENVIO_REAL = new Set(["contactado", "esperando_respuesta", "respondido", "negociando", "confirmado"]);
const ESTADOS_RESPONDIDO = new Set(["respondido", "negociando", "confirmado"]);

export function computeAgentFunnel(bandas: FunnelBandInput[]): AgentFunnelResult {
  const resultado: AgentFunnelResult = {
    totalBandas: bandas.length,
    bandasConEmailConectado: 0,
    bandasConAlMenosUnLead: 0,
    bandasConPitchGenerado: 0,
    bandasConAprobacionHumana: 0,
    bandasConEnvioReal: 0,
    bandasConRespuestaDeSala: 0,
    bandasConConciertoConfirmado: 0
  };

  for (const banda of bandas) {
    if (banda.emailConectado) resultado.bandasConEmailConectado++;
    if (banda.leadsEstados.length > 0) resultado.bandasConAlMenosUnLead++;
    if (banda.leadsEstados.some((e) => ESTADOS_PITCH_GENERADO.has(e))) resultado.bandasConPitchGenerado++;
    if (banda.leadsEstados.some((e) => ESTADOS_APROBADO_POR_HUMANO.has(e))) resultado.bandasConAprobacionHumana++;
    if (banda.leadsEstados.some((e) => ESTADOS_ENVIO_REAL.has(e))) resultado.bandasConEnvioReal++;
    if (banda.leadsEstados.some((e) => ESTADOS_RESPONDIDO.has(e))) resultado.bandasConRespuestaDeSala++;
    if (banda.leadsEstados.includes("confirmado")) resultado.bandasConConciertoConfirmado++;
  }

  return resultado;
}
