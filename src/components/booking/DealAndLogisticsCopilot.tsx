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
        color: 'text-zinc-400 bg-zinc-800/60 border-[var(--hair)]',
        tactic: 'Envía un primer pitch conciso con vídeo de directo, enlace al rider y propuesta de 2 fechas alternativas.',
        suggestedSubject: `Propuesta concierto Bakandeya en ${lead.nombre_sala}`,
        suggestedDraft: `Hola equipo de ${lead.nombre_sala},\n\nNos encantaría presentar en vuestra sala nuestro directo (fusión orgánica de violín acústico, sintetizadores analógicos y grooves de baile). Os dejamos nuestro EPK y vídeo en vivo:\nhttps://bandmanager.io/epk\n\n¿Tenéis disponibilidad para un viernes o sábado durante los próximos meses?\n\nUn saludo,\nEquipo Bakandeya`,
      };
    }

    if (text.includes('cerrada') || text.includes('llena') || text.includes('completa') || text.includes('temporada')) {
      return {
        tone: 'closed_schedule',
        label: 'Agenda de temporada cerrada ⏳',
        color: 'text-amber-400 bg-amber-500/10 border-[var(--acc)]/30',
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
        label: 'Objeción económica / Caché 💰',
        color: 'text-sky-400 bg-sky-500/10 border-[var(--acc)]/30',
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
        label: 'Interés Alto / Caliente 🔥',
        color: 'text-emerald-400 bg-emerald-500/10 border-[var(--ok)]/30',
        tactic: 'Cierra fecha ya mismo: pide un hold de 48h, envía el rider y pacta el horario de prueba de sonido.',
        suggestedSubject: `Re: Confirmación de detalles y pre-reserva - ${lead.nombre_sala}`,
        suggestedDraft: `¡Qué gran noticia, nos hace muchísima ilusión tocar en ${lead.nombre_sala}!\n\nPara poder cerrar los billetes y la furgoneta del equipo, ¿podemos dejar la fecha en Pre-reserva (Hold 48h)? Os adjunto el rider con nuestro canal de violín y sintes. ¿A qué hora os viene mejor la prueba de sonido?`,
      };
    }

    return {
      tone: 'open_reply',
      label: 'Conversación en curso 💬',
      color: 'text-purple-400 bg-purple-500/10 border-[var(--acc)]/30',
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
      <div className="p-3 bg-gradient-to-r from-[var(--acc)]/10 via-sky-500/10 to-emerald-500/10 border border-[var(--acc)]/30 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-[var(--acc)]/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 font-display">
              Copiloto de Cierre, Logística & Rentabilidad
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans">Inteligencia financiera y táctica para no perder dinero en carretera</p>
          </div>
        </div>

        {corridorData && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--sunken)] border border-[var(--hair)] text-[10px] font-mono text-amber-300 flex items-center gap-1 shrink-0">
            <Compass className="w-3 h-3 text-amber-400" />
            {corridorData.info.corridor}
          </span>
        )}
      </div>

      {/* BLOQUE 1: CALCULADORA P&L Y PUNTO DE EQUILIBRIO */}
      <div className="bg-[#1A1918] rounded-xl p-4 border border-[var(--hair)] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-sans uppercase text-emerald-400 tracking-wider">
              1. Rentabilidad de Gira & Punto de Equilibrio (Cubrir Gastos)
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isBreakEvenFeasible
                ? 'bg-emerald-500/15 border-[var(--ok)]/40 text-emerald-300'
                : 'bg-amber-500/15 border-[var(--acc)]/40 text-amber-300'
            }`}
          >
            {isBreakEvenFeasible ? '✅ Bolo Viable' : '⚠️ Requiere >60% Aforo'}
          </span>
        </div>

        {/* Inputs de simulación */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-[var(--sunken)] p-2 rounded-lg border border-[var(--hair)]">
            <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">Tipo de Acuerdo</label>
            <select
              value={dealType}
              onChange={(e: any) => setDealType(e.target.value)}
              className="w-full bg-zinc-900 text-zinc-200 text-xs rounded border border-[var(--hair)] p-1 focus:outline-none"
            >
              <option value="taquilla">Taquilla (%)</option>
              <option value="cache">Caché Fijo (€)</option>
              <option value="mixto">Fijo + Taquilla</option>
            </select>
          </div>

          <div className="bg-[var(--sunken)] p-2 rounded-lg border border-[var(--hair)]">
            <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
              {dealType === 'cache' ? 'Caché Fijo (€)' : 'Precio Entrada (€)'}
            </label>
            <input
              type="number"
              value={dealType === 'cache' ? guaranteedCache : ticketPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (dealType === 'cache') setGuaranteedCache(val);
                else setTicketPrice(val);
              }}
              className="w-full bg-zinc-900 text-zinc-200 text-xs rounded border border-[var(--hair)] p-1 focus:outline-none font-mono"
            />
          </div>

          <div className="bg-[var(--sunken)] p-2 rounded-lg border border-[var(--hair)]">
            <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">Distancia Ida (km)</label>
            <input
              type="number"
              value={vanKmEstimated}
              onChange={(e) => setVanKmEstimated(Number(e.target.value))}
              className="w-full bg-zinc-900 text-zinc-200 text-xs rounded border border-[var(--hair)] p-1 focus:outline-none font-mono"
            />
          </div>

          <div className="bg-[var(--sunken)] p-2 rounded-lg border border-[var(--hair)]">
            <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">Hotel + Dietas (€)</label>
            <input
              type="number"
              value={hotelCost + dietsCost}
              onChange={(e) => {
                const total = Number(e.target.value);
                setHotelCost(Math.round(total * 0.6));
                setDietsCost(Math.round(total * 0.4));
              }}
              className="w-full bg-zinc-900 text-zinc-200 text-xs rounded border border-[var(--hair)] p-1 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Dashboard de Resultados de Rentabilidad */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--hair)]/80">
          <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-[var(--hair)] text-center">
            <span className="text-[9px] text-zinc-400 font-mono block">Gastos Viaje Estimados</span>
            <span className="text-sm sm:text-base font-bold font-mono text-rose-400">{totalTourExpenses} €</span>
            <span className="text-[9px] text-zinc-500 block">Gasolina: ~{estimatedFuelExpense}€</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-[var(--hair)] text-center">
            <span className="text-[9px] text-zinc-400 font-mono block">Entradas para Cubrir Costes</span>
            <span className="text-sm sm:text-base font-bold font-mono text-amber-300">{breakEvenTickets} tickets</span>
            <span className="text-[9px] text-zinc-500 block">{breakEvenCapacityPercent}% del aforo</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-[var(--hair)] text-center">
            <span className="text-[9px] text-zinc-400 font-mono block">Beneficio con Sala Llena</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
              {Math.max(0, Math.round(venueCapacity * revenuePerTicketForBand + guaranteedCache - totalTourExpenses))} €
            </span>
            <span className="text-[9px] text-zinc-500 block">Aforo total: {venueCapacity} pax</span>
          </div>
        </div>
      </div>

      {/* BLOQUE 2: DEAL CLOSING COPILOT (ANÁLISIS DE RESPUESTAS Y OBJECIONES) */}
      <div className="bg-[#1A1918] rounded-xl p-4 border border-[var(--hair)] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold font-sans uppercase text-sky-400 tracking-wider">
              2. Asistente Táctico de Cierre (Objeciones & Negociación)
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sentimentAnalysis.color}`}>
            {sentimentAnalysis.label}
          </span>
        </div>

        {/* Diagnóstico Táctico */}
        <div className="p-3 bg-[var(--sunken)] rounded-xl border border-[var(--hair)] space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-zinc-200 block">Recomendación de Negociación:</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{sentimentAnalysis.tactic}</p>
            </div>
          </div>

          {/* Plantilla de réplica táctica pre-redactada */}
          <div className="pt-2 border-t border-[var(--hair)]/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Plantilla de Réplica Sugerida:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(sentimentAnalysis.suggestedDraft, () => {})}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copiar respuesta
              </button>
            </div>
            <p className="text-[11px] font-sans text-zinc-300 bg-zinc-900/90 p-2.5 rounded-lg border border-[var(--hair)] whitespace-pre-wrap leading-relaxed">
              {sentimentAnalysis.suggestedDraft}
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: GENERADOR INSTANTÁNEO DE ROADBOOK & CONTRATO */}
      <div className="bg-[#1A1918] rounded-xl p-4 border border-[var(--hair)] space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold font-sans uppercase text-purple-400 tracking-wider">
              3. Generador de Hoja de Ruta (Roadbook) & Resumen de Acuerdo
            </span>
          </div>

          {onOpenRoadbookModal && (
            <button
              type="button"
              onClick={() => onOpenRoadbookModal(lead)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-[var(--acc)]/40 text-[10px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Exportar PDF / Imprimir</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tarjeta Roadbook */}
          <div className="p-3 bg-[var(--sunken)] rounded-xl border border-[var(--hair)] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  Hoja de Ruta (Run of Show)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(roadbookMarkdown, setCopiedRoadbook)}
                  className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedRoadbook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRoadbook ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">
                Horarios de carga, prueba de sonido, contacto técnico y ruta listos para compartir con los músicos en WhatsApp.
              </p>
            </div>
            <pre className="text-[9px] font-mono text-zinc-300 bg-zinc-950 p-2 rounded border border-[var(--hair)]/80 overflow-x-auto max-h-24">
              {roadbookMarkdown}
            </pre>
          </div>

          {/* Tarjeta Contrato */}
          <div className="p-3 bg-[var(--sunken)] rounded-xl border border-[var(--hair)] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Acuerdo & Condiciones
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(miniContractSummary, setCopiedContract)}
                  className="px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedContract ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 leading-snug">
                Cláusulas clave de sonido (D.I., in-ears), liquidación y hospitalidad listas para formalizar con la sala.
              </p>
            </div>
            <pre className="text-[9px] font-mono text-zinc-300 bg-zinc-950 p-2 rounded border border-[var(--hair)]/80 overflow-x-auto max-h-24">
              {miniContractSummary}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
