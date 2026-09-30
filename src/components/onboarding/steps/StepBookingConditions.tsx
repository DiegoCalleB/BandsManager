import React from "react";
import {
  DollarSign,
  MapPin,
  Mail,
  Phone,
  User,
  Check,
  Car,
  Hotel,
} from "lucide-react";
import { Input } from '../../ui';

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
      <div className="flex items-center gap-2 pb-2">
        <DollarSign className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Caché y condiciones de contratación (Booking CRM)
        </h3>
      </div>

      <p className="text-xs text-[var(--ink-2)]">
        Configura los rangos de caché orientativos y las condiciones de
        kilometraje/alojamiento para que las propuestas generadas por el agente
        o redactor incluyan cifras precisas.
      </p>

      {/* Caché estimado por formato */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)]">
            Caché Acústico / Showcase (€)
          </label>
          <div className="relative">
            <Input
              size="sm"
              type="number"
              min={0}
              step={50}
              value={cacheAcustico}
              onChange={(e) => setCacheAcustico(Number(e.target.value))}
              placeholder="400"
              className="w-full"
            />
          </div>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)]">
            Caché sala / concierto estándar (€)
          </label>
          <div className="relative">
            <Input
              size="sm"
              type="number"
              min={0}
              step={50}
              value={cacheSala}
              onChange={(e) => setCacheSala(Number(e.target.value))}
              placeholder="850"
              className="w-full"
            />
          </div>
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)]">
            Caché Festival / Fiesta Mayor (€)
          </label>
          <div className="relative">
            <Input
              size="sm"
              type="number"
              min={0}
              step={100}
              value={cacheFestival}
              onChange={(e) => setCacheFestival(Number(e.target.value))}
              placeholder="1800"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Logística & Gastos de Desplazamiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-[var(--acc)]" />
            Condiciones de kilometraje / furgoneta
          </label>
          <Input
            size="sm"
            type="text"
            value={condicionesKm}
            onChange={(e) => setCondicionesKm(e.target.value)}
            placeholder="Ej. 0,25 €/km a partir de 100 km desde Madrid"
            className="w-full"
          />
        </div>

        <div className="flex items-center pt-5">
          <button
            type="button"
            onClick={() => setRequiereAlojamiento(!requiereAlojamiento)}
            className={`w-full p-3 rounded-[var(--r-m)] text-left transition-ui flex items-center justify-between ${
              requiereAlojamiento
                ? "bg-[var(--acc)]/10  text-[var(--acc-ink)]"
                : "bg-[var(--bg)] text-[var(--ink-2)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-[var(--acc)]" />
              <div>
                <span className="text-xs font-semibold block">
                  Hotel si distancia &gt; 150 km
                </span>
                <span className="text-micro text-[var(--ink-2)]">
                  Incluir pernocta en presupuestos fuera de la provincia
                </span>
              </div>
            </div>
            {requiereAlojamiento && (
              <Check className="w-4 h-4 text-[var(--acc)]" />
            )}
          </button>
        </div>
      </div>

      {/* Contacto Directo de Booking */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)]">
          Persona de contacto de Booking / contratación
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
              Nombre / Cargo
            </label>
            <Input
              size="sm"
              type="text"
              value={contactoBookingNombre}
              onChange={(e) => setContactoBookingNombre(e.target.value)}
              placeholder="Ej. Carlos (Booking & Manager)"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
              Email de contratación
            </label>
            <Input
              size="sm"
              type="email"
              value={contactoBookingEmail}
              onChange={(e) => setContactoBookingEmail(e.target.value)}
              placeholder="booking@tubanda.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
              Teléfono directo
            </label>
            <Input
              size="sm"
              type="tel"
              value={contactoBookingTelefono}
              onChange={(e) => setContactoBookingTelefono(e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
