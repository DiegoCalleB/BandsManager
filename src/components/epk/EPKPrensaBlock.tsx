import React from 'react';
import {
  BarChart3,
  Quote,
  Plus,
  Trash2
} from 'lucide-react';
import { EPKConfig } from '../../types';
import { EPKBlockWrapper } from './EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta } from './epkBlocks';

interface EPKPrensaBlockProps {
  config: EPKConfig;
  setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
  prevBlock?: EPKBlockMeta | null;
  nextBlock?: EPKBlockMeta | null;
  onNavigate?: (blockId: any) => void;
  onSave?: () => void;
  isAllView?: boolean;
}

export const EPKPrensaBlock: React.FC<EPKPrensaBlockProps> = ({
  config,
  setConfig,
  prevBlock,
  nextBlock,
  onNavigate,
  onSave,
  isAllView = false
}) => {
  return (
    <EPKBlockWrapper
      meta={EPK_BLOCKS[3]}
      prevBlock={prevBlock}
      nextBlock={nextBlock}
      onNavigate={onNavigate}
      onSave={onSave}
      isAllView={isAllView}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CIFRAS CLAVE / SOCIAL PROOF */}
        <div className="bg-[var(--surface)] border  rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b  pb-3 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Cifras Clave (Social Proof)
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border /20 px-2.5 py-1 rounded-full">
              {config.cifrasClave?.habilitado ? '✓ Visible en EPK' : 'Oculto'}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-3)]">
            Bloque de 4 cifras destacadas (oyentes, directos, comunidad, ciudades) al principio del dossier público. Si dejas alguna vacía, no se muestra.
          </p>

          <div className="flex items-center justify-between p-3 bg-slate-950 border  rounded-[var(--r-m)]">
            <div className="space-y-0.5 pr-3">
              <span className="text-xs font-bold text-white">Mostrar cifras clave en el dossier público</span>
              <p className="text-[10px] text-[var(--ink-3)]">
                Si está desactivado, este bloque no aparece en el enlace público aunque haya cifras guardadas.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.cifrasClave?.habilitado ?? false}
              onChange={e =>
                setConfig({
                  ...config,
                  cifrasClave: { ...(config.cifrasClave || {}), habilitado: e.target.checked }
                })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                { key: 'oyentes', label: 'Oyentes & Streams', placeholder: 'Ej: 12.400' },
                { key: 'directos', label: 'Directos & Shows', placeholder: 'Ej: 18' },
                { key: 'comunidad', label: 'Comunidad & Fans', placeholder: 'Ej: 2.100' },
                { key: 'ciudades', label: 'Ciudades en Gira', placeholder: 'Ej: 6' }
              ] as const
            ).map(campo => (
              <div key={campo.key} className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-wider block">
                  {campo.label}
                </label>
                <input
                  type="text"
                  value={config.cifrasClave?.[campo.key] || ''}
                  onChange={e =>
                    setConfig({
                      ...config,
                      cifrasClave: { ...(config.cifrasClave || {}), [campo.key]: e.target.value }
                    })
                  }
                  placeholder={campo.placeholder}
                  className="w-full bg-slate-950 border  focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* RESEÑAS DE PRENSA */}
        <div className="bg-[var(--surface)] border  rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b  pb-3 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
              <Quote className="w-5 h-5" /> Reseñas y Citas de Prensa
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border /20 px-2.5 py-1 rounded-full">
              {config.resenasPrensa?.habilitado ? '✓ Visible en EPK' : 'Oculto'}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-3)]">
            Citas de medios, radios o blogs musicales. Añade citas reales; el bloque no se muestra hasta que lo actives y tenga al menos una cita.
          </p>

          <div className="flex items-center justify-between p-3 bg-slate-950 border  rounded-[var(--r-m)]">
            <div className="space-y-0.5 pr-3">
              <span className="text-xs font-bold text-white">Mostrar reseñas de prensa en el dossier público</span>
              <p className="text-[10px] text-[var(--ink-3)]">
                Si está desactivado, este bloque no aparece en el enlace público aunque haya citas guardadas.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.resenasPrensa?.habilitado ?? false}
              onChange={e =>
                setConfig({
                  ...config,
                  resenasPrensa: { ...(config.resenasPrensa || {}), habilitado: e.target.checked }
                })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="space-y-2.5">
            {(config.resenasPrensa?.citas || []).map((cita, idx) => (
              <div key={cita.id} className="rounded-[var(--r-m)] border  bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={cita.texto}
                    onChange={e => {
                      const nuevas = [...(config.resenasPrensa?.citas || [])];
                      nuevas[idx] = { ...nuevas[idx], texto: e.target.value };
                      setConfig({ ...config, resenasPrensa: { ...(config.resenasPrensa || {}), citas: nuevas } });
                    }}
                    placeholder="Texto exacto de la reseña o cita..."
                    className="flex-1 bg-[var(--surface)] border  rounded-[var(--r-s)] px-3 py-2 text-xs text-slate-200 focus: outline-none leading-relaxed resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nuevas = (config.resenasPrensa?.citas || []).filter(c => c.id !== cita.id);
                      setConfig({ ...config, resenasPrensa: { ...(config.resenasPrensa || {}), citas: nuevas } });
                    }}
                    className="shrink-0 p-1.5 text-[var(--ink-2)] hover:text-red-400 transition cursor-pointer"
                    title="Quitar reseña"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={cita.medio}
                  onChange={e => {
                    const nuevas = [...(config.resenasPrensa?.citas || [])];
                    nuevas[idx] = { ...nuevas[idx], medio: e.target.value };
                    setConfig({ ...config, resenasPrensa: { ...(config.resenasPrensa || {}), citas: nuevas } });
                  }}
                  placeholder="Medio / firma (Ej: Radio 3, MondoSonoro, blog especializado...)"
                  className="w-full bg-[var(--surface)] border  rounded-[var(--r-s)] px-3 py-1.5 text-xs text-amber-400/90 focus: outline-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const nuevas = [
                ...(config.resenasPrensa?.citas || []),
                { id: `cita-${Date.now()}`, texto: '', medio: '' }
              ];
              setConfig({ ...config, resenasPrensa: { ...(config.resenasPrensa || {}), citas: nuevas } });
            }}
            className="w-full py-2 rounded-[var(--r-m)] border border-dashed  text-[var(--ink-3)] hover:text-amber-400 hover:/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Añadir Reseña de Prensa
          </button>
        </div>
      </div>
    </EPKBlockWrapper>
  );
};
