import express from "express";
import { Lead } from "../../../src/types.js";
import { loadState, requireAuth } from "../../state.js";
import { getAiClient, generateContentWithFallback } from "../../ai.js";

const router = express.Router();

router.post("/generate-simulated-email", requireAuth, async (req, res) => {
  const { leadId, role, scenario, customInstruction, senderName } = req.body;
  if (!leadId) {
    return res.status(400).json({ success: false, error: "Falta el leadId." });
  }

  const state = loadState();
  const lead = state.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: "Lead no encontrado." });
  }

  const userBandId = lead.band_id || (req as any).user?.band_id ;
  const bandConfig = state.epkConfigsByBand?.[userBandId] || state.epkConfigsByBand?.[userBandId.replace(/^(band|reg)-/, '')] || state.epkConfig || {};
  const registeredBand = state.registeredBands?.find((b: any) => b.band_id === userBandId || b.band_id === userBandId.replace(/^(band|reg)-/, ''));
  const cleanId = userBandId.replace(/^(band|reg)-/, '');
  const isBakandeya = cleanId === 'bakandeya';
  const bandName = registeredBand?.nombre_banda || registeredBand?.bandName || bandConfig?.contactoBooking?.nombre || bandConfig?.nombre_banda || (isBakandeya ? 'Bakandeya' : cleanId.charAt(0).toUpperCase() + cleanId.slice(1));
  const bandBio = bandConfig?.biografia || registeredBand?.biografia || registeredBand?.dossier_texto_extra || '';

  const ai = getAiClient();
  const instructionToUse = customInstruction || scenario || "Propuesta o respuesta general";
  const now = new Date();
  const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const defaultSender = senderName || (bandName + " Agent Manager");
  let prompt = "";
  if (role === "sala") {
    prompt = `Actúa como el programador o responsable de booking de la sala o festival "${lead.nombre_sala}" en la ciudad de "${lead.ciudad}" (Aforo: ${lead.aforo || "N/D"}, género musical habitual: ${lead.genero || "N/D"}).
Genera una respuesta realista por correo electrónico a la propuesta que la banda "${bandName}" (${bandBio ? `con propuesta: ${bandBio}` : 'banda de música en directo'}) te envió para tocar en su gira.

Sigue estrictamente estas instrucciones de negociación o situación:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural, al estilo del mundillo musical alternativo en España.
2. Usa modismos coloquiales de España (como "Buenas", "chavales", "bolo", "curro", "un saludo", "pasadme", "de lujo", "vaya bolazo", etc.) pero mantén un nivel profesional de programador de sala.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. No pongas saludos formales artificiales como "Estimado mánager". Dirígete a "equipo de ${bandName}" o "${defaultSender}".
5. Si corresponde a la instrucción, ofrece detalles concretos de fechas, taquillas (ej. 70/30, 80/20), precios de entradas o riders técnicos.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  } else {
    prompt = `Actúa como Mánager Virtual IA de la banda "${bandName}" (${bandBio ? bandBio : 'banda de música en directo'}). El remitente del correo es "${defaultSender}".
Estás escribiendo una respuesta a la sala o festival "${lead.nombre_sala}" en la ciudad de "${lead.ciudad}".

Sigue estrictamente estas instrucciones de redacción:
"${instructionToUse}"

Pautas importantes:
1. El correo debe ser realista y natural para una banda de gira por España.
2. Usa modismos de España y mantén un tono de cercanía y profesionalidad a la vez.
3. El mensaje debe ser directo, no excesivamente largo (entre 100 y 200 palabras).
4. El remitente debe firmar OBLIGATORIAMENTE como "${defaultSender}".
5. Si corresponde a la instrucción, haz una contrapropuesta de fechas, aclara detalles técnicos o solicita un caché/garantía mínimo.
6. Devuelve ÚNICAMENTE el texto del cuerpo del correo (sin cabeceras de "Asunto:", "Fecha:", ni saludos de sistema).`;
  }

  let generatedText = "";
  let isSimulated = true;

  if (ai) {
    try {
      const response = await generateContentWithFallback(ai, {
        contents: prompt
      });
      if (response && response.text) {
        generatedText = response.text.trim();
        isSimulated = false;
      }
    } catch (err: any) {
      console.warn("Fallo al llamar a Gemini para generar correo simulado, usando generador local:", err.message);
    }
  }

  if (!generatedText) {
    const lowerInst = instructionToUse.toLowerCase();
    if (role === "sala") {
      if (lowerInst.includes("taquilla") || lowerInst.includes("acuerdo") || lowerInst.includes("reparto") || lowerInst.includes("precio")) {
        generatedText = `¡Buenas chavales! Nos mola un montón vuestro directo. Hemos estado mirando el calendario y para el sábado 14 de Noviembre nos encaja vuestro bolo. Como sois una banda de fuera, os podemos ofrecer ir a taquilla con un reparto del 70/30 a vuestro favor y las entradas a 12€ en anticipada / 15€ en taquilla. Nos encargamos de la promoción local y ponemos el equipo de luces básico. ¿Cómo lo veis? Un saludo, Equipo de Programación de ${lead.nombre_sala}.`;
      } else if (lowerInst.includes("rider") || lowerInst.includes("técnico") || lowerInst.includes("sonido") || lowerInst.includes("montaje")) {
        generatedText = `Hola equipo de ${bandName}, ¿qué tal? Vuestra propuesta suena genial, pero nuestro técnico de sala quiere asegurarse de que el rider técnico sea muy preciso. ¿Tenéis la lista de canales y el plano de escenario listos? También querríamos saber a qué hora tenéis previsto llegar para las pruebas de sonido. Quedamos a la espera para seguir concretando. ¡Un saludo!`;
      } else if (lowerInst.includes("lleno") || lowerInst.includes("calendario") || lowerInst.includes("rechazo") || lowerInst.includes("primavera") || lowerInst.includes("cerrado")) {
        generatedText = `Hola equipo de ${bandName}. Gracias por poneros en contacto. Nos encanta vuestro estilo y creemos que funcionaría de lujo en nuestra sala, pero lamentablemente tenemos la programación totalmente cerrada desde hace meses. Nos da mucha rabia, pero si os parece bien, apuntamos vuestro contacto para la próxima temporada o para algún festival. ¡Mucha suerte con el tour!`;
      } else if (lowerInst.includes("confirmación") || lowerInst.includes("contrato") || lowerInst.includes("cerrar") || lowerInst.includes("fiscales") || lowerInst.includes("aceptación")) {
        generatedText = `¡Hola! Pues nos parece perfecto. Cerramos el concierto para el viernes 27 de Noviembre en las condiciones acordadas (80/20 de taquilla con un mínimo garantizado). Por favor, pasadnos vuestro CIF, dirección de facturación, nombre completo para el contrato y el rider definitivo para que nuestro equipo técnico lo deje todo coordinado. ¡Va a ser un bolazo! Un saludo de parte de todo el equipo de ${lead.nombre_sala}.`;
      } else {
        generatedText = `Hola equipo de ${bandName}. Recibimos vuestro dossier y suena muy bien. Respecto a vuestras pautas de negociación: "${instructionToUse.substring(0, 100)}...", nos parece que podemos llegar a un buen entendimiento. Vamos a proponerle la fecha al resto del equipo y os decimos algo definitivo esta semana. ¡Un saludo!`;
      }
    } else {
      if (lowerInst.includes("contrapropuesta") || lowerInst.includes("fecha") || lowerInst.includes("alternativa") || lowerInst.includes("local") || lowerInst.includes("cartel")) {
        generatedText = `Buenas, ¿cómo va todo? Respecto a la fecha que nos ofrecíais, nos resulta un poco difícil por temas de logística de desplazamiento de la banda. ¿Habría alguna posibilidad de cuadrar un viernes o sábado? Si os viene mejor, podemos buscar apoyo local para asegurar la asistencia. ¡Ya nos decís qué os parece! Un saludo, ${senderName || `${bandName} Agent Manager`}.`;
      } else if (lowerInst.includes("aceptación") || lowerInst.includes("sí") || lowerInst.includes("ok") || lowerInst.includes("rider") || lowerInst.includes("enviar")) {
        generatedText = `¡Perfecto! Nos encajan de maravilla las condiciones que proponéis y la fecha queda reservada en nuestro calendario. Con respecto al sonido, os enviamos ya el rider técnico y en breve los datos fiscales para formalizar el contrato. ¡Muchas gracias por todo! Un saludo, ${senderName || `${bandName} Agent Manager`}.`;
      } else if (lowerInst.includes("caché") || lowerInst.includes("mínimo") || lowerInst.includes("dinero") || lowerInst.includes("gastos")) {
        generatedText = `Hola, muchas gracias por la propuesta. No obstante, al tener que desplazarnos y asumir gastos de viaje, para nosotros es fundamental contar con un mínimo garantizado para cubrir los costes. El resto del reparto nos parece bien mantenerlo a taquilla. ¿Creéis que sería viable para vosotros? Un saludo, ${senderName || `${bandName} Agent Manager`}.`;
      } else {
        generatedText = `Hola, muchas gracias por la respuesta rápida. En relación a la propuesta: "${instructionToUse.substring(0, 100)}...", de parte de ${bandName} nos parece un buen punto de partida. Vamos a valorarlo y os confirmamos los detalles de inmediato. ¡Un abrazo! Atentamente, ${senderName || `${bandName} Agent Manager`}.`;
      }
    }
  }

  res.json({
    success: true,
    message: generatedText,
    isSimulated,
    fecha: fechaStr
  });
});

// Scrape/enrich contact information using Gemini Search Grounding

export default router;
