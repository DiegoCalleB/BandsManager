/**
 * Server-side email template generator and signature cleaner.
 * Ensures all emails dispatched or drafted by agents have the exact
 * rich visual HTML signature matching the EPK Manager design.
 */

export function cleanTrailingPitchSignature(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip markdown trailing hr separators (e.g. ---, ___, ===)
  cleaned = cleaned.replace(/\n\s*[-—_=]{3,}\s*$/g, '').trim();

  // Strip redundant trailing signature blocks with contact details (names, roles, phones, emails)
  const signOffPatterns = [
    /\n+(?:(?:¡?Un saludo(?: cordial)?!?|Atentamente,?|Cordialmente,?|¡?Un (?:fuerte )?abrazo!?|Saludos cordiales,?|Quedamos a vuestra (?:entera )?disposici[oó]n\.?))\s*\n+([\s\S]*)$/i,
    /\n+(?:(?:Booking\s*&\s*Management|Management|Equipo de Booking|Booking Team)[\s\S]*)$/i,
    /\n+(?:(?:📞|📱|✉️|Email:|Tel:|\+34|\b[\w.-]+@[\w.-]+\.\w+\b)[\s\S]*)$/i
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
  const logoUrl = epkConfig?.logoUrl || epkConfig?.logo_url || (isBakandeya ? 'https://bands-manager.up.railway.app/logo_bakandeya_bueno_sin_fondo.png' : '');

  const cleanBandIdStr = bandId.replace(/^(band|reg)-/, '').toLowerCase();
  const webEpkUrl = `https://bands-manager.up.railway.app/epk?band=${encodeURIComponent(bandId.startsWith('band-') ? bandId : `band-${cleanBandIdStr}`)}`;

  const enlaces = epkConfig?.enlacesRedes || epkConfig?.enlaces_redes || {};

  // Build clean, elegant social media links (textual with middle dot, strictly NO payment platforms)
  const socialLinksList: Array<{ net: string; label: string; url: string }> = [
    { net: 'spotify', label: 'Spotify', url: enlaces.spotify || '' },
    { net: 'instagram', label: 'Instagram', url: enlaces.instagram || '' },
    { net: 'youtube', label: 'YouTube', url: enlaces.youtube || '' },
    { net: 'tiktok', label: 'TikTok', url: enlaces.tiktok || '' },
    { net: 'appleMusic', label: 'Apple Music', url: enlaces.appleMusic || '' },
    { net: 'bandcamp', label: 'Bandcamp', url: enlaces.bandcamp || '' },
    { net: 'website', label: 'Web Oficial', url: enlaces.website || '' },
    { net: 'facebook', label: 'Facebook', url: enlaces.facebook || '' },
    { net: 'whatsapp', label: 'WhatsApp', url: (enlaces as any).whatsapp ? `https://wa.me/${String((enlaces as any).whatsapp).replace(/[^0-9]/g, '')}` : '' }
  ].filter(item => item.url && String(item.url).trim() !== '');

  const activeSocialLinksHtml = ((firma.incluirIconosRedes ?? true) && socialLinksList.length > 0)
    ? socialLinksList
        .map(b => {
          const raw = String(b.url).trim();
          const href = raw.startsWith('http') ? raw : `https://${raw}`;
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #64748b; text-decoration: underline; font-size: 12px; font-weight: 500;">${b.label}</a>`;
        })
        .join(' <span style="color: #cbd5e1; font-size: 11px;">•</span> ')
    : '';

  const adjuntarDossier = (firma.adjuntarDossierPorDefecto ?? true);
  const dossierLabel = dossierPdfName ? `Dossier Oficial & Rider (${dossierPdfName})` : 'Dossier Oficial & Kit de Prensa';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; background-color: #ffffff; margin: 0; padding: 12px;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff;">
    
    <!-- PITCH TEXT -->
    <div style="font-size: 15px; color: #1e293b; line-height: 1.6;">
      ${htmlBodyParagraphs}
    </div>

    <!-- NATURAL ORGANIC SIGNATURE -->
    <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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

      ${adjuntarDossier ? `
      <div style="margin-top: 10px; font-size: 12px;">
        📁 <a href="${webEpkUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; font-weight: 600;">${dossierLabel}</a>
      </div>
      ` : ''}

      ${activeSocialLinksHtml ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dotted #e2e8f0; font-size: 12px; color: #64748b;">
        ${activeSocialLinksHtml}
      </div>
      ` : ''}
    </div>

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
