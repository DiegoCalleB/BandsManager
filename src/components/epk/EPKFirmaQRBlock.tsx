import React, { useState } from 'react';
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
  FileText,
  Code,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig } from '../../types';
import { EPKBlockWrapper } from './EPKBlockWrapper';
import { EPK_BLOCKS, EPKBlockMeta, UNIFIED_PLATFORMS } from './epkBlocks';
import {
  buildEmailSignatureHtml,
  buildEmailSignaturePlainText,
  copyRichSignatureToClipboard
} from '../../utils/emailFormatter';

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
  const [copiadoFirma, setCopiadoFirma] = useState<false | 'rich' | 'html' | 'text'>(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionTab, setInstructionTab] = useState<'gmail' | 'outlook' | 'apple'>('gmail');

  const handleCopyRichSignature = async () => {
    const success = await copyRichSignatureToClipboard({
      epkConfig: config,
      isBakandeya,
      publicEpkUrl
    });
    if (success) {
      setCopiadoFirma('rich');
      setTimeout(() => setCopiadoFirma(false), 3500);
    }
  };

  const handleCopyHtmlCode = async () => {
    const html = buildEmailSignatureHtml({
      epkConfig: config,
      isBakandeya,
      publicEpkUrl
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(html);
      setCopiadoFirma('html');
      setTimeout(() => setCopiadoFirma(false), 3000);
    }
  };

  const handleCopyPlainText = async () => {
    const text = buildEmailSignaturePlainText({
      epkConfig: config,
      isBakandeya,
      publicEpkUrl
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiadoFirma('text');
      setTimeout(() => setCopiadoFirma(false), 3000);
    }
  };
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
                placeholder="Ej: Booking & Management"
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
                placeholder="+34 600 00 00 00"
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
              placeholder="Música en directo, energía y directo arrollador"
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
                      {config.firmaEmail?.nombreRemitente || config.contactoBooking?.nombre || (isBakandeya ? 'Booking & Management' : 'Booking & Management Team')}
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
                  <div className="pt-2 pb-1">
                    <a
                      href={publicEpkUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer group"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>
                        {config.dossierPdfName
                          ? `Ver Dossier Oficial (${config.dossierPdfName})`
                          : 'Ver Dossier Oficial & EPK Online'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
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
              Esta firma se inyecta automáticamente en los correos del CRM y ahora puedes exportarla a tu propio correo.
            </p>

            {/* BOTONES DE COPIADO DE FIRMA */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  id="copy-rich-signature-btn"
                  onClick={handleCopyRichSignature}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    copiadoFirma === 'rich'
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/10'
                  }`}
                  title="Copia la firma visual con fotos, enlaces y formato para pegarla en Gmail, Outlook o Apple Mail"
                >
                  {copiadoFirma === 'rich' ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡Firma Formateada Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Firma Formateada (Gmail / Outlook)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="copy-html-signature-btn"
                    onClick={handleCopyHtmlCode}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      copiadoFirma === 'html'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                    title="Copiar el código fuente HTML puro de la firma"
                  >
                    {copiadoFirma === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiadoFirma === 'html' ? '¡HTML Copiado!' : 'HTML'}</span>
                  </button>

                  <button
                    type="button"
                    id="copy-plain-signature-btn"
                    onClick={handleCopyPlainText}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      copiadoFirma === 'text'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                    title="Copiar versión en texto plano"
                  >
                    {copiadoFirma === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiadoFirma === 'text' ? '¡Texto Copiado!' : 'Texto'}</span>
                  </button>
                </div>
              </div>

              {/* AVISO / TOAST DE ÉXITO */}
              {copiadoFirma && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    {copiadoFirma === 'rich' && (
                      <span><strong>¡Firma visual copiada!</strong> Ahora ve a los ajustes de firma de tu correo (Gmail, Outlook, Apple Mail...) y pulsa <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 font-mono text-[10px]">Ctrl + V</kbd> (o <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 font-mono text-[10px]">Cmd + V</kbd>) para pegarla con todos sus enlaces y logos.</span>
                    )}
                    {copiadoFirma === 'html' && (
                      <span><strong>¡Código HTML copiado!</strong> Puedes pegarlo en clientes de correo o editores que admitan código HTML directo.</span>
                    )}
                    {copiadoFirma === 'text' && (
                      <span><strong>¡Texto plano copiado!</strong> Ideal para clientes en modo texto o terminal.</span>
                    )}
                  </div>
                </div>
              )}

              {/* GUÍA DESPLEGABLE: CÓMO PEGARLA EN TU CORREO */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full text-left py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 text-xs text-slate-400 hover:text-amber-300 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    ¿Cómo ponértela de firma en tu correo electrónico?
                  </span>
                  {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showInstructions && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
                    {/* Tabs de clientes */}
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => setInstructionTab('gmail')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          instructionTab === 'gmail'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔴 Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstructionTab('outlook')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          instructionTab === 'outlook'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔵 Outlook / Microsoft 365
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstructionTab('apple')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          instructionTab === 'apple'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚪ Apple Mail / Mac
                      </button>
                    </div>

                    {/* Contenido según tab */}
                    {instructionTab === 'gmail' && (
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
                        <li>Haz clic arriba en <strong>"Copiar Firma Formateada"</strong>.</li>
                        <li>Abre tu Gmail y pulsa en la rueda de <strong>Ajustes (⚙️)</strong> &gt; <strong>Ver todos los ajustes</strong>.</li>
                        <li>En la pestaña <em>General</em>, baja hasta <strong>Firma</strong> y pulsa en <em>Crear nueva</em> (o edita la actual).</li>
                        <li>Haz clic dentro del recuadro de firma y pulsa <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 text-[10px] font-mono">Ctrl + V</kbd> (o <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 text-[10px] font-mono">Cmd + V</kbd> en Mac).</li>
                        <li>Baja al final de la página de Gmail y pulsa <strong>Guardar cambios</strong>.</li>
                      </ol>
                    )}

                    {instructionTab === 'outlook' && (
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
                        <li>Haz clic arriba en <strong>"Copiar Firma Formateada"</strong>.</li>
                        <li>En Outlook Web o App, entra en <strong>Configuración (⚙️)</strong> &gt; <strong>Correo</strong> &gt; <strong>Redactar y responder</strong>.</li>
                        <li>En <em>Firma de correo electrónico</em>, crea una nueva firma y pega con <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 text-[10px] font-mono">Ctrl + V</kbd>.</li>
                        <li>Haz clic en <strong>Guardar</strong>.</li>
                      </ol>
                    )}

                    {instructionTab === 'apple' && (
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
                        <li>Haz clic arriba en <strong>"Copiar Firma Formateada"</strong>.</li>
                        <li>En la app Mail de Mac, ve al menú superior <strong>Mail</strong> &gt; <strong>Ajustes...</strong> &gt; <strong>Firmas</strong>.</li>
                        <li>Añade una firma con el botón <strong>+</strong> y desmarca la casilla <em>"Usar siempre el tipo de letra predeterminado"</em>.</li>
                        <li>Pega en el editor con <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-300 text-[10px] font-mono">Cmd + V</kbd>.</li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            </div>
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
