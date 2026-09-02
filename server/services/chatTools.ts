import { FunctionDeclaration, Type } from "@google/genai";

/**
 * Declaraciones de Function Calling nativas para Gemini en BandManager.ai.
 * Permiten que el Mánager Virtual razone sobre el estado de la banda y emita
 * acciones tipadas y estructuradas con validación JSON Schema estricta.
 */

export const chatFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "propose_lead_approval",
    description: "Propone al usuario la aprobación del correo de presentación/pitch generado para una sala, medio o festival en estado 'pendiente_aprobacion'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadId: {
          type: Type.STRING,
          description: "ID exacto de la sala o lead en la base de datos Supabase (ej: 'lead-1', 'rec-123')."
        },
        leadName: {
          type: Type.STRING,
          description: "Nombre oficial de la sala o recinto (ej: 'Sala Apolo', 'Sala El Tren')."
        },
        description: {
          type: Type.STRING,
          description: "Breve explicación humana de la acción a confirmar (ej: 'Aprobar el correo de presentación preparado para Sala Apolo.')."
        }
      },
      required: ["leadId", "leadName", "description"]
    }
  },
  {
    name: "propose_status_change",
    description: "Propone cambiar el estado o clasificación de interés de una sala o lead en el embudo CRM de Supabase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadId: {
          type: Type.STRING,
          description: "ID exacto de la sala o lead."
        },
        leadName: {
          type: Type.STRING,
          description: "Nombre de la sala o contacto."
        },
        newStatus: {
          type: Type.STRING,
          description: "Nuevo estado del embudo CRM.",
          enum: [
            "nuevo",
            "contactado",
            "esperando_respuesta",
            "respondido",
            "negociando",
            "confirmado",
            "aplazado",
            "no_interesado",
            "interesado",
            "pendiente_aprobacion"
          ]
        },
        description: {
          type: Type.STRING,
          description: "Texto explicativo del cambio de estado."
        }
      },
      required: ["leadId", "leadName", "newStatus", "description"]
    }
  },
  {
    name: "propose_concert",
    description: "Propone agendar y guardar un concierto o bolo cerrado en el calendario de la banda y la tabla de conciertos de Supabase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: "Resumen de la confirmación del bolo (ej: 'Agendar concierto confirmado en Sala Villanos para el 15 de Noviembre')."
        },
        leadId: {
          type: Type.STRING,
          description: "ID opcional del lead/sala de origen si proviene del CRM."
        },
        concert: {
          type: Type.OBJECT,
          description: "Datos detallados del concierto a guardar.",
          properties: {
            fecha: { type: Type.STRING, description: "Fecha del bolo en formato YYYY-MM-DD." },
            ciudad: { type: Type.STRING, description: "Ciudad donde se celebra el concierto." },
            sala: { type: Type.STRING, description: "Nombre de la sala o recinto." },
            direccion: { type: Type.STRING, description: "Dirección física de la sala si se conoce." },
            cache: { type: Type.NUMBER, description: "Caché pactado en euros (0 si es a taquilla)." },
            aforo_total: { type: Type.NUMBER, description: "Aforo total del recinto." },
            aforo_vendido: { type: Type.NUMBER, description: "Entradas vendidas anticipadas si aplica (por defecto 0)." },
            contrato_firmado: { type: Type.BOOLEAN, description: "Indica si el contrato o acuerdo está firmado." },
            estado_pago: { type: Type.STRING, description: "Estado del cobro ('pendiente', 'anticipo', 'pagado')." },
            tipo: { type: Type.STRING, description: "Tipo de evento ('sala', 'festival', 'ayuntamiento', 'propio', 'privado')." },
            notas: { type: Type.STRING, description: "Condiciones técnicas, horarios o acuerdos específicos." }
          },
          required: ["fecha", "ciudad", "sala"]
        }
      },
      required: ["description", "concert"]
    }
  },
  {
    name: "propose_rehearsal",
    description: "Propone programar un ensayo para la banda en el calendario.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: "Explicación del ensayo propuesto (ej: 'Programar ensayo general para el jueves a las 19:00 en local habitual')."
        },
        rehearsal: {
          type: Type.OBJECT,
          description: "Detalles del ensayo.",
          properties: {
            fecha: { type: Type.STRING, description: "Fecha del ensayo (YYYY-MM-DD)." },
            hora: { type: Type.STRING, description: "Hora de inicio (ej: '19:00')." },
            lugar: { type: Type.STRING, description: "Local o ubicación del ensayo." },
            asistentes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de miembros convocados o 'Banda'."
            },
            notas: { type: Type.STRING, description: "Objetivos del ensayo o temas a pulir." },
            estado: { type: Type.STRING, description: "'programado' | 'completado' | 'cancelado'" }
          },
          required: ["fecha", "hora", "lugar"]
        }
      },
      required: ["description", "rehearsal"]
    }
  },
  {
    name: "propose_band",
    description: "Propone añadir o sincronizar una banda colega/aliada en el CRM de contactos.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Descripción de la colaboración o contacto." },
        band: {
          type: Type.OBJECT,
          description: "Información de la banda.",
          properties: {
            id: { type: Type.STRING, description: "ID opcional si ya existe." },
            nombre_banda: { type: Type.STRING, description: "Nombre de la banda." },
            estilo_musical: { type: Type.STRING, description: "Estilo o género musical." },
            localizacion: { type: Type.STRING, description: "Ciudad de origen." },
            estado_relacion: { type: Type.STRING, description: "'sin_contactar' | 'intercambio_propuesto' | 'concierto_agendado' | 'colegas_aliados'" },
            contacto_nombre: { type: Type.STRING, description: "Persona de contacto." },
            email: { type: Type.STRING, description: "Email de contacto." },
            telefono: { type: Type.STRING, description: "Teléfono." },
            instagram: { type: Type.STRING, description: "Usuario o link de Instagram." },
            notas_colaboracion: { type: Type.STRING, description: "Notas sobre bolos compartidos o swap de ciudades." }
          },
          required: ["nombre_banda"]
        }
      },
      required: ["description", "band"]
    }
  },
  {
    name: "propose_tour",
    description: "Propone planificar o registrar una gira completa con paradas y presupuesto logístico en Supabase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Descripción de la gira (ej: 'Gira Norte de Primavera 2026')." },
        tour: {
          type: Type.OBJECT,
          description: "Detalles de la gira.",
          properties: {
            id: { type: Type.STRING, description: "ID único del tour." },
            nombre: { type: Type.STRING, description: "Nombre de la gira." },
            vehiculo: { type: Type.STRING, description: "Vehículo principal (ej: 'Furgoneta 9 Plazas')." },
            estado: { type: Type.STRING, description: "'planificacion' | 'confirmada' | 'completada'" },
            fechaInicio: { type: Type.STRING, description: "Fecha de inicio (YYYY-MM-DD)." },
            fechaFin: { type: Type.STRING, description: "Fecha de fin (YYYY-MM-DD)." },
            presupuestoLogistica: { type: Type.NUMBER, description: "Presupuesto estimado de combustible, peajes y dietas." },
            stops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  ciudad: { type: Type.STRING },
                  sala: { type: Type.STRING },
                  fecha: { type: Type.STRING },
                  distanciaAnteriorKm: { type: Type.NUMBER },
                  ingresoCacheEstimated: { type: Type.NUMBER }
                }
              },
              description: "Paradas de la ruta."
            }
          },
          required: ["nombre", "fechaInicio", "fechaFin"]
        }
      },
      required: ["description", "tour"]
    }
  },
  {
    name: "propose_add_lead",
    description: "Propone dar de alta y registrar un nuevo lead (sala, medio, festival, ayuntamiento o discoteca) en la base de datos Supabase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Resumen de la creación del lead." },
        leadName: { type: Type.STRING, description: "Nombre del espacio o medio." },
        lead: {
          type: Type.OBJECT,
          description: "Datos completos del nuevo lead.",
          properties: {
            nombre_sala: { type: Type.STRING, description: "Nombre de la sala, festival o medio." },
            ciudad: { type: Type.STRING, description: "Ciudad." },
            region: { type: Type.STRING, description: "Comunidad autónoma o provincia." },
            aforo: { type: Type.NUMBER, description: "Capacidad estimada de público." },
            genero: { type: Type.STRING, description: "Géneros musicales habituales." },
            tipo: {
              type: Type.STRING,
              description: "Categoría del lead ('sala' | 'festival' | 'ayuntamiento' | 'medio' | 'discoteca' | 'grupo' | 'agencia' | 'manager' | 'productora' | 'sello').",
              enum: ["sala", "festival", "ayuntamiento", "medio", "discoteca", "grupo", "agencia", "manager", "productora", "sello"]
            },
            email_contacto: { type: Type.STRING, description: "Correo electrónico de booking o prensa." },
            telefono: { type: Type.STRING, description: "Teléfono de contacto." },
            website: { type: Type.STRING, description: "Sitio web oficial." },
            instagram: { type: Type.STRING, description: "Perfil de Instagram." },
            fuente: { type: Type.STRING, description: "Origen del contacto (por defecto 'Chatbot')." },
            estado: { type: Type.STRING, description: "Estado inicial ('nuevo' | 'pendiente_aprobacion')." },
            notas: { type: Type.STRING, description: "Notas o detalles de contacto." }
          },
          required: ["nombre_sala", "ciudad", "tipo"]
        }
      },
      required: ["description", "leadName", "lead"]
    }
  },
  {
    name: "propose_update_lead",
    description: "Propone actualizar campos concretos de un lead o sala existente en Supabase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        leadId: { type: Type.STRING, description: "ID del lead a modificar." },
        leadName: { type: Type.STRING, description: "Nombre de la sala." },
        description: { type: Type.STRING, description: "Explicación de la modificación." },
        updatedFields: {
          type: Type.OBJECT,
          description: "Campos modificados (ej: email_contacto, notas, estado, etc.).",
          properties: {
            email_contacto: { type: Type.STRING },
            telefono: { type: Type.STRING },
            instagram: { type: Type.STRING },
            notas: { type: Type.STRING },
            estado: { type: Type.STRING },
            aforo: { type: Type.NUMBER },
            genero: { type: Type.STRING }
          }
        }
      },
      required: ["leadId", "leadName", "description", "updatedFields"]
    }
  },
  {
    name: "propose_draft_email",
    description: "Genera y guarda un borrador de correo/pitch personalizado para una sala o medio para revisión humana previa.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Resumen del borrador generado." },
        leadId: { type: Type.STRING, description: "ID de la sala o lead destinatario." },
        leadName: { type: Type.STRING, description: "Nombre de la sala." },
        subject: { type: Type.STRING, description: "Asunto del correo electrónico." },
        body: { type: Type.STRING, description: "Cuerpo del mensaje redactado con tono profesional y adaptado al dossier." },
        attachDossier: { type: Type.BOOLEAN, description: "Si se debe adjuntar el dossier PDF oficial (por defecto true)." }
      },
      required: ["description", "leadId", "leadName", "subject", "body"]
    }
  },
  {
    name: "propose_send_email",
    description: "Propone al usuario autorizar el envío directo y oficial de un correo electrónico a un lead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Resumen de la propuesta de envío." },
        leadId: { type: Type.STRING, description: "ID de la sala o lead." },
        leadName: { type: Type.STRING, description: "Nombre de la sala." },
        subject: { type: Type.STRING, description: "Asunto del email." },
        body: { type: Type.STRING, description: "Cuerpo del email." },
        senderName: { type: Type.STRING, description: "Nombre del remitente que firma." },
        attachDossier: { type: Type.BOOLEAN, description: "Incluir dossier oficial." },
        incluirFirmaRedes: { type: Type.BOOLEAN, description: "Incluir bloque de firma y redes." }
      },
      required: ["description", "leadId", "leadName", "subject", "body"]
    }
  },
  {
    name: "propose_agent_trigger",
    description: "Propone lanzar o ejecutar un agente autónomo de Supabase (Enviador, Scout, Redactor o Lector) ÚNICAMENTE cuando el usuario lo solicita explícitamente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        agentName: {
          type: Type.STRING,
          description: "Nombre del agente a ejecutar.",
          enum: ["Enviador", "Scout", "Redactor", "Lector", "Scout Descubridor"]
        },
        description: { type: Type.STRING, description: "Explicación del trabajo que ejecutará el agente." },
        params: {
          type: Type.OBJECT,
          description: "Parámetros opcionales de ejecución (ej: región, tipo de espacio).",
          properties: {
            region: { type: Type.STRING },
            ciudad: { type: Type.STRING },
            tipo: { type: Type.STRING }
          }
        }
      },
      required: ["agentName", "description"]
    }
  },
  {
    name: "propose_update_logo",
    description: "Propone actualizar el logo o emoji de una sala, medio o banda.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetType: { type: Type.STRING, enum: ["lead", "band"], description: "Tipo de entidad a actualizar." },
        targetName: { type: Type.STRING, description: "Nombre de la sala o banda." },
        leadId: { type: Type.STRING, description: "ID del lead si targetType es 'lead'." },
        bandId: { type: Type.STRING, description: "ID de la banda si targetType es 'band'." },
        imagen_url: { type: Type.STRING, description: "URL de la imagen o logo público." },
        icono: { type: Type.STRING, description: "Emoji representativo del espacio o banda." },
        description: { type: Type.STRING, description: "Descripción del cambio de imagen." }
      },
      required: ["targetType", "targetName", "description"]
    }
  },
  {
    name: "propose_accompaniment",
    description: "Genera y sintetiza una base rítmica de acompañamiento (batería y bajo) en el navegador del usuario según el ADN musical de la banda.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Descripción de la base rítmica sugerida." },
        accompaniment: {
          type: Type.OBJECT,
          description: "Parámetros de síntesis sonora Web Audio.",
          properties: {
            bpm: { type: Type.NUMBER, description: "Tempo en pulsaciones por minuto (e.g. 120)." },
            keyName: { type: Type.STRING, description: "Tonalidad (e.g. 'Do', 'Lam', 'Sol', 'Fa#m')." },
            drumPattern: {
              type: Type.STRING,
              description: "Estilo de batería ('rock' | 'pop' | 'funk' | 'reggae' | 'ska' | 'cumbia' | 'punk').",
              enum: ["rock", "pop", "funk", "reggae", "ska", "cumbia", "punk"]
            },
            includeDrums: { type: Type.BOOLEAN, description: "Incluir pista de percusión/batería." },
            includeBass: { type: Type.BOOLEAN, description: "Incluir línea de bajo de referencia." },
            durationSecs: { type: Type.NUMBER, description: "Duración en segundos (entre 10 y 120)." },
            songId: { type: Type.STRING, description: "ID de canción opcional del repertorio." },
            songTitle: { type: Type.STRING, description: "Título de la canción si aplica." }
          },
          required: ["bpm", "keyName", "drumPattern", "includeDrums", "includeBass", "durationSecs"]
        }
      },
      required: ["description", "accompaniment"]
    }
  },
  {
    name: "propose_melodic_idea",
    description: "Compone una idea melódica instrumental (guitarra, violín, handpan, percusión) con notas y tiempos específicos para una canción o sección.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Descripción musical de la frase y lo que aporta a la canción." },
        melodicIdea: {
          type: Type.OBJECT,
          description: "Composición melódica sintetizable con Tone.js.",
          properties: {
            instrument: {
              type: Type.STRING,
              description: "Instrumento melódico a sintetizar.",
              enum: ["guitarra", "violin", "handpan", "percusion"]
            },
            bpm: { type: Type.NUMBER, description: "Tempo en BPM." },
            keyName: { type: Type.STRING, description: "Tonalidad (e.g. 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si' con o sin 'm')." },
            escala: { type: Type.STRING, enum: ["mayor", "menor"], description: "Modo de la escala." },
            durationSecs: { type: Type.NUMBER, description: "Duración en segundos (entre 4 y 60)." },
            seccion: {
              type: Type.STRING,
              enum: ["general", "intro", "verso", "estribillo", "puente", "solo", "outro"],
              description: "Sección musical a la que va destinada la idea."
            },
            songId: { type: Type.STRING, description: "ID de la canción en repertorio si aplica." },
            songTitle: { type: Type.STRING, description: "Título de la canción." },
            eventos: {
              type: Type.ARRAY,
              description: "Secuencia ordenada de notas melódicas (entre 8 y 32 notas).",
              items: {
                type: Type.OBJECT,
                properties: {
                  tiempo: { type: Type.NUMBER, description: "Posición de inicio en beats desde 0." },
                  nota: { type: Type.STRING, description: "Notación científica (e.g. 'C4', 'A3', 'G#4', 'D5')." },
                  duracionBeats: { type: Type.NUMBER, description: "Duración de la nota en beats (e.g. 0.5, 1, 1.5, 2)." },
                  velocidad: { type: Type.NUMBER, description: "Intensidad de 0 a 1 (por defecto ~0.8)." }
                },
                required: ["tiempo", "nota", "duracionBeats"]
              }
            }
          },
          required: ["instrument", "bpm", "keyName", "durationSecs", "eventos"]
        }
      },
      required: ["description", "melodicIdea"]
    }
  }
];

/**
 * Convierte llamadas a funciones generadas por Gemini Function Calling
 * en la estructura ProposedAction reconocida por la UI.
 */
export function convertFunctionCallsToProposedActions(functionCalls: any[]): any[] {
  if (!Array.isArray(functionCalls) || functionCalls.length === 0) {
    return [];
  }

  const proposedActions: any[] = [];

  for (const call of functionCalls) {
    if (!call || typeof call !== "object") continue;
    const name = call.name;
    const args = call.args || {};

    switch (name) {
      case "propose_lead_approval":
        proposedActions.push({
          type: "propose_lead_approval",
          leadId: args.leadId,
          leadName: args.leadName,
          description: args.description || `Aprobar el correo de presentación para ${args.leadName}.`
        });
        break;

      case "propose_status_change":
        proposedActions.push({
          type: "propose_status_change",
          leadId: args.leadId,
          leadName: args.leadName,
          newStatus: args.newStatus,
          description: args.description || `Cambiar estado de ${args.leadName} a '${args.newStatus}'.`
        });
        break;

      case "propose_concert":
        proposedActions.push({
          type: "propose_concert",
          leadId: args.leadId,
          description: args.description || `Agendar concierto en ${args.concert?.sala || 'la sala'} (${args.concert?.ciudad || ''}).`,
          concert: args.concert
        });
        break;

      case "propose_rehearsal":
        proposedActions.push({
          type: "propose_rehearsal",
          description: args.description || `Programar ensayo para el ${args.rehearsal?.fecha || ''}.`,
          rehearsal: args.rehearsal
        });
        break;

      case "propose_band":
        proposedActions.push({
          type: "propose_band",
          description: args.description || `Añadir contacto de banda '${args.band?.nombre_banda}'.`,
          band: args.band
        });
        break;

      case "propose_tour":
        proposedActions.push({
          type: "propose_tour",
          description: args.description || `Guardar planificación de gira '${args.tour?.nombre}'.`,
          tour: args.tour
        });
        break;

      case "propose_add_lead":
        proposedActions.push({
          type: "propose_add_lead",
          leadName: args.leadName || args.lead?.nombre_sala,
          description: args.description || `Añadir nuevo lead '${args.leadName || args.lead?.nombre_sala}' a Supabase.`,
          lead: args.lead
        });
        break;

      case "propose_update_lead":
        proposedActions.push({
          type: "propose_update_lead",
          leadId: args.leadId,
          leadName: args.leadName,
          description: args.description || `Actualizar información de ${args.leadName}.`,
          updatedFields: args.updatedFields
        });
        break;

      case "propose_draft_email":
        proposedActions.push({
          type: "propose_draft_email",
          leadId: args.leadId,
          leadName: args.leadName,
          description: args.description || `Guardar borrador de correo para ${args.leadName}.`,
          subject: args.subject,
          body: args.body,
          attachDossier: args.attachDossier !== false
        });
        break;

      case "propose_send_email":
        proposedActions.push({
          type: "propose_send_email",
          leadId: args.leadId,
          leadName: args.leadName,
          description: args.description || `Enviar correo oficial a ${args.leadName}.`,
          subject: args.subject,
          body: args.body,
          senderName: args.senderName,
          attachDossier: args.attachDossier !== false,
          incluirFirmaRedes: args.incluirFirmaRedes !== false
        });
        break;

      case "propose_agent_trigger":
        proposedActions.push({
          type: "propose_agent_trigger",
          agentName: args.agentName,
          description: args.description || `Disparar agente de Supabase '${args.agentName}'.`,
          params: args.params || {}
        });
        break;

      case "propose_update_logo":
        proposedActions.push({
          type: "propose_update_logo",
          targetType: args.targetType,
          targetName: args.targetName,
          leadId: args.leadId,
          bandId: args.bandId,
          imagen_url: args.imagen_url,
          icono: args.icono,
          description: args.description || `Actualizar imagen de ${args.targetName}.`
        });
        break;

      case "propose_accompaniment":
        proposedActions.push({
          type: "propose_accompaniment",
          description: args.description || "Reproducir base rítmica de acompañamiento.",
          accompaniment: args.accompaniment
        });
        break;

      case "propose_melodic_idea":
        proposedActions.push({
          type: "propose_melodic_idea",
          description: args.description || `Idea melódica para ${args.melodicIdea?.instrument || 'instrumento'}.`,
          melodicIdea: args.melodicIdea
        });
        break;

      default:
        console.warn(`[chatTools] Función no reconocida: ${name}`, args);
        break;
    }
  }

  return proposedActions;
}
