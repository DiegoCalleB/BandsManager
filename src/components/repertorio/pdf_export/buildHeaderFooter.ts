/**
 * Cabecera (logo, título, métricas) y pie (QR y marca) de cada hoja impresa.
 * Extraído de printDocumentBuilder.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Setlist } from "../../../types";
import { escapeHtml } from "../../../utils/escapeHtml";
import { buildQrSvg } from "../../../utils/qrSvg";
import { BandMemberOption } from "../../../utils/repertorioUtils";
import { cleanSetlistName } from "../../../utils/setlistNoteText";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface buildHeaderFooterParams {
  membersToExport: BandMemberOption[];
  isCentered: boolean;
  showBandLogo: boolean;
  customLogoUrl: string;
  bandName: string;
  activeSetlist: Setlist;
  showAppBranding: boolean;
}

/**
 * Cabecera (logo, título, métricas) y pie (QR y marca) de cada hoja impresa.
 * @param params Estado y callbacks del contenedor ({@link buildHeaderFooterParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function buildHeaderFooter({ isCentered, showBandLogo, customLogoUrl, bandName, activeSetlist, showAppBranding }: buildHeaderFooterParams) {
  // Header/footer de cada hoja: independientes de cuántas páginas necesite el repertorio en
  // sí (el footer sí necesita el número de página final, se rellena tras calcular el plan).
  const buildHeaderHtml = (
    member: BandMemberOption,
    isMaster: boolean,
  ): string => `
      <div class="page-header ${isCentered ? "is-centered" : ""}">
        <div class="header-left">
          ${
 showBandLogo && customLogoUrl
   ? `
            <img src="${escapeHtml(customLogoUrl)}" alt="${escapeHtml(bandName)}" class="band-logo-img" onerror="this.style.display='none'" />
          `
   : ""
 }
 <div class="band-text-block">
 <h1 class="band-heading">${escapeHtml(bandName.toUpperCase())}</h1>
            <div class="setlist-meta">${escapeHtml(cleanSetlistName(activeSetlist.nombre).toUpperCase())}</div>
          </div>
        </div>

        <div class="header-right">
          <div class="member-stage-tag">
            <div class="tag-title">${!isMaster ? "COPIA PARA MÚSICO" : "COPIA CONTROL"}</div>
            <div class="tag-name">${escapeHtml(member.name.toUpperCase())}</div>
            <div class="tag-instrument">${escapeHtml(member.instrument.toUpperCase())}</div>
          </div>
        </div>
      </div>
    `;

  // El mismo SVG en todas las hojas: se genera una vez por documento.
  const footerQrSvg = showAppBranding ? buildQrSvg("https://bandmanager.io/?utm_source=setlist&utm_medium=qr", 11) : "";

  const buildFooterHtml = (
    member: BandMemberOption,
    pageNum: number,
    totalPages: number,
  ): string =>
    showAppBranding && pageNum < totalPages
      ? // Hojas intermedias: solo numeración, el QR y la marca van en la última hoja de cada copia.
        `
      <div class="page-footer ${isCentered ? "is-centered" : ""}">
        <div class="footer-left"></div>
        <div class="footer-right">
          <span>Hoja ${pageNum} de ${totalPages} (${escapeHtml(member.name)})</span>
        </div>
      </div>
    `
      : showAppBranding
      ? `
      <div class="page-footer ${isCentered ? "is-centered" : ""}">
        <div class="footer-left">
          <span class="footer-qr">${footerQrSvg}</span>
          <span class="app-logo-badge">⚡ BandManager</span>
          <span class="footer-sep">•</span>
          <a href="https://bandmanager.io" target="_blank" class="app-link">bandmanager.io</a>
        </div>
        <div class="footer-right">
          <span>Hoja ${pageNum} de ${totalPages} (${escapeHtml(member.name)})</span>
          <span class="footer-sep">•</span>
          <span>${new Date().toLocaleDateString("es-ES")}</span>
        </div>
      </div>
    `
      : "";

  return { buildHeaderHtml, buildFooterHtml };
}
