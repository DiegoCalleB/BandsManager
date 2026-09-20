import React from 'react';
import {
 FileText,
 Info,
 Mail,
 Share2,
 Trash2,
 Upload,
 Loader2,
 Instagram,
 User as UserIcon,
 Users,
 Globe
} from 'lucide-react';
import { EPKConfig, BandMember } from '../../types';
import { EPKBlockWrapper } from './EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta } from './epkBlocks';

interface EPKPerfilBlockProps {
 config: EPKConfig;
 setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
 miembros: BandMember[];
 anadirMiembro: () => void;
 editarMiembro: (id: string, patch: Partial<BandMember>) => void;
 quitarMiembro: (id: string) => void;
 subiendoFotoMiembro: string | null;
 subirFotoMiembro: (id: string, file: File) => void;
 unifiedPlatforms: Array<{ key: string; label: string; icon: string; placeholder: string }>;
 prevBlock?: EPKBlockMeta | null;
 nextBlock?: EPKBlockMeta | null;
 onNavigate?: (blockId: any) => void;
 onSave?: () => void;
 isAllView?: boolean;
}

export const EPKPerfilBlock: React.FC<EPKPerfilBlockProps> = ({
 config,
 setConfig,
 miembros,
 anadirMiembro,
 editarMiembro,
 quitarMiembro,
 subiendoFotoMiembro,
 subirFotoMiembro,
 unifiedPlatforms,
 prevBlock,
 nextBlock,
 onNavigate,
 onSave,
 isAllView = false
}) => {
 return (
 <EPKBlockWrapper
 meta={EPK_BLOCKS[0]}
 prevBlock={prevBlock}
 nextBlock={nextBlock}
 onNavigate={onNavigate}
 onSave={onSave}
 isAllView={isAllView}
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* BIOGRAFÍA OFICIAL / RESUMEN EJECUTIVO */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
 <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
 <FileText className="w-5 h-5" /> Biografía Oficial / Resumen Ejecutivo
 </h3>
 <span
 className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${
 config.biografia &&
 config.biografia.trim().length >= 80 &&
 !config.biografia.toLowerCase().includes('por definir') &&
 !config.biografia.includes('Propuesta musical en directo')
 ?'bg-[var(--ok)]/10 text-[var(--ok)]/30'
 :'bg-[var(--acc)]/10 text-[var(--acc)]/70 /20'
 }`}
 >
 {config.biografia &&
 config.biografia.trim().length >= 80 &&
 !config.biografia.toLowerCase().includes('por definir') &&
 !config.biografia.includes('Propuesta musical en directo')
 ?'✓ Bio Lista'
 :'Mínimo 80 caracteres'}
 </span>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold text-[var(--ink-2)]">Biografía de Presentación</label>
 <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-3 text-[11px] text-[var(--ink-2)] space-y-1.5">
 <p className="text-[var(--ink-2)] font-semibold">
 Escribid UN texto de banda, no la trayectoria de cada uno por separado (eso va en &quot;Formación de la Banda&quot;, con su foto).
 </p>
 <p>Un programador de sala lee esto en 15 segundos antes de decidir si sigue mirando. En este orden:</p>
 <ol className="list-decimal list-inside space-y-0.5 pl-1">
 <li>Qué sois y cómo sonáis, en una frase (vuestro género, lo que os hace distintos).</li>
 <li>Qué pasa en vuestro directo - lo que ve y siente el público.</li>
 <li>Por qué sois una apuesta segura - trayectoria en UNA frase (giras, festivales, con quién habéis compartido escenario).</li>
 </ol>
 <p>Máximo 150 palabras. Evitad adjetivos genéricos (&quot;energética&quot;, &quot;diversa&quot;) y usad detalles concretos que os distingan.</p>
 </div>
 <textarea
 rows={6}
 value={config.biografia}
 onChange={e => setConfig({ ...config, biografia: e.target.value })}
 placeholder={'Ejemplo de estructura (sustituid por lo vuestro):\n\n[Nombre de la banda] es [una frase que os define + vuestro género/sonido propio].\n\nEn directo, [qué ocurre encima del escenario: instrumentación, energía, qué se lleva el público].\n\nCon [X años/conciertos] a la espalda, hemos tocado en [salas/festivales relevantes] y compartido escenario con [referencias, si aplica].'
 }
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs sm:text-sm text-[var(--ink)] outline-none leading-relaxed placeholder:text-[var(--ink-2)]"
 />
 <div className="flex justify-between items-center text-[11px] font-sans text-[var(--ink-2)]">
 <span>Mínimo 80 caracteres para completar el perfil</span>
 <span className={(config.biografia ||'').trim().length >= 80 ?'text-[var(--ok)] font-bold' :'text-[var(--acc)] font-bold'}>
 {(config.biografia ||'').trim().length} / 80 min.
 </span>
 </div>
 </div>
 </div>

 {/* INFORMACIÓN ADICIONAL PARA EL DOSSIER */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
 <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
 <Info className="w-5 h-5" /> Información Adicional y Notas del Dossier
 </h3>
 <div className="flex items-center gap-2">
 <span
 className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${
 (config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) ||
 (config.dossierTextoExtra &&
 config.dossierTextoExtra.trim().length >= 80 &&
 !config.dossierTextoExtra.toLowerCase().includes('por definir'))
 ?'bg-[var(--ok)]/10 text-[var(--ok)]/30'
 :'bg-[var(--acc)]/10 text-[var(--acc)]/70 /20'
 }`}
 >
 {(config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) ||
 (config.dossierTextoExtra &&
 config.dossierTextoExtra.trim().length >= 80 &&
 !config.dossierTextoExtra.toLowerCase().includes('por definir'))
 ?'✓ Listo'
 :'Mín. 80 car. o PDF'}
 </span>
 <span className="text-[10px] font-bold tracking-wider text-[var(--acc)] bg-[var(--acc)]/10 px-2 py-0.5 rounded-full hidden sm:inline">
 Uso Interno
 </span>
 </div>
 </div>

 <p className="text-xs text-[var(--ink-2)] leading-relaxed">
 Escribe notas y detalles de la banda (trayectoria, integrantes, estilo, hitos, prensa, etc.) para enriquecer la documentación del proyecto.
 </p>
 <p className="text-[11px] text-[var(--acc)]/90 font-semibold bg-[var(--acc)]/5 rounded-[var(--r-s)] px-3 py-2">
 Nota: Este texto es para uso interno del equipo y no se muestra en la página pública del EPK.
 </p>

 <div className="space-y-1.5">
 <textarea
 rows={5}
 value={config.dossierTextoExtra ||''}
 onChange={e => setConfig({ ...config, dossierTextoExtra: e.target.value })}
 placeholder="Ejemplo: La banda cuenta con 4 integrantes (voz, guitarra, bajo y batería). Formato versátil para salas y festivales según aforo y requisitos técnicos. Ofrecemos un show potente y enérgico de 90 minutos concebido para hacer vibrar al público..."
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3.5 text-xs sm:text-sm text-[var(--ink)] outline-none leading-relaxed font-sans"
 />
 <div className="flex justify-between items-center text-[11px] font-sans text-[var(--ink-2)]">
 <span>Mínimo 80 caracteres para marcar como completado (si no hay PDF)</span>
 <span className={(config.dossierTextoExtra ||'').trim().length >= 80 ?'text-[var(--ok)] font-bold' :'text-[var(--acc)] font-bold'}>
 {(config.dossierTextoExtra ||'').trim().length} / 80 min.
 </span>
 </div>
 </div>
 </div>

 {/* FORMACIÓN DE LA BANDA */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
 <div className="flex items-center gap-2">
 <Users className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)]">
 Formación de la Banda ({miembros.length})
 </h3>
 </div>
 <button
 type="button"
 onClick={anadirMiembro}
 className="text-xs bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold px-3 py-1.5 rounded-[var(--r-s)] transition cursor-pointer"
 >
 + Añadir miembro
 </button>
 </div>
 <div className="text-xs text-[var(--ink-2)] space-y-1">
 <p>Quien programa quiere ver caras y saber cuánta gente sube al escenario. Foto, nombre, instrumento y breve descripción de cada integrante.</p>
 </div>
 {miembros.length === 0 && (
 <div className="rounded-[var(--r-m)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-2)]">
 Todavía no has añadido a nadie. Añade a los integrantes con su foto y descripción para que el dossier tenga cercanía.
 </div>
 )}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {miembros.map(m => (
 <div key={m.id} className="rounded-[var(--r-m)] bg-[var(--surface)] p-3.5 space-y-2.5">
 <div className="flex items-start gap-3">
 <label className="shrink-0 cursor-pointer group" title="Subir foto del músico">
 <div className="w-16 h-16 rounded-[var(--r-m)] overflow-hidden bg-[var(--surface)] flex items-center justify-center relative">
 {subiendoFotoMiembro === m.id ? (
 <Loader2 className="w-5 h-5 text-[var(--acc)] animate-spin" />
 ) : m.fotoUrl && m.fotoUrl.trim() !=='' ? (
 <img src={m.fotoUrl} alt={m.nombre ||'Miembro'} className="w-full h-full object-cover" />
 ) : (
 <div className="flex flex-col items-center justify-center p-1 text-center">
 <Upload className="w-4 h-4 text-[var(--ink-2)] group-hover:text-[var(--acc)] transition mb-0.5" />
 <span className="text-[8px] text-[var(--ink-2)] font-medium">Foto</span>
 </div>
 )}
 </div>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={e => {
 const f = e.target.files?.[0];
 if (f) subirFotoMiembro(m.id, f);
 e.target.value ='';
 }}
 />
 </label>
 <div className="flex-1 space-y-1.5">
 <input
 type="text"
 value={m.nombre}
 onChange={e => editarMiembro(m.id, { nombre: e.target.value })}
 placeholder="Nombre del músico"
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)] focus: outline-none"
 />
 <input
 type="text"
 value={m.rol}
 onChange={e => editarMiembro(m.id, { rol: e.target.value })}
 placeholder="Instrumento / Rol (Voz, guitarra, metales...)"
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-1.5 text-xs text-[var(--acc)]/90 focus: outline-none"
 />
 </div>
 <button
 type="button"
 onClick={() => quitarMiembro(m.id)}
 className="shrink-0 p-1.5 text-[var(--ink-2)] hover:text-[var(--alert)] transition cursor-pointer"
 title="Quitar músico"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-semibold text-[var(--ink-2)] tracking-wider block">
 Breve descripción / Trayectoria (opcional)
 </label>
 <textarea
 rows={2}
 value={m.bio ||''}
 onChange={e => editarMiembro(m.id, { bio: e.target.value })}
 placeholder="Trayectoria o rol en directo..."
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-2 text-xs text-[var(--ink)] focus: outline-none placeholder:text-[var(--ink-2)] leading-relaxed"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[10px] font-semibold text-[var(--ink-2)] tracking-wider block">
 Instagram personal (opcional)
 </label>
 <div className="relative">
 <Instagram className="w-3.5 h-3.5 text-[var(--ink-2)] absolute left-2.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={m.instagram ||''}
 onChange={e => editarMiembro(m.id, { instagram: e.target.value })}
 placeholder="@usuario o https://instagram.com/usuario"
 className="w-full bg-[var(--surface)] rounded-[var(--r-s)] pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] focus: outline-none"
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* DATOS DE CONTACTO DE BOOKING & REDES */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
 <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
 <Mail className="w-5 h-5" /> Datos de Contacto de Booking & Redes Oficiales
 </h3>

 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="text-xs font-semibold text-[var(--ink-2)]">Nombre / Cargo Mánager</label>
 <input
 type="text"
 value={config.contactoBooking?.nombre ||''}
 onChange={e =>
 setConfig({
 ...config,
 contactoBooking: { ...config.contactoBooking, nombre: e.target.value }
 })
 }
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none mt-1"
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--ink-2)]">Email de Contacto</label>
 <input
 type="email"
 value={config.contactoBooking?.email ||''}
 onChange={e =>
 setConfig({
 ...config,
 contactoBooking: { ...config.contactoBooking, email: e.target.value }
 })
 }
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none mt-1"
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[var(--ink-2)]">Teléfono Mánager</label>
 <input
 type="text"
 value={config.contactoBooking?.telefono ||''}
 onChange={e =>
 setConfig({
 ...config,
 contactoBooking: { ...config.contactoBooking, telefono: e.target.value }
 })
 }
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none mt-1"
 />
 </div>
 </div>

 {/* SITIO WEB OFICIAL PROPIO DE LA BANDA */}
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-2">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <label className="text-xs font-bold text-[var(--acc)]/70 flex items-center gap-1.5">
 <Globe className="w-4 h-4 text-[var(--acc)]" /> Sitio Web Oficial Propio de la Banda (Opcional)
 </label>
 <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[var(--acc)]/10 text-[var(--acc)]/70">
 Dossier EPK + Fans Landing
 </span>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
 Si vuestra banda ya dispone de un sitio web oficial o dominio propio, incluidlo aquí. Se enlazará de forma destacada en el Dossier EPK y en la Landing de Fans.
 </p>
 <input
 type="url"
 placeholder="https://www.tubanda.com"
 value={config.enlacesRedes?.website ||''}
 onChange={e => {
 const updatedVal = e.target.value;
 setConfig(prev => {
 const newRedes = {
 ...(prev.enlacesRedes || {}),
 website: updatedVal
 };
 return {
 ...prev,
 enlacesRedes: newRedes,
 firmaEmail: {
 ...(prev.firmaEmail || {}),
 redesSociales: newRedes
 }
 };
 });
 }}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>

 <div className="pt-3 space-y-3">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div>
 <label className="text-xs font-bold text-[var(--acc)]/70 flex items-center gap-1.5">
 <Share2 className="w-3.5 h-3.5" /> Enlaces de Redes & Plataformas Oficiales
 </label>
 <p className="text-[11px] text-[var(--ink-2)]">
 Fuente única: se sincronizan automáticamente en tu Dossier EPK, firma de email, landing de fans y plataformas oficiales.
 </p>
 </div>
 <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[var(--ok)]/10 text-[var(--ok)]">
 Fuente Centralizada
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
 {unifiedPlatforms.filter(item => item.key !=='website').map(item => (
 <div key={item.key} className="space-y-1">
 <label className="text-[11px] font-semibold text-[var(--ink-2)] flex items-center gap-1">
 <span>{item.icon}</span>
 <span>{item.label}</span>
 </label>
 <input
 type="text"
 placeholder={item.placeholder}
 value={(config.enlacesRedes as any)?.[item.key] ||''}
 onChange={e => {
 const updatedVal = e.target.value;
 setConfig(prev => {
 const newRedes = {
 ...(prev.enlacesRedes || {}),
 [item.key]: updatedVal
 };
 return {
 ...prev,
 enlacesRedes: newRedes,
 firmaEmail: {
 ...(prev.firmaEmail || {}),
 redesSociales: newRedes
 }
 };
 });
 }}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-s)] px-2.5 py-1.5 text-[var(--ink)] outline-none font-sans text-[11px]"
 />
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </EPKBlockWrapper>
 );
};
