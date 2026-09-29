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
  Info,
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
  isStitchLight = false,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || '');
  const [activeTab, setActiveTab] = useState<'roadbook' | 'contract' | 'weblink'>('roadbook');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Lead activo seleccionado
  const currentLead = useMemo(() => {
    if (selectedLeadId) {
      const found = leads.find((l) => l.id === selectedLeadId);
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
${
  dealType === 'cache'
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[var(--scrim)]/80 overflow-y-auto">
        <div
          id="roadbook-contract-modal"
          className="relative w-full max-w-4xl bg-[var(--surface)] rounded-[var(--r-l)] overflow-hidden flex flex-col max-h-[92vh] text-[var(--ink-2)]"
        >
          {/* HEADER DEL MODAL */}
          <div className="p-4 sm:p-5 border-b border-[var(--hair)] bg-[var(--sunken)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[var(--acc)]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink-2)] font-display flex items-center gap-2">
                  <span>Hoja de Ruta (Roadbook) & Contrato Pro</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc)] font-mono">
                    Gira {bandName}
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-2)]">
                  Exporta run of show para WhatsApp, acuerdo para la sala o imprime en PDF para la furgoneta
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BARRA DE SELECTOR DE SALA Y PESTAÑAS */}
          <div className="p-3 sm:px-5 bg-[var(--surface)]/80 border-b border-[var(--hair)]/80 flex flex-wrap items-center justify-between gap-3">
            {/* Selector de sala activa */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--ink-2)] font-mono text-[10px]">Evento / Sala:</span>
              <select
                value={currentLead.id}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="bg-[var(--sunken)] text-[var(--ink-2)] text-xs rounded-[var(--r-m)] px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre_sala} ({l.ciudad}) {l.estado === 'confirmado' ? '★ Confirmado' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1 bg-[var(--sunken)]/90 p-1 rounded-[var(--r-m)] ">
              <button
                type="button"
                onClick={() => setActiveTab('roadbook')}
                className={`px-3 py-1 text-xs font-semibold rounded-[var(--r-m)] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'roadbook' ? 'bg-[var(--acc)] text-[var(--ink)] font-bold shadow' : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Roadbook & Horarios</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                className={`px-3 py-1 text-xs font-semibold rounded-[var(--r-m)] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'contract' ? 'bg-[var(--acc)] text-[var(--ink)] font-bold shadow' : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acuerdo / Contrato</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('weblink')}
                className={`px-3 py-1 text-xs font-semibold rounded-[var(--r-m)] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'weblink' ? 'bg-[var(--acc)] text-[var(--ink)] font-bold shadow' : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
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
                <div className="p-3.5 bg-[var(--sunken)] rounded-[var(--r-m)] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Fecha Evento</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Salida Furgoneta</label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Prueba Sonido</label>
                    <input
                      type="text"
                      value={soundcheckTime}
                      onChange={(e) => setSoundcheckTime(e.target.value)}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Inicio Show</label>
                    <input
                      type="text"
                      value={showTime}
                      onChange={(e) => setShowTime(e.target.value)}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                </div>

                {/* Previsualización de la Hoja de Ruta Pro */}
                <div className="bg-[var(--sunken)] p-5 rounded-[var(--r-l)] space-y-4 font-sans print:bg-[var(--surface)] print:text-[var(--ink)] print:border-none">
                  {/* Cabecera del documento */}
                  <div className="flex items-start justify-between border-b border-[var(--hair)] pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--acc)] block font-bold">DOCUMENTO OPERATIVO DE GIRA</span>
                      <h2 className="text-xl font-black text-[var(--ink)] tracking-tight">{venueName}</h2>
                      <p className="text-xs text-[var(--ink-2)] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                        <span>
                          {venueAddress} ({venueCity})
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[var(--ink-2)] block">
                        {new Date(eventDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] text-[var(--ink-2)] font-mono">Aforo: {venueCapacity} pax</span>
                    </div>
                  </div>

                  {/* Cronograma visual en dos columnas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--ink-2)] block border-b border-[var(--hair)]/80 pb-1">
                        Timeline de Operaciones
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 ">
                          <span className="text-xs font-mono font-bold text-[var(--acc)] w-12">{departureTime}</span>
                          <span className="text-[var(--ink-2)]">Salida furgoneta desde {originCity}</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 ">
                          <span className="text-xs font-mono font-bold text-[var(--acc)] w-12">{arrivalTime}</span>
                          <span className="text-[var(--ink-2)]">Llegada, descarga y carga en camerino</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 ">
                          <span className="text-xs font-mono font-bold text-[var(--acc)] w-12">{soundcheckTime}</span>
                          <span className="text-[var(--ink-2)] font-medium">Prueba sonido (D.I.s violín acústico, sintes, voces & IEMs)</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 ">
                          <span className="text-xs font-mono font-bold text-[var(--acc)] w-12">{dinnerTime}</span>
                          <span className="text-[var(--ink-2)]">Cena de banda / descanso previo</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 ">
                          <span className="text-xs font-mono font-bold text-[var(--ok)] w-12">{showTime}</span>
                          <span className="text-[var(--ink-2)] font-bold">⚡ INICIO CONCIERTO (Show 75 min)</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 ">
                          <span className="text-xs font-mono font-bold text-[var(--acc)] w-12">{curfewTime}</span>
                          <span className="text-[var(--ink-2)]">Cierre, recogida, firmas y salida</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--ink-2)] block border-b border-[var(--hair)]/80 pb-1">
                        Contactos y Especificaciones
                      </span>
                      <div className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)]/60 space-y-2">
                        <div>
                          <span className="text-[10px] text-[var(--ink-2)] block">Responsable de Sala / Programador:</span>
                          <span className="font-medium text-[var(--ink-2)]">{contactPerson}</span>
                          <span className="text-[var(--ink-2)] block font-mono text-[11px]">
                            {contactPhone} • {contactEmail}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-[var(--hair)]">
                          <span className="text-[10px] text-[var(--ink-2)] block">Rider Rápido en Escenario:</span>
                          <ul className="list-disc list-inside text-[var(--ink-2)] space-y-0.5 text-[11px]">
                            <li>2x D.I. activas para violín acústico (Canales 1-2)</li>
                            <li>1x D.I. estéreo para sintetizador analógico / percusión</li>
                            <li>2x Envíos auxiliares balanceados para transmisor In-Ear (IEM)</li>
                            <li>Toma de corriente Schuko 220V en puesto de escenario</li>
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-[var(--hair)]">
                          <span className="text-[10px] text-[var(--ink-2)] block">Hospitalidad & Parking:</span>
                          <span className="text-[var(--ink-2)] text-[11px]">
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
                <div className="p-3.5 bg-[var(--sunken)] rounded-[var(--r-m)] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Régimen Económico</label>
                    <select
                      value={dealType}
                      onChange={(e: any) => setDealType(e.target.value)}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    >
                      <option value="taquilla">Taquilla (%)</option>
                      <option value="cache">Caché Fijo (€)</option>
                      <option value="mixto">Fijo + Taquilla</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">
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
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Reparto Banda (%)</label>
                    <input
                      type="number"
                      value={splitPercent}
                      onChange={(e) => setSplitPercent(Number(e.target.value))}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono focus:outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-[var(--ink-2)] block mb-1">Aforo Sala</label>
                    <input
                      type="number"
                      value={venueCapacity}
                      disabled
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded p-1 font-mono"
                    />
                  </div>
                </div>

                {/* Previsualización del Contrato */}
                <div className="bg-[var(--sunken)] p-5 rounded-[var(--r-l)] space-y-3 font-mono text-xs text-[var(--ink-2)] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {contractText}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: ENLACE WEB DIGITAL */}
            {activeTab === 'weblink' && (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--sunken)] rounded-[var(--r-l)] space-y-3 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-14 h-14 rounded-[var(--r-l)] bg-[var(--acc)]  flex items-center justify-center shrink-0">
                      <Share2 className="w-7 h-7 text-[var(--ink)]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)] font-display">Hoja de Ruta Digital para Móvil (Sin Login)</h4>
                      <p className="text-xs text-[var(--ink-2)] mt-0.5">
                        Comparte este enlace directo con tus músicos, chófer y técnico de sonido para que tengan los horarios, ubicación y
                        teléfonos actualizados en vivo.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://bandmanager.io/roadbook/${currentLead.id}?date=${eventDate}`}
                      className="w-full bg-[var(--surface)] text-[var(--ink-2)] text-xs rounded-[var(--r-m)] px-3 py-2 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(`https://bandmanager.io/roadbook/${currentLead.id}?date=${eventDate}`, setCopiedLink)}
                      className="w-full sm:w-auto px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center gap-2 text-xs text-[var(--ink-2)]">
                  <Info className="w-4 h-4 text-[var(--acc)] shrink-0" />
                  <span>
                    El enlace web no expone datos sensibles ni contraseñas; solo los datos operacionales de este concierto específico.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER DE ACCIONES */}
          <div className="p-4 border-t border-[var(--hair)] bg-[var(--sunken)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
              <span className="font-mono text-[11px] text-[var(--acc)] font-bold">
                {currentLead.nombre_sala} • {currentLead.ciudad}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {activeTab === 'roadbook' && (
                <button
                  type="button"
                  onClick={() => handleCopy(whatsAppMessage, setCopiedWhatsApp)}
                  className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--ok)]/30 hover:bg-[var(--ok)]/50 text-[var(--ok)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
                  className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 hover:bg-[var(--acc)]/50 text-[var(--acc)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract ? '¡Contrato Copiado!' : 'Copiar Contrato'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir documento o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-medium transition-colors cursor-pointer"
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
