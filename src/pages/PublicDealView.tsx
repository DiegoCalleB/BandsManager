import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Printer,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';

interface DealData {
  token: string;
  nombre_evento: string;
  lugar_sala: string;
  ciudad: string;
  fecha_evento: string;
  hora_llegada: string;
  hora_concierto: string;
  tipo_remuneracion: string;
  cache_base: number;
  total_acordado: number;
  forma_pago: string;
  rider_incluido: boolean;
  rider_texto: string;
  rider_validado_por_sala: boolean;
  hospitalidad_notas: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado';
  nombre_firmante?: string | null;
  cargo_firmante?: string | null;
  firma_timestamp?: string | null;
  contrato_sha256?: string | null;
}

export const PublicDealView: React.FC = () => {
  // Extract token from pathname: /deal/:token, query params (?token=dl_...), or hash
  const token = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token') || params.get('t') || params.get('d');
    if (queryToken) return queryToken.trim();

    // Check hash if any (e.g. #/deal/dl_xxx)
    if (window.location.hash) {
      const hashClean = window.location.hash.replace(/^#\/?/, '');
      const hashParts = hashClean.split('/').filter(Boolean);
      const hashToken = hashParts.find(p => p.startsWith('dl_')) || hashParts[1] || hashParts[0];
      if (hashToken && !['deal', 'acuerdo', 'contrato'].includes(hashToken.toLowerCase())) {
        return hashToken.trim();
      }
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const dlPart = pathParts.find(p => p.startsWith('dl_'));
    if (dlPart) return dlPart.trim();

    const dealIdx = pathParts.findIndex(p => ['deal', 'acuerdo', 'contrato'].includes(p.toLowerCase()));
    if (dealIdx !== -1 && pathParts[dealIdx + 1]) {
      return pathParts[dealIdx + 1].trim();
    }

    return pathParts[1] || pathParts[0] || '';
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<DealData | null>(null);

  // Form State for Signature
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Programador / Dirección de Sala');
  const [signerEmail, setSignerEmail] = useState('');
  const [riderAccepted, setRiderAccepted] = useState(false);
  const [showRiderDetails, setShowRiderDetails] = useState(false);

  const [isSigning, setIsSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  // Email Resend State
  const [resendEmailInput, setResendEmailInput] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const isDrawing = useRef(false);

  // Fetch Deal Data
  useEffect(() => {
    if (!token) {
      setError('Enlace inválido o sin token de concierto');
      setLoading(false);
      return;
    }

    const fetchDeal = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/deals/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar el acuerdo');
        }

        setDeal(data.deal);
        if (data.deal.estado === 'confirmado') {
          setSignSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [token]);

  // Canvas Drawing Handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#2158DC'; // Azul eléctrico oficial de BandManager.io (--acc)
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [deal, signSuccess]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSignDeal = async () => {
    if (!signerName.trim()) {
      alert('Por favor, introduce tu nombre o el de la persona responsable de la sala.');
      return;
    }
    if (!riderAccepted) {
      alert('Debes marcar la casilla aceptando las condiciones y el rider técnico.');
      return;
    }
    if (!hasSignature) {
      alert('Por favor, realiza tu firma en el recuadro táctil.');
      return;
    }

    const canvas = canvasRef.current;
    const firmaImagen = canvas ? canvas.toDataURL('image/png') : '';

    try {
      setIsSigning(true);
      const res = await fetch(`/api/public/deals/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_firmante: signerName,
          cargo_firmante: signerRole,
          email_firmante: signerEmail,
          firma_imagen: firmaImagen,
          rider_validado_por_sala: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la firma');
      }

      // La respuesta de /sign es parcial (solo estado y firma): se fusiona, no se sustituye
      setDeal(prev => (prev ? { ...prev, ...data.deal } : data.deal));
      setSignSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error al confirmar el acuerdo');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    if (!resendEmailInput.trim() || !resendEmailInput.includes('@')) {
      alert('Por favor, introduce un correo electrónico válido');
      return;
    }
    try {
      setResending(true);
      setResendStatus(null);
      const res = await fetch(`/api/public/deals/${token}/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmailInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el correo');
      }
      setResendStatus(data.mensaje || '¡Copia enviada correctamente!');
    } catch (err: any) {
      alert(err.message || 'Error al enviar el correo');
    } finally {
      setResending(false);
    }
  };

  // Google Calendar URL Generator
  const googleCalendarUrl = React.useMemo(() => {
    if (!deal) return '#';
    if (!deal.fecha_evento) return '#';
    const cleanDate = String(deal.fecha_evento).replace(/-/g, '');
    const startTime = String(deal.hora_concierto || '21:30').replace(':', '') + '00';
    const endTime = '235900';
    const dates = `${cleanDate}T${startTime}/${cleanDate}T${endTime}`;
    const text = encodeURIComponent(deal.nombre_evento ?? '');
    const location = encodeURIComponent(`${deal.lugar_sala}, ${deal.ciudad}`);
    const details = encodeURIComponent(
      `Concierto confirmado con BandManager.io. Llegada: ${deal.hora_llegada}. Show: ${deal.hora_concierto}.`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  }, [deal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--acc)] mb-3" />
        <p className="text-sm font-semibold text-[var(--ink-2)]">Cargando Hoja de Acuerdo Oficial...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] p-7 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-[var(--alert)] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[var(--ink)] mb-2">Acuerdo No Disponible</h2>
          <p className="text-sm text-[var(--ink-2)] mb-6">{error || 'El enlace no es válido o ha expirado.'}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:opacity-90 text-xs font-bold text-[var(--on-acc)] transition-opacity"
          >
            Ir a BandManager.io
          </a>
        </div>
      </div>
    );
  }

  const isConfirmed = deal.estado === 'confirmado' || signSuccess;

  return (
    <div className="min-h-screen bg-[var(--bg)] py-6 sm:py-10 px-3 sm:px-6 font-sans text-[var(--ink)] antialiased">
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* BRANDING HEADER SUPERIOR */}
        <div className="flex items-center justify-between px-2">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <img
              src="/logo_bandmanager_symbol.png?v=4"
              alt="BandManager.io"
              className="w-8 h-8 rounded-[var(--r-s)] shadow-xs"
            />
            <div>
              <span className="font-display text-base font-bold text-[var(--ink)] tracking-tight block">
                BandManager<span className="text-[var(--acc)]">.io</span>
              </span>
              <span className="text-[11px] font-semibold text-[var(--ink-2)] uppercase tracking-wider block">
                Acuerdo Oficial de Directo
              </span>
            </div>
          </a>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] border border-[var(--hair)] text-xs font-semibold text-[var(--ink-2)] shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[var(--acc)]" />
            <span>Validez Legal eIDAS</span>
          </div>
        </div>

        {/* TARJETA PRINCIPAL DEL DOCUMENTO */}
        <div className="bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] overflow-hidden shadow-sm">
          
          {/* BANNER DE ESTADO */}
          <div
            className={`p-4 sm:p-5 flex items-center justify-between ${
              isConfirmed
                ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                : 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <div className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--ok)] text-[var(--on-ok)] flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
                  {isConfirmed
                    ? 'Acuerdo Confirmado y Bloqueado'
                    : 'Hoja de Acuerdo y Reserva de Fecha'}
                </h1>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  {isConfirmed
                    ? 'Contrato sellado digitalmente conforme al reglamento eIDAS'
                    : 'Confirmación rápida de condiciones para bloquear la fecha'}
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] uppercase font-mono font-bold px-3 py-1 rounded-[var(--r-pill)] shrink-0 shadow-2xs ${
                isConfirmed
                  ? 'bg-[var(--ok)] text-[var(--on-ok)]'
                  : 'bg-[var(--acc)] text-[var(--on-acc)]'
              }`}
            >
              {isConfirmed ? 'Confirmado' : 'Pendiente'}
            </span>
          </div>

          {/* CUERPO DEL ACUERDO */}
          <div className="p-5 sm:p-7 space-y-6">
            
            {/* ENCABEZADO ARTÍSTICO Y RECINTO */}
            <div className="border-b border-[var(--hair)] pb-5">
              <span className="text-[11px] font-bold text-[var(--acc)] uppercase tracking-wider block mb-1">
                Artista & Recinto
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight leading-tight">
                {deal.nombre_evento}
              </h2>
              <div className="flex items-center gap-2 mt-2.5 text-[var(--ink-2)] text-sm font-medium">
                <MapPin className="w-4 h-4 text-[var(--acc)] shrink-0" />
                <span>
                  {deal.lugar_sala} {deal.ciudad ? `• ${deal.ciudad}` : ''}
                </span>
              </div>
            </div>

            {/* CAJA 1: FECHA Y CRONOGRAMA DE HORARIOS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-[var(--sunken)] p-4.5 rounded-[var(--r-m)]">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-[var(--ink-2)] flex items-center gap-1.5 tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Fecha de Evento
                </span>
                <p className="text-base sm:text-lg font-bold text-[var(--ink)] capitalize">
                  {new Date(`${deal.fecha_evento}T12:00:00Z`).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-[var(--ink-2)] flex items-center gap-1.5 tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Horarios de Producción
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[var(--ink)] leading-snug">
                  Llegada y Prueba: <span className="font-bold text-[var(--acc)]">{deal.hora_llegada}</span> <br />
                  Concierto: <span className="font-bold text-[var(--acc)]">{deal.hora_concierto}</span>
                </p>
              </div>
            </div>

            {/* CAJA 2: COMPENSACIÓN ECONÓMICA PACTADA */}
            <div className="bg-[var(--sunken)] p-5 rounded-[var(--r-m)] border-l-4 border-l-[var(--acc)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[var(--ink-2)] tracking-wider">
                  Compensación Económica
                </span>
                <span className="text-xs font-bold text-[var(--acc-ink)] uppercase px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)]">
                  {deal.tipo_remuneracion === 'cache_fijo' ? 'Caché Fijo' : 'Porcentaje Taquilla'}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl sm:text-4xl font-black text-[var(--ink)] tracking-tight">
                  {deal.total_acordado ? `${deal.total_acordado} €` : 'A convenir'}
                </span>
                <span className="text-xs font-bold text-[var(--ink)] bg-[var(--surface)] px-3 py-1.5 rounded-[var(--r-s)] shadow-2xs border border-[var(--hair)]">
                  {deal.forma_pago === 'efectivo'
                    ? '💵 Efectivo al finalizar'
                    : deal.forma_pago === 'transferencia'
                    ? '🏦 Transferencia bancaria / Bizum'
                    : '🏛️ Pago diferido (Ayuntamiento)'}
                </span>
              </div>
            </div>

            {/* CAJA 3: RIDER TÉCNICO Y SONIDO */}
            {deal.rider_incluido && (
              <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[var(--acc)]" />
                    <span className="text-sm font-bold text-[var(--ink)]">Rider Técnico y Escenario</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRiderDetails(!showRiderDetails)}
                    className="text-xs font-bold text-[var(--acc)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showRiderDetails ? 'Ocultar resumen' : 'Ver resumen de canales'}</span>
                    {showRiderDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Ficha de producción de directo estándar de la banda con microfonía, cajas de inyección directa (D.I.) y envíos de monitores.
                </p>

                {showRiderDetails && (
                  <div className="p-3.5 bg-[var(--surface)] rounded-[var(--r-s)] text-xs font-mono text-[var(--ink)] border border-[var(--hair)] space-y-1.5 animate-in fade-in duration-150">
                    <p className="font-bold text-[var(--acc)] border-b border-[var(--hair)] pb-1">Line-up de Canales de PA y Escenario:</p>
                    <p>• Canal 1: Voz Principal (Shure SM58 / Cable XLR propio)</p>
                    <p>• Canal 2: Voz Coros (Shure SM58)</p>
                    <p>• Canal 3-4: Líneas estéreo Teclado / Sintes (D.I. balanceada)</p>
                    <p>• Canal 5: Bajo Eléctrico (D.I. directa a previo)</p>
                    <p>• Canal 6-8: Batería básica (Bombo, Caja, Overheads)</p>
                    <p>• Monitores: 2 o 3 mezclas independientes en escenario</p>
                  </div>
                )}
              </div>
            )}

            {/* CAJA 4: NOTAS DE HOSPITALIDAD (SI APLICA) */}
            {deal.hospitalidad_notas && (
              <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] text-xs text-[var(--ink)] space-y-1">
                <span className="font-bold uppercase text-[10px] text-[var(--ink-2)] tracking-wider block">
                  Hospitalidad, Camerino & Catering Acordado
                </span>
                <p className="font-medium">{deal.hospitalidad_notas}</p>
              </div>
            )}

            {/* SECCIÓN DE FIRMA (SI ESTÁ PENDIENTE) */}
            {!isConfirmed ? (
              <div className="pt-5 border-t border-[var(--hair)] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    Firma de Conformidad de la Sala
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Introduce los datos del responsable y realiza la firma táctil para validar y bloquear la fecha.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">Nombre y Apellidos</label>
                    <input
                      type="text"
                      placeholder="Ej: Javier Gómez"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--line)] text-xs text-[var(--ink)] font-medium placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--acc)] shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">Cargo / Responsabilidad</label>
                    <input
                      type="text"
                      placeholder="Ej: Programador de Sala"
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--line)] text-xs text-[var(--ink)] font-medium placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--acc)] shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1">
                    Email de la Sala (para recibir copia oficial del acuerdo y certificado eIDAS)
                  </label>
                  <input
                    type="email"
                    placeholder="programacion@sala.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[var(--r-s)] bg-[var(--sunken)] border border-[var(--line)] text-xs text-[var(--ink)] font-medium placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--acc)] shadow-2xs"
                  />
                </div>

                {/* CHECKBOX OBLIGATORIO DE RIDER Y CONDICIONES */}
                <label className="flex items-start gap-2.5 p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={riderAccepted}
                    onChange={(e) => setRiderAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--line)] text-[var(--acc)] focus:ring-[var(--acc)] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[var(--ink)] leading-snug">
                    He revisado las condiciones económicas, horarios y requerimientos técnicos del concierto y confirmo la
                    disponibilidad de la sala para la fecha indicada.
                  </span>
                </label>

                {/* LIENZO DE FIRMA TÁCTIL (MANUSCRITA) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink-2)]">Firma manuscrita (pantalla táctil o ratón):</span>
                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs font-bold text-[var(--alert)] hover:underline cursor-pointer"
                      >
                        Borrar firma
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed border-[var(--line-strong)] rounded-[var(--r-m)] bg-white overflow-hidden relative touch-none shadow-inner">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-32 cursor-crosshair block"
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-[var(--ink-3)] font-medium select-none">
                        Firme aquí con el dedo o ratón ✍️
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÓN OFICIAL DE CONFIRMAR */}
                <button
                  type="button"
                  onClick={handleSignDeal}
                  disabled={isSigning || !riderAccepted || !hasSignature || !signerName.trim()}
                  className={`w-full py-3.5 rounded-[var(--r-m)] font-bold text-sm flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-md ${
                    riderAccepted && hasSignature && signerName.trim()
                      ? 'bg-[var(--acc)] hover:opacity-90 text-[var(--on-acc)]'
                      : 'bg-[var(--sunken)] text-[var(--ink-3)] cursor-not-allowed border border-[var(--hair)]'
                  }`}
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sellando Acuerdo Criptográfico...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirmar y Firmar Concierto (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* SECCIÓN POST-FIRMA (CERTIFICADO NOTARIAL / eIDAS) */
              <div className="pt-5 border-t border-[var(--hair)] space-y-4 animate-in fade-in duration-300">
                <div className="p-5 rounded-[var(--r-m)] bg-[var(--ok-soft)] text-[var(--ok)] space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Sello Criptográfico Inmutable Generado</span>
                  </div>
                  <p className="text-xs text-[var(--ink)] leading-relaxed font-medium">
                    Documento firmado por <span className="font-bold">{deal.nombre_firmante}</span>{' '}
                    ({deal.cargo_firmante || 'Responsable de Programación'}).
                  </p>
                  {deal.firma_timestamp && (
                    <p className="text-[11px] text-[var(--ink-2)] font-mono">
                      Timestamp Certificado UTC: {new Date(deal.firma_timestamp).toLocaleString('es-ES')}
                    </p>
                  )}
                  {deal.contrato_sha256 && (
                    <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--surface)] border border-[var(--hair)] font-mono text-[11px] text-[var(--ink)] truncate select-all">
                      <span className="font-bold text-[var(--acc)]">SHA-256: </span>
                      {deal.contrato_sha256}
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--ok)] font-medium pt-1">
                    ✉️ Copia oficial del acuerdo y certificado eIDAS enviada por email a la sala y a la dirección de la banda.
                  </p>
                </div>

                {/* ACCIONES POST-FIRMA */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--hair)] text-[var(--ink)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-2xs"
                  >
                    <Calendar className="w-4 h-4 text-[var(--acc)]" />
                    <span>Añadir a Google Calendar</span>
                  </a>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-3 rounded-[var(--r-m)] bg-[var(--acc)] hover:opacity-90 text-[var(--on-acc)] font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Guardar PDF</span>
                  </button>
                </div>

                {/* CAJA PARA ENVIAR COPIA AL CORREO AHORA */}
                <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] border border-[var(--hair)] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                    <Mail className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>¿Enviar o reenviar copia oficial a un correo?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="Introduce un email (ej: tu@correo.com)"
                      value={resendEmailInput}
                      onChange={(e) => setResendEmailInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-[var(--r-s)] bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--acc)]"
                    />
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending}
                      className="px-4 py-2 rounded-[var(--r-s)] bg-[var(--acc)] hover:opacity-90 text-[var(--on-acc)] font-bold text-xs cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {resending ? 'Enviando...' : 'Enviar Copia'}
                    </button>
                  </div>
                  {resendStatus && (
                    <p className="text-[11px] text-[var(--ok)] font-medium">✓ {resendStatus}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PIE DE PÁGINA FORMAL */}
        <div className="text-center text-xs text-[var(--ink-3)] space-y-1 pb-4">
          <p className="font-semibold text-[var(--ink-2)]">BandManager.io • Sistema Operativo para Gestión y Contratación de Directos</p>
          <p className="text-[11px]">
            Firma Electrónica Simple conforme al Reglamento eIDAS (UE Nº 910/2014) • Documento vinculante entre sala y artista
          </p>
        </div>

      </div>
    </div>
  );
};
