/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShieldCheck,Shirt,Users,Wrench } from "lucide-react";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function LogisticsSubtabsBar() {
  const { setActiveTab, activeTab } = useCalendar();
  return (
    <>
      {/* Subtabs for Checklist */}
      <div className={`flex flex-wrap gap-1 mb-4 pb-1 border-b ${'border-[var(--hair)]'}`}>
        <button
          id="calendar-subtab-runofshow"
          onClick={() => setActiveTab('runofshow')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors ${
            activeTab === 'runofshow'
              ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          Timing
        </button>
        <button
          id="calendar-subtab-tecnica"
          onClick={() => setActiveTab('tecnica')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors flex items-center gap-1 ${
            activeTab === 'tecnica'
              ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Wrench className="w-2.5 h-2.5" />
          <span>1. Logística</span>
        </button>
        <button
          id="calendar-subtab-contactos"
          onClick={() => setActiveTab('contactos')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors flex items-center gap-1 ${
            activeTab === 'contactos'
              ? 'bg-[var(--ok-soft)] text-[var(--ok)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Users className="w-2.5 h-2.5" />
          <span>2. Contactos</span>
        </button>
        <button
          id="calendar-subtab-merchan"
          onClick={() => setActiveTab('merchan')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors flex items-center gap-1 ${
            activeTab === 'merchan'
              ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Shirt className="w-2.5 h-2.5" />
          <span>3. Merchan</span>
        </button>
        <button
          id="calendar-subtab-cierre"
          onClick={() => setActiveTab('cierre')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors flex items-center gap-1 ${
            activeTab === 'cierre'
              ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>5. Cierre</span>
        </button>
        <button
          id="calendar-subtab-roadbook"
          onClick={() => setActiveTab('roadbook')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors ${
            activeTab === 'roadbook'
              ? 'bg-[var(--ok-soft)] text-[var(--ok)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          Ruta
        </button>
        <button
          id="calendar-subtab-gear"
          onClick={() => setActiveTab('gear')}
          className={`px-2 py-1 text-micro font-mono rounded cursor-pointer transition-colors ${
            activeTab === 'gear'
              ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
              : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          Cacharros
        </button>
      </div>
    </>
  );
}
