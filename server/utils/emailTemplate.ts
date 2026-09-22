/**
 * Server-side email template generator and signature cleaner.
 * Ensures all emails dispatched or drafted by agents have the exact
 * rich visual HTML signature matching the EPK Manager design.
 */

import { generateTrackingToken } from '../routes/tracking.js';
import { getHashedPublicEpkUrl } from './bandHash.js';

export function cleanTrailingPitchSignature(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip markdown trailing hr separators (e.g. ---, ___, ===)
  cleaned = cleaned.replace(/\n\s*[-—_=]{3,}\s*$/g, '').trim();

  // Strip redundant trailing signature blocks with contact details (names, roles, phones, emails)
  const signOffPatterns = [
    /\n+(?:(?:¡?Un saludo(?: cordial)?!?|Atentamente,?|Cordialmente,?|¡?Un (?:fuerte )?abrazo!?|Saludos cordiales,?|Quedamos a vuestra (?:entera )?disposici[oó]n\.?))\s*\n+([\s\S]*)$/i,
    /\n+(?:(?:Booking\s*&\s*Management|Management|Equipo de Booking|Booking Team|Bakandeya Management|Equipo de Comunicación|Músicos de \w+)[\s\S]*)$/i,
    /\n+(?:(?:📞|📱|✉️|Email:|Tel:|\+34|\b[\w.-]+@[\w.-]+\.\w+\b)[\s\S]*)$/i,
    /\n+(?:--\s*\n[\s\S]*)$/i
  ];

  for (const pat of signOffPatterns) {
    const match = cleaned.match(pat);
    if (match) {
      const idx = cleaned.lastIndexOf(match[0]);
      const signOffWord = match[0].split('\n').map(s => s.trim()).filter(Boolean)[0];
      const isPureSignOff = /^(¡?Un saludo|Atentamente|Cordialmente|¡?Un fuerte abrazo|Saludos)/i.test(signOffWord || '');
      cleaned = cleaned.substring(0, idx).trim() + (isPureSignOff ? `\n\n${signOffWord}` : '');
    }
  }

  // Remove trailing email/telephone links or placeholders
  cleaned = cleaned.replace(/\n+\s*(?:Tel|Email|Web|Dossier|Spotify|YouTube|Instagram):.*$/gim, '').trim();

  return cleaned.trim();
}

export function buildServerEmailHtml(params: {
  pitchText: string;
  bandName: string;
  bandId: string;
  epkConfig?: any;
  lead?: any;
}): { html: string; text: string; cleanPitch: string } {
  const { pitchText, bandName, bandId, epkConfig, lead } = params;

  const isBakandeya = bandName.toLowerCase().includes('bakandeya') || bandId.includes('bakandeya');
  const defaultEmail = isBakandeya ? 'bakandeya@gmail.com' : `${bandName.toLowerCase().replace(/[^a-z0-9]/g, '')}@booking.com`;
  const defaultPhone = isBakandeya ? '+34 652 938 521' : '+34 600 000 000';

  const cleanPitch = cleanTrailingPitchSignature(pitchText || '');
  const isAlreadyHtml = cleanPitch.startsWith('<') || cleanPitch.startsWith('<!DOCTYPE');

  const htmlBodyParagraphs = isAlreadyHtml
    ? cleanPitch
    : cleanPitch
        .split('\n\n')
        .map((paragraph) => {
          const escaped = paragraph
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #1e293b; font-size: 15px;">${escaped.replace(/\n/g, '<br>')}</p>`;
        })
        .join('');

  const firma = epkConfig?.firmaEmail || epkConfig?.firma_email || {};
  const booking = epkConfig?.contactoBooking || epkConfig?.contacto_booking || {};

  const remitenteNombre =
    firma.nombreRemitente ||
    booking.nombre ||
    (isBakandeya ? 'Bakandeya Management' : 'Equipo de Booking');

  const cargo = firma.cargo || `Booking & Management | ${bandName}`;
  const textoPie = firma.textoPie || (isBakandeya ? 'Electrobasureo: ska-balkan y mestizaje sobre percusión reciclada y electrónica' : '');
  const telefono = firma.telefono || booking.telefono || defaultPhone;
  const email = firma.email || booking.email || defaultEmail;

  const dossierPdfName = epkConfig?.dossierPdfName || epkConfig?.dossier_pdf_name || 'Dossier Bakandeya.pdf';
  const logoUrl = epkConfig?.logoUrl || epkConfig?.logo_url || (isBakandeya ? 'https://bandmanager.io/logo_bakandeya_bueno_sin_fondo.png' : '');

  const appBaseUrl = process.env.APP_URL || 'https://bandmanager.io';
  const rawWebEpkUrl = getHashedPublicEpkUrl(bandId, appBaseUrl);
  let trackingPixelHtml = '';
  let webEpkUrl = rawWebEpkUrl;

  if (lead?.id) {
    try {
      const trackingToken = generateTrackingToken({ leadId: lead.id, bandId });
      const pixelUrl = `${appBaseUrl.replace(/\/$/, '')}/api/tracking/open?t=${encodeURIComponent(trackingToken)}`;
      trackingPixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;outline:none;" alt="" />`;
      
      const clickRedirectUrl = `${appBaseUrl.replace(/\/$/, '')}/api/tracking/click?t=${encodeURIComponent(trackingToken)}&url=${encodeURIComponent(rawWebEpkUrl)}`;
      webEpkUrl = clickRedirectUrl;
    } catch {
      // Fallback seguro si falla la firma del token
    }
  }

  const enlaces = epkConfig?.enlacesRedes || epkConfig?.enlaces_redes || {};

  // Build clean, elegant social media links with official icons for Instagram, Facebook, TikTok
  const socialIconsMap: Record<string, { iconSvg: string; label: string; color: string; bg: string }> = {
    instagram: {
      iconSvg: 'https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white',
      label: 'Instagram',
      color: '#E4405F',
      bg: '#fdf2f8'
    },
    facebook: {
      iconSvg: 'https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white',
      label: 'Facebook',
      color: '#1877F2',
      bg: '#eff6ff'
    },
    tiktok: {
      iconSvg: 'https://img.shields.io/badge/TikTok-000000?style=for-the-badge&logo=tiktok&logoColor=white',
      label: 'TikTok',
      color: '#000000',
      bg: '#f8fafc'
    },
    spotify: {
      iconSvg: 'https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white',
      label: 'Spotify',
      color: '#1DB954',
      bg: '#f0fdf4'
    },
    youtube: {
      iconSvg: 'https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white',
      label: 'YouTube',
      color: '#FF0000',
      bg: '#fef2f2'
    },
    website: {
      iconSvg: 'https://img.shields.io/badge/Web-475569?style=for-the-badge&logo=google-chrome&logoColor=white',
      label: 'Web Oficial',
      color: '#475569',
      bg: '#f1f5f9'
    }
  };

  const socialLinksList: Array<{ net: string; label: string; url: string; badgeUrl: string; color: string }> = [
    { net: 'instagram', label: 'Instagram', url: enlaces.instagram || '', badgeUrl: socialIconsMap.instagram.iconSvg, color: socialIconsMap.instagram.color },
    { net: 'facebook', label: 'Facebook', url: enlaces.facebook || '', badgeUrl: socialIconsMap.facebook.iconSvg, color: socialIconsMap.facebook.color },
    { net: 'tiktok', label: 'TikTok', url: enlaces.tiktok || '', badgeUrl: socialIconsMap.tiktok.iconSvg, color: socialIconsMap.tiktok.color },
    { net: 'spotify', label: 'Spotify', url: enlaces.spotify || '', badgeUrl: socialIconsMap.spotify.iconSvg, color: socialIconsMap.spotify.color },
    { net: 'youtube', label: 'YouTube', url: enlaces.youtube || '', badgeUrl: socialIconsMap.youtube.iconSvg, color: socialIconsMap.youtube.color },
    { net: 'website', label: 'Web Oficial', url: enlaces.website || '', badgeUrl: socialIconsMap.website.iconSvg, color: socialIconsMap.website.color }
  ].filter(item => item.url && String(item.url).trim() !== '');

  const activeSocialLinksHtml = ((firma.incluirIconosRedes ?? true) && socialLinksList.length > 0)
    ? `
      <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        ${socialLinksList.map(b => {
          const raw = String(b.url).trim();
          const href = raw.startsWith('http') ? raw : `https://${raw}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none; margin-right: 6px; margin-bottom: 4px;">
            <img src="${b.badgeUrl}" alt="${b.label}" height="20" style="height: 20px; border-radius: 4px; display: inline-block; vertical-align: middle;" />
          </a>`;
        }).join('')}
      </div>
    `
    : '';

  const adjuntarDossier = (firma.adjuntarDossierPorDefecto ?? true);
  const dossierLabel = 'Dossier Oficial & Kit de Prensa';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; background-color: #ffffff; margin: 0; padding: 12px;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff;">
    
    <!-- PITCH TEXT (SIN DOBLE FIRMA) -->
    <div style="font-size: 15px; color: #1e293b; line-height: 1.6;">
      ${htmlBodyParagraphs}
    </div>

    <!-- FIRMA ÚNICA CON DOSSIER Y REDES OFICIALES -->
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      
      ${adjuntarDossier ? `
      <!-- BOTÓN DESTACADO DOSSIER OFICIAL -->
      <div style="margin-bottom: 14px;">
        <a href="${webEpkUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 6px; letter-spacing: 0.2px;">
          📄 Ver ${dossierLabel}
        </a>
      </div>
      ` : ''}

      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr>
          ${logoUrl ? `
          <td valign="top" style="padding-right: 12px; width: 48px;">
            <img src="${logoUrl}" alt="${bandName}" width="44" height="44" style="width: 44px; height: 44px; border-radius: 8px; object-fit: contain; display: block;" />
          </td>
          ` : ''}
          <td valign="top">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; line-height: 1.3;">
              ${remitenteNombre}
            </div>
            <div style="color: #475569; font-size: 12px; font-weight: 500; margin-top: 2px;">
              ${cargo}
            </div>
            ${textoPie ? `
            <div style="color: #64748b; font-size: 11px; margin-top: 3px; font-style: italic;">
              ${textoPie}
            </div>
            ` : ''}
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
              ${telefono ? `<span><a href="tel:${telefono.replace(/\s+/g, '')}" style="color: #475569; text-decoration: none;">${telefono}</a></span>` : ''}
              ${telefono && email ? ` &nbsp;•&nbsp; ` : ''}
              ${email ? `<span><a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a></span>` : ''}
            </div>
          </td>
        </tr>
      </table>

      ${activeSocialLinksHtml}
    </div>

    ${trackingPixelHtml}
  </div>
</body>
</html>`.trim();

  const text = `
${cleanPitch}

--
${remitenteNombre}
${cargo}
${textoPie ? `${textoPie}\n` : ''}Tel: ${telefono} | Email: ${email}
${adjuntarDossier ? `Dossier: ${webEpkUrl}` : ''}
`.trim();

  return { html, text, cleanPitch };
}

/**
 * Plantilla de email rica para notificaciones de calendario, ensayos y eventos.
 * Diseñada para enviarse desde no-reply@bandmanager.io identificando prioritariamente a la BANDA.
 */
export function buildBandNotificationEmailHtml(params: {
  bandName: string;
  eventLabel: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  recipientMembers?: string[];
  customNotes?: string;
  setlistSummary?: string;
  appUrl?: string;
}): string {
  const {
    bandName,
    eventLabel,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    recipientMembers = [],
    customNotes,
    setlistSummary,
    appUrl = process.env.APP_URL || 'https://bandmanager.io'
  } = params;

  const eventBadgeColor =
    eventLabel.toLowerCase() === 'concierto'
      ? '#ef4444'
      : eventLabel.toLowerCase() === 'ensayo'
      ? '#3b82f6'
      : '#8b5cf6';

  const memberListText = recipientMembers.length > 0 ? recipientMembers.join(', ') : 'Toda la banda';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio BandManager - ${bandName}</title>
</head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 24px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- HEADER BRANDING -->
    <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); padding: 24px; text-align: center; border-bottom: 1px solid #27272a;">
      <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
        BandManager<span style="color: #3b82f6;">.io</span>
      </div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-top: 4px; font-family: monospace;">
        Notificación de Calendario & Ensayos
      </div>
    </div>

    <!-- MAIN BAND HIGHLIGHT CARD (IDENTIFICACIÓN PRIMARIA DE LA BANDA) -->
    <div style="padding: 24px;">
      
      <!-- IDENTIFICADOR DESTACADO DE BANDA -->
      <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
        <div style="font-size: 11px; text-transform: uppercase; font-family: monospace; color: #60a5fa; font-weight: 700; letter-spacing: 0.5px;">
          🎸 BANDA / GRUPO
        </div>
        <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 2px;">
          ${bandName}
        </div>
        <div style="display: inline-block; background-color: ${eventBadgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 8px; font-family: monospace; text-transform: uppercase;">
          ${eventLabel}: ${eventTitle}
        </div>
      </div>

      <!-- DETALLES DEL EVENTO -->
      <div style="font-size: 15px; font-weight: 600; color: #e4e4e7; margin-bottom: 12px;">
        📌 Detalles de la citación:
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4d4d8;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; width: 130px; color: #a1a1aa; font-weight: 600;">📅 Fecha:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #ffffff; font-weight: 700;">${eventDate}${eventTime ? ` a las <span style="color: #60a5fa;">${eventTime}</span>` : ''}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-weight: 600;">📍 Lugar / Ubicación:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #f4f4f5;">${eventLocation || 'Por determinar'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-weight: 600;">👥 Convocados:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #f4f4f5;">${memberListText}</td>
        </tr>
        ${customNotes ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-weight: 600; vertical-align: top;">📝 Notas / Tareas:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #fde047; font-weight: 500; line-height: 1.5;">${customNotes.replace(/\n/g, '<br>')}</td>
        </tr>
        ` : ''}
        ${setlistSummary ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-weight: 600; vertical-align: top;">🎵 Repertorio / Setlist:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #27272a; color: #38bdf8; font-weight: 500;">${setlistSummary}</td>
        </tr>
        ` : ''}
      </table>

      <!-- CALL TO ACTION -->
      <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
        <a href="${appUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-family: sans-serif;">
          Abrir Calendario en BandManager.io
        </a>
      </div>

    </div>

    <!-- FOOTER NO-REPLY -->
    <div style="background-color: #09090b; padding: 16px 24px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a;">
      Notificación automática del sistema para los miembros de <strong>${bandName}</strong>.<br>
      Correo enviado desde <span style="color: #a1a1aa;">no-reply@bandmanager.io</span>. Por favor no respondas a este correo.
    </div>

  </div>
</body>
</html>
  `.trim();
}
