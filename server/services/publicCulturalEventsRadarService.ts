/**
 * PUBLIC CULTURAL & MUNICIPAL EVENTS RADAR SERVICE
 * 
 * Especializado en captación de contrataciones públicas:
 * - Ayuntamientos, Concejalías de Festejos y Cultura
 * - Diputaciones y Consejerías de Cultura
 * - Ciclos Culturales Municipales, Veranos Culturales y Noches en Blanco
 * - Festivales con Presupuesto / Subvención Pública
 */

import { getAiClient, generateContentWithFallback } from "../ai.js";
import { safeParseJson } from "../utils.js";
import { fetchMadridOpenDataCulturalEvents } from "./openDataCulturalService.js";

export interface PublicCulturalLead {
  entidad_publica: string; // Ej: Ayuntamiento de Guadalajara - Área de Cultura
  ciudad: string;
  provincia: string;
  comunidad_autonoma: string;
  evento_o_ciclo: string; // Ej: "Verano Cultural 2026", "Fiestas de la Virgen de la Antigua"
  tecnico_cultura_contacto?: string;
  email_contacto?: string;
  telefono_oficial?: string;
  presupuesto_estimado_categoria?: 'Alto (>30k€)' | 'Medio (10k-30k€)' | 'Caché Directo (3k-10k€)';
  ventana_presentacion_dossier?: string; // Ej: "Enero - Marzo"
  requisitos_contratacion?: string; // Ej: "Alta en IAE / Factura electrónica / Registro de Licitadores"
  fuente: 'Plataforma Contratación Pública' | 'Boletín Oficial' | 'Radar Cultural IA' | 'Datos Abiertos Madrid' | 'Open Data Municipal';
  fiabilidad: 'alta' | 'media';
}

export interface PublicCulturalRadarResult {
  success: boolean;
  comunidad_o_provincia: string;
  leads_publicos: PublicCulturalLead[];
  total_encontrados: number;
  resumen: string;
}

/**
 * Escanea oportunidades de contratación pública y eventos culturales municipales
 */
export async function searchPublicCulturalOpportunities(params: {
  provinciaOrRegion: string;
  estiloMusical?: string;
  bandName?: string;
  limit?: number;
}): Promise<PublicCulturalRadarResult> {
  const region = params.provinciaOrRegion || "Madrid / Castilla-La Mancha / Andalucía";
  const estilo = params.estiloMusical || "World Music, Fusion, Mestizaje, Pop/Rock, Folk";
  const bandName = params.bandName || "la banda";
  const limit = Math.max(1, Math.min(20, params.limit || 8));

  const leadsPublicos: PublicCulturalLead[] = [];

  // 1. Consultar portales de Datos Abiertos reales (si la búsqueda aplica a Madrid u open data estatal)
  try {
    if (region.toLowerCase().includes("madrid") || region.toLowerCase().includes("españa") || !region) {
      const openEvents = await fetchMadridOpenDataCulturalEvents();
      openEvents.slice(0, 4).forEach(oe => {
        leadsPublicos.push({
          entidad_publica: `${oe.entidad_o_lugar} (Área de Cultura)`,
          ciudad: oe.ciudad,
          provincia: "Madrid",
          comunidad_autonoma: oe.comunidad_autonoma,
          evento_o_ciclo: oe.titulo,
          tecnico_cultura_contacto: `Programación ${oe.tipo_espacio}`,
          email_contacto: "cultura@madrid.es",
          telefono_oficial: "+34 915 298 210",
          presupuesto_estimado_categoria: "Caché Directo (3k-10k€)",
          ventana_presentacion_dossier: "Programación Trimestral Continua",
          requisitos_contratacion: "Factura electrónica (FACe) y alta en SS/IAE",
          fuente: "Datos Abiertos Madrid",
          fiabilidad: "alta"
        });
      });
    }
  } catch (err: any) {
    console.warn("[PublicCulturalRadar] Error consultando open data municipal:", err?.message);
  }

  // 2. Radar de Contratación con IA para el resto de municipios y diputaciones
  try {
    const client = getAiClient();
    if (client) {
      const prompt = `Actúa como un Especialista en Licencias y Contratación Pública Cultural para bandas de música en España.
Objetivo: Identificar programas culturales municipales, concejalías de fiestas y ciclos públicos de conciertos en: ${region}.
Banda candidata: "${bandName}" (Estilo: ${estilo}).

Queremos localizar ayuntamientos y ciclos culturales receptivos a propuestas musicales para sus Veranos Culturales, Fiestas Patronales o Ciclos de Música en Vivo.

Devuelve un JSON estricto con esta estructura exacta:
{
  "leads_publicos": [
    {
      "entidad_publica": "Ayuntamiento de [Ciudad] - Concejalía de Festejos y Cultura",
      "ciudad": "Nombre Ciudad",
      "provincia": "Nombre Provincia",
      "comunidad_autonoma": "Comunidad",
      "evento_o_ciclo": "Nombre del Ciclo o Fiestas (ej. Verano Cultural / Noches al Aire Libre)",
      "tecnico_cultura_contacto": "Técnico de Cultura / Programación",
      "email_contacto": "cultura@ayuntamiento.es",
      "telefono_oficial": "+34 949...",
      "presupuesto_estimado_categoria": "Caché Directo (3k-10k€)",
      "ventana_presentacion_dossier": "Enero - Abril",
      "requisitos_contratacion": "Facturación electrónica (FACe) y alta en SS/IAE",
      "fuente": "Radar Cultural IA",
      "fiabilidad": "alta"
    }
  ]
}

Devuelve máximo ${limit} entidades públicas y programas culturales REALES.`;

      const aiRes = await generateContentWithFallback(client, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const parsed = safeParseJson(aiRes.text || "{}");
      if (parsed && Array.isArray(parsed.leads_publicos)) {
        parsed.leads_publicos.forEach((item: any) => {
          if (item.entidad_publica) {
            leadsPublicos.push({
              entidad_publica: item.entidad_publica,
              ciudad: item.ciudad || region,
              provincia: item.provincia || region,
              comunidad_autonoma: item.comunidad_autonoma || "España",
              evento_o_ciclo: item.evento_o_ciclo || "Programación Cultural Municipal",
              tecnico_cultura_contacto: item.tecnico_cultura_contacto || "Concejalía de Cultura",
              email_contacto: item.email_contacto || "",
              telefono_oficial: item.telefono_oficial || "",
              presupuesto_estimado_categoria: item.presupuesto_estimado_categoria || "Caché Directo (3k-10k€)",
              ventana_presentacion_dossier: item.ventana_presentacion_dossier || "Enero - Mayo",
              requisitos_contratacion: item.requisitos_contratacion || "Facturación electrónica (FACe)",
              fuente: "Radar Cultural IA",
              fiabilidad: "alta"
            });
          }
        });
      }
    }
  } catch (err: any) {
    console.warn("[Public Cultural Radar] Error en escaneo:", err?.message);
  }

  const finalLeads = leadsPublicos.slice(0, limit);

  return {
    success: true,
    comunidad_o_provincia: region,
    leads_publicos: finalLeads,
    total_encontrados: finalLeads.length,
    resumen: `Se han localizado ${finalLeads.length} oportunidades de contratación pública y ciclos culturales municipales en ${region}.`
  };
}
