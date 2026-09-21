import React, { useState, useMemo } from 'react';
import { Lead, Concert } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Phone,
  ShieldCheck,
  Share2,
  Sparkles,
  Car,
  Fuel,
  Music,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface RoadbookContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  leads?: Lead[];
  concerts?: Concert[];
  bandName?: string;
  isStitchLight?: boolean;
}

export const RoadbookContractModal: React.FC<RoadbookContractModalProps> = ({
  isOpen,
  onClose,
  lead: initialLead,
  leads = [],
  concerts = [],
  bandName = 'Bakandeya',
  isStitchLight = false
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || '');
  const [activeTab, setActiveTab] = useState<'roadbook' | 'contract' | 'weblink'>('roadbook');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Lead activo seleccionado
  const currentLead = useMemo(() => {
    if (selectedLeadId) {
      const found = leads.find(l => l.id === selectedLeadId);
      if (found) return found;
    }
    return initialLead || leads[0] || null;
  }, [selectedLeadId, leads, initialLead]);

  // Parámetros editables en vivo
  const [eventDate, setEventDate] = useState<string>(() => {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [dealType, setDealType] = useState<'taquilla' | 'cache' | 'mixto'>('taquilla');
  const [ticketPrice, setTicketPrice] = useState<number>(12);
  const [cacheAmount, setCacheAmount] = useState<number>(600);
  const [splitPercent, setSplitPercent] = useState<number>(80);
  const [originCity, setOriginCity] = useState<string>('Madrid');
  const [travelDistanceKm, setTravelDistanceKm] = useState<number>(320);

  // Horarios de operaciones
  const [departureTime, setDepartureTime] = useState('15:30');
  const [arrivalTime, setArrivalTime] = useState('18:00');
  const [soundcheckTime, setSoundcheckTime] = useState('19:00');
  const [dinnerTime, setDinnerTime] = useState('20:45');
  const [doorsTime, setDoorsTime] = useState('21:30');
  const [showTime, setShowTime] = useState('22:15');
  const [curfewTime, setCurfewTime] = useState('00:30');

  if (!isOpen || !currentLead) return null;

  const venueName = currentLead.nombre_sala || 'Sala de Conciertos';
  const venueCity = currentLead.ciudad || currentLead.region || 'Ciudad';
  const venueAddress = currentLead.direccion || currentLead.ciudad || 'Por confirmar';
  const contactPerson = currentLead.contacto_nombre || 'Responsable de Programación';
  const contactPhone = currentLead.telefono || 'Por confirmar';
  const contactEmail = currentLead.email_contacto || 'Por confirmar';
  const venueCapacity = currentLead.aforo || 180;

  // Texto formateado para WhatsApp
  const whatsAppMessage = `🚐 *HOJA DE RUTA / ROADBOOK OFICIAL*
🎵 *Banda:* ${bandName}
🏛️ *Sala:* ${venueName} (${venueCity})
📅 *Fecha:* ${eventDate}
📍 *Dirección:* ${venueAddress}
📞 *Contacto Sala:* ${contactPerson} (${contactPhone})

⏰ *HORARIOS RUN OF SHOW:*
• *${departureTime}* - Salida furgoneta desde ${originCity}
• *${arrivalTime}* - Llegada a la sala y descarga
• *${soundcheckTime}* - Prueba de sonido (D.I.s violín acústico, sintes, voces & IEMs)
• *${dinnerTime}* - Cena de la banda
• *${doorsTime}* - Apertura de puertas
• *${showTime}* - ⚡ INICIO CONCIERTO (${bandName} Live)
• *${curfewTime}* - Cierre, recogida y carga furgoneta

🚗 *LOGÍSTICA:*
• Ruta: ${originCity} ↔ ${venueCity} (~${travelDistanceKm} km)
• Parking furgoneta en zona de carga y descarga de la sala.`;

  // Texto del Acuerdo de Actuación
  const contractText = `=====================================================
ACUERDO DE ACTUACIÓN MUSICAL Y CONDICIONES GENERALES
=====================================================
Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}

REUNIDOS:
De una parte, la agrupación artística ${bandName} (en adelante, "EL ARTISTA").
Y de otra parte, la dirección de ${venueName}, sita en ${venueAddress} (${venueCity}) (en adelante, "EL ORGANIZADOR").

EXPONEN Y ACUERDAN LAS SIGUIENTES CONDICIONES:

1. OBJETO Y FECHA:
El Artista ofrecerá una actuación musical en directo el día ${eventDate}, en el recinto de ${venueName}, con apertura de puertas a las ${doorsTime}h e inicio de actuación previsto a las ${showTime}h.

2. CONDICIONES ECONÓMICAS:
${dealType === 'cache'
  ? `• Caché acordado: ${cacheAmount} € netos, a abonar por El Organizador al término de la actuación.`
  : dealType === 'taquilla'
  ? `• Régimen de taquilla: El Artista percibirá el ${splitPercent}% de la recaudación íntegra de entradas (precio de venta al público: ${ticketPrice} €). La liquidación se efectuará en metálico o transferencia inmediata al finalizar el concierto.`
  : `• Régimen mixto: Garantía mínima de ${cacheAmount} € más el ${splitPercent}% de la taquilla neta superado el punto de equilibrio.`
}

3. RIDER TÉCNICO Y PRUEBAS:
• El Organizador garantiza sistema de PA adecuado al aforo de ${venueCapacity} personas y monitorización.
• El Artista requiere 3 cajas de inyección directa activas (D.I.) para violín acústico y sintetizadores, microfonía para voces y envíos auxiliares para sistema IEM/monitores.
• La prueba de sonido tendrá lugar a las ${soundcheckTime}h.

4. HOSPITALIDAD:
El Organizador proveerá agua en escenario, catering o cena caliente para los integrantes del grupo y plaza de estacionamiento reservada para furgoneta de producción.

5. FUERZA MAYOR Y RESPONSABILIDAD:
Ninguna de las partes incurrirá en penalización en caso de cancelación sobrevenida por causa de fuerza mayor justificada según la legislación vigente.

Firmado en conformidad por ambas partes.`;

  const handleCopy = (text: string, setStatus: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setStatus(true);
    setTimeout(() => setStatus(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div
          id="roadbook-contract-modal"
          className="relative w-full max-w-4xl bg-[#141414] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100"
        >
          {/* HEADER DEL MODAL */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-[#1A1918] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-display flex items-center gap-2">
                  <span>Hoja de Ruta (Roadbook) & Contrato Pro</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                    Gira {bandName}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Exporta run of show para WhatsApp, acuerdo para la sala o imprime en PDF para la furgoneta
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BARRA DE SELECTOR DE SALA Y PESTAÑAS */}
          <div className="p-3 sm:px-5 bg-zinc-950/80 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Selector de sala activa */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono uppercase text-[10px]">Evento / Sala:</span>
              <select
                value={currentLead.id}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nombre_sala} ({l.ciudad}) {l.estado === 'confirmado' ? '★ Confirmado' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('roadbook')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'roadbook'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Roadbook & Horarios</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'contract'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acuerdo / Contrato</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('weblink')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'weblink'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enlace Web</span>
              </button>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* PESTAÑA 1: ROADBOOK & RUN OF SHOW */}
            {activeTab === 'roadbook' && (
              <div className="space-y-4">
                {/* Controles rápidos de edición de horarios */}
                <div className="p-3.5 bg-[#1A1918] rounded-xl border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Fecha Evento</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Salida Furgoneta</label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Prueba Sonido</label>
                    <input
                      type="text"
                      value={soundcheckTime}
                      onChange={(e) => setSoundcheckTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Inicio Show</label>
                    <input
                      type="text"
                      value={showTime}
                      onChange={(e) => setShowTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Previsualización de la Hoja de Ruta Pro */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4 font-sans print:bg-white print:text-black print:border-none">
                  {/* Cabecera del documento */}
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-amber-400 block font-bold">
                        DOCUMENTO OPERATIVO DE GIRA
                      </span>
                      <h2 className="text-xl font-black text-white tracking-tight">{venueName}</h2>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{venueAddress} ({venueCity})</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-zinc-300 block">
                        {new Date(eventDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Aforo: {venueCapacity} pax</span>
                    </div>
                  </div>

                  {/* Cronograma visual en dos columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block border-b border-zinc-800/80 pb-1">
                        Timeline de Operaciones
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                          <span className="text-xs font-mono font-bold text-amber-400 w-12">{departureTime}</span>
                          <span className="text-zinc-300">Salida furgoneta desde {originCity}</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                          <span className="text-xs font-mono font-bold text-amber-400 w-12">{arrivalTime}</span>
                          <span className="text-zinc-300">Llegada, descarga y carga en camerino</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <span className="text-xs font-mono font-bold text-amber-300 w-12">{soundcheckTime}</span>
                          <span className="text-zinc-200 font-medium">Prueba sonido (D.I.s violín acústico, sintes, voces & IEMs)</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                          <span className="text-xs font-mono font-bold text-amber-400 w-12">{dinnerTime}</span>
                          <span className="text-zinc-300">Cena de banda / descanso previo</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <span className="text-xs font-mono font-bold text-emerald-400 w-12">{showTime}</span>
                          <span className="text-zinc-100 font-bold">⚡ INICIO CONCIERTO (Show 75 min)</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                          <span className="text-xs font-mono font-bold text-amber-400 w-12">{curfewTime}</span>
                          <span className="text-zinc-300">Cierre, recogida, firmas y salida</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block border-b border-zinc-800/80 pb-1">
                        Contactos y Especificaciones
                      </span>
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Responsable de Sala / Programador:</span>
                          <span className="font-medium text-zinc-200">{contactPerson}</span>
                          <span className="text-zinc-400 block font-mono text-[11px]">{contactPhone} • {contactEmail}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">Rider Rápido en Escenario:</span>
                          <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                            <li>2x D.I. activas para violín acústico (Canales 1-2)</li>
                            <li>1x D.I. estéreo para sintetizador analógico / percusión</li>
                            <li>2x Envíos auxiliares balanceados para transmisor In-Ear (IEM)</li>
                            <li>Toma de corriente Schuko 220V en puesto de escenario</li>
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">Hospitalidad & Parking:</span>
                          <span className="text-zinc-300 text-[11px]">
                            Agua sin gas en escenario, camerino con llave y espacio reservado para estacionamiento de furgoneta.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: ACUERDO / CONTRATO SIMPLIFICADO */}
            {activeTab === 'contract' && (
              <div className="space-y-4">
                {/* Parámetros de negociación del contrato */}
                <div className="p-3.5 bg-[#1A1918] rounded-xl border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Régimen Económico</label>
                    <select
                      value={dealType}
                      onChange={(e: any) => setDealType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 focus:outline-none focus:border-amber-500"
                    >
                      <option value="taquilla">Taquilla (%)</option>
                      <option value="cache">Caché Fijo (€)</option>
                      <option value="mixto">Fijo + Taquilla</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">
                      {dealType === 'cache' ? 'Caché Neto (€)' : 'Precio Entrada (€)'}
                    </label>
                    <input
                      type="number"
                      value={dealType === 'cache' ? cacheAmount : ticketPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (dealType === 'cache') setCacheAmount(val);
                        else setTicketPrice(val);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Reparto Banda (%)</label>
                    <input
                      type="number"
                      value={splitPercent}
                      onChange={(e) => setSplitPercent(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Aforo Sala</label>
                    <input
                      type="number"
                      value={venueCapacity}
                      disabled
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded p-1 font-mono"
                    />
                  </div>
                </div>

                {/* Previsualización del Contrato */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {contractText}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: ENLACE WEB DIGITAL */}
            {activeTab === 'weblink' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#1A1918] rounded-2xl border border-zinc-800 space-y-3 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center shrink-0 shadow-lg">
                      <Share2 className="w-7 h-7 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">
                        Hoja de Ruta Digital para Móvil (Sin Login)
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Comparte este enlace directo con tus músicos, chófer y técnico de sonido para que tengan los horarios, ubicación y teléfonos actualizados en vivo.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://bandmanager.io/roadbook/${currentLead.id}?date=${eventDate}`}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-3 py-2 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(`https://bandmanager.io/roadbook/${currentLead.id}?date=${eventDate}`, setCopiedLink)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    El enlace web no expone datos sensibles ni contraseñas; solo los datos operacionales de este concierto específico.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER DE ACCIONES */}
          <div className="p-4 border-t border-zinc-800 bg-[#1A1918] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono text-[11px] text-amber-400 font-bold">
                {currentLead.nombre_sala} • {currentLead.ciudad}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {activeTab === 'roadbook' && (
                <button
                  type="button"
                  onClick={() => handleCopy(whatsAppMessage, setCopiedWhatsApp)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copiar texto formateado listo para WhatsApp"
                >
                  {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWhatsApp ? '¡Copiado para WhatsApp!' : 'Copiar para WhatsApp'}</span>
                </button>
              )}

              {activeTab === 'contract' && (
                <button
                  type="button"
                  onClick={() => handleCopy(contractText, setCopiedContract)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract ? '¡Contrato Copiado!' : 'Copiar Contrato'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir documento o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-400" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
