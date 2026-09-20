import React from'react';
import { Users, Plus, Trash2, Mail, Instagram, ShieldCheck, UserCheck } from'lucide-react';
import { WizardMemberItem } from'../types';

interface StepMembersProps {
 members: WizardMemberItem[];
 newMemberName: string;
 setNewMemberName: (v: string) => void;
 newMemberRole: string;
 setNewMemberRole: (v: string) => void;
 newMemberEmail: string;
 setNewMemberEmail: (v: string) => void;
 newMemberInstagram: string;
 setNewMemberInstagram: (v: string) => void;
 onAddMember: () => void;
 onRemoveMember: (id: string) => void;
}

export const StepMembers: React.FC<StepMembersProps> = ({
 members,
 newMemberName,
 setNewMemberName,
 newMemberRole,
 setNewMemberRole,
 newMemberEmail,
 setNewMemberEmail,
 newMemberInstagram,
 setNewMemberInstagram,
 onAddMember,
 onRemoveMember,
}) => {
 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <Users className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-[var(--ink)]">Miembros de la Banda & Invitaciones</h3>
 </div>

 {/* List of current members */}
 <div className="space-y-2.5">
 {members.map((m, idx) => (
 <div
 key={m.id || idx}
 className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] hover:border-[var(--hair)] transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-[var(--r-m)] flex items-center justify-center font-bold text-xs ${
 m.isLeader ?'bg-[var(--acc)]/20 text-[var(--acc)]/70' :'bg-[var(--sunken)] text-[var(--ink-2)] border-[var(--hair)]'
 }`}>
 {m.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-[var(--ink)]">{m.name}</span>
 {m.isLeader && (
 <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 font-medium">
 Líder / Creador
 </span>
 )}
 </div>
 <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] mt-0.5">
 <span>{m.role ||'Músico'}</span>
 {m.email && <span className="text-[var(--ink-2)]">· {m.email}</span>}
 {m.instagram && <span className="text-[var(--ink-2)]">· @{m.instagram.replace('@','')}</span>}
 </div>
 </div>
 </div>

 {!m.isLeader && (
 <button
 type="button"
 onClick={() => onRemoveMember(m.id)}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
 title="Quitar miembro"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 ))}
 </div>

 {/* Add new member form */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] space-y-3">
 <h4 className="text-xs font-semibold text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
 <Plus className="w-3.5 h-3.5 text-[var(--acc)]" />
 Añadir Compañero de Banda / Músico
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <input
 type="text"
 value={newMemberName}
 onChange={(e) => setNewMemberName(e.target.value)}
 placeholder="Nombre y Apellidos *"
 className="px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />

 <input
 type="text"
 value={newMemberRole}
 onChange={(e) => setNewMemberRole(e.target.value)}
 placeholder="Instrumento / Rol (ej. Batería, Bajo, Teclados) *"
 className="px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />

 <input
 type="email"
 value={newMemberEmail}
 onChange={(e) => setNewMemberEmail(e.target.value)}
 placeholder="Email (para invitarle a acceder al panel)"
 className="px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />

 <input
 type="text"
 value={newMemberInstagram}
 onChange={(e) => setNewMemberInstagram(e.target.value)}
 placeholder="Instagram (ej. @nombremusico)"
 className="px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>

 <div className="flex justify-end pt-1">
 <button
 type="button"
 onClick={onAddMember}
 disabled={!newMemberName.trim()}
 className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-semibold text-xs transition-colors disabled:opacity-50"
 >
 <Plus className="w-3.5 h-3.5" />
 Añadir a la formación
 </button>
 </div>
 </div>
 </div>
 );
};
