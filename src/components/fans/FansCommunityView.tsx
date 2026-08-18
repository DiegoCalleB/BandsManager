import React, { useState } from 'react';
import { 
  Heart, Flame, Sparkles, MessageCircle, Send, Plus, Trash2, 
  MapPin, Calendar, Music, Instagram, Award, ExternalLink, 
  Check, Share2, Mail, Filter, Search, ShieldCheck, UserCheck,
  Megaphone, Pin, Star
} from 'lucide-react';
import { Fan, Concert, ThemeColors } from '../../types';

interface BandAnnouncement {
  id: string;
  fecha: string;
  autor: string;
  titulo: string;
  contenido: string;
  fijado?: boolean;
  reacciones: {
    likes: number;
    fire: number;
    applause: number;
    guitars: number;
  };
}

interface FansCommunityViewProps {
  fans: Fan[];
  concerts: Concert[];
  effectiveBandName: string;
  effectiveBandLogo?: string;
  colors?: ThemeColors;
  isStitchLight?: boolean;
  onUpdateFan?: (fanId: string, updates: Partial<Fan>) => void;
  onDeleteFan?: (fanId: string) => void;
  onOpenAddModal: () => void;
  selectedCityFilter: string;
}

export const FansCommunityView: React.FC<FansCommunityViewProps> = ({
  fans = [],
  concerts = [],
  effectiveBandName,
  effectiveBandLogo,
  colors,
  isStitchLight,
  onUpdateFan,
  onDeleteFan,
  onOpenAddModal,
  selectedCityFilter
}) => {
  // Local announcements from the band
  const [announcements, setAnnouncements] = useState<BandAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(`bakandeya_community_announcements_${effectiveBandName}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'ann-1',
        fecha: new Date().toISOString().split('T')[0],
        autor: effectiveBandName,
        titulo: '¡Bienvenidos al Fan Club Oficial! 🎸',
        contenido: `Gracias a todos los que os habéis unido a nuestra comunidad a través de los directos y las redes. ¡Tendréis acceso prioritario a entradas, setlists exclusivos y sorteos de merchan!`,
        fijado: true,
        reacciones: { likes: 24, fire: 18, applause: 12, guitars: 15 }
      }
    ];
  });

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Local reaction states for instant reactive feedback
  const [userReactions, setUserReactions] = useState<Record<string, Record<string, boolean>>>({});
  const [fanReactionCounts, setFanReactionCounts] = useState<Record<string, { likes: number; fire: number; applause: number; guitars: number }>>(() => {
    const initial: Record<string, { likes: number; fire: number; applause: number; guitars: number }> = {};
    fans.forEach(f => {
      initial[f.id] = {
        likes: f.reacciones?.likes ?? Math.max(1, (f.nombre.length % 5) + 1),
        fire: f.reacciones?.fire ?? (f.comoConocio?.includes('Concierto') ? 3 : 1),
        applause: f.reacciones?.applause ?? (f.nombre.length % 3),
        guitars: f.reacciones?.guitars ?? 1
      };
    });
    return initial;
  });

  const handleReactFan = (fanId: string, type: 'likes' | 'fire' | 'applause' | 'guitars') => {
    const isAlreadyReacted = userReactions[fanId]?.[type];
    
    setUserReactions(prev => ({
      ...prev,
      [fanId]: {
        ...(prev[fanId] || {}),
        [type]: !isAlreadyReacted
      }
    }));

    setFanReactionCounts(prev => {
      const current = prev[fanId] || { likes: 0, fire: 0, applause: 0, guitars: 0 };
      const delta = isAlreadyReacted ? -1 : 1;
      const updated = {
        ...current,
        [type]: Math.max(0, (current[type] || 0) + delta)
      };

      if (onUpdateFan) {
        onUpdateFan(fanId, { reacciones: updated });
      }

      return {
        ...prev,
        [fanId]: updated
      };
    });
  };

  const handleReactAnnouncement = (annId: string, type: 'likes' | 'fire' | 'applause' | 'guitars') => {
    setAnnouncements(prev => {
      const updated = prev.map(a => {
        if (a.id === annId) {
          return {
            ...a,
            reacciones: {
              ...a.reacciones,
              [type]: (a.reacciones[type] || 0) + 1
            }
          };
        }
        return a;
      });
      try {
        localStorage.setItem(`bakandeya_community_announcements_${effectiveBandName}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newAnn: BandAnnouncement = {
      id: `ann-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      autor: effectiveBandName,
      titulo: newPostTitle.trim() || 'Comunicado Oficial',
      contenido: newPostContent.trim(),
      fijado: false,
      reacciones: { likes: 1, fire: 1, applause: 0, guitars: 0 }
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    try {
      localStorage.setItem(`bakandeya_community_announcements_${effectiveBandName}`, JSON.stringify(updated));
    } catch {}

    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostModal(false);
  };

  const getFanLevelBadge = (fan: Fan) => {
    const level = fan.nivelFan || (fan.conciertoOrigenId || fan.comoConocio?.toLowerCase().includes('concierto') ? 'superfan' : 'fiel');
    switch (level) {
      case 'fundador':
        return {
          label: 'Fan Fundador',
          icon: Star,
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'superfan':
        return {
          label: 'Superfan Directos',
          icon: Flame,
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400'
        };
      case 'backstage':
        return {
          label: 'Backstage VIP',
          icon: Award,
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400'
        };
      default:
        return {
          label: 'Oyente Fiel',
          icon: Music,
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
    }
  };

  const getRandomGradient = (name: string) => {
    const gradients = [
      'from-amber-600 to-amber-400',
      'from-rose-600 to-amber-500',
      'from-emerald-600 to-teal-400',
      'from-indigo-600 to-purple-400',
      'from-blue-600 to-cyan-400',
      'from-fuchsia-600 to-rose-400'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="space-y-6">
      {/* Pinned / Band Post Box */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {effectiveBandLogo ? (
              <img 
                src={effectiveBandLogo} 
                alt="Logo" 
                className="w-12 h-12 object-contain rounded-xl p-1 bg-slate-950 border border-amber-500/40 shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black font-display text-lg shrink-0">
                {effectiveBandName[0] || 'B'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">Muro Oficial de la Banda</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Megaphone className="w-2.5 h-2.5" /> Oficial
                </span>
              </div>
              <h3 className="text-white font-bold text-base font-display">
                Comunidad & Red Social de {effectiveBandName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Publicar Comunicado
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono font-bold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Fan
            </button>
          </div>
        </div>
      </div>

      {/* Band Announcements Feed */}
      {announcements.map((ann) => (
        <div 
          key={ann.id} 
          className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 space-y-3.5 shadow-md relative group transition hover:border-amber-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{ann.autor}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                    Noticia Banda
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{ann.fecha}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pl-1">
            <h4 className="text-white font-bold text-sm">{ann.titulo}</h4>
            <p className="text-slate-300 text-xs font-sans leading-relaxed whitespace-pre-line">{ann.contenido}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReactAnnouncement(ann.id, 'likes')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>❤️</span>
                <span className="font-bold text-slate-200">{ann.reacciones.likes}</span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, 'fire')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>🔥</span>
                <span className="font-bold text-slate-200">{ann.reacciones.fire}</span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, 'guitars')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>🎸</span>
                <span className="font-bold text-slate-200">{ann.reacciones.guitars}</span>
              </button>
              <button
                onClick={() => handleReactAnnouncement(ann.id, 'applause')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>👏</span>
                <span className="font-bold text-slate-200">{ann.reacciones.applause}</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Fijado en cabecera</span>
          </div>
        </div>
      ))}

      {/* Fan Posts / Shouts Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
            Muro de Fans & Mensajes de la Comunidad ({fans.length})
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {selectedCityFilter ? `Filtrando por: ${selectedCityFilter}` : 'Mostrando todos'}
          </span>
        </div>

        {fans.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-sm">Aún no hay fans en el muro</h4>
            <p className="text-slate-400 text-xs font-mono max-w-sm mx-auto">
              Comparte el código QR o el enlace público de captura en tus conciertos y redes para que tus seguidores se unan a la comunidad.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold rounded-xl transition cursor-pointer"
            >
              Registrar Primer Fan
            </button>
          </div>
        ) : (
          fans.map((fan) => {
            const badge = getFanLevelBadge(fan);
            const BadgeIcon = badge.icon;
            const fanReactions = fanReactionCounts[fan.id] || { likes: 1, fire: 0, applause: 0, guitars: 0 };
            const fanUserReactions = userReactions[fan.id] || {};
            const initialLetter = fan.nombre?.charAt(0)?.toUpperCase() || 'F';
            const gradient = getRandomGradient(fan.nombre || 'fan');

            const defaultMessage = fan.mensaje || (
              fan.comoConocio?.toLowerCase().includes('concierto')
                ? `¡Directo brutal en ${fan.ciudad || 'el concierto'}! Contando los días para el próximo bolo.`
                : `¡Apoyando a ${effectiveBandName} desde ${fan.ciudad || 'las redes'}!`
            );

            return (
              <div 
                key={fan.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3.5 transition-all shadow-sm group"
              >
                {/* Header with Avatar & Details */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold font-display text-base shadow-sm shrink-0`}>
                      {initialLetter}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{fan.nombre}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badge.bg}`}>
                          <BadgeIcon className="w-2.5 h-2.5" />
                          <span>{badge.label}</span>
                        </span>
                        {fan.consentimientoRGPD && (
                          <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-0.5" title="Consentimiento RGPD Verificado">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-0.5">
                        {fan.ciudad && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {fan.ciudad}
                          </span>
                        )}
                        {fan.instagram && (
                          <a 
                            href={`https://instagram.com/${fan.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition"
                          >
                            <Instagram className="w-3 h-3" />
                            @{fan.instagram}
                          </a>
                        )}
                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {fan.fechaCaptura}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`mailto:${fan.email}?subject=¡Un abrazo de ${encodeURIComponent(effectiveBandName)}!`}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition"
                      title="Enviar Email de agradecimiento"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    {onDeleteFan && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${fan.nombre} del Fan Club?`)) {
                            onDeleteFan(fan.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 rounded-lg border border-slate-800 hover:border-rose-500/30 transition opacity-60 group-hover:opacity-100"
                        title="Eliminar Fan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Favorite Song Badge */}
                {fan.cancionFavorita && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-mono text-amber-300">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tema favorito: <strong className="text-white">{fan.cancionFavorita}</strong></span>
                  </div>
                )}

                {/* Fan Post / Message / Shout */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                  <p className="text-slate-200 text-xs font-sans leading-relaxed">
                    "{defaultMessage}"
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                    <span>Origen: {fan.conciertoOrigenNombre ? `Concierto ${fan.conciertoOrigenNombre}` : (fan.comoConocio || 'Fan Club Web')}</span>
                    <span>ID: {fan.id.slice(-6)}</span>
                  </div>
                </div>

                {/* Social Reactions Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, 'likes')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        fanUserReactions.likes 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs font-bold' 
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                      title="Me gusta"
                    >
                      <span>❤️</span>
                      <span>{fanReactions.likes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, 'fire')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        fanUserReactions.fire 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs font-bold' 
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                      title="Fuego / Brutal"
                    >
                      <span>🔥</span>
                      <span>{fanReactions.fire}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, 'guitars')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        fanUserReactions.guitars 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs font-bold' 
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                      title="Púa de Oro / Rock On"
                    >
                      <span>🎸</span>
                      <span>{fanReactions.guitars}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReactFan(fan.id, 'applause')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        fanUserReactions.applause 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs font-bold' 
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                      title="Aplausos"
                    >
                      <span>👏</span>
                      <span>{fanReactions.applause}</span>
                    </button>
                  </div>

                  {/* Level Switcher */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <span className="hidden sm:inline">Nivel:</span>
                    <select
                      value={fan.nivelFan || (fan.conciertoOrigenId ? 'superfan' : 'fiel')}
                      onChange={(e) => {
                        if (onUpdateFan) {
                          onUpdateFan(fan.id, { nivelFan: e.target.value as any });
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-amber-400 font-mono outline-none cursor-pointer"
                    >
                      <option value="fiel">Oyente Fiel</option>
                      <option value="superfan">Superfan</option>
                      <option value="fundador">Fundador</option>
                      <option value="backstage">Backstage VIP</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Announcement Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Publicar Comunicado en el Muro Social
              </h3>
              <button 
                onClick={() => setShowNewPostModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">
                  Título o Titular *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ¡Nuevo single este viernes! / Concierto en Sevilla"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">
                  Mensaje para la Comunidad de Fans *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe las novedades, agradecimiento o anuncio exclusivo para tus seguidores..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-sans resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-mono text-xs font-bold rounded-xl transition hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Publicar en el Muro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
