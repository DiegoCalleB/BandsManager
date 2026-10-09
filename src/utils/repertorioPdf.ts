// Utilidades de generación de estilos y hojas de impresión para setlists en PDF

export function getTokenValueForPrint(tokenName: string): string {
  const style =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;
  return style
    ? style.getPropertyValue(tokenName).trim() || "#666666"
    : "#666666";
}

export function generatePdfStylesheet(): string {
  const bgColor = getTokenValueForPrint("--bg");
  const inkColor = getTokenValueForPrint("--ink");
  const ink2Color = getTokenValueForPrint("--ink-2");
  const ink3Color = getTokenValueForPrint("--ink-3");
  const accColor = getTokenValueForPrint("--acc");
  const okColor = getTokenValueForPrint("--ok");
  const alertColor = getTokenValueForPrint("--alert");
  const hairColor = getTokenValueForPrint("--hair");

  return `
 body {
 font-family: system-ui, -apple-system, sans-serif;
 margin: 20px;
 background: ${bgColor};
 color: ${inkColor};
 }
 .header {
 border-bottom: 4px solid ${accColor};
 padding-bottom: 15px;
 margin-bottom: 25px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 }
 h1 { font-size: 32px; margin: 0; color: ${accColor}; letter-spacing: 2px; }
 .meta { font-size: 16px; font-family: monospace; color: ${ink2Color}; }
 .set-table { width: 100%; border-collapse: collapse; }
 .set-table th {
 text-align: left;
 padding: 10px;
 border-bottom: 2px solid ${ink3Color};
 font-size: 14px;
 color: ${ink2Color};
 }
 .set-table td {
 padding: 14px 10px;
 border-bottom: 1px solid ${hairColor};
 font-size: 22px;
 font-weight: bold;
 }
 .num { color: ${accColor}; width: 40px; font-family: monospace; }
 .key-badge {
 display: inline-block;
 background: ${bgColor};
 color: ${okColor};
 padding: 4px 10px;
 border-radius: 6px;
 font-size: 18px;
 font-family: monospace;
 }
 .bpm { color: ${ink2Color}; font-size: 16px; font-family: monospace; }
 .chapa { color: ${accColor}; font-style: italic; font-size: 18px; }
 .bis { color: ${alertColor}; font-size: 20px; text-align: center; }
 .note { display: block; font-size: 13px; color: ${ink3Color}; font-weight: normal; margin-top: 4px; font-style: italic; }
 .footer { margin-top: 30px; font-size: 12px; font-family: monospace; color: ${ink3Color}; text-align: center; }
 .member-note {
 display: inline-block;
 background: ${bgColor};
 color: ${inkColor};
 font-size: 11px;
 padding: 2px 7px;
 border-radius: 999px;
 font-family: monospace;
 margin-right: 6px;
 margin-top: 4px;
 }
 `;
}
