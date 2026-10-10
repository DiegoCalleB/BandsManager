import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { getPublicDealUrl } from '../../utils/bandHash';
import {
  X,
  Zap,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Calendar,
  Clock,
  Euro,
  FileCheck,
  Shield,
  ShieldCheck,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import { Button, Input } from '../ui';
import { ShowIcon } from '../ui/ShowIcon';

/** % que viene marcado por defecto y opciones rápidas. El importe real lo calcula el servidor. */
const APOYO_PORCENTAJE_DEFECTO = 3;
const APOYO_OPCIONES_RAPIDAS = [0, 3, 5];
const APOYO_PORCENTAJE_MAX = 20;

/** Solo para mostrar "≈ X €" en el formulario; la cifra que se propone la fija el servidor. */
const apoyoAproximado = (cache: number, pct: number) =>
  pct > 0 && cache > 0 ? Math.min(500, Math.max(1, Math.round((cache * pct) / 100))) : 0;
import { useApoyableDeals } from '../../hooks/useApoyableDeals';
import { DealSupportCard } from './DealSupportCard';

interface FastDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  bandName?: string;
  onDealConfirmed?: () => void;
}

export const FastDealModal: React.FC<FastDealModalProps> = ({
  isOpen,
  onClose,
  lead,
  bandName = 'Nuestra Banda',
  onDealConfirmed
}) => {
  // Form State (Single Screen, 0 Tabs)
  const [fechaEvento, setFechaEvento] = useState('');
  const [horaLlegada, setHoraLlegada] = useState('18:30');
  const [horaConcierto, setHoraConcierto] = useState('21:30');
  const [tipoRemuneracion, setTipoRemuneracion] = useState<'cache_fijo' | 'taquilla'>('cache_fijo');
  const [cacheBase, setCacheBase] = useState<number>(500);
  // Apoyo voluntario a BandManager (0 = no apoyar). No se descuenta del caché ni entra en el
  // contrato con la sala: solo fija el importe que se propondrá a la banda cuando la sala firme.
  const [apoyoPorcentaje, setApoyoPorcentaje] = useState<number>(APOYO_PORCENTAJE_DEFECTO);
  const [apoyoOtro, setApoyoOtro] = useState(false);
  const [formaPago, setFormaPago] = useState<'efectivo' | 'transferencia' | 'pago_diferido_ayto'>('efectivo');
  const [incluirRider, setIncluirRider] = useState(true);
  const [hospitalidadNotas, setHospitalidadNotas] = useState('');
  const [mostrarNotasExtra, setMostrarNotasExtra] = useState(false);

  // Status & Token Generation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dealGenerated, setDealGenerated] = useState<{
    id?: string;
    token: string;
    officialUrl: string;
    aiStudioUrl: string;
    estado: string;
  } | null>(null);

  const [copiedOfficial, setCopiedOfficial] = useState(false);
  const [copiedAiStudio, setCopiedAiStudio] = useState(false);

  // Pre-fill when opening
  useEffect(() => {
    if (!isOpen || !lead) return;

    setErrorMsg(null);
    setCopiedOfficial(false);
    setCopiedAiStudio(false);

    // Initial date pre-fill: next month or from lead notes/context
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const defaultDateStr = futureDate.toISOString().slice(0, 10);

    setFechaEvento(lead.fecha_envio?.slice(0, 10) || defaultDateStr);
    setCacheBase(lead.cache_habitual || 500);

    // Fetch existing deal if any
    const fetchExistingDeal = async () => {
      try {
        const token = localStorage.getItem('bandmanager_token');
        const res = await fetch(`/api/deals/lead/${lead.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.deal) {
            setDealGenerated({
              id: data.deal.id,
              token: data.deal.token,
              officialUrl: `https://bandmanager.io/deal/${data.deal.token}`,
              aiStudioUrl: `${window.location.origin}/deal/${data.deal.token}`,
              estado: data.deal.estado
            });
            setFechaEvento(data.deal.fecha_evento || defaultDateStr);
            setCacheBase(data.deal.cache_base || 500);
            setHoraLlegada(data.deal.hora_llegada || '18:30');
            setHoraConcierto(data.deal.hora_concierto || '21:30');
            setFormaPago(data.deal.forma_pago || 'efectivo');
            if (data.deal.apoyo_porcentaje !== null && data.deal.apoyo_porcentaje !== undefined) {
              const pct = Number(data.deal.apoyo_porcentaje);
              setApoyoPorcentaje(pct);
              setApoyoOtro(!APOYO_OPCIONES_RAPIDAS.includes(pct));
            }
          } else {
            setDealGenerated(null);
          }
        }
      } catch (_) {
        setDealGenerated(null);
      }
    };

    fetchExistingDeal();
  }, [isOpen, lead]);

  // Aportación voluntaria: solo si el acuerdo está firmado y aún no se ha apoyado este bolo.
  const { deals: apoyables } = useApoyableDeals(isOpen && dealGenerated?.estado === 'confirmado', lead?.band_id);
  const apoyoDelBolo = dealGenerated?.id ? apoyables.find((d) => d.deal_id === dealGenerated.id) : undefined;

  if (!isOpen || !lead) return null;

  const handleGenerateDeal = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('bandmanager_token');
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          lead_id: lead.id,
          nombre_evento: `Concierto de ${bandName} en ${lead.nombre_sala}`,
          lugar_sala: lead.nombre_sala,
          ciudad: lead.ciudad || '',
          fecha_evento: fechaEvento,
          hora_llegada: horaLlegada,
          hora_concierto: horaConcierto,
          tipo_remuneracion: tipoRemuneracion,
          cache_base: Number(cacheBase) || 0,
          total_acordado: Number(cacheBase) || 0,
          forma_pago: formaPago,
          apoyo_porcentaje: apoyoPorcentaje,
          rider_incluido: incluirRider,
          hospitalidad_notas: hospitalidadNotas
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el acuerdo');
      }

      setDealGenerated({
        id: data.deal.id,
        token: data.deal.token,
        officialUrl: `https://bandmanager.io/deal/${data.deal.token}`,
        aiStudioUrl: `${window.location.origin}/deal/${data.deal.token}`,
        estado: data.deal.estado
      });

      if (onDealConfirmed) {
        onDealConfirmed();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la hoja de acuerdo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOfficial = () => {
    if (!dealGenerated) return;
    navigator.clipboard.writeText(dealGenerated.officialUrl);
    setCopiedOfficial(true);
    setTimeout(() => setCopiedOfficial(false), 2500);
  };

  const handleCopyAiStudio = () => {
    if (!dealGenerated) return;
    navigator.clipboard.writeText(dealGenerated.aiStudioUrl);
    setCopiedAiStudio(true);
    setTimeout(() => setCopiedAiStudio(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Te dejo la Hoja de Acuerdo rápida del concierto de ${bandName} en ${lead.nombre_sala} para que nos des el OK y tengamos la fecha bloqueada: ${dealGenerated?.officialUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-[var(--card)] border border-[var(--hair)] rounded-[var(--r-l)] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* HEADER PREMIUM */}
          <div className="p-4 sm:p-5 border-b border-[var(--hair)] bg-gradient-to-r from-[var(--sunken)] to-[var(--card)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/15 border border-[var(--acc)]/30 flex items-center justify-center text-[var(--acc)] shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[var(--ink)] font-display">
                    Cerrar Acuerdo de Bolo
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)] font-bold">
                    1-Click
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] truncate max-w-xs">
                  {lead.nombre_sala} {lead.ciudad ? `• ${lead.ciudad}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--ink-2)] hover:text-[var(--ink)] p-2 rounded-[var(--r-m)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONTENIDO (UNA SOLA VISTA COMPACTA) */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-[var(--r-m)] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            {/* SECCIÓN 1: FECHA Y HORARIOS */}
            <div className="bg-[var(--sunken)] p-3.5 rounded-[var(--r-m)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                <Calendar className="w-4 h-4 text-[var(--acc)]" />
                <span>Fecha y Horarios</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <label className="text-[11px] text-[var(--ink-2)] block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--ink-2)] block mb-1">Llegada / Prueba</label>
                  <input
                    type="time"
                    value={horaLlegada}
                    onChange={(e) => setHoraLlegada(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--ink-2)] block mb-1">Show / Concierto</label>
                  <input
                    type="time"
                    value={horaConcierto}
                    onChange={(e) => setHoraConcierto(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONDICIONES ECONÓMICAS */}
            <div className="bg-[var(--sunken)] p-3.5 rounded-[var(--r-m)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                  <Euro className="w-4 h-4 text-emerald-400" />
                  <span>Compensación Económica</span>
                </div>
                <div className="flex items-center gap-1 bg-[var(--card)] p-0.5 rounded-[var(--r-s)] border border-[var(--hair)] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTipoRemuneracion('cache_fijo')}
                    className={`px-2 py-0.5 rounded-[var(--r-xs)] transition-colors cursor-pointer ${
                      tipoRemuneracion === 'cache_fijo'
                        ? 'bg-[var(--acc)] text-white font-bold'
                        : 'text-[var(--ink-2)]'
                    }`}
                  >
                    Caché Fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoRemuneracion('taquilla')}
                    className={`px-2 py-0.5 rounded-[var(--r-xs)] transition-colors cursor-pointer ${
                      tipoRemuneracion === 'taquilla'
                        ? 'bg-[var(--acc)] text-white font-bold'
                        : 'text-[var(--ink-2)]'
                    }`}
                  >
                    Taquilla %
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-[var(--ink-2)] block mb-1">
                    {tipoRemuneracion === 'cache_fijo' ? 'Importe Neto (€)' : 'Mínimo Garantizado (€)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={cacheBase}
                      onChange={(e) => setCacheBase(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] font-mono font-bold pr-7 focus:outline-none focus:border-[var(--acc)]"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-[var(--ink-2)]">€</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--ink-2)] block mb-1">Forma de Pago</label>
                  <select
                    value={formaPago}
                    onChange={(e: any) => setFormaPago(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
                  >
                    <option value="efectivo"><ShowIcon inline emoji="💵" />Efectivo al terminar (sobre)</option>
                    <option value="transferencia"><ShowIcon inline emoji="🏦" />Transferencia / Bizum</option>
                    <option value="pago_diferido_ayto"><ShowIcon inline emoji="🏛️" />Pago Diferido (Ayuntamiento / 60d)</option>
                  </select>
                </div>
              </div>

              {/* LIQUIDACIÓN: sin comisión. El apoyo a BandManager es voluntario y se pide al firmar la sala. */}
              <div className="rounded-[var(--r-s)] bg-[var(--surface)] p-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-2)]">Caché que abona la sala</span>
                    <span className="font-bold text-[var(--ink)] font-mono">{cacheBase || 0} €</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-2)]">Comisión de BandManager</span>
                    <span className="font-bold text-[var(--ink)] font-mono">0 €</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ink)]">Apoyo voluntario a BandManager</span>
                    <span className="text-[11px] text-[var(--ink-3)]">opcional</span>
                  </div>

                  <div role="radiogroup" aria-label="Apoyo voluntario a BandManager" className="flex flex-wrap items-center gap-1.5">
                    {APOYO_OPCIONES_RAPIDAS.map((pct) => {
                      const activo = !apoyoOtro && apoyoPorcentaje === pct;
                      return (
                        <Button
                          key={pct}
                          type="button"
                          role="radio"
                          aria-checked={activo}
                          size="sm"
                          variant={activo ? 'inverse' : 'raised'}
                          onClick={() => {
                            setApoyoOtro(false);
                            setApoyoPorcentaje(pct);
                          }}
                        >
                          {pct === 0 ? 'Ahora no' : `${pct} %`}
                        </Button>
                      );
                    })}
                    <Button
                      type="button"
                      role="radio"
                      aria-checked={apoyoOtro}
                      size="sm"
                      variant={apoyoOtro ? 'inverse' : 'raised'}
                      onClick={() => {
                        setApoyoOtro(true);
                        if (APOYO_OPCIONES_RAPIDAS.includes(apoyoPorcentaje)) setApoyoPorcentaje(10);
                      }}
                    >
                      Otro
                    </Button>
                    {apoyoOtro && (
                      <label className="flex items-center gap-1 text-xs text-[var(--ink-2)]">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0.5}
                          max={APOYO_PORCENTAJE_MAX}
                          step={0.5}
                          value={apoyoPorcentaje}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setApoyoPorcentaje(Number.isFinite(n) ? Math.min(APOYO_PORCENTAJE_MAX, Math.max(0, n)) : 0);
                          }}
                          aria-label="Porcentaje de apoyo"
                          className="w-16 rounded-[var(--r-s)] bg-[var(--sunken)] px-2 py-1.5 text-xs text-[var(--ink)] focus:outline-none"
                        />
                        <span>%</span>
                      </label>
                    )}
                  </div>

                  <p className="text-[11px] leading-snug text-[var(--ink-3)]">
                    {apoyoPorcentaje > 0
                      ? `No se descuenta del caché ni forma parte del contrato con la sala. Cuando la sala firme te propondremos ≈ ${apoyoAproximado(Number(cacheBase) || 0, apoyoPorcentaje)} € y podrás cambiar la cifra o cerrar sin pagar.`
                      : 'No te lo volveremos a pedir con este bolo.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: RIDER Y SONIDO */}
            <div className="bg-[var(--sunken)] p-3.5 rounded-[var(--r-m)] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={incluirRider}
                  onChange={(e) => setIncluirRider(e.target.checked)}
                  className="rounded border-[var(--hair)] text-[var(--acc)] focus:ring-[var(--acc)] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-[var(--ink)]">
                  Incluir Rider Técnico y Ficha de Canales de la Banda
                </span>
              </label>
              <p className="text-[11px] text-[var(--ink-2)] pl-6">
                La sala deberá aceptar el rider como requisito obligatorio antes de estampar la firma.
              </p>
            </div>

            {/* NOTAS OPCIONALES / HOSPITALIDAD */}
            {!mostrarNotasExtra ? (
              <button
                type="button"
                onClick={() => setMostrarNotasExtra(true)}
                className="text-xs text-[var(--acc)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>+ Añadir notas de hospitalidad (cenas, hotel, etc.)</span>
              </button>
            ) : (
              <div className="bg-[var(--sunken)] p-3 rounded-[var(--r-m)] space-y-1.5 animate-in fade-in duration-150">
                <label className="text-[11px] text-[var(--ink-2)] block font-medium">
                  Hospitalidad / Catering acordado
                </label>
                <input
                  type="text"
                  placeholder="Ej: 5 cenas en sala, camerino con agua y cerveza"
                  value={hospitalidadNotas}
                  onChange={(e) => setHospitalidadNotas(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--card)] border border-[var(--hair)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--acc)]"
                />
              </div>
            )}

            {/* BOTÓN O RESULTADO GENERADO */}
            {!dealGenerated ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleGenerateDeal}
                disabled={isSubmitting || !fechaEvento}
                className="w-full py-2.5 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando Hoja de Acuerdo...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Generar Enlace 1-Click para la Sala</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]/60 border border-[var(--hair)] space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="w-4 h-4" />
                    <span>
                      {dealGenerated.estado === 'confirmado'
                        ? '¡Acuerdo Ya Firmado por la Sala!'
                        : '¡Enlaces de Acuerdo Listos para Enviar y Probar!'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                    eIDAS Ready
                  </span>
                </div>

                {/* BOTÓN 1: ENLACE AI STUDIO (PRUEBAS / DEMO ACTUAL) */}
                <div className="p-3 rounded-[var(--r-s)] bg-[var(--card)] border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Enlace AI Studio (Pruebas y Demo)
                    </span>
                    <span className="text-[10px] text-[var(--ink-2)]">Para probar y firmar ahora</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={dealGenerated.aiStudioUrl}
                      className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--hair)] text-[11px] font-mono text-[var(--ink)] select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyAiStudio}
                      className="px-2.5 py-1.5 rounded-[var(--r-s)] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-colors"
                      title="Copiar enlace de AI Studio"
                    >
                      {copiedAiStudio ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAiStudio ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <a
                      href={dealGenerated.aiStudioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--ink)] hover:bg-[var(--ink)]/90 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-colors"
                      title="Abrir enlace de AI Studio en una pestaña nueva"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* BOTÓN 2: ENLACE OFICIAL (BANDMANAGER.IO) */}
                <div className="p-3 rounded-[var(--r-s)] bg-[var(--card)] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Enlace Oficial (bandmanager.io)
                    </span>
                    <span className="text-[10px] text-[var(--ink-2)]">Dominio de Producción</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={dealGenerated.officialUrl}
                      className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--hair)] text-[11px] font-mono text-[var(--ink)] select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyOfficial}
                      className="px-2.5 py-1.5 rounded-[var(--r-s)] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-colors"
                      title="Copiar enlace oficial de BandManager.io"
                    >
                      {copiedOfficial ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOfficial ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <a
                      href={dealGenerated.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-[var(--r-s)] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-colors"
                      title="Abrir enlace oficial de BandManager.io"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>

                {/* BOTÓN WHATSAPP A SALA */}
                <div className="pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-[var(--r-s)] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 text-center transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Propuesta por WhatsApp a la Sala</span>
                  </a>
                </div>
              </div>
            )}

            {/* Aportación voluntaria: solo con el acuerdo firmado y el bolo aún sin apoyar */}
            {apoyoDelBolo && <DealSupportCard deal={apoyoDelBolo} />}
          </div>

          {/* FOOTER */}
          <div className="p-3.5 border-t border-[var(--hair)] bg-[var(--sunken)]/60 flex items-center justify-between text-[11px] text-[var(--ink-2)]">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sello Criptográfico SHA-256 e Inmutabilidad eIDAS</span>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--ink-2)] hover:text-[var(--ink)] px-2.5 py-1 rounded hover:bg-[var(--card)] cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
