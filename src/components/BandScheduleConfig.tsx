import React, { useState, useEffect } from 'react';
import { Clock, Globe, Save, Loader2, CheckCircle2, AlertCircle, Mail, Send, Sparkles, Check, Info } from 'lucide-react';
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const BandScheduleConfig: React.FC<BandScheduleConfigProps> = ({ bandId, isStitchLight = false }) => {
  const [timezone, setTimezone] = useState<string>('Europe/Madrid');
  const [horasLector, setHorasLector] = useState<number[]>([]);
  const [horasEnviador, setHorasEnviador] = useState<number[]>([]);
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
          setHorasLector(Array.isArray(data.horas_lector) ? data.horas_lector.map((h) => Number(h)) : []);
          setHorasEnviador(Array.isArray(data.horas_enviador) ? data.horas_enviador.map((h) => Number(h)) : []);
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

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // Ensure strictly numbers array
      const payloadLector = horasLector.map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);
      const payloadEnviador = horasEnviador.map((h) => Math.floor(Number(h))).filter((h) => !isNaN(h) && h >= 0 && h <= 23);

      await api.saveBandSchedule({
        band_id: bandId || 'bakandeya',
        timezone,
        horas_lector: payloadLector,
        horas_enviador: payloadEnviador
      });

      setFeedback({
        type: 'success',
        message: '¡Horarios guardados correctamente! Los agentes Python Smart Gate actuarán según este calendario.'
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
              <h3 className="text-base font-bold tracking-tight">Smart Gate Scheduler (Agentes de Correo)</h3>
              <p className="text-xs font-mono text-neutral-400">
                Sincronización horaria con los agentes automáticos en GitHub Actions
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
      <div className={`p-4 rounded-xl text-xs space-y-2 border ${
        isStitchLight ? 'bg-indigo-50/80 border-indigo-100 text-indigo-950' : 'bg-neutral-950 border border-neutral-800 text-neutral-300'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Recomendaciones Inteligentes por Zona Horaria ({timezone.split('/')[1] || timezone})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setHorasLector([9, 13, 19]);
              setHorasEnviador([10, 16]);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-mono text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3 h-3" />
            <span>Aplicar Recomendado IA</span>
          </button>
        </div>
        
        <p className="leading-relaxed font-sans text-neutral-300">
          Los datos de conversión en booking B2B demuestran que las decisiones dependen de la <strong>hora local del destinatario</strong>:
        </p>
        
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Send className="w-3 h-3 text-emerald-400" />
              1. Envíos: 10:00 y 16:00
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Franja de máxima apertura matutina y vuelta del almuerzo. Evita noches y fines de semana.
            </span>
          </li>
          <li className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Mail className="w-3 h-3 text-sky-400" />
              2. Revisiones: 09:00, 13:00, 19:00
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Revisa la bandeja justo antes de los bloques de trabajo para procesar respuestas frescas.
            </span>
          </li>
          <li className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              3. Respuestas: Delay Humano
            </span>
            <span className="text-[10px] text-neutral-400 font-sans">
              Los agentes aplican un retraso de 15-30 min tras la revisión para simular atención humana real.
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

      {/* 2. Horas Lector */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Horarios de Revisión de Bandeja (Lector)</span>
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              ¿A qué horas del día quieres que la IA revise tu correo en busca de nuevas respuestas?
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => handleSelectAllLector([9, 14, 20])}
              className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 transition-all cursor-pointer"
            >
              Preset (9, 14, 20h)
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

        {/* Hour Pills Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {HOURS.map((hour) => {
            const isSelected = horasLector.includes(hour);
            return (
              <button
                key={`lector-${hour}`}
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

      {/* 3. Horas Enviador */}
      <div className="space-y-3 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Horarios de Envío de Pitches (Enviador)</span>
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              ¿A qué horas quieres que la IA dispare los emails en frío aprobados?
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
            <button
              type="button"
              onClick={() => handleSelectAllEnviador([10, 16])}
              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer"
            >
              Preset Mañana (10, 16h)
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

        {/* Hour Pills Grid with Highlight for Morning/Business hours */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {HOURS.map((hour) => {
            const isSelected = horasEnviador.includes(hour);
            const isPrimeTime = hour >= 9 && hour <= 12; // Destacar mañanas
            return (
              <button
                key={`enviador-${hour}`}
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
              <span>Guardar Horarios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
