import React, { useState } from'react';
import {
 Copy,
 Check,
 ExternalLink,
 Save,
 Bot,
 ChevronDown,
 ChevronUp,
 HelpCircle,
 MoreVertical,
 ChevronLeft,
 ChevronRight
} from'lucide-react';
import { EPKBlockId, EPK_BLOCKS, EPKHealthStats } from'./epkBlocks';

interface EPKHeaderProps {
 activeBlock: EPKBlockId;
 onSelectBlock: (blockId: EPKBlockId) => void;
 publicEpkUrl: string;
 copiedPublicUrl: boolean;
 onCopyUrl: () => void;
 onSave: () => void;
 health: EPKHealthStats;
 isPromoPlan?: boolean;
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
 isPromoPlan = false,
 onOpenTutorial
}) => {
 const [showAiNotice, setShowAiNotice] = useState(false);
 const [showMobileMenu, setShowMobileMenu] = useState(false);
 const [showHealthDetails, setShowHealthDetails] = useState(false);

 const healthItems = [
 { key:'logo', label:'Logo', ok: health.hasLogo, block:'archivos' as EPKBlockId },
 { key:'bio', label:'Bio', ok: health.hasBio, block:'perfil' as EPKBlockId },
 { key:'dossier', label:'PDF', ok: health.hasDossier, block:'archivos' as EPKBlockId },
 { key:'rider', label:'Rider', ok: health.hasRider, block:'archivos' as EPKBlockId },
 { key:'miembros', label:'Músicos', ok: health.numMiembros > 0, block:'perfil' as EPKBlockId },
 { key:'temas', label:'Audio', ok: health.numTemas > 0, block:'musica' as EPKBlockId },
 { key:'idiomas', label:'Idiomas', ok: health.numTraducciones > 0, block:'donaciones' as EPKBlockId }
 ];
 const completedCount = healthItems.filter(h => h.ok).length;
 const totalCount = healthItems.length;

 const activeBlockIndex = EPK_BLOCKS.findIndex(b => b.id === activeBlock);
 const prevBlock = activeBlockIndex > 0 ? EPK_BLOCKS[activeBlockIndex - 1] : null;
 const nextBlock = activeBlockIndex < EPK_BLOCKS.length - 1 ? EPK_BLOCKS[activeBlockIndex + 1] : null;

 return (
 <div className="space-y-2.5 sm:space-y-3.5">
 {/* ============================================================ */}
 {/* 1. VERSIÓN MÓVIL (< sm): ULTRA COMPACTA, LIMPIA Y SIN RUIDO */}
 {/* ============================================================ */}
 <div className="sm:hidden bg-[var(--surface)] border-[var(--hair)] p-2.5 rounded-[var(--r-m)] shadow-xs space-y-2">
 <div className="flex items-center justify-between gap-2">
 <div className="min-w-0">
 <h2 className="text-sm font-bold font-mono text-[var(--ink)] leading-tight truncate">
 EPK / Dossier
 </h2>
 <button
 type="button"
 onClick={() => setShowHealthDetails(prev => !prev)}
 className="mt-0.5 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition text-stone-400 hover:text-[var(--acc)]/70"
 >
 <span className={completedCount >= 5 ?'text-emerald-400 font-semibold' :'text-[var(--acc)] font-semibold'}>
 ● {completedCount}/{totalCount} requisitos listos
 </span>
 {showHealthDetails ? <ChevronUp className="w-3 h-3 text-stone-500" /> : <ChevronDown className="w-3 h-3 text-stone-500" />}
 </button>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {/* BOTÓN PRIMARIO GUARDAR */}
 <button
 type="button"
 onClick={onSave}
 className="px-3 py-1.5 bg-[var(--acc)] active:bg-[var(--acc)]/60 text-[var(--ink)] font-bold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
 >
 <Save className="w-3.5 h-3.5" />
 <span>Guardar</span>
 </button>

 {/* MENÚ DE ACCIONES SECUNDARIAS (⋯) */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setShowMobileMenu(prev => !prev)}
 className={`p-1.5 rounded-[var(--r-s)] text-xs transition cursor-pointer ${
 showMobileMenu
 ?'bg-[var(--surface)]/60 text-[var(--acc)]/70'
 :'bg-[var(--surface)]/80 border-stone-700/80 text-stone-300 hover:text-[var(--ink)]'
 }`}
 aria-label="Más acciones del dossier"
 >
 <MoreVertical className="w-4 h-4" />
 </button>

 {showMobileMenu && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setShowMobileMenu(false)}
 />
 <div className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--surface)] rounded-[var(--r-m)] shadow-2xl z-50 p-1.5 space-y-1 text-xs">
 <a
 href={publicEpkUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={() => setShowMobileMenu(false)}
 className="flex items-center gap-2 px-3 py-2 text-[var(--acc)]/70 hover:bg-[var(--surface)]/60 rounded-[var(--r-s)] transition"
 >
 <ExternalLink className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <span className="font-semibold">Ver EPK público</span>
 </a>

 <button
 type="button"
 onClick={() => {
 onCopyUrl();
 setShowMobileMenu(false);
 }}
 className="w-full text-left flex items-center gap-2 px-3 py-2 text-stone-200 hover:bg-[var(--surface)]/60 rounded-[var(--r-s)] transition cursor-pointer"
 >
 {copiedPublicUrl ? (
 <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 ) : (
 <Copy className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 )}
 <span>{copiedPublicUrl ?'¡Copiado!' :'Copiar URL pública'}</span>
 </button>

 {onOpenTutorial && (
 <button
 type="button"
 onClick={() => {
 onOpenTutorial();
 setShowMobileMenu(false);
 }}
 className="w-full text-left flex items-center gap-2 px-3 py-2 text-purple-300 hover:bg-[var(--surface)]/60 rounded-[var(--r-s)] transition cursor-pointer"
 >
 <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
 <span>Guía interactiva EPK</span>
 </button>
 )}

 {!isPromoPlan && (
 <button
 type="button"
 onClick={() => {
 setShowAiNotice(prev => !prev);
 setShowMobileMenu(false);
 }}
 className="w-full text-left flex items-center gap-2 px-3 py-2 text-stone-300 hover:bg-[var(--surface)]/60 rounded-[var(--r-s)] transition cursor-pointer border-t border-[var(--hair)]/80 mt-1 pt-1.5"
 >
 <Bot className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <span>Conexión con Agentes IA</span>
 </button>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* DESGLOSE DESPLEGABLE DE SALUD */}
 {showHealthDetails && (
 <div className="pt-2 border-t border-[var(--hair)]/80 flex flex-wrap gap-1 text-[10px] font-mono">
 {healthItems.map(item => (
 <button
 key={item.key}
 type="button"
 onClick={() => {
 onSelectBlock(item.block);
 setShowHealthDetails(false);
 }}
 className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
 item.ok
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)]'
 }`}
 >
 <span>{item.label}</span>
 <span>{item.ok ?'✓' :'○'}</span>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* SELECTOR ERGONÓMICO DE BLOQUES EN MÓVIL (< sm) */}
 <div className="sm:hidden flex items-center justify-between gap-1.5 bg-[var(--surface)] border-[var(--hair)] p-1 rounded-[var(--r-m)]">
 <button
 type="button"
 onClick={() => prevBlock && onSelectBlock(prevBlock.id)}
 disabled={!prevBlock}
 className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 border-[var(--hair)] text-stone-300 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition"
 title="Bloque anterior"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>

 <div className="relative flex-1">
 <select
 value={activeBlock}
 onChange={(e) => onSelectBlock(e.target.value as EPKBlockId)}
 className="w-full appearance-none bg-[var(--surface)]/80 rounded-[var(--r-s)] py-1.5 pl-2.5 pr-7 text-xs font-bold font-mono text-[var(--acc)]/70 focus:outline-none focus: cursor-pointer"
 >
 {EPK_BLOCKS.map(block => (
 <option key={block.id} value={block.id} className="bg-[var(--surface)]/80 text-[var(--ink)]">
 {block.number ? `${block.number}/8. ${block.label}` : block.label}
 </option>
 ))}
 </select>
 <ChevronDown className="w-3.5 h-3.5 text-[var(--acc)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
 </div>

 <button
 type="button"
 onClick={() => nextBlock && onSelectBlock(nextBlock.id)}
 disabled={!nextBlock}
 className="p-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 border-[var(--hair)] text-stone-300 disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition"
 title="Siguiente bloque"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>

 {/* ============================================================ */}
 {/* 2. VERSIÓN ESCRITORIO (>= sm): COMPLETA Y ESPACIOSA */}
 {/* ============================================================ */}
 <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-[var(--surface)] border-[var(--hair)] p-4 sm:p-5 rounded-[var(--r-l)] shadow-sm">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)] text-[10px] font-mono font-bold uppercase">
 Kit de Prensa & EPK
 </span>
 <span className="text-[11px] text-stone-500 hidden sm:inline">•</span>
 <span className="text-[11px] text-stone-400 hidden sm:inline">
 Gestor Modular del Dossier
 </span>
 </div>
 <h2 className="text-lg sm:text-xl font-bold font-mono text-[var(--ink)]">
 EPK / Dossier de la Banda
 </h2>
 <p className="text-[var(--ink-3)] text-xs max-w-2xl leading-relaxed">
 {isPromoPlan
 ?'Configura por bloques tu dossier oficial: identidad, archivos, audio, vídeos y rider listos para festivales y salas.'
 :'Configura por bloques tu dossier oficial: identidad, archivos, audio, vídeos y rider. Sincronizado para el EPK público y los agentes de contratación.'}
 </p>
 </div>

 {/* ACCIONES PRINCIPALES ESCRITORIO */}
 <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
 {onOpenTutorial && (
 <button
 id="tutorial-trigger-epk"
 type="button"
 onClick={onOpenTutorial}
 className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono font-bold rounded-[var(--r-m)] flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
 title="Abrir guía interactiva del Dossier EPK"
 >
 <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
 <span>Guía rápida</span>
 </button>
 )}

 <button
 id="epk-header-copy-btn"
 type="button"
 onClick={onCopyUrl}
 className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] text-xs font-semibold rounded-[var(--r-m)] flex items-center gap-1.5 transition cursor-pointer"
 title="Copiar enlace web público del EPK"
 >
 {copiedPublicUrl ? (
 <Check className="w-3.5 h-3.5 text-emerald-400" />
 ) : (
 <Copy className="w-3.5 h-3.5 text-[var(--acc)]" />
 )}
 <span>{copiedPublicUrl ?'¡Copiado!' :'Copiar URL'}</span>
 </button>

 <a
 id="epk-header-public-btn"
 href={publicEpkUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]/70 hover:text-[var(--ink)] text-xs font-semibold rounded-[var(--r-m)] flex items-center gap-1.5 transition"
 title="Abrir vista pública del EPK"
 >
 <ExternalLink className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Ver EPK</span>
 </a>

 <button
 type="button"
 onClick={onSave}
 className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold text-xs sm:text-sm rounded-[var(--r-m)] flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
 >
 <Save className="w-4 h-4" />
 <span>Guardar Cambios</span>
 </button>
 </div>
 </div>

 {/* STATUS & HEALTH BAR ESCRITORIO (>= sm) */}
 <div className="hidden sm:flex items-center justify-between gap-3 px-3 sm:px-4 py-2 bg-[var(--surface)] rounded-[var(--r-m)] text-xs">
 <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 text-[11px] font-mono">
 <span className="text-stone-500 uppercase tracking-wider text-[10px] shrink-0 font-bold">
 Estado:
 </span>

 <button
 type="button"
 onClick={() => onSelectBlock('archivos')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition flex items-center gap-1 ${
 health.hasLogo
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Logo de la banda (Bloque Archivos)"
 >
 Logo {health.hasLogo ?'✓' :'○'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('perfil')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition flex items-center gap-1 ${
 health.hasBio
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Biografía oficial (Bloque Perfil)"
 >
 Bio {health.hasBio ?'✓' :'○'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('archivos')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition flex items-center gap-1 ${
 health.hasDossier
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Dossier en PDF (Bloque Archivos)"
 >
 PDF {health.hasDossier ?'✓' :'○'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('archivos')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition flex items-center gap-1 ${
 health.hasRider
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Rider técnico (Bloque Archivos)"
 >
 Rider {health.hasRider ?'✓' :'○'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('perfil')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition ${
 health.numMiembros > 0
 ?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Miembros de la formación (Bloque Perfil)"
 >
 {health.numMiembros} {health.numMiembros === 1 ?'músico' :'músicos'} {health.numMiembros > 0 ?'✓' :'○'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('musica')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition ${
 health.numTemas > 0
 ?'bg-sky-500/10 text-sky-400 border-sky-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Temas y audio preview (Bloque Música)"
 >
 {health.numTemas} {health.numTemas === 1 ?'tema' :'temas'}
 </button>

 <button
 type="button"
 onClick={() => onSelectBlock('donaciones')}
 className={`px-2 py-0.5 rounded-md shrink-0 transition ${
 health.numTraducciones > 0
 ?'bg-purple-500/10 text-purple-300 border-purple-500/20'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-stone-200'
 }`}
 title="Versiones en otros idiomas (Bloque Donaciones & Idiomas)"
 >
 {health.numTraducciones + 1} {health.numTraducciones === 0 ?'idioma' :'idiomas'}
 </button>
 </div>

 {!isPromoPlan && (
 <button
 type="button"
 onClick={() => setShowAiNotice(!showAiNotice)}
 className={`shrink-0 px-2 sm:px-2.5 py-1 rounded-[var(--r-s)] text-[11px] font-semibold flex items-center gap-1.5 transition ${
 showAiNotice
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /30'
 :'bg-[var(--surface)]/80 text-stone-400 border-[var(--hair)] hover:text-[var(--acc)]/70'
 }`}
 title="Ver integración con Chatbot y Agentes de IA"
 >
 <Bot className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span className="hidden sm:inline">Info IA</span>
 {showAiNotice ? (
 <ChevronUp className="w-3 h-3 text-stone-400" />
 ) : (
 <ChevronDown className="w-3 h-3 text-stone-400" />
 )}
 </button>
 )}
 </div>

 {/* AVISO EXPANDIBLE DE AGENTES DE IA (COLAPSADO POR DEFECTO PARA NO COMER ESPACIO) */}
 {!isPromoPlan && showAiNotice && (
 <div className="p-3.5 bg-[var(--acc)]/10 rounded-[var(--r-l)] text-xs text-[var(--ink-3)] flex items-start gap-3 transition">
 <Bot className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="font-bold text-[var(--acc)]/70 text-xs">
 Conexión Automática con Agentes de IA y Chatbot
 </p>
 <p className="text-[var(--ink-3)] leading-relaxed text-[11px]">
 Toda la información del dossier (biografía, integrantes, PDF oficial, rider técnico y cifras) se sincroniza en el servidor. El Chatbot y los Agentes autónomos de Redacción de Emails la consultan en tiempo real para personalizar los correos y propuestas enviadas a programadores de salas y festivales.
 </p>
 </div>
 </div>
 )}

 {/* SELECTOR DE BLOQUES ESCRITORIO (>= sm) */}
 <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
 {EPK_BLOCKS.map(block => {
 const Icon = block.icon;
 const isActive = activeBlock === block.id;
 return (
 <button
 key={block.id}
 id={`epk-block-tab-${block.id}`}
 type="button"
 onClick={() => onSelectBlock(block.id)}
 className={`px-3 py-2 rounded-[var(--r-m)] text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 ${
 isActive
 ?'bg-[var(--acc)] text-[var(--ink)] font-bold shadow-sm'
 :'bg-[var(--surface)]/80 border-[var(--hair)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-stone-700'
 }`}
 >
 <Icon className={`w-3.5 h-3.5 ${isActive ?'text-[var(--ink)]' :'text-[var(--acc)]'}`} />
 <span>{block.label}</span>
 </button>
 );
 })}
 </div>
 </div>
 );
};
