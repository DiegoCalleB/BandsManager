/**
 * Vista previa paginada del documento, impresión y edición de notas por canción.
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect, useRef, useState } from "react";
import { Setlist, Song } from "../../../../types";
import { BandMemberOption } from "../../../../utils/repertorioUtils";
import { mmToPx } from "../../../../utils/textFit";
import { buildPrintDocument as buildPrintDocumentFor } from "../printDocumentBuilder";
import { PrintDocument, SetlistStylePreset } from "../printLayout";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PrintPreviewParams {
  printMode: "all_members" | "single_member" | "master";
  selectedMemberId: string;
  previewPageIndex: number;
  textAlign: "left" | "center";
  columnsChoice: 2 | "auto" | 1;
  handwritingFont: "caveat" | "permanent_marker" | "courier" | "sans";
  handwritingColor: "blue" | "black" | "red" | "purple";
  showBandLogo: boolean;
  showSongNumbers: boolean;
  showTonality: boolean;
  showBpm: boolean;
  showDuration: boolean;
  badgesScope: "all" | "marked";
  markedSongs: Record<string, string[]>;
  showSetlistNotes: boolean;
  showGeneralNotes: boolean;
  showAppBranding: boolean;
  showWatermark: boolean;
  stylePreset: SetlistStylePreset;
  bandName: string;
  customLogoUrl: string;
  resolvedMembers: BandMemberOption[];
  songs: Song[];
  isOpen: boolean;
  membersToExport: BandMemberOption[];
  activeSetlist: Setlist;
  isCentered: boolean;
  currentPreviewMember: BandMemberOption;
}

/**
 * Vista previa paginada del documento, impresión y edición de notas por canción.
 * @param params Estado y callbacks del contenedor ({@link PrintPreviewParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePrintPreview({ printMode, selectedMemberId, previewPageIndex, textAlign, columnsChoice, handwritingFont, handwritingColor, showBandLogo, showSongNumbers, showTonality, showBpm, showDuration, badgesScope, markedSongs, showSetlistNotes, showGeneralNotes, showAppBranding, showWatermark, stylePreset, bandName, customLogoUrl, resolvedMembers, songs, isOpen, membersToExport, activeSetlist, isCentered, currentPreviewMember }: PrintPreviewParams) {
  // Quick edit note state
  const [editingSongForNotes, setEditingSongForNotes] = useState<Song | null>(
    null,
  );

  // Hojas por músico: "auto" deja decidir al motor (setlistPaginator.ts); 1-3 las impone el
  // usuario y el motor busca la letra más grande que quepa en ellas.
  const [pagesChoice, setPagesChoice] = useState<"auto" | 1 | 2 | 3>("auto");

  // Vista previa = el MISMO HTML que se imprime (buildPrintDocument), pintado en un iframe como
  // papel A4. Antes era una maqueta aparte que solo se parecía; ahora no puede divergir.
  const [previewDoc, setPreviewDoc] = useState<{
    html: string;
    layout: PrintDocument["layouts"][number] | null;
  } | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewHeightPx, setPreviewHeightPx] = useState<number>(
    Math.round(mmToPx(297)),
  );

  const [previewScale, setPreviewScale] = useState(1);

  const hasPreview = previewDoc !== null;

  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const previewBoxRef = useRef<HTMLDivElement>(null);

  // Una clave con todo lo que cambia la maquetación (solo primitivos: `bandMembers` y los
  // arrays por defecto son objetos nuevos en cada render y dispararían el efecto sin parar).
  const previewKey = JSON.stringify([
    printMode,
    selectedMemberId,
    previewPageIndex,
    textAlign,
    columnsChoice,
    pagesChoice,
    handwritingFont,
    handwritingColor,
    showBandLogo,
    showSongNumbers,
    showTonality,
    showBpm,
    showDuration,
    badgesScope,
    markedSongs,
    showSetlistNotes,
    showGeneralNotes,
    showAppBranding,
    showWatermark,
    stylePreset,
    bandName,
    customLogoUrl,
    resolvedMembers.map((m) => `${m.id}|${m.name}|${m.instrument}`),
  ]);

  // El iframe avisa de su altura real y de los clics en un tema (editar su nota).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== previewFrameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; h?: number; id?: string } | null;
      if (data?.type === "bm-preview-height" && data.h && data.h > 0) {
        setPreviewHeightPx(Math.ceil(data.h));
      } else if (data?.type === "bm-edit-song" && data.id) {
        const song = songs.find((x) => x.id === data.id);
        if (song) setEditingSongForNotes(song);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [songs]);

  // Escala el A4 (210mm) al ancho disponible: en móvil se ve la hoja entera, no un trozo.
  useEffect(() => {
    const el = previewBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const free = el.clientWidth - 24;
      if (free > 0) setPreviewScale(Math.min(1, free / mmToPx(210)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, hasPreview]);

  const printBuildContext = { handwritingFont, handwritingColor, membersToExport, stylePreset, activeSetlist, songs, showGeneralNotes, showSongNumbers, markedSongs, showTonality, badgesScope, showBpm, showDuration, showSetlistNotes, isCentered, showBandLogo, customLogoUrl, bandName, showAppBranding, columnsChoice, pagesChoice, showWatermark };

  const buildPrintDocument = (opts: Parameters<typeof buildPrintDocumentFor>[1]) =>
    buildPrintDocumentFor(printBuildContext, opts);

  const handlePrint = async (onlyMember?: (typeof membersToExport)[number]) => {
    // La ventana se abre YA, dentro del gesto del usuario: si se abre después de maquetar (varios
    // `await` más tarde) Chrome móvil la bloquea como ventana emergente.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Tu navegador ha bloqueado la ventana de impresión. Permite las ventanas emergentes para bandmanager.io y vuelve a pulsar Imprimir.");
      return;
    }
    printWindow.document.write(
      '<!DOCTYPE html><meta charset="utf-8"><title>Preparando setlist…</title><body style="font-family:sans-serif;color:#555;display:grid;place-items:center;height:100vh;margin:0">Maquetando el setlist…</body>',
    );
    try {
      const doc = await buildPrintDocument({ members: onlyMember ? [onlyMember] : membersToExport, mode: "print" });
      if (!doc) {
        printWindow.close();
        return;
      }
      printWindow.document.open();
      printWindow.document.write(doc.html);
      printWindow.document.close();
    } catch (err) {
      console.error("Impresión del setlist:", err);
      printWindow.close();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const member = currentPreviewMember;
      if (!member) return;
      setPreviewLoading(true);
      try {
        const doc = await buildPrintDocument({ members: [member], mode: "preview" });
        if (!cancelled && doc) {
          setPreviewDoc({ html: doc.html, layout: doc.layouts[0] ?? null });
        }
      } catch (err) {
        console.error("Vista previa del setlist:", err);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // buildPrintDocument y currentPreviewMember se recrean en cada render: lo que de verdad
    // cambia la maquetación está en previewKey (y en el repertorio/canciones).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, activeSetlist, songs]);

  return { handlePrint, pagesChoice, setPagesChoice, previewDoc, previewBoxRef, previewScale, previewHeightPx, previewFrameRef, previewLoading, editingSongForNotes, setEditingSongForNotes };
}
