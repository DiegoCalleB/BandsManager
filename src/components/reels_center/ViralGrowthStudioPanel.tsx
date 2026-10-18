/**
 * Panel Viral Growth Studio: ganchos A/B, bucle, subtítulos, zoom y pegatinas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ViralGrowthStudio } from "../reels/ViralGrowthStudio";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Panel Viral Growth Studio: ganchos A/B, bucle, subtítulos, zoom y pegatinas.
 * @returns Sección de interfaz.
 */
export function ViralGrowthStudioPanel() {
  const { colors, bandName, videoMeta, highlights, selectedHighlightIndex, setHighlights, editedCopy, setEditedCopy, isSeamlessLoop, setIsSeamlessLoop, isPunchInZoom, setIsPunchInZoom, beatDropFx, setBeatDropFx, smartPan, setSmartPan, cropMode, setCropMode, activeSubtitleStyle, setActiveSubtitleStyle, injectEmojis, setInjectEmojis, showSpotifyBadge, setShowSpotifyBadge, showRetentionProgressBar, setShowRetentionProgressBar, showTourSticker, setShowTourSticker, tourStickerText, setTourStickerText, handleSyncFromTourCRM, handleTriggerMagicAutopilot, magicAppliedNotification, layoutMode, setLayoutMode, showSafeZone, setShowSafeZone } = useReelsCenter();
  return (
    <>
      {/* 🚀 Viral Growth Studio 4.0 (Ganchos A/B + Bucle 120% + Subtítulos + Punch-In Zoom + Stickers B-Roll) */}
      <ViralGrowthStudio
        colors={colors}
        bandName={bandName}
        songTitle={
          videoMeta?.title ||
          highlights[selectedHighlightIndex]?.title ||
          ""
        }
        currentHook={
          highlights[selectedHighlightIndex]?.hookText || ""
        }
        onUpdateHook={(newHook) => {
          setHighlights((prev) =>
            prev.map((clip, idx) =>
              idx === selectedHighlightIndex
                ? { ...clip, hookText: newHook }
                : clip,
            ),
          );
        }}
        currentCopy={editedCopy}
        onUpdateCopy={(newCopy) => setEditedCopy(newCopy)}
        isSeamlessLoop={isSeamlessLoop}
        onToggleSeamlessLoop={(enabled) =>
          setIsSeamlessLoop(enabled)
        }
        isPunchInZoom={isPunchInZoom}
        onTogglePunchInZoom={(enabled) =>
          setIsPunchInZoom(enabled)
        }
        beatDropFx={beatDropFx}
        onToggleBeatDropFx={(enabled) =>
          setBeatDropFx(enabled)
        }
        smartPan={smartPan}
        onToggleSmartPan={(enabled) => setSmartPan(enabled)}
        cropMode={cropMode}
        onChangeCropMode={(cm) => setCropMode(cm)}
        activeSubtitleStyle={activeSubtitleStyle}
        onChangeSubtitleStyle={(st) =>
          setActiveSubtitleStyle(st)
        }
        injectEmojis={injectEmojis}
        onToggleInjectEmojis={(enabled) =>
          setInjectEmojis(enabled)
        }
        showSpotifyBadge={showSpotifyBadge}
        onToggleSpotifyBadge={(enabled) =>
          setShowSpotifyBadge(enabled)
        }
        showRetentionProgressBar={showRetentionProgressBar}
        onToggleRetentionProgressBar={(enabled) =>
          setShowRetentionProgressBar(enabled)
        }
        showTourSticker={showTourSticker}
        onToggleTourSticker={(enabled) =>
          setShowTourSticker(enabled)
        }
        tourStickerText={tourStickerText}
        onUpdateTourStickerText={(txt) =>
          setTourStickerText(txt)
        }
        onSyncFromTourCRM={handleSyncFromTourCRM}
        onTriggerMagicAutopilot={handleTriggerMagicAutopilot}
        magicAppliedNotification={magicAppliedNotification}
        layoutMode={layoutMode}
        onChangeLayoutMode={(lm) => setLayoutMode(lm)}
        showSafeZone={showSafeZone}
        onToggleSafeZone={() =>
          setShowSafeZone(!showSafeZone)
        }
      />
    </>
  );
}
