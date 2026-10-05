import React, { useState } from 'react';
import { Lead } from '../../types';
import { calculateLeadScore, findCorridorForCity } from '../../utils/tourRouting';
import {
  Calculator,
  Compass,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  Fuel,
  Users,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button, Input, Select } from '../ui';

interface DealAndLogisticsCopilotProps {
  lead: Lead;
  latestIncomingMessage?: string;
  isStitchLight?: boolean;
  onOpenRoadbookModal?: (lead: Lead) => void;
}

export const DealAndLogisticsCopilot: React.FC<DealAndLogisticsCopilotProps> = ({
  lead,
  latestIncomingMessage,
  isStitchLight = false,
  onOpenRoadbookModal,
}) => {
  // --- SUB-SECCIÓN 1: P&L & VIABILIDAD LOGÍSTICA ---
  const [bandOriginCity, setBandOriginCity] = useState<string>('Madrid');
  const [ticketPrice, setTicketPrice] = useState<number>(10);
  const [guaranteedCache, setGuaranteedCache] = useState<number>(0);
  const [dealType, setDealType] = useState<'cache' | 'taquilla' | 'mixto'>('taquilla');
  const [bandSplitPercent, setBandSplitPercent] = useState<number>(80);
  const [vanKmEstimated, setVanKmEstimated] = useState<number>(350);
  const [hotelCost, setHotelCost] = useState<number>(120);
  const [dietsCost, setDietsCost] = useState<number>(80);
  const [fuelPriceEurL, setFuelPriceEurL] = useState<number>(1.55);
  const [vanConsumptionL100km, setVanConsumptionL100km] = useState<number>(9.5);

  // Estimación de combustible ida y vuelta
  const estimatedFuelExpense = Math.round(((vanKmEstimated * 2) / 100) * vanConsumptionL100km * fuelPriceEurL);
  const totalTourExpenses = estimatedFuelExpense + hotelCost + dietsCost;

  // Cálculo de punto de equilibrio (Break-Even)
  const revenuePerTicketForBand = dealType === 'cache' ? 0 : ticketPrice * (bandSplitPercent / 100);
  const remainingCostToCover = Math.max(0, totalTourExpenses - guaranteedCache);
  const breakEvenTickets =
    revenuePerTicketForBand > 0
      ? Math.ceil(remainingCostToCover / revenuePerTicketForBand)
      : guaranteedCache >= totalTourExpenses
        ? 0
        : 999;

  const venueCapacity = lead.aforo || 150;
  const breakEvenCapacityPercent = venueCapacity > 0 ? Math.min(100, Math.round((breakEvenTickets / venueCapacity) * 100)) : 0;
  const isBreakEvenFeasible = breakEvenTickets <= venueCapacity * 0.6; // Si necesita menos del 60% de aforo es muy viable

  // Corredor de gira
  const corridorData = findCorridorForCity(lead.ciudad || lead.region);

  // --- SUB-SECCIÓN 2: DEAL CLOSING & ANÁLISIS DE RESPUESTAS ---
  const sentimentAnalysis = React.useMemo(() => {
    const text = (latestIncomingMessage || lead.ultimo_mensaje_recibido || '').toLowerCase();
    if (!text) {
      return {
        tone: 'neutral',
        label: 'A la espera de respuesta',
        color: 'text-[var(--ink-2)] bg-[var(--sunken)]/60 ',
        tactic: 'Envía un primer pitch conciso con vídeo de directo, enlace al rider y propuesta de 2 fechas alternativas.',
        suggestedSubject: `Propuesta concierto Bakandeya en ${lead.nombre_sala}`,
        suggestedDraft: `Hola equipo de ${lead.nombre_sala},\n\nNos encantaría presentar en vuestra sala nuestro directo (fusión orgánica de violín acústico, sintetizadores analógicos y grooves de baile). Os dejamos nuestro EPK y vídeo en vivo:\nhttps://bandmanager.io/epk\n\n¿Tenéis disponibilidad para un viernes o sábado durante los próximos meses?\n\nUn saludo,\nEquipo Bakandeya`,
      };
    }

    if (text.includes('cerrada') || text.includes('llena') || text.includes('completa') || text.includes('temporada')) {
      return {
        tone: 'closed_schedule',
        label: 'Agenda de temporada cerrada',
        color: 'text-[var(--ink)] bg-[var(--acc)]/10 ',
        tactic:
          'No insistas para esta temporada. Agradece la respuesta y pide fecha exacta de apertura del próximo trimestre para entrar los primeros.',
        suggestedSubject: `Re: Concierto en ${lead.nombre_sala} - Fechas próxima temporada`,
        suggestedDraft: `Muchas gracias por responder tan rápido y con total transparencia. Es una gran señal que tengáis la programación tan viva.\n\n¿En qué mes exacto abrís la recepción de propuestas para la siguiente temporada? Nos lo anotamos en el calendario para enviaros material nuevo en cuanto lo abráis.\n\n¡Un abrazo y mucho éxito con los bolos de estos meses!`,
      };
    }

    if (
      text.includes('presupuesto') ||
      text.includes('caché') ||
      text.includes('cache') ||
      text.includes('caro') ||
      text.includes('no llegamos') ||
      text.includes('coste')
    ) {
      return {
        tone: 'budget_concern',
        label: 'Objeción económica / Caché',
        color: 'text-[var(--ink)] bg-[var(--acc)]/10 ',
        tactic: 'Ofrece pasar a formato mixto (fijo mínimo + taquilla compartida) o proponer fecha doble con banda local amiga.',
        suggestedSubject: `Re: Adaptación de propuesta económica para ${lead.nombre_sala}`,
        suggestedDraft: `Entendemos perfectamente vuestra postura y valoramos mucho el esfuerzo que hacéis por mantener la música en vivo. Lo primordial para nosotros es tocar en vuestra sala.\n\n¿Os encajaría plantearlo a taquilla con un porcentaje del 80/20 a nuestro favor, o bien organizar una fecha compartida con una banda local que active la venta anticipada?\n\nEstamos abiertos a encontrar la fórmula que os sea cómoda.`,
      };
    }

    if (
      text.includes('interes') ||
      text.includes('disponib') ||
      text.includes('fecha') ||
      text.includes('rider') ||
      text.includes('condiciones') ||
      text.includes('fecha libre')
    ) {
      return {
        tone: 'hot_lead',
        label: 'Interés Alto / Caliente',
        color: 'text-[var(--ok)] bg-[var(--ok)]/10 ',
        tactic: 'Cierra fecha ya mismo: pide un hold de 48h, envía el rider y pacta el horario de prueba de sonido.',
        suggestedSubject: `Re: Confirmación de detalles y pre-reserva - ${lead.nombre_sala}`,
        suggestedDraft: `¡Qué gran noticia, nos hace muchísima ilusión tocar en ${lead.nombre_sala}!\n\nPara poder cerrar los billetes y la furgoneta del equipo, ¿podemos dejar la fecha en Pre-reserva (Hold 48h)? Os adjunto el rider con nuestro canal de violín y sintes. ¿A qué hora os viene mejor la prueba de sonido?`,
      };
    }

    return {
      tone: 'open_reply',
      label: 'Conversación en curso',
      color: 'text-[var(--ink)] bg-[var(--acc)]/10 ',
      tactic: 'Responde aclarando las dudas técnicas y manteniendo la iniciativa con una llamada a la acción clara.',
      suggestedSubject: `Re: Detalles concierto Bakandeya en ${lead.nombre_sala}`,
      suggestedDraft: `Hola de nuevo,\n\nMuchas gracias por las indicaciones. Por nuestra parte estamos totalmente alineados con la propuesta. ¿Queréis que os mandemos el cartel editable o preferís coordinar la comunicación vosotros?`,
    };
  }, [latestIncomingMessage, lead.ultimo_mensaje_recibido, lead.nombre_sala]);

  // --- SUB-SECCIÓN 3: GENERADOR DE HOJA DE RUTA (ROADBOOK) & CONTRATO ---
  const [copiedRoadbook, setCopiedRoadbook] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const roadbookMarkdown = `🗺️ HOJA DE RUTA (ROADBOOK) & RUN OF SHOW
Banda: Bakandeya
Evento: Concierto en ${lead.nombre_sala} (${lead.ciudad})
Dirección: ${lead.direccion || lead.ciudad || 'Por confirmar'}
Contacto Sala / Programador: ${lead.contacto_nombre || 'Dirección de Sala'} (${lead.telefono || lead.email_contacto || 'n/d'})

⏰ CRONOGRAMA DE OPERACIONES:
• 16:30 - Salida desde ${bandOriginCity} (Furgoneta)
• 18:30 - Llegada a ${lead.nombre_sala}, descarga y carga en camerinos
• 19:15 - Prueba de sonido (Canales violín D.I. 1/2, sintes D.I. 3, voces & in-ears)
• 20:30 - Cena de banda y pausa
• 21:30 - Apertura de puertas
• 22:15 - Show en directo (Setlist 75 min)
• 23:45 - Cierre, firmas, fotos y merchandising
• 00:30 - Carga furgoneta y retirada a hotel/base

🚗 LOGÍSTICA & VEHÍCULO:
• Ruta: ${bandOriginCity} ↔ ${lead.ciudad} (~${vanKmEstimated} km)
• Combustible estimado: ~${estimatedFuelExpense} €
• Dietas y Alojamiento: ~${hotelCost + dietsCost} €`;

  const miniContractSummary = `📄 RESUMEN DE ACUERDO DE ACTUACIÓN
• Artista: Bakandeya
• Organizador / Sala: ${lead.nombre_sala} (${lead.direccion || lead.ciudad})
• Régimen Económico: ${dealType === 'cache' ? `Caché fijo de ${guaranteedCache} €` : `${bandSplitPercent}% de taquilla íntegra (Entrada: ${ticketPrice} €)`}
• Rider Técnico: 3 cajas de inyección directa activas (D.I.), monitores o envíos IEM, PA adecuada al aforo (${venueCapacity} pax).
• Curfew / Límite de Sonido: Respeto escrupuloso a la normativa de la sala.
• Hospitalidad: Agua en escenario, catering ligero para 4 músicos y plaza de carga y descarga para furgoneta.`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* HEADER DE COPILOTO */}
      <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-l)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[var(--acc)]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-1.5 font-display">
              Copiloto de cierre, logística y rentabilidad
            </h4>
            <p className="text-micro text-[var(--ink-2)] font-sans">Inteligencia financiera y táctica para no perder dinero en carretera</p>
          </div>
        </div>

        {corridorData && (
          <span className="px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--sunken)] text-micro font-mono text-[var(--acc)] flex items-center gap-1 shrink-0">
            <Compass className="w-3 h-3 text-[var(--acc)]" />
            {corridorData.info.corridor}
          </span>
        )}
      </div>

      {/* BLOQUE 1: CALCULADORA P&L Y PUNTO DE EQUILIBRIO */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--ok)]" />
            <span className="text-xs font-bold font-sans text-[var(--ok)]">
              1. Rentabilidad de Gira y Punto de Equilibrio (Cubrir Gastos)
            </span>
          </div>
          <span
            className={`text-micro font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${
              isBreakEvenFeasible
                ? 'bg-[var(--ok)]/15 text-[var(--ink)]'
                : 'bg-[var(--acc)]/15 text-[var(--ink)]'
            }`}
          >
            {isBreakEvenFeasible ? 'Bolo Viable' : 'Requiere >60% Aforo'}
          </span>
        </div>

        {/* Inputs de simulación */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
            <label className="text-micro font-mono text-[var(--ink-2)] block mb-1">Tipo de Acuerdo</label>
            <Select size="sm" aria-label="Tipo de Acuerdo"
              value={dealType}
              onChange={(e: any) => setDealType(e.target.value)}
              wrapperClassName="w-full"
            >
              <option value="taquilla">Taquilla (%)</option>
              <option value="cache">Caché fijo (€)</option>
              <option value="mixto">Fijo + taquilla</option>
            </Select>
          </div>

          <div className="bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
            <label className="text-micro font-mono text-[var(--ink-2)] block mb-1">
              {dealType === 'cache' ? 'Caché Fijo (€)' : 'Precio Entrada (€)'}
            </label>
            <Input
              size="sm"
              type="number"
              value={dealType === 'cache' ? guaranteedCache : ticketPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (dealType === 'cache') setGuaranteedCache(val);
                else setTicketPrice(val);
              }}
              className="w-full"
            />
          </div>

          <div className="bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
            <label className="text-micro font-mono text-[var(--ink-2)] block mb-1">Distancia Ida (km)</label>
            <Input size="sm" aria-label="Distancia Ida (km)"
              type="number"
              value={vanKmEstimated}
              onChange={(e) => setVanKmEstimated(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
            <label className="text-micro font-mono text-[var(--ink-2)] block mb-1">Hotel + dietas (€)</label>
            <Input size="sm" aria-label="Hotel + dietas (€)"
              type="number"
              value={hotelCost + dietsCost}
              onChange={(e) => {
                const total = Number(e.target.value);
                setHotelCost(Math.round(total * 0.6));
                setDietsCost(Math.round(total * 0.4));
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Dashboard de Resultados de Rentabilidad */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--hair)]/80">
          <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]/80 text-center">
            <span className="text-micro text-[var(--ink-2)] font-mono block">Gastos viaje estimados</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[var(--alert)]">{totalTourExpenses} €</span>
            <span className="text-micro text-[var(--ink-2)] block">Gasolina: ~{estimatedFuelExpense}€</span>
          </div>

          <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]/80 text-center">
            <span className="text-micro text-[var(--ink-2)] font-mono block">Entradas para cubrir costes</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[var(--acc)]">{breakEvenTickets} tickets</span>
            <span className="text-micro text-[var(--ink-2)] block">{breakEvenCapacityPercent}% del aforo</span>
          </div>

          <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]/80 text-center">
            <span className="text-micro text-[var(--ink-2)] font-mono block">Beneficio con sala llena</span>
            <span className="text-sm sm:text-base font-bold font-mono text-[var(--ok)]">
              {Math.max(0, Math.round(venueCapacity * revenuePerTicketForBand + guaranteedCache - totalTourExpenses))} €
            </span>
            <span className="text-micro text-[var(--ink-2)] block">Aforo total: {venueCapacity} pax</span>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: DEAL CLOSING COPILOT (ANÁLISIS DE RESPUESTAS Y OBJECIONES) */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-xs font-bold font-sans text-[var(--acc)]">
              2. Asistente Táctico de Cierre (Objeciones y Negociación)
            </span>
          </div>
          <span className={`text-micro font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${sentimentAnalysis.color}`}>
            {sentimentAnalysis.label}
          </span>
        </div>

        {/* Diagnóstico Táctico */}
        <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[var(--ink-2)] block">Recomendación de Negociación:</span>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">{sentimentAnalysis.tactic}</p>
            </div>
          </div>

          {/* Plantilla de réplica táctica pre-redactada */}
          <div className="pt-2 border-t border-[var(--hair)]/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-micro font-mono text-[var(--ink-2)]">Plantilla de réplica sugerida:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(sentimentAnalysis.suggestedDraft, () => {})}
                className="text-micro text-[var(--acc)] hover:text-[var(--acc)] font-mono flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copiar respuesta
              </button>
            </div>
            <p className="text-xs font-sans text-[var(--ink-2)] bg-[var(--sunken)]/90 p-2.5 rounded-[var(--r-m)] whitespace-pre-wrap leading-relaxed">
              {sentimentAnalysis.suggestedDraft}
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: GENERADOR INSTANTÁNEO DE ROADBOOK & CONTRATO */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-xs font-bold font-sans text-[var(--acc)]">
              3. Generador de Hoja de Ruta (Roadbook) y Resumen de Acuerdo
            </span>
          </div>

          {onOpenRoadbookModal && (
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => onOpenRoadbookModal(lead)}
              className="items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>Exportar PDF / imprimir</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tarjeta Roadbook */}
          <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Hoja de ruta (Run of show)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(roadbookMarkdown, setCopiedRoadbook)}
                  className="px-2 py-0.5 rounded bg-[var(--acc)]/30 hover:bg-[var(--acc)]/50 text-[var(--ink)] text-micro font-mono flex items-center gap-1 transition-ui cursor-pointer"
                >
                  {copiedRoadbook ? <Check className="w-3 h-3 text-[var(--ok)]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRoadbook ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-micro text-[var(--ink-2)] leading-snug">
                Horarios de carga, prueba de sonido, contacto técnico y ruta listos para compartir con los músicos en WhatsApp.
              </p>
            </div>
            <pre className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] p-2 rounded overflow-x-auto shrink-0 max-h-24">
              {roadbookMarkdown}
            </pre>
          </div>

          {/* Tarjeta Contrato */}
          <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Acuerdo y condiciones
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(miniContractSummary, setCopiedContract)}
                  className="px-2 py-0.5 rounded bg-[var(--acc)]/30 hover:bg-[var(--acc)]/50 text-[var(--ink)] text-micro font-mono flex items-center gap-1 transition-ui cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3 h-3 text-[var(--ok)]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedContract ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-micro text-[var(--ink-2)] leading-snug">
                Cláusulas clave de sonido (D.I., in-ears), liquidación y hospitalidad listas para formalizar con la sala.
              </p>
            </div>
            <pre className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] p-2 rounded overflow-x-auto shrink-0 max-h-24">
              {miniContractSummary}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
