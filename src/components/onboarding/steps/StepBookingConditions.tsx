import React from'react';
import { DollarSign, MapPin, Mail, Phone, User, Check, Car, Hotel } from'lucide-react';

interface StepBookingConditionsProps {
 cacheAcustico: number;
 setCacheAcustico: (n: number) => void;
 cacheSala: number;
 setCacheSala: (n: number) => void;
 cacheFestival: number;
 setCacheFestival: (n: number) => void;
 condicionesKm: string;
 setCondicionesKm: (v: string) => void;
 requiereAlojamiento: boolean;
 setRequiereAlojamiento: (v: boolean) => void;
 contactoBookingNombre: string;
 setContactoBookingNombre: (v: string) => void;
 contactoBookingEmail: string;
 setContactoBookingEmail: (v: string) => void;
 contactoBookingTelefono: string;
 setContactoBookingTelefono: (v: string) => void;
}

export const StepBookingConditions: React.FC<StepBookingConditionsProps> = ({
 cacheAcustico,
 setCacheAcustico,
 cacheSala,
 setCacheSala,
 cacheFestival,
 setCacheFestival,
 condicionesKm,
 setCondicionesKm,
 requiereAlojamiento,
 setRequiereAlojamiento,
 contactoBookingNombre,
 setContactoBookingNombre,
 contactoBookingEmail,
 setContactoBookingEmail,
 contactoBookingTelefono,
 setContactoBookingTelefono,
}) => {
 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <DollarSign className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-white">Caché & Condiciones de Contratación (Booking CRM)</h3>
 </div>

 <p className="text-xs text-zinc-400">
 Configura los rangos de caché orientativos y las condiciones de kilometraje/alojamiento para que las propuestas generadas por el agente o redactor incluyan cifras precisas.
 </p>

 {/* Caché estimado por formato */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="p-3 rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] space-y-1">
 <label className="block text-[11px] font-medium text-zinc-400">
 Caché Acústico / Showcase (€)
 </label>
 <div className="relative">
 <input
 type="number"
 min={0}
 step={50}
 value={cacheAcustico}
 onChange={(e) => setCacheAcustico(Number(e.target.value))}
 placeholder="400"
 className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-zinc-800 border-[var(--hair)] text-white text-xs focus:outline-none focus:"
 />
 </div>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] space-y-1">
 <label className="block text-[11px] font-medium text-zinc-400">
 Caché Sala / Concierto Estándar (€)
 </label>
 <div className="relative">
 <input
 type="number"
 min={0}
 step={50}
 value={cacheSala}
 onChange={(e) => setCacheSala(Number(e.target.value))}
 placeholder="850"
 className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-zinc-800 border-[var(--hair)] text-white text-xs focus:outline-none focus:"
 />
 </div>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] space-y-1">
 <label className="block text-[11px] font-medium text-zinc-400">
 Caché Festival / Fiesta Mayor (€)
 </label>
 <div className="relative">
 <input
 type="number"
 min={0}
 step={100}
 value={cacheFestival}
 onChange={(e) => setCacheFestival(Number(e.target.value))}
 placeholder="1800"
 className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-zinc-800 border-[var(--hair)] text-white text-xs focus:outline-none focus:"
 />
 </div>
 </div>
 </div>

 {/* Logística & Gastos de Desplazamiento */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--hair)]">
 <div>
 <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
 <Car className="w-3.5 h-3.5 text-[var(--acc)]" />
 Condiciones de Kilometraje / Furgoneta
 </label>
 <input
 type="text"
 value={condicionesKm}
 onChange={(e) => setCondicionesKm(e.target.value)}
 placeholder="Ej. 0,25 €/km a partir de 100 km desde Madrid"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] text-white placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>

 <div className="flex items-center pt-5">
 <button
 type="button"
 onClick={() => setRequiereAlojamiento(!requiereAlojamiento)}
 className={`w-full p-3 rounded-[var(--r-m)] text-left transition-all flex items-center justify-between ${
 requiereAlojamiento
 ?'bg-[var(--acc)]/10 /30 text-[var(--acc)]/70'
 :'bg-zinc-900 border-[var(--hair)] text-zinc-400'
 }`}
 >
 <div className="flex items-center gap-2">
 <Hotel className="w-4 h-4 text-[var(--acc)]" />
 <div>
 <span className="text-xs font-semibold block">Hotel si distancia &gt; 150 km</span>
 <span className="text-[10px] text-zinc-500">Incluir pernocta en presupuestos fuera de la provincia</span>
 </div>
 </div>
 {requiereAlojamiento && <Check className="w-4 h-4 text-[var(--acc)]" />}
 </button>
 </div>
 </div>

 {/* Contacto Directo de Booking */}
 <div className="pt-2 border-t border-[var(--hair)] space-y-3">
 <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
 Persona de Contacto de Booking / Contratación
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nombre / Cargo</label>
 <input
 type="text"
 value={contactoBookingNombre}
 onChange={(e) => setContactoBookingNombre(e.target.value)}
 placeholder="Ej. Carlos (Booking & Manager)"
 className="w-full px-3 py-1.5 rounded-[var(--r-s)] bg-zinc-900 border-[var(--hair)] text-white placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium text-zinc-400 mb-1">Email de Contratación</label>
 <input
 type="email"
 value={contactoBookingEmail}
 onChange={(e) => setContactoBookingEmail(e.target.value)}
 placeholder="booking@tubanda.com"
 className="w-full px-3 py-1.5 rounded-[var(--r-s)] bg-zinc-900 border-[var(--hair)] text-white placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium text-zinc-400 mb-1">Teléfono Directo</label>
 <input
 type="tel"
 value={contactoBookingTelefono}
 onChange={(e) => setContactoBookingTelefono(e.target.value)}
 placeholder="+34 600 000 000"
 className="w-full px-3 py-1.5 rounded-[var(--r-s)] bg-zinc-900 border-[var(--hair)] text-white placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>
 </div>
 </div>
 </div>
 );
};
