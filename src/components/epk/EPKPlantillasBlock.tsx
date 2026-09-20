import React from'react';
import {
 ArrowUp,
 ArrowDown,
 Eye,
 EyeOff,
 RotateCcw,
 Sparkles,
 ExternalLink,
 Check,
 Music,
 Briefcase,
 Layers,
 Palette
} from'lucide-react';
import { EPKConfig, EPKSectionId, EPKTemplateId } from'../../types';
import { EPKBlockWrapper } from'./EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta } from'./epkBlocks';
import {
 EPK_TEMPLATES,
 EPK_SECTIONS_META,
 DEFAULT_EPK_SECTIONS_ORDER,
 getAllSectionsWithVisibility
} from'./epkTemplates';

interface EPKPlantillasBlockProps {
 config: Partial<EPKConfig>;
 onChange: (updated: Partial<EPKConfig>) => void;
 publicEpkUrl?: string;
 prevBlock?: EPKBlockMeta | null;
 nextBlock?: EPKBlockMeta | null;
 onNavigate?: (blockId: any) => void;
 onSave?: () => void;
 isAllView?: boolean;
}

export const EPKPlantillasBlock: React.FC<EPKPlantillasBlockProps> = ({
 config,
 onChange,
 publicEpkUrl,
 prevBlock,
 nextBlock,
 onNavigate,
 onSave,
 isAllView = false
}) => {
 const meta = EPK_BLOCKS.find(b => b.id ==='plantillas') || EPK_BLOCKS[0];
 const currentTemplate: EPKTemplateId = config.plantilla ||'stage';
 const sectionsList = getAllSectionsWithVisibility(config);

 const handleSelectTemplate = (templateId: EPKTemplateId) => {
 onChange({ plantilla: templateId });
 };

 const handleMoveSection = (index: number, direction:'up' |'down') => {
 const targetIndex = direction ==='up' ? index - 1 : index + 1;
 if (targetIndex < 0 || targetIndex >= sectionsList.length) return;

 const newSections = [...sectionsList];
 const temp = newSections[index];
 newSections[index] = newSections[targetIndex];
 newSections[targetIndex] = temp;

 const newOrder: EPKSectionId[] = newSections.map(s => s.id);
 onChange({ ordenSecciones: newOrder });
 };

 const handleToggleVisibility = (sectionId: EPKSectionId) => {
 const currentHidden = new Set(config.seccionesOcultas || []);
 if (currentHidden.has(sectionId)) {
 currentHidden.delete(sectionId);
 } else {
 currentHidden.add(sectionId);
 }
 onChange({ seccionesOcultas: Array.from(currentHidden) });
 };

 const handleResetDefaultOrder = () => {
 onChange({
 ordenSecciones: [...DEFAULT_EPK_SECTIONS_ORDER],
 seccionesOcultas: []
 });
 };

 const handlePresetMusicFirst = () => {
 const musicFirstOrder: EPKSectionId[] = ['musica','videos','escucha','conciertos','bio','miembros','cifras','prensa','datos','galeria'
 ];
 onChange({ ordenSecciones: musicFirstOrder });
 };

 const handlePresetPromoterFirst = () => {
 const promoterFirstOrder: EPKSectionId[] = ['datos','videos','bio','conciertos','musica','miembros','cifras','prensa','escucha','galeria'
 ];
 onChange({ ordenSecciones: promoterFirstOrder });
 };

 return (
 <EPKBlockWrapper
 meta={meta}
 prevBlock={prevBlock}
 nextBlock={nextBlock}
 onNavigate={onNavigate}
 onSave={onSave}
 isAllView={isAllView}
 >
 <div className="space-y-4 sm:space-y-8">
 {/* SECCIÓN 1: SELECCIÓN DE PLANTILLAS VISUALES */}
 <div className="bg-[var(--surface)] border-[var(--hair)] rounded-[var(--r-m)] sm:rounded-[var(--r-l)] p-3.5 sm:p-6 space-y-3 sm:space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--hair)]/80">
 <div className="flex items-center gap-2 sm:gap-2.5">
 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--r-s)] sm:rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] shrink-0">
 <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 </div>
 <div>
 <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)] font-mono uppercase tracking-wider">
 1. Elige la Plantilla Visual del Dossier
 </h4>
 <p className="hidden sm:block text-xs text-[var(--ink-3)]">
 Personaliza los colores, tipografía, estilo de tarjetas y fondo para que coincida con el sonido de tu banda.
 </p>
 </div>
 </div>
 {publicEpkUrl && (
 <a
 href={publicEpkUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--acc)] hover:text-[var(--acc)]/70 font-semibold transition self-start sm:self-auto"
 >
 <span>Ver vista pública</span>
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 )}
 </div>

 {/* TARJETAS DE PLANTILLAS (2 COLS EN MÓVIL, 4 EN ESCRITORIO) */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 pt-1">
 {EPK_TEMPLATES.map(tpl => {
 const isSelected = currentTemplate === tpl.id;
 const Icon = tpl.icon;

 return (
 <button
 key={tpl.id}
 type="button"
 onClick={() => handleSelectTemplate(tpl.id)}
 className={`text-left rounded-[var(--r-m)] sm:rounded-[var(--r-l)] transition relative overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 cursor-pointer ${
 isSelected
 ?'bg-[var(--surface)] ring-2 ring-amber-500/20 shadow-lg'
 :'bg-[var(--surface)]/80 border-[var(--hair)] hover:border-stone-700 hover:bg-[var(--surface)]/80'
 }`}
 >
 {/* PREVIEW MINIATURA GRÁFICA */}
 <div className={`w-full h-16 sm:h-24 rounded-[var(--r-s)] sm:rounded-[var(--r-m)] mb-2 sm:mb-3 p-2 sm:p-2.5 flex flex-col justify-between ${tpl.preview.bg} ${tpl.preview.border}`}>
 <div className="flex items-center justify-between">
 <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${tpl.preview.pill}`}>
 {tpl.badge}
 </span>
 <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-stone-700/60" />
 </div>
 <div className="space-y-0.5 sm:space-y-1">
 <div className={`text-[10px] sm:text-xs font-bold ${tpl.preview.text} truncate`}>
 TU BANDA
 </div>
 <div className="flex items-center gap-1 sm:gap-1.5">
 <div className={`h-1.5 sm:h-2 w-8 sm:w-12 rounded-sm ${tpl.preview.accent}`} />
 <div className="h-1.5 sm:h-2 w-5 sm:w-8 rounded-sm bg-stone-700/50" />
 </div>
 </div>
 </div>

 {/* INFO DE LA PLANTILLA */}
 <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
 <div className="flex items-center justify-between gap-1">
 <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
 <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ?'text-[var(--acc)]' :'text-[var(--ink-2)]'}`} />
 <span className="text-xs font-bold text-[var(--ink)] font-mono truncate">{tpl.name}</span>
 </div>
 {isSelected && (
 <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[var(--acc)] text-[var(--ink)] flex items-center justify-center shrink-0">
 <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 stroke-[3]" />
 </span>
 )}
 </div>
 <p className="hidden sm:block text-[11px] text-[var(--ink-3)] leading-snug">
 {tpl.description}
 </p>
 <p className="text-[10px] text-[var(--ink-2)] sm:text-[var(--ink-2)] truncate pt-0.5 sm:pt-1">
 <span className="hidden sm:inline">Ideal: </span>{tpl.recommendedFor}
 </p>
 </div>

 {/* BOTÓN DE ESTADO */}
 <div className="pt-2 sm:pt-3 mt-1.5 sm:mt-2 border-t border-[var(--hair)]/60">
 <span
 className={`block w-full py-0.5 sm:py-1 text-center rounded-md sm:rounded-[var(--r-s)] text-[10px] sm:text-[11px] font-bold font-mono transition ${
 isSelected
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70'
 :'bg-[var(--surface)]/60 text-[var(--ink-2)] hover:text-stone-200'
 }`}
 >
 {isSelected ?'✓ Activa' :'Elegir'}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* SECCIÓN 2: ORDEN Y VISIBILIDAD DE SECCIONES */}
 <div className="bg-[var(--surface)] border-[var(--hair)] rounded-[var(--r-m)] sm:rounded-[var(--r-l)] p-3.5 sm:p-6 space-y-3 sm:space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--hair)]/80">
 <div className="flex items-center gap-2 sm:gap-2.5">
 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--r-s)] sm:rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] shrink-0">
 <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
 </div>
 <div>
 <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)] font-mono uppercase tracking-wider">
 2. Organiza el Orden de las Secciones
 </h4>
 <p className="hidden sm:block text-xs text-[var(--ink-3)]">
 Usa las flechas para subir o bajar cualquier sección. Puedes ocultar las que aún no tengas listas.
 </p>
 </div>
 </div>

 {/* ACCIONES RÁPIDAS DE PRESETS */}
 <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
 <button
 type="button"
 onClick={handleResetDefaultOrder}
 className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-stone-300 rounded-[var(--r-s)] text-[10px] sm:text-[11px] font-semibold border-[var(--hair)] flex items-center gap-1 transition"
 title="Restablecer el orden estándar de fábrica"
 >
 <RotateCcw className="w-3 h-3 text-[var(--ink-2)]" />
 <span>Estándar</span>
 </button>
 <button
 type="button"
 onClick={handlePresetMusicFirst}
 className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-sky-300 rounded-[var(--r-s)] text-[10px] sm:text-[11px] font-semibold border-[var(--hair)] flex items-center gap-1 transition"
 title="Poner la música, vídeos y reproductor al principio"
 >
 <Music className="w-3 h-3 text-sky-400" />
 <span>Música</span>
 </button>
 <button
 type="button"
 onClick={handlePresetPromoterFirst}
 className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-[var(--acc)]/70 rounded-[var(--r-s)] text-[10px] sm:text-[11px] font-semibold border-[var(--hair)] flex items-center gap-1 transition"
 title="Poner datos de contratación, contacto y requisitos primero"
 >
 <Briefcase className="w-3 h-3 text-[var(--acc)]" />
 <span>Promotor</span>
 </button>
 </div>
 </div>

 {/* LISTA DE SECCIONES CON CONTROLES */}
 <div className="space-y-2 pt-1">
 {sectionsList.map((item, index) => {
 const Icon = item.meta.icon;
 const isFirst = index === 0;
 const isLast = index === sectionsList.length - 1;

 return (
 <div
 key={item.id}
 className={`flex items-center justify-between gap-3 p-3 rounded-[var(--r-m)] transition ${
 item.isVisible
 ?'bg-[var(--surface)] border-[var(--hair)]/90 text-stone-200'
 :'bg-stone-950/60 border-[var(--hair)] text-[var(--ink-2)] opacity-60'
 }`}
 >
 {/* ÍNDICE Y METADATOS */}
 <div className="flex items-center gap-3 min-w-0">
 <span className="w-6 text-center font-mono text-xs font-bold text-[var(--ink-2)] shrink-0">
 #{index + 1}
 </span>
 <div
 className={`w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
 item.isVisible
 ?'bg-[var(--acc)]/10 /20 text-[var(--acc)]'
 :'bg-[var(--surface)]/80 border-[var(--hair)] text-stone-600'
 }`}
 >
 <Icon className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-[var(--ink)] font-mono truncate">
 {item.meta.label}
 </span>
 <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface)]/80 text-[var(--ink-2)] border-[var(--hair)] shrink-0 hidden sm:inline">
 {item.meta.defaultBadge}
 </span>
 {!item.isVisible && (
 <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 shrink-0">
 Oculta
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--ink-3)] truncate hidden sm:block">
 {item.meta.subtitle}
 </p>
 </div>
 </div>

 {/* CONTROLES DE REORDENACIÓN Y VISIBILIDAD */}
 <div className="flex items-center gap-1 shrink-0">
 {/* BOTÓN VISIBILIDAD */}
 <button
 type="button"
 onClick={() => handleToggleVisibility(item.id)}
 className={`p-1.5 rounded-[var(--r-s)] text-xs transition cursor-pointer ${
 item.isVisible
 ?'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-stone-300 border-[var(--hair)]'
 :'bg-[var(--alert-soft)] text-rose-400 border-rose-900/60 hover:bg-[var(--alert-soft)]'
 }`}
 title={item.isVisible ?'Ocultar esta sección en el EPK' :'Mostrar esta sección en el EPK'}
 >
 {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
 </button>

 {/* SUBIR */}
 <button
 type="button"
 onClick={() => handleMoveSection(index,'up')}
 disabled={isFirst}
 className={`p-1.5 rounded-[var(--r-s)] text-xs transition ${
 isFirst
 ?'opacity-30 cursor-not-allowed bg-stone-950 border-[var(--hair)] text-stone-600'
 :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-stone-300 hover:text-[var(--ink)] border-[var(--hair)] cursor-pointer'
 }`}
 title="Subir posición"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>

 {/* BAJAR */}
 <button
 type="button"
 onClick={() => handleMoveSection(index,'down')}
 disabled={isLast}
 className={`p-1.5 rounded-[var(--r-s)] text-xs transition ${
 isLast
 ?'opacity-30 cursor-not-allowed bg-stone-950 border-[var(--hair)] text-stone-600'
 :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/60 text-stone-300 hover:text-[var(--ink)] border-[var(--hair)] cursor-pointer'
 }`}
 title="Bajar posición"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </EPKBlockWrapper>
 );
};
