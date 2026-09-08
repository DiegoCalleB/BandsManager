import React from 'react';
import {
  AtSign,
  Mail,
  Music,
  FileDown,
  Sparkles,
  QrCode,
  Copy,
  ExternalLink,
  Check,
  Share2,
  FileText
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig } from '../../types';
import { EPKBlockWrapper } from './EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta, UNIFIED_PLATFORMS } from './epkBlocks';

interface EPKFirmaQRBlockProps {
  config: EPKConfig;
  setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
  publicEpkUrl: string;
  isBakandeya?: boolean;
  handleCopyUrl: () => void;
  copiado: boolean;
  onNavigateToBlock?: (blockId: any) => void;
  prevBlock?: EPKBlockMeta | null;
  nextBlock?: EPKBlockMeta | null;
  onNavigate?: (blockId: any) => void;
  onSave?: () => void;
  isAllView?: boolean;
}

export const EPKFirmaQRBlock: React.FC<EPKFirmaQRBlockProps> = ({
  config,
  setConfig,
  publicEpkUrl,
  isBakandeya = false,
  handleCopyUrl,
  copiado,
  onNavigateToBlock,
  prevBlock,
  nextBlock,
  onNavigate,
  onSave,
  isAllView = false
}) => {
  return (
    <EPKBlockWrapper
      meta={EPK_BLOCKS[5]}
      prevBlock={prevBlock}
      nextBlock={nextBlock}
      onNavigate={onNavigate}
      onSave={onSave}
      isAllView={isAllView}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONFIGURACIÓN DE FIRMA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
              <AtSign className="w-5 h-5" /> Configurar Firma de Correo
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              HTML Automático
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Nombre del Remitente</label>
              <input
                type="text"
                value={config.firmaEmail?.nombreRemitente || ''}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), nombreRemitente: e.target.value }
                  })
                }
                placeholder="Ej: Diego & Filgue"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Cargo / Puesto</label>
              <input
                type="text"
                value={config.firmaEmail?.cargo || ''}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), cargo: e.target.value }
                  })
                }
                placeholder="Ej: Booking & Management Team"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Teléfono de Contacto</label>
              <input
                type="text"
                value={config.firmaEmail?.telefono || ''}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), telefono: e.target.value }
                  })
                }
                placeholder="+34 652 93 85 21"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Email Oficial</label>
              <input
                type="email"
                value={config.firmaEmail?.email || ''}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), email: e.target.value }
                  })
                }
                placeholder="booking@tubanda.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Lema / Pie de Firma</label>
            <p className="text-[11px] text-slate-500">
              Una frase corta que sale al pie de los emails y también como subtítulo en el EPK.
            </p>
            <input
              type="text"
              value={config.firmaEmail?.textoPie || ''}
              onChange={e =>
                setConfig({
                  ...config,
                  firmaEmail: { ...(config.firmaEmail || {}), textoPie: e.target.value }
                })
              }
              placeholder="Bakandeya — Electrónica-Fusión & Balkan Ska Directo"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          {/* OPCIONES DE INCLUSIÓN */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
              <input
                type="checkbox"
                checked={config.firmaEmail?.incluirIconosRedes ?? true}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), incluirIconosRedes: e.target.checked }
                  })
                }
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-white">Incluir iconos de plataformas musicales y redes</p>
                <p className="text-[11px] text-slate-400">
                  Añade enlaces directos a Spotify, Instagram, YouTube, etc.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
              <input
                type="checkbox"
                checked={config.firmaEmail?.adjuntarDossierPorDefecto ?? true}
                onChange={e =>
                  setConfig({
                    ...config,
                    firmaEmail: {
                      ...(config.firmaEmail || {}),
                      adjuntarDossierPorDefecto: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-white">Adjuntar enlace al Dossier EPK en la firma</p>
                <p className="text-[11px] text-slate-400">
                  Incluye el botón con enlace al Dossier interactivo en cada propuesta redactada.
                </p>
              </div>
            </label>
          </div>

          {/* REDES VINCULADAS */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Redes enlazadas
              </span>
              {onNavigateToBlock && (
                <button
                  type="button"
                  onClick={() => onNavigateToBlock('perfil')}
                  className="px-2 py-0.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 rounded border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> Editar en Bloque 1
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {Object.entries(config.enlacesRedes || {})
                .filter(([_, url]) => Boolean(url && String(url).trim()))
                .map(([key]) => {
                  const platform = UNIFIED_PLATFORMS.find(p => p.key === key);
                  return (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                    >
                      <span>{platform?.icon || '🔗'}</span>
                      <span className="font-semibold">{platform?.label || key}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        </div>

        {/* VISTA PREVIA EN VIVO DE LA FIRMA & QR */}
        <div className="space-y-6">
          {/* VISTA PREVIA EN VIVO DE LA FIRMA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Vista Previa de la Firma
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Renderizado Email</span>
            </div>

            <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md space-y-3 font-sans text-xs">
              <p className="text-slate-400 italic text-[11px] pb-2 border-b border-slate-100">
                ... [Cuerpo del correo redactado para la sala o festival] ...
              </p>

              <div className="pt-1 space-y-2">
                <div className="flex items-start gap-3">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-contain shrink-0"
                    />
                  ) : isBakandeya ? (
                    <img
                      src="/logo_bakandeya_bueno_sin_fondo.png"
                      alt="Bakandeya Logo"
                      className="w-10 h-10 rounded-lg object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold shrink-0">
                      <Music className="w-5 h-5 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                      {config.firmaEmail?.nombreRemitente || config.contactoBooking?.nombre || 'Diego & Filgue'}
                    </h4>
                    <p className="text-slate-600 font-medium text-xs truncate">
                      {config.firmaEmail?.cargo || 'Booking & Management Team'}
                    </p>
                    {config.firmaEmail?.textoPie && (
                      <p className="text-slate-500 text-[11px] italic truncate">
                        {config.firmaEmail.textoPie}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                      {config.firmaEmail?.telefono && <span>{config.firmaEmail.telefono}</span>}
                      {config.firmaEmail?.telefono && config.firmaEmail?.email && (
                        <span className="text-slate-300">•</span>
                      )}
                      {config.firmaEmail?.email && (
                        <span className="text-sky-600 font-medium">{config.firmaEmail.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                {(config.firmaEmail?.adjuntarDossierPorDefecto ?? true) && (
                  <div className="pt-1 text-xs">
                    <a
                      href={publicEpkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold underline transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>
                        {config.dossierPdfName
                          ? `Dossier Oficial & Rider (${config.dossierPdfName})`
                          : 'Dossier Oficial & Kit de Prensa'}
                      </span>
                    </a>
                  </div>
                )}

                {/* ENLACES A REDES SOCIALES CON LOGOS OFICIALES */}
                {(config.firmaEmail?.incluirIconosRedes ?? true) && (() => {
                  const combinedRedes: Record<string, string> = {
                    ...(isBakandeya ? {
                      instagram: 'https://instagram.com/bakandeya_oficial',
                      youtube: 'https://youtube.com/@bakandeya_oficial',
                      tiktok: 'https://tiktok.com/@bakandeya_oficial'
                    } : {}),
                    ...(config.enlacesRedes || {}),
                    ...(config.firmaEmail?.redesSociales || {})
                  };

                  const badgesMap: Record<string, { label: string; badgeUrl: string }> = {
                    instagram: {
                      label: 'Instagram',
                      badgeUrl: 'https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white'
                    },
                    facebook: {
                      label: 'Facebook',
                      badgeUrl: 'https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white'
                    },
                    tiktok: {
                      label: 'TikTok',
                      badgeUrl: 'https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white'
                    },
                    youtube: {
                      label: 'YouTube',
                      badgeUrl: 'https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white'
                    },
                    spotify: {
                      label: 'Spotify',
                      badgeUrl: 'https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white'
                    },
                    applemusic: {
                      label: 'Apple Music',
                      badgeUrl: 'https://img.shields.io/badge/Apple_Music-FA243C?style=for-the-badge&logo=apple-music&logoColor=white'
                    },
                    bandcamp: {
                      label: 'Bandcamp',
                      badgeUrl: 'https://img.shields.io/badge/Bandcamp-629AA9?style=for-the-badge&logo=bandcamp&logoColor=white'
                    },
                    website: {
                      label: 'Web Oficial',
                      badgeUrl: 'https://img.shields.io/badge/Web-475569?style=for-the-badge&logo=google-chrome&logoColor=white'
                    },
                    whatsapp: {
                      label: 'WhatsApp',
                      badgeUrl: 'https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white'
                    },
                    twitter: {
                      label: 'X / Twitter',
                      badgeUrl: 'https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white'
                    }
                  };

                  const filteredEntries = Object.entries(combinedRedes)
                    .filter(([net, url]) => url && String(url).trim() !== '' && !['revolut', 'paypal', 'bizum', 'iban', 'cash'].includes(net.toLowerCase()));

                  if (filteredEntries.length === 0) return null;

                  return (
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      {filteredEntries.map(([net, url]) => {
                        const cleanNet = net.toLowerCase();
                        const badgeInfo = badgesMap[cleanNet] || {
                          label: net,
                          badgeUrl: `https://img.shields.io/badge/${encodeURIComponent(net)}-475569?style=for-the-badge`
                        };

                        const rawUrl = String(url || '');
                        const href = rawUrl.startsWith('http') || rawUrl.startsWith('+')
                          ? (rawUrl.startsWith('+') ? `https://wa.me/${rawUrl.replace(/\+/g, '')}` : rawUrl)
                          : `https://${rawUrl}`;

                        return (
                          <a
                            key={net}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block transition-transform hover:scale-105"
                            title={badgeInfo.label}
                          >
                            <img
                              src={badgeInfo.badgeUrl}
                              alt={badgeInfo.label}
                              className="h-5 rounded object-contain shadow-xs"
                            />
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Esta firma se inyecta automáticamente en los correos redactados por la IA o enviados desde el CRM.
            </p>
          </div>

          {/* CÓDIGO QR OFICIAL DEL EPK */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Código QR Oficial del Dossier
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Difusión Rápida</span>
            </div>

            <p className="text-xs text-slate-400 text-left">
              QR directo a vuestro dossier público para incluir en cartelería, carpetas físicas de prensa o tarjetas de contacto.
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-amber-500">
              <QRCode value={publicEpkUrl} size={150} />
            </div>

            <div className="space-y-2 text-left">
              <p className="text-xs font-mono text-amber-300 bg-slate-950 py-2 px-3 rounded-xl border border-slate-800 truncate">
                {publicEpkUrl}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex-1 px-3 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition cursor-pointer"
                >
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? '¡Copiado!' : 'Copiar Enlace'}
                </button>
                <a
                  href={publicEpkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-800 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Dossier
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EPKBlockWrapper>
  );
};
