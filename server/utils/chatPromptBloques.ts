import { sanitizeExternalText } from "./promptSafety.js";

/** Texto de usuario apto para el prompt: saneado, acotado y sin los delimitadores del bloque de DATOS. */
export const textoDeDatos = (valor: unknown, max: number): string =>
  sanitizeExternalText(valor, max).replace(/<<<|>>>/g, "");

/** Igual que `textoDeDatos`, en una sola línea (nombres). */
export const nombreEnPrompt = (valor: unknown, max: number): string =>
  textoDeDatos(valor, max).replace(/\s+/g, " ");

/** Umbral numérico del cuerpo de la petición: finito, entero y acotado; si no, el valor por defecto. */
export const umbralSeguro = (valor: unknown, porDefecto: number): number =>
  (typeof valor === "number" && Number.isFinite(valor) ? Math.min(Math.max(Math.round(valor), 0), 1_000_000) : 0) || porDefecto;

interface AutonomiaPrompt {
  dispatchLevel?: string;
  negotiationDepth?: string;
  autoDeclineUnderMinCache?: boolean;
}

/** Bloque de autonomía y negociación de la instrucción de sistema del chat. */
export function bloqueAutonomiaPrompt(autonomy: AutonomiaPrompt, minCache: number, maxCache: number): string {
  return `
CONFIGURACIÓN VIGENTE DE AUTONOMÍA Y NEGOCIACIÓN DEL MÁNAGER Y AGENTES AI:
- Modo de Envío (Dispatch Level): ${autonomy.dispatchLevel === 'draft_only' ? 'SÓLO BORRADORES (Cualquier propuesta o correo redactado se guarda como borrador en "pendiente_aprobacion" o borrador de Gmail para revisión humana obligatoria)' : autonomy.dispatchLevel === 'scheduled_window' ? 'VENTANA PROGRAMADA (Margen de 3h para revisión antes de salir)' : 'ENVÍO AUTÓNOMO DE PRIMER CONTACTO (El pitch inicial se aprueba si cumple criterios; negociaciones requieren validación)'}
- Profundidad de Negociación: ${autonomy.negotiationDepth === 'outreach_only' ? 'SÓLO CONTACTO INICIAL / EPK (No negociar cachés ni condiciones en esta fase)' : autonomy.negotiationDepth === 'filter_conditions' ? 'FILTRADO DE CONDICIONES Y CACHÉ (Aceptar/proponer negociaciones solo si el caché está entre ' + minCache + '€ y ' + maxCache + '€)' : 'NEGOCIACIÓN AVANZADA Y RE-OFERTAS (Proponer contraofertas dentro del rango de ' + minCache + '€ y ' + maxCache + '€)'}
- Caché Mínimo Aceptable: ${minCache} €
- Caché Objetivo / Máximo: ${maxCache} €
- Auto-rechazar ofertas por debajo de ${minCache} €: ${autonomy.autoDeclineUnderMinCache ? 'SÍ (Rechazar cortesmente)' : 'NO (Avisar al mánager sin rechazar)'}
- FIRMA Y CIERRE FINAL HUMANO: SIEMPRE OBLIGATORIO (No se cierra ningún trato ni se firma contrato sin aprobación directa del usuario).

🚨 REGLA CRÍTICA DE SEGURIDAD ABSOLUTA (MODO SÓLO BORRADORES):
${autonomy.dispatchLevel === 'draft_only' ? `El nivel de autonomía actual es SÓLO BORRADORES ('draft_only'). Si el usuario pide enviar un correo directo individual, usa 'propose_draft_email' para generar y guardar borradores en Gmail o Supabase. Si el usuario pide ejecutar el AGENTE ENVIADOR, propón 'propose_agent_trigger' con 'agentName': 'Enviador' para despachar las salas aprobadas mediante el agente de Supabase.` : `Puedes proponer 'propose_draft_email', 'propose_send_email' o 'propose_agent_trigger' con la validación explícita del usuario.`}

REGLA DE AUTONOMÍA: Cuando el usuario te pregunte sobre negociaciones, ofertas de salas, o te pida generar/enviar correos, DEBES TENER EN CUENTA ESTOS LÍMITES Y MENCIONARLOS SI CORRESPONDE.
`;
}
