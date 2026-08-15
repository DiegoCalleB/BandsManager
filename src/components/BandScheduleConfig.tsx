import React, { useState, useEffect } from 'react';
import { Clock, Globe, Save, Loader2, CheckCircle2, AlertCircle, Mail, Send, Sparkles, Check, Info, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { BandSchedule } from '../types';

interface BandScheduleConfigProps {
  bandId: string;
  isStitchLight?: boolean;
}

const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'Europe/Madrid (Madrid, Barcelona, París, Roma) [UTC+1/UTC+2]' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Ciudad de México, Cancún) [UTC-6]' },
  { value: 'America/Bogota', label: 'America/Bogota (Bogotá, Lima, Quito) [UTC-5]' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (Buenos Aires) [UTC-3]' },
  { value: 'America/Santiago', label: 'America/Santiago (Santiago de Chile) [UTC-3/UTC-4]' },
  { value: 'America/Caracas', label: 'America/Caracas (Caracas) [UTC-4]' },
  { value: 'America/New_York', label: 'America/New_York (Nueva York, Miami) [UTC-5/UTC-4]' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Los Ángeles, San Francisco) [UTC-8/UTC-7]' },
  { value: 'Europe/London', label: 'Europe/London (Londres, Dublín, Lisboa) [UTC+0/UTC+1]' }
];

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', short: 'Lun', recommended: false },
  { id: 2, name: 'Martes', short: 'Mar', recommended: true, badge: '🔥 Top Booking' },
  { id: 3, name: 'Miércoles', short: 'Mié', recommended: true, badge: '🔥 Top Booking' },
  { id: 4, name: 'Jueves', short: 'Jue', recommended: true, badge: '🔥 Top Booking' },
  { id: 5, name: 'Viernes', short: 'Vie', recommended: false },
  { id: 6, name: 'Sábado', short: 'Sáb', recommended: false },
  { id: 7, name: 'Domingo', short: 'Dom', recommended: false }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const BandScheduleConfig: React.FC<BandScheduleConfigProps> = ({ bandId, isStitchLight = false }) => {
  const [timezone, setTimezone] = useState<string>('Europe/Madrid');
  const [horasLector, setHorasLector] = useState<number[]>([]);
  const [horasEnviador, setHorasEnviador] = useState<number[]>([]);
  const [diasEnviador, setDiasEnviador] = useState<number[]>([2, 3, 4]);
  const [diasLector, setDiasLector] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSchedule = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const data: BandSchedule = await api.getBandSchedule(bandId || 'bakandeya');
        if (isMounted && data) {
          setTimezone(data.timezone || 'Europe/Madrid');
          setHorasLector(Array.isArray(data.horas_lector) ? data.horas_lector.map((h) => Number(h)) : [8, 12, 16, 20]);
          setHorasEnviador(Array.isArray(data.horas_enviador) ? data.horas_enviador.map((h) => Number(h)) : [10, 11, 12, 13]);
          setDiasEnviador(Array.isArray(data.dias_enviador) && data.dias_enviador.length > 0 ? data.dias_enviador.map(Number) : [2, 3, 4]);
          setDiasLector(Array.isArray(data.dias_lector) && data.dias_lector.length > 0 ? data.dias_lector.map(Number) : [1, 2, 3, 4, 5, 6, 7]);
        }
      } catch (err) {
        console.error('Error cargando la configuración de horarios:', err);
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: 'No se pudo cargar la configuración de horarios. Usando valores por defecto.'
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSchedule();
    return () => { isMounted = false; };
  }, [bandId]);

  const toggleHoraLector = (hour: number) => {
    setHorasLector((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const toggleHoraEnviador = (hour: number) => {
    setHorasEnviador((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const toggleDiaEnviador = (dayId: number) => {
    setDiasEnviador((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const toggleDiaLector = (dayId: number) => {
    setDiasLector((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const handleSelectAllLector = (hours: number[]) => {
    const newSelection = Array.from(new Set([...horasLector, ...hours])).sort((a, b) => a - b);
    setHorasLector(newSelection);
  };

  const handleClearLector = () => setHorasLector([]);

  const handleSelectAllEnviador = (hours: number[]) => {
    const newSelection = Array.from(new Set([...horasEnviador, ...hours])).sort((a, b) => a - b);
    setHorasEnviador(newSelection);
  };

  const handleClearEnviador = () => setHorasEnviador([]);

  const applyPresetRecommendedBooking = () => {
    setDiasEnviador([2, 3, 4]); // Martes, Miércoles, Jueves
    setHorasEnviador([10, 11, 12, 13]); // 10h a 14h
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([9, 13, 17, 21]);
    setFeedback({
      type: 'success',
      message: '🎯 Sugerencia IA Aplicada: Martes, Miércoles y Jueves (10:00 - 14:00). Recuerda pulsar Guardar Horarios.'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // Ensure strictly numbers array
      const payloadLector = horasLector.map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
      const payloadEnviador = horasEnviador.map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
      const payloadDiasEnviador = diasEnviador.map((d) => Math.floor(Number(d))).filter((d) => !isNaN(d) && d >= 1 && d <= 7);
      const payloadDiasLector = diasLector.map((d) => Math.floor(Number(d))).filter((d) => !isNaN(d) && d >= 1 && d <= 7);

      await api.saveBandSchedule({
        band_id: bandId || 'bakandeya',
        timezone,
        horas_lector: payloadLector,
        horas_enviador: payloadEnviador,
        dias_enviador: payloadDiasEnviador,
        dias_lector: payloadDiasLector
      });

      setFeedback({
        type: 'success',
        message: '¡Horarios y días guardados correctamente! Los agentes de Supabase Smart Gate actuarán según este calendario.'
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Error guardando los horarios:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Ocurrió un error al guardar la configuración en Supabase.'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl flex items-center justify-center gap-3 ${
        isStitchLight ? 'bg-slate-50 border border-slate-200' : 'bg-neutral-900/60 border border-neutral-800'
      }`}>
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        <span className="text-xs font-mono text-neutral-400">Cargando Smart Gate Scheduler...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-5 sm:p-6 rounded-2xl border transition-all ${
      isStitchLight 
        ? 'bg-white border-slate-200 shadow-sm' 
        : 'bg-neutral-900/70 border-neutral-800 text-white'
    }`}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Smart Gate Scheduler (Días y Horas de Ejecución)</h3>
              <p className="text-xs font-mono text-neutral-400">
                Sincronización de días y horarios comerciales con los agentes automáticos en Supabase
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Activo TFM Supabase</span>
        </div>
      </div>

      {/* Info box with AI Best Practices */}
      <div className={`p-4 rounded-xl text-xs space-y-2.5 border ${
        isStitchLight ? 'bg-indigo-50/80 border-indigo-100 text-indigo-950' : 'bg-neutral-950 border border-neutral-800 text-neutral-300'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Sugerencia Inteligente de Booking ({timezone.split('/')[1] || timezone})</span>
          </div>
          <button
            type="button"
            onClick={applyPresetRecommendedBooking}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20 active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            <span>🌟 Aplicar Días y Horas Top Booking (M, X, J)</span>
          </button>
        </div>
        
        <p className="leading-relaxed font-sans text-neutral-300">
          En la industria musical, los promotores y salas atienden propuestas de booking principalmente <strong>de martes a jueves de 10:00 a 14:00</strong>:
        </p>
        
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Send className="w-3 h-3 text-emerald-400" />
              1. Envíos: Martes a Jueves (10h-14h)
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Máxima tasa de apertura (+45%) y atención directa sin interferir con producción de directos.
            </span>
          </li>
          <li className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Mail className="w-3 h-3 text-sky-400" />
              2. Revisiones: Todos los días
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Revisa la bandeja en bloques regulares para sincronizar respuestas y alimentar el CRM.
            </span>
          </li>
          <li className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              3. Delay Humano Real
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Los agentes aplican cadencias orgánicas para garantizar máxima entregabilidad y evitar spam.
            </span>
          </li>
        </ul>
      </div>

      {/* 1. Timezone selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-semibold text-neutral-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>Zona Horaria de la Banda</span>
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={`w-full p-2.5 rounded-xl text-xs font-mono transition-all outline-none cursor-pointer ${
            isStitchLight
              ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-indigo-500'
              : 'bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-amber-500/60'
          }`}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. DÍAS Y HORAS ENVIADOR */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Días y Horarios de Envío de Pitches (Agente Enviador)</span>
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Configura qué días de la semana y a qué horas quieres que la IA despache los correos aprobados a las salas.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => {
                setDiasEnviador([2, 3, 4]);
                setHorasEnviador([10, 11, 12, 13]);
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-bold"
            >
              🔥 Top (M-X-J 10-14h)
            </button>
            <button
              type="button"
              onClick={() => {
                setDiasEnviador([1, 2, 3, 4, 5]);
                setHorasEnviador([9, 10, 11, 12, 13, 14]);
              }}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all cursor-pointer"
            >
              L-V
            </button>
            <button
              type="button"
              onClick={handleClearEnviador}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-all cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Días de la semana Selector (Enviador) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Días de la semana activos ({diasEnviador.length} seleccionados):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = diasEnviador.includes(day.id);
              return (
                <button
                  key={`config-dia-enviador-${day.id}`}
                  type="button"
                  onClick={() => toggleDiaEnviador(day.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-200 font-bold shadow-sm shadow-emerald-900/30'
                      : isStitchLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold">{day.short}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-neutral-700'}`} />
                  </div>
                  <span className="text-[11px] font-sans truncate">{day.name}</span>
                  {day.recommended && (
                    <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold self-start mt-0.5">
                      Top
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horas Enviador Grid */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Horas del día activas ({horasEnviador.length} seleccionadas):
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {HOURS.map((hour) => {
              const isSelected = horasEnviador.includes(hour);
              const isPrimeTime = hour >= 10 && hour <= 13;
              return (
                <button
                  key={`config-enviador-${hour}`}
                  type="button"
                  onClick={() => toggleHoraEnviador(hour)}
                  className={`py-2 px-1 rounded-xl text-center font-mono text-xs transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 relative ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-200 font-bold shadow-sm shadow-emerald-900/30'
                      : isPrimeTime
                      ? isStitchLight
                        ? 'bg-amber-50/60 border-amber-200 text-slate-700 hover:bg-amber-100/80'
                        : 'bg-amber-500/5 border-amber-500/30 text-amber-200/80 hover:bg-amber-500/10'
                      : isStitchLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <span>{formatHour(hour)}</span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : isPrimeTime ? 'bg-amber-400/60' : 'bg-neutral-700/50'}`} />
                  {isPrimeTime && !isSelected && (
                    <span className="text-[8px] font-sans text-amber-400/80 leading-none">Alta apert.</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. DÍAS Y HORAS LECTOR */}
      <div className="space-y-4 pt-3 border-t border-neutral-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Días y Frecuencia de Revisión de Bandeja (Agente Lector)</span>
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Configura los días y las horas en que el bot escanea la bandeja de entrada para detectar respuestas.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => {
                setDiasLector([1, 2, 3, 4, 5, 6, 7]);
                setHorasLector([9, 13, 17, 21]);
              }}
              className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 transition-all cursor-pointer font-bold"
            >
              Cada 4h (7 días)
            </button>
            <button
              type="button"
              onClick={handleClearLector}
              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-all cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Días Lector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" /> Días de revisión activos ({diasLector.length} seleccionados):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = diasLector.includes(day.id);
              return (
                <button
                  key={`config-dia-lector-${day.id}`}
                  type="button"
                  onClick={() => toggleDiaLector(day.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/80 text-sky-200 font-bold shadow-sm shadow-sky-900/30'
                      : isStitchLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold">{day.short}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-neutral-700'}`} />
                  </div>
                  <span className="text-[11px] font-sans truncate">{day.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horas Lector */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> Horas de revisión ({horasLector.length} seleccionadas):
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {HOURS.map((hour) => {
              const isSelected = horasLector.includes(hour);
              return (
                <button
                  key={`config-lector-${hour}`}
                  type="button"
                  onClick={() => toggleHoraLector(hour)}
                  className={`py-2 px-1 rounded-xl text-center font-mono text-xs transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/80 text-sky-200 font-bold shadow-sm shadow-sky-900/30'
                      : isStitchLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <span>{formatHour(hour)}</span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-neutral-700/50'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-all shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en Supabase...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Horarios y Días</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
