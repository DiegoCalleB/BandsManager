import React from'react';
import {
 Heart,
 Eye,
 Lock as LockIcon,
 Copy,
 Languages,
 AlertCircle,
 Info,
 ExternalLink,
 Sparkles,
 Loader2
} from'lucide-react';
import { EPKConfig, BandMember } from'../../types';
import { EPKBlockWrapper } from'./EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta } from'./epkBlocks';
import { PayPalLogo, BizumLogo } from'../SocialPlatformsList';
import { tieneTraduccion, traduccionDesactualizada } from'../../utils/epkTraducciones';

interface EPKDonacionesBlockProps {
 config: EPKConfig;
 setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
 setShowFansPreviewModal: (show: boolean) => void;
 idiomasDestino: Array<{ code: string; label: string; flag: string }>;
 traduciendo: string | null;
 traducirConIA: (codigoIdioma: string) => void;
 editarTraduccion: (codigoIdioma: string, campo:'biografia' |'textoPie', valor: string) => void;
 editarTraduccionMiembro: (codigoIdioma: string, miembroId: string, campo:'rol' |'bio', valor: string) => void;
 errorTraduccion: string | null;
 avisoTraduccion: string | null;
 publicEpkUrl: string;
 miembros: BandMember[];
 prevBlock?: EPKBlockMeta | null;
 nextBlock?: EPKBlockMeta | null;
 onNavigate?: (blockId: any) => void;
 onSave?: () => void;
 isAllView?: boolean;
}

export const EPKDonacionesBlock: React.FC<EPKDonacionesBlockProps> = ({
 config,
 setConfig,
 setShowFansPreviewModal,
 idiomasDestino,
 traduciendo,
 traducirConIA,
 editarTraduccion,
 editarTraduccionMiembro,
 errorTraduccion,
 avisoTraduccion,
 publicEpkUrl,
 miembros,
 prevBlock,
 nextBlock,
 onNavigate,
 onSave,
 isAllView = false
}) => {
 return (
 <EPKBlockWrapper
 meta={EPK_BLOCKS[4]}
 prevBlock={prevBlock}
 nextBlock={nextBlock}
 onNavigate={onNavigate}
 onSave={onSave}
 isAllView={isAllView}
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* APOYO ECONÓMICO / DONACIONES */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
 <h3 className="text-base sm:text-lg font-bold text-sky-400 flex items-center gap-2">
 <Heart className="w-5 h-5" /> Apoyo Económico & Donaciones (Revolut, PayPal & Bizum)
 </h3>
 <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full">
 Crowdfunding Directo
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)]">
 Permite a tus fans y salas hacer aportaciones por Revolut, PayPal o Bizum sin intermediarios. Se muestra en el formulario público y en el Dossier EPK.
 </p>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
 {/* Campos de configuración */}
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-[var(--r-m)]">
 <div className="space-y-0.5 pr-3">
 <span className="text-xs font-bold text-[var(--ink)]">Mostrar tarjeta de donación</span>
 <p className="text-[10px] text-[var(--ink-2)]">Activa o desactiva la opción de colaboración</p>
 </div>
 <input
 type="checkbox"
 checked={config.donacionRevolut?.habilitado !== false}
 onChange={e =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, habilitado: e.target.checked }
 })
 }
 className="w-4 h-4 accent-sky-500 rounded cursor-pointer shrink-0"
 />
 </div>

 {/* Métodos de Pago: Revolut y PayPal */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {/* Revolut */}
 <div className="p-3 bg-[var(--surface)]/80 rounded-[var(--r-m)] space-y-1.5">
 <div className="flex items-center gap-1.5">
 <div className="w-5 h-5 rounded-md bg-white text-[var(--ink)] flex items-center justify-center p-0.5 shadow-sm">
 <svg className="w-full h-full fill-black" viewBox="0 0 24 24">
 <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z" />
 </svg>
 </div>
 <label className="text-xs font-semibold text-sky-200">Revolut (Revtag)</label>
 </div>
 <div className="flex items-center gap-1 bg-[var(--surface)] focus-within:border-sky-500 rounded-[var(--r-s)] px-2.5">
 <span className="text-[10px] text-[var(--ink-2)] font-mono">revolut.me/</span>
 <input
 type="text"
 value={config.donacionRevolut?.revolutTag ||''}
 onChange={e => {
 const cleanTag = e.target.value
 .replace(/^@/,'')
 .replace(/^https?:\/\/revolut\.me\//i,'')
 .replace(/^revolut\.me\//i,'')
 .trim();
 const generatedUrl = cleanTag
 ? cleanTag.startsWith('http')
 ? cleanTag
 : `https://revolut.me/${cleanTag}`
 :'';
 setConfig(prev => ({
 ...prev,
 donacionRevolut: {
 ...prev.donacionRevolut,
 revolutTag: cleanTag,
 revolutUrl: generatedUrl
 },
 enlacesRedes: { ...(prev.enlacesRedes || {}), revolut: generatedUrl }
 }));
 }}
 placeholder="tubanda"
 className="w-full bg-transparent py-1.5 text-xs text-sky-300 font-bold outline-none font-mono"
 />
 </div>
 </div>

 {/* PayPal */}
 <div className="p-3 bg-[var(--surface)]/80 rounded-[var(--r-m)] space-y-1.5">
 <div className="flex items-center gap-1.5">
 <div className="w-5 h-5 rounded-md bg-[var(--bg)] text-[#0079C1] flex items-center justify-center p-0.5 shadow-sm">
 <PayPalLogo className="w-full h-full fill-white" />
 </div>
 <label className="text-xs font-semibold text-blue-200">PayPal (paypal.me)</label>
 </div>
 <div className="flex items-center gap-1 bg-[var(--surface)] focus-within:border-blue-500 rounded-[var(--r-s)] px-2.5">
 <span className="text-[10px] text-[var(--ink-2)] font-mono">paypal.me/</span>
 <input
 type="text"
 value={config.donacionRevolut?.paypalUser ||''}
 onChange={e => {
 const cleanUser = e.target.value
 .replace(/^@/,'')
 .replace(/^https?:\/\/paypal\.me\//i,'')
 .replace(/^paypal\.me\//i,'')
 .trim();
 const generatedUrl = cleanUser
 ? cleanUser.startsWith('http')
 ? cleanUser
 : `https://paypal.me/${cleanUser}`
 :'';
 setConfig(prev => ({
 ...prev,
 donacionRevolut: {
 ...prev.donacionRevolut,
 paypalUser: cleanUser,
 paypalUrl: generatedUrl
 },
 enlacesRedes: { ...(prev.enlacesRedes || {}), paypal: generatedUrl }
 }));
 }}
 placeholder="tubanda"
 className="w-full bg-transparent py-1.5 text-xs text-blue-300 font-bold outline-none font-mono"
 />
 </div>
 </div>
 </div>

 {/* Bizum */}
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center p-0.5 shadow-sm">
 <BizumLogo className="w-4 h-4" />
 </div>
 <label className="text-xs font-semibold text-[var(--ink)]">Bizum (Teléfono)</label>
 </div>
 <div className="flex items-center gap-1 bg-[var(--surface)] focus-within:border-emerald-500 rounded-[var(--r-s)] px-2.5">
 <span className="text-[10px] text-[var(--ink-2)] font-mono">TLF:</span>
 <input
 type="text"
 value={config.donacionRevolut?.bizumTelefono ||''}
 onChange={e => {
 const num = e.target.value.replace(/[^0-9+\s-]/g,'');
 setConfig(prev => ({
 ...prev,
 donacionRevolut: { ...prev.donacionRevolut, bizumTelefono: num },
 enlacesRedes: { ...(prev.enlacesRedes || {}), bizum: num }
 }));
 }}
 placeholder="+34 600 000 000"
 className="w-full bg-transparent py-1.5 text-xs text-[var(--ink-2)] font-bold outline-none font-mono"
 />
 </div>
 </div>

 {/* Método por defecto */}
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[var(--ink-2)]">Método preferente</label>
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, metodoPorDefecto:'revolut' }
 })
 }
 className={`p-2 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
 (config.donacionRevolut?.metodoPorDefecto ||'revolut') ==='revolut'
 ?'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span className="w-2 h-2 rounded-full bg-sky-400" />
 Revolut
 </button>
 <button
 type="button"
 onClick={() =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, metodoPorDefecto:'paypal' }
 })
 }
 className={`p-2 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
 config.donacionRevolut?.metodoPorDefecto ==='paypal'
 ?'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span className="w-2 h-2 rounded-full bg-blue-400" />
 PayPal
 </button>
 <button
 type="button"
 onClick={() =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, metodoPorDefecto:'bizum' }
 })
 }
 className={`p-2 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
 config.donacionRevolut?.metodoPorDefecto ==='bizum'
 ?'bg-emerald-500/20 border-emerald-500 text-[var(--ink-2)] shadow-sm'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <span className="w-2 h-2 rounded-full bg-emerald-400" />
 Bizum
 </button>
 </div>
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--ink-2)]">Título de la tarjeta</label>
 <input
 type="text"
 value={config.donacionRevolut?.titulo ||''}
 onChange={e =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, titulo: e.target.value }
 })
 }
 placeholder="Colabora con la banda"
 className="w-full bg-[var(--surface)] focus:border-sky-500 rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none"
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--ink-2)]">Descripción del destino</label>
 <textarea
 rows={2}
 value={config.donacionRevolut?.descripcion ||''}
 onChange={e =>
 setConfig({
 ...config,
 donacionRevolut: { ...config.donacionRevolut, descripcion: e.target.value }
 })
 }
 placeholder="Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos."
 className="w-full bg-[var(--surface)] focus:border-sky-500 rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none resize-none"
 />
 </div>
 </div>

 {/* Vista previa en vivo */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-2)]">
 Previsualización en vivo
 </span>
 <button
 type="button"
 onClick={() => setShowFansPreviewModal(true)}
 className="text-[11px] font-mono text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 cursor-pointer hover:underline transition"
 title="Abrir simulador interactivo del formulario Únete"
 >
 <Eye className="w-3.5 h-3.5" /> Ver Formulario Únete
 </button>
 </div>

 {config.donacionRevolut?.habilitado === false ? (
 <div className="p-4 rounded-[var(--r-m)] border-dashed text-center text-xs text-[var(--ink-2)]">
 Tarjeta desactivada: no se mostrará en &quot;Únete&quot; ni en el Dossier
 </div>
 ) : (
 <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-[var(--r-l)] bg-gradient-to-b from-[var(--surface)]/95 via-[var(--surface)]/90 to-[var(--surface)]/95 p-4 shadow-xl space-y-3">
 <div className="relative flex items-start gap-3 sm:gap-3.5">
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] tracking-tight leading-snug">
 {config.donacionRevolut?.titulo ||'Colabora con la banda'}
 </h3>
 <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold shrink-0">
 Contribución
 </span>
 </div>
 <p className="text-[11px] text-[var(--ink)]/90 leading-relaxed mt-1">
 {config.donacionRevolut?.descripcion ||'Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos.'}
 </p>
 </div>
 </div>

 <div className="pt-1 flex items-center justify-between text-[10px] text-[var(--ink-2)]">
 <span className="flex items-center gap-1">
 <LockIcon className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
 <span>Pago seguro sin comisiones para la banda</span>
 </span>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* EPK MULTIIDIOMA */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 border-b pb-3">
 <Languages className="w-5 h-5" /> Versiones del EPK en otros idiomas
 </h3>
 <div className="text-xs text-[var(--ink-2)] space-y-1">
 <p>
 Traduce automáticamente biografía, lema y formación a otros idiomas para festivales y programadores internacionales.
 </p>
 <p>
 <strong className="text-[var(--ink-2)]">Gasta tokens solo al pulsar el botón</strong>. La IA genera el borrador y puedes repasarlo antes de dejarlo público.
 </p>
 </div>

 {errorTraduccion && (
 <div className="rounded-[var(--r-m)] bg-red-500/10 text-red-300 p-3 text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errorTraduccion}</span>
 </div>
 )}
 {avisoTraduccion && (
 <div className="rounded-[var(--r-m)] bg-sky-500/10 text-sky-300 p-3 text-xs flex items-start gap-2">
 <Info className="w-4 h-4 shrink-0 mt-0.5" /> <span>{avisoTraduccion}</span>
 </div>
 )}

 {idiomasDestino.map(idioma => {
 const traduccion = config.traducciones?.[idioma.code];
 const hayTraduccion = tieneTraduccion(config, idioma.code);
 const desactualizada = traduccionDesactualizada(config, idioma.code);
 const estaTraduciendo = traduciendo === idioma.code;

 return (
 <div key={idioma.code} className=" rounded-[var(--r-m)] p-4 bg-[var(--surface)] space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className="text-lg" aria-hidden="true">
 {idioma.flag}
 </span>
 <span className="font-bold text-[var(--ink)] text-sm">{idioma.label}</span>
 {hayTraduccion && !desactualizada && (
 <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
 Al día
 </span>
 )}
 </div>
 <div className="flex items-center gap-2">
 {hayTraduccion && (
 <a
 href={`${publicEpkUrl}&lang=${idioma.code}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]/70 font-semibold px-3 py-1.5 rounded-[var(--r-s)] flex items-center gap-1.5 transition"
 >
 <ExternalLink className="w-3.5 h-3.5" /> Ver página
 </a>
 )}
 <button
 type="button"
 onClick={() => traducirConIA(idioma.code)}
 disabled={estaTraduciendo}
 className="text-xs bg-[var(--acc)] hover:bg-[var(--acc)]/60 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--ink)] font-bold px-3 py-1.5 rounded-[var(--r-s)] flex items-center gap-1.5 transition cursor-pointer"
 >
 {estaTraduciendo ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" /> Traduciendo...
 </>
 ) : (
 <>
 <Sparkles className="w-3.5 h-3.5" />{''}
 {hayTraduccion ?'Volver a traducir' :'Traducir con IA'}
 </>
 )}
 </button>
 </div>
 </div>

 {desactualizada && (
 <div className="rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc)]/70 p-3 text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>
 Has modificado el texto en español desde la última traducción. Conviene volver a traducir para sincronizarla.
 </span>
 </div>
 )}

 {hayTraduccion && (
 <div className="space-y-4">
 {[
 {
 campo:'biografia' as const,
 etiqueta:'Biografía',
 original: config.biografia,
 filas: 5
 },
 {
 campo:'textoPie' as const,
 etiqueta:'Lema / Subtítulo',
 original: config.firmaEmail?.textoPie,
 filas: 2
 }
 ]
 .filter(f => (f.original ||'').trim())
 .map(f => (
 <div key={f.campo} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] uppercase tracking-wider text-[var(--ink-2)] font-semibold mb-1.5">
 {f.etiqueta} — original (ES)
 </label>
 <div className="w-full bg-[var(--surface)]/60 rounded-[var(--r-s)] p-3 text-xs text-[var(--ink-2)] whitespace-pre-line max-h-40 overflow-y-auto">
 {f.original}
 </div>
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider text-amber-0/80 font-semibold mb-1.5">
 {f.etiqueta} — {idioma.label}
 </label>
 <textarea
 value={traduccion?.[f.campo] ||''}
 onChange={e => editarTraduccion(idioma.code, f.campo, e.target.value)}
 rows={f.filas}
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] p-3 text-xs text-[var(--ink)] focus: focus:outline-none"
 />
 </div>
 </div>
 ))}

 {miembros.filter(m => (m.rol ||'').trim() || (m.bio ||'').trim()).length > 0 && (
 <div className="space-y-3 pt-2 border-t border-[var(--hair)]">
 <p className="text-[10px] uppercase tracking-wider text-[var(--ink-2)] font-semibold">
 Formación
 </p>
 {miembros
 .filter(m => (m.rol ||'').trim() || (m.bio ||'').trim())
 .map(m => (
 <div key={m.id} className="bg-[var(--surface)]/60 rounded-[var(--r-s)] p-3 space-y-2">
 <p className="text-xs font-bold text-[var(--ink)]">{m.nombre ||'Sin nombre'}</p>
 {(m.rol ||'').trim() && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div className="text-[11px] text-[var(--ink-2)] pt-1.5">{m.rol}</div>
 <input
 type="text"
 value={traduccion?.miembros?.[m.id]?.rol ||''}
 onChange={e =>
 editarTraduccionMiembro(idioma.code, m.id,'rol', e.target.value)
 }
 placeholder={`Instrumento en ${idioma.label}`}
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus: focus:outline-none"
 />
 </div>
 )}
 {(m.bio ||'').trim() && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div className="text-[11px] text-[var(--ink-2)]">{m.bio}</div>
 <textarea
 value={traduccion?.miembros?.[m.id]?.bio ||''}
 onChange={e =>
 editarTraduccionMiembro(idioma.code, m.id,'bio', e.target.value)
 }
 rows={2}
 placeholder={`Trayectoria en ${idioma.label}`}
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus: focus:outline-none"
 />
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </EPKBlockWrapper>
 );
};
