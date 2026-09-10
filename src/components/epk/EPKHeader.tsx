import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Save,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EPKBlockId, EPK_BLOCKS, EPKHealthStats } from './epkBlocks';
import { ModuleTutorialTrigger } from '../common/ModuleTutorialTrigger';

interface EPKHeaderProps {
  activeBlock: EPKBlockId;
  onSelectBlock: (blockId: EPKBlockId) => void;
  publicEpkUrl: string;
  copiedPublicUrl: boolean;
  onCopyUrl: () => void;
  onSave: () => void;
  health: EPKHealthStats;
  onOpenTutorial?: () => void;
}

export const EPKHeader: React.FC<EPKHeaderProps> = ({
  activeBlock,
  onSelectBlock,
  publicEpkUrl,
  copiedPublicUrl,
  onCopyUrl,
  onSave,
  health,
  onOpenTutorial
}) => {
  const [showAiNotice, setShowAiNotice] = useState(false);

  return (
    <div className="space-y-3.5">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[#181716] border border-stone-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase">
              Kit de Prensa & EPK
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">•</span>
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Gestor Modular del Dossier
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
            EPK / Dossier de la Banda
          </h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Configura por bloques tu dossier oficial: identidad, archivos, audio, vídeos y rider. Sincronizado para el EPK público y los agentes de contratación.
          </p>
        </div>

        {/* ACCIONES PRINCIPALES */}
        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
          {onOpenTutorial && <ModuleTutorialTrigger onOpen={onOpenTutorial} />}

          <button
            type="button"
            onClick={onCopyUrl}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-stone-700/80 flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar enlace web público del EPK"
          >
            {copiedPublicUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{copiedPublicUrl ? '¡Copiado!' : 'Copiar URL'}</span>
          </button>

          <a
            href={publicEpkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-xl border border-stone-700/80 flex items-center gap-1.5 transition"
            title="Abrir vista pública del EPK"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver EPK</span>
          </a>

          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* STATUS & HEALTH BAR (1 LÍNEA COMPACTA Y CLICKEABLE) */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 bg-[#141312] border border-stone-800/90 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 text-[11px] font-mono">
          <span className="text-stone-500 uppercase tracking-wider text-[10px] shrink-0 font-bold">
            Estado:
          </span>

          <button
            type="button"
            onClick={() => onSelectBlock('archivos')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border flex items-center gap-1 ${
              health.hasLogo
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Logo de la banda (Bloque Archivos)"
          >
            Logo {health.hasLogo ? '✓' : '○'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('perfil')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border flex items-center gap-1 ${
              health.hasBio
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Biografía oficial (Bloque Perfil)"
          >
            Bio {health.hasBio ? '✓' : '○'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('archivos')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border flex items-center gap-1 ${
              health.hasDossier
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Dossier en PDF (Bloque Archivos)"
          >
            PDF {health.hasDossier ? '✓' : '○'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('archivos')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border flex items-center gap-1 ${
              health.hasRider
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Rider técnico (Bloque Archivos)"
          >
            Rider {health.hasRider ? '✓' : '○'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('perfil')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border ${
              health.numMiembros > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Miembros de la formación (Bloque Perfil)"
          >
            {health.numMiembros} {health.numMiembros === 1 ? 'músico' : 'músicos'} {health.numMiembros > 0 ? '✓' : '○'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('musica')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border ${
              health.numTemas > 0
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Temas y audio preview (Bloque Música)"
          >
            {health.numTemas} {health.numTemas === 1 ? 'tema' : 'temas'}
          </button>

          <button
            type="button"
            onClick={() => onSelectBlock('donaciones')}
            className={`px-2 py-0.5 rounded-md shrink-0 transition border ${
              health.numTraducciones > 0
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
            title="Versiones en otros idiomas (Bloque Donaciones & Idiomas)"
          >
            {health.numTraducciones + 1} {health.numTraducciones === 0 ? 'idioma' : 'idiomas'}
          </button>
        </div>

        {/* BOTÓN TOGGLE INFO IA */}
        <button
          type="button"
          onClick={() => setShowAiNotice(!showAiNotice)}
          className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition border ${
            showAiNotice
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-amber-300'
          }`}
          title="Ver integración con Chatbot y Agentes de IA"
        >
          <Bot className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Info IA</span>
          {showAiNotice ? (
            <ChevronUp className="w-3 h-3 text-stone-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-stone-400" />
          )}
        </button>
      </div>

      {/* AVISO EXPANDIBLE DE AGENTES DE IA (COLAPSADO POR DEFECTO PARA NO COMER ESPACIO) */}
      {showAiNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-slate-300 flex items-start gap-3 transition">
          <Bot className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300 text-xs">
              Conexión Automática con Agentes de IA y Chatbot
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Toda la información del dossier (biografía, integrantes, PDF oficial, rider técnico y cifras) se sincroniza en el servidor. El Chatbot y los Agentes autónomos de Redacción de Emails la consultan en tiempo real para personalizar los correos y propuestas enviadas a programadores de salas y festivales.
            </p>
          </div>
        </div>
      )}

      {/* SELECTOR DE BLOQUES ERGONÓMICO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {EPK_BLOCKS.map(block => {
          const Icon = block.icon;
          const isActive = activeBlock === block.id;
          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelectBlock(block.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-stone-900/90 border-stone-800 text-slate-300 hover:text-white hover:border-stone-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{block.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
