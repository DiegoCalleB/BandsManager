import React, { useState } from 'react';
import {
  Smartphone,
  Phone,
  PhoneCall,
  Mail,
  Instagram,
  MapPin,
  Globe,
  Sparkles,
  Calendar,
  DollarSign,
  Percent,
  Edit3,
  Save,
  Undo2,
  Compass,
  TrendingUp,
  Loader2,
  ExternalLink,
  MessageCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Lead, LeadType, Concert } from '../../../types';
import { getWhatsAppUrl, openWhatsAppChat, WHATSAPP_WINDOW_NAME } from '../../../utils/whatsapp';
import { checkBandDateConflict } from '../../../utils/bookingTourContext';
import { Button, IconButton, Input, Select, Textarea } from '../../ui';
import { ShowIcon } from '../../ui/ShowIcon';
import { apiFetch } from '../../../utils/api';

interface VenueProfileColumnProps {
  lead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onFilterByRouteCity?: (city: string) => void;
  bandName?: string;
  concerts?: Concert[];
  onOpenWhatsAppModal: () => void;
  autoDetectVenueAddress?: (venueName: string, city: string) => string;
}

export const VenueProfileColumn: React.FC<VenueProfileColumnProps> = ({
  lead,
  onUpdateLead,
  onFilterByRouteCity,
  bandName,
  concerts = [],
  onOpenWhatsAppModal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({ ...lead });
  const [isEnrichingScout, setIsEnrichingScout] = useState(false);
  const [scoutMsg, setScoutMsg] = useState<string | null>(null);

  // Sync edit form when lead changes
  React.useEffect(() => {
    setEditFormData({ ...lead });
    setIsEditing(false);
    setScoutMsg(null);
  }, [lead.id]);

  const handleSave = () => {
    onUpdateLead(lead.id, editFormData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditFormData({ ...lead });
    setIsEditing(false);
  };

  const handleScoutEnrich = async () => {
    setIsEnrichingScout(true);
    setScoutMsg('Agente Scout consultando web y bases públicas...');
    try {
      const res = await apiFetch(`/api/leads/enrich-lead`, {
        method: 'POST',
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.nombre_sala,
          city: lead.ciudad || 'España',
        }),
      });

      if (res.success && res.data) {
        const d = res.data;
        const updates: Partial<Lead> = {};
        if (d.email && !lead.email_contacto) updates.email_contacto = d.email;
        if (d.phone && !lead.telefono_movil && !lead.telefono) updates.telefono_movil = d.phone;
        if (d.website && !lead.website) updates.website = d.website;
        if (d.capacity && !lead.aforo) updates.aforo = d.capacity;
        if (d.address && !lead.direccion) updates.direccion = d.address;
        if (d.instagram && !lead.instagram) updates.instagram = d.instagram;

        if (Object.keys(updates).length > 0) {
          onUpdateLead(lead.id, updates);
          setScoutMsg(`¡Datos completados: ${Object.keys(updates).join(', ')}!`);
        } else {
          setScoutMsg('La sala ya cuenta con sus datos principales actualizados.');
        }
      } else {
        setScoutMsg('No se encontraron nuevos datos públicos.');
      }
    } catch (err: any) {
      setScoutMsg(`Error en Scout: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsEnrichingScout(false);
    }
  };

  // Tour Date Conflict Check
  const conflictCheck = checkBandDateConflict(
    (lead as any).fecha_posible_evento || lead.fechas_propuestas_sala?.[0] || lead.fechas_libres_detectadas?.[0],
    concerts,
    lead.ciudad
  );

  const cleanInstagramHandle = lead.instagram?.replace(/^@/, '').trim();
  const instagramUrl = lead.instagram
    ? lead.instagram.startsWith('http')
      ? lead.instagram
      : `https://instagram.com/${cleanInstagramHandle}`
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4 bg-[var(--sunken)]/40 border-r border-[var(--hair)]">
      {/* 1. HEADER / QUICK TOGGLE */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--hair)]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--ink-2)]">
            Ficha de la Sala
          </span>
          {lead.tipo && (
            <span className="text-micro font-sans font-semibold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc-soft)] text-[var(--acc-ink)] capitalize">
              {lead.tipo}
            </span>
          )}
        </div>

        <Button
          variant={isEditing ? 'neutral' : 'ghost'}
          size="xs"
          onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
          className="items-center gap-1"
        >
          {isEditing ? (
            <>
              <Undo2 className="w-3.5 h-3.5" />
              <span>Ver ficha</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Editar datos</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. DIRECT ACTION BUTTONS (WHATSAPP, INSTAGRAM, CALL) */}
      <div className="grid grid-cols-2 gap-2">
        {/* WhatsApp Button */}
        {lead.telefono_movil ? (
          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok)]/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-ui cursor-pointer shadow-xs active:scale-95"
            title={`Abrir propuesta para WhatsApp (${lead.telefono_movil})`}
          >
            <MessageCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-ui cursor-pointer"
            title="Escribir propuesta por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        )}

        {/* Instagram Direct Button — Con logo y color reconocible */}
        {instagramUrl ? (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-[var(--r-m)] bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/25 font-bold text-xs flex items-center justify-center gap-1.5 transition-ui cursor-pointer shadow-xs group"
            title={`Visitar Instagram: @${cleanInstagramHandle}`}
          >
            <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">@{cleanInstagramHandle}</span>
            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-ui cursor-pointer"
            title="Añadir Instagram a esta sala"
          >
            <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="truncate">+ Instagram</span>
          </button>
        )}
      </div>

      {/* 3. TOUR ROUTE CONFLICT OR OPPORTUNITY ALERT */}
      {conflictCheck.status === 'conflicto_directo' && (
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/15 border border-[var(--alert)]/30 text-[var(--alert)] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold">Conflicto en agenda de {bandName || 'la banda'}</p>
            <p className="text-micro mt-0.5 opacity-90">{conflictCheck.mensaje}</p>
          </div>
        </div>
      )}

      {conflictCheck.status === 'cercano_compatible' && (
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok-soft)] border border-[var(--ok)]/30 text-[var(--ok)] text-xs flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold">¡Oportunidad de doble fecha en ruta!</p>
            <p className="text-micro mt-0.5 opacity-90">{conflictCheck.mensaje}</p>
          </div>
        </div>
      )}

      {/* 4. EDIT FORM vs VIEW PROFILE */}
      {isEditing ? (
        /* EDIT MODE FORM */
        <div className="space-y-3 p-3.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--hair)]">
            <span className="text-xs font-bold font-sans text-[var(--acc)]">Editar Información</span>
            <div className="flex items-center gap-1.5">
              <Button size="xs" variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="xs" variant="primary" onClick={handleSave} className="items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Nombre</label>
              <Input
                size="sm"
                value={editFormData.nombre_sala || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nombre_sala: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Ciudad</label>
                <Input
                  size="sm"
                  value={editFormData.ciudad || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, ciudad: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Aforo (pax)</label>
                <Input
                  size="sm"
                  type="number"
                  placeholder="Ej: 350"
                  value={editFormData.aforo || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, aforo: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Caché estimado (€)</label>
                <Input
                  size="sm"
                  type="number"
                  placeholder="Ej: 600"
                  value={editFormData.cache_habitual || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cache_habitual: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Taquilla (%)</label>
                <Input
                  size="sm"
                  type="number"
                  placeholder="Ej: 80"
                  value={editFormData.porcentaje_taquilla || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, porcentaje_taquilla: Number(e.target.value) || 0 })}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Email Principal</label>
              <Input
                size="sm"
                type="email"
                placeholder="booking@sala.com"
                value={editFormData.email_contacto || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email_contacto: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Email Secundario</label>
              <Input
                size="sm"
                type="email"
                placeholder="programacion@sala.com"
                value={editFormData.email_secundario || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email_secundario: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-micro font-medium text-[var(--ok)] mb-1 font-bold">Móvil (WhatsApp)</label>
                <Input
                  size="sm"
                  placeholder="600123456"
                  value={editFormData.telefono_movil || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono_movil: e.target.value })}
                  className="w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Teléfono Fijo</label>
                <Input
                  size="sm"
                  placeholder="912345678"
                  value={editFormData.telefono_fijo || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono_fijo: e.target.value })}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-medium text-pink-500 mb-1 font-bold">Instagram (@handle o URL)</label>
              <Input
                size="sm"
                placeholder="@salacapitol"
                value={editFormData.instagram || ''}
                onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Dirección física</label>
              <Input
                size="sm"
                placeholder="Calle Mayor 12, 28013 Madrid"
                value={editFormData.direccion || ''}
                onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Sitio Web</label>
              <Input
                size="sm"
                placeholder="https://..."
                value={editFormData.website || ''}
                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-micro font-medium text-[var(--ink-2)] mb-1">Notas privadas del programador</label>
              <Textarea
                rows={3}
                placeholder="Ej: Tratar con Carlos. Suelen programar los jueves y viernes..."
                value={editFormData.notas || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notas: e.target.value })}
                className="w-full text-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE CARD */
        <div className="space-y-3.5">
          {/* Contact Details Card */}
          <div className="p-3.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] space-y-2.5 text-xs">
            <span className="text-micro font-bold font-sans uppercase tracking-wider text-[var(--ink-2)] block">
              Datos de contacto
            </span>

            {/* Email principal */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span>Email:</span>
              </span>
              {lead.email_contacto ? (
                <a
                  href={`mailto:${lead.email_contacto}`}
                  className="font-medium text-[var(--ink)] hover:text-[var(--acc)] transition-colors truncate max-w-[200px]"
                  title={lead.email_contacto}
                >
                  {lead.email_contacto}
                </a>
              ) : (
                <span className="text-[var(--ink-2)] italic opacity-60">Sin email</span>
              )}
            </div>

            {/* Email secundario si existe */}
            {lead.email_secundario && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[var(--acc-ink)] shrink-0" />
                  <span>Email 2:</span>
                </span>
                <a
                  href={`mailto:${lead.email_secundario}`}
                  className="font-medium text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors truncate max-w-[200px]"
                  title={lead.email_secundario}
                >
                  {lead.email_secundario}
                </a>
              </div>
            )}

            {/* Móvil / WhatsApp */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                <span>Móvil:</span>
              </span>
              {lead.telefono_movil ? (
                <a
                  href={`tel:${lead.telefono_movil}`}
                  className="font-mono font-medium text-[var(--ink)] hover:text-[var(--ok)] transition-colors"
                >
                  {lead.telefono_movil}
                </a>
              ) : (
                <span className="text-[var(--ink-2)] italic opacity-60">Sin móvil</span>
              )}
            </div>

            {/* Fijo */}
            {lead.telefono_fijo && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  <span>Fijo:</span>
                </span>
                <a
                  href={`tel:${lead.telefono_fijo}`}
                  className="font-mono font-medium text-[var(--ink)] hover:text-[var(--acc)] transition-colors"
                >
                  {lead.telefono_fijo}
                </a>
              </div>
            )}

            {/* Dirección */}
            <div className="flex items-start justify-between gap-2 pt-1 border-t border-[var(--hair)]">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5 shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span>Dirección:</span>
              </span>
              {lead.direccion ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${lead.nombre_sala} ${lead.direccion} ${lead.ciudad || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-right text-[var(--ink)] hover:text-[var(--acc)] transition-colors truncate max-w-[190px] block"
                  title={lead.direccion}
                >
                  {lead.direccion}
                </a>
              ) : (
                <span className="text-[var(--ink-2)] italic opacity-60">Sin dirección</span>
              )}
            </div>

            {/* Sitio Web */}
            {lead.website && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--ink-2)] flex items-center gap-1.5 shrink-0">
                  <Globe className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                  <span>Web:</span>
                </span>
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--acc)] hover:underline transition-colors truncate max-w-[190px]"
                >
                  {lead.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* Economics & Capacity Card */}
          <div className="p-3.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-micro font-medium text-[var(--ink-2)] block">Aforo</span>
              <span className="text-sm font-bold font-mono text-[var(--ink)] mt-0.5 block">
                {lead.aforo ? `${lead.aforo} personas` : 'Sin aforo'}
              </span>
            </div>

            <div>
              <span className="text-micro font-medium text-[var(--ink-2)] block">Caché / Oferta</span>
              <span className="text-sm font-bold font-mono text-[var(--acc)] mt-0.5 block">
                {lead.cache_habitual ? `${lead.cache_habitual} €` : 'A negociar'}
              </span>
            </div>
          </div>

          {/* Notes Card */}
          {lead.notas && (
            <div className="p-3.5 bg-[var(--surface)] rounded-[var(--r-m)] border border-[var(--hair)] space-y-1 text-xs">
              <span className="text-micro font-bold font-sans uppercase tracking-wider text-[var(--ink-2)] block">
                Notas del programador
              </span>
              <p className="text-[var(--ink)] whitespace-pre-wrap leading-relaxed">{lead.notas}</p>
            </div>
          )}

          {/* Scout Enricher Button */}
          <div className="pt-1">
            <Button
              variant="neutral"
              size="xs"
              onClick={handleScoutEnrich}
              disabled={isEnrichingScout}
              className="w-full items-center justify-center gap-1.5"
              title="El Scout busca automáticamente emails, teléfonos y dirección en internet"
            >
              {isEnrichingScout ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>{isEnrichingScout ? 'Buscando datos con IA...' : 'Completar datos con Agente Scout'}</span>
            </Button>

            {scoutMsg && (
              <p className="text-micro font-sans text-[var(--ink-2)] mt-1.5 text-center animate-in fade-in duration-100">
                {scoutMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
