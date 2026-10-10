/**
 * Modales del CRM de bandas: alta/edición, pitch, tono, barrido de Spotify, reproductor, scout y progreso masivo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { BandPreviewPlayer } from "../booking/BandPreviewPlayer";
import { BulkProgressModal } from "../booking/BulkProgressModal";
import { AddEditBandModal } from "./AddEditBandModal";
import { AIBandScoutModal } from "./AIBandScoutModal";
import { useBandCrm } from "./BandCrmContext";
import { isStitchLight } from "./bandCrmTheme";
import { BandPitchModal } from "./BandPitchModal";
import { BandToneModal } from "./BandToneModal";
import { SpotifySweepModal } from "./SpotifySweepModal";

/**
 * Modales del CRM de bandas: alta/edición, pitch, tono, barrido de Spotify, reproductor, scout y progreso masivo.
 * @returns Sección de interfaz.
 */
export function BandCrmModalsHost() {
  const { isAddEditModalOpen, setIsAddEditModalOpen, editingBand, handleSaveBand, formName, setFormName, formStyle, setFormStyle, formLocation, setFormLocation, formStatus, setFormStatus, formLastContact, setFormLastContact, formContactName, setFormContactName, formEmail, setFormEmail, formPhone, setFormPhone, formInstagram, setFormInstagram, formSpotifyYoutube, setFormSpotifyYoutube, formAforo, setFormAforo, formNotes, setFormNotes, formIcon, setFormIcon, formImageUrl, setFormImageUrl, handleAiLookup, isAiSearching, aiProposal, setAiProposal, aiError, setAiError, handleApplyAllAiData, handleLogoUpload, isUploadingLogo, isPitchModalOpen, setIsPitchModalOpen, selectedPitchBand, activeCampaign, myBandName, proposedCity, setProposedCity, proposedVenue, setProposedVenue, proposedMonth, setProposedMonth, generatePitchText, customPitchText, isToneModalOpen, setIsToneModalOpen, selectedToneBand, toneData, isAnalyzingTone, handleAnalyzeTone, setCustomPitchText, setSelectedPitchBand, isSpotifySweepOpen, setIsSpotifySweepOpen, fetchBands, reproductor, setReproductor, isScoutModalOpen, setIsScoutModalOpen, handleImportScoutedBands, bulkProgressState, setBulkProgressState } = useBandCrm();
  return (
    <>
      {/* 4. MODAL: CREATE / EDIT BAND CONTACT */}
      <AddEditBandModal
      isOpen={isAddEditModalOpen}
      onClose={() => setIsAddEditModalOpen(false)}
      isStitchLight={isStitchLight}
      editingBand={editingBand}
      handleSaveBand={handleSaveBand}
      formName={formName}
      setFormName={setFormName}
      formStyle={formStyle}
      setFormStyle={setFormStyle}
      formLocation={formLocation}
      setFormLocation={setFormLocation}
      formStatus={formStatus}
      setFormStatus={setFormStatus}
      formLastContact={formLastContact}
      setFormLastContact={setFormLastContact}
      formContactName={formContactName}
      setFormContactName={setFormContactName}
      formEmail={formEmail}
      setFormEmail={setFormEmail}
      formPhone={formPhone}
      setFormPhone={setFormPhone}
      formInstagram={formInstagram}
      setFormInstagram={setFormInstagram}
      formSpotifyYoutube={formSpotifyYoutube}
      setFormSpotifyYoutube={setFormSpotifyYoutube}
      formAforo={formAforo}
      setFormAforo={setFormAforo}
      formNotes={formNotes}
      setFormNotes={setFormNotes}
      formIcon={formIcon}
      setFormIcon={setFormIcon}
      formImageUrl={formImageUrl}
      setFormImageUrl={setFormImageUrl}
      handleAiLookup={handleAiLookup}
      isAiSearching={isAiSearching}
      aiProposal={aiProposal}
      setAiProposal={setAiProposal}
      aiError={aiError}
      setAiError={setAiError}
      handleApplyAllAiData={handleApplyAllAiData}
      handleLogoUpload={handleLogoUpload}
      isUploadingLogo={isUploadingLogo}
      />

      {/* 5. MODAL: DATE SWAP PITCH GENERATOR */}
      <BandPitchModal
      isOpen={isPitchModalOpen}
      onClose={() => setIsPitchModalOpen(false)}
      band={selectedPitchBand}
      activeCampaign={activeCampaign}
      myBandName={myBandName}
      proposedCity={proposedCity}
      setProposedCity={setProposedCity}
      proposedVenue={proposedVenue}
      setProposedVenue={setProposedVenue}
      proposedMonth={proposedMonth}
      setProposedMonth={setProposedMonth}
      generatePitchText={generatePitchText}
      customPitchText={customPitchText}
      />

      {/* 6. MODAL: TONE & COMMUNICATION STYLE SCRAPER */}
      <BandToneModal
      isOpen={isToneModalOpen}
      onClose={() => setIsToneModalOpen(false)}
      band={selectedToneBand}
      toneData={toneData}
      isLoading={isAnalyzingTone}
      onReAnalyze={() =>
        selectedToneBand && handleAnalyzeTone(selectedToneBand)
      }
      onUseTailoredPitch={(tailoredText) => {
        setCustomPitchText(tailoredText);
        setSelectedPitchBand(selectedToneBand);
        setIsPitchModalOpen(true);
      }}
      />

      {isSpotifySweepOpen && (
      <SpotifySweepModal
        isOpen
        onClose={() => setIsSpotifySweepOpen(false)}
        onApplied={() => fetchBands()}
      />
      )}

      {reproductor && (
      <BandPreviewPlayer
        key={reproductor.id}
        cola={reproductor.cola}
        inicio={reproductor.inicio}
        onClose={() => setReproductor(null)}
      />
      )}

      <AIBandScoutModal
      isOpen={isScoutModalOpen}
      onClose={() => setIsScoutModalOpen(false)}
      activeCampaign={activeCampaign}
      onAddBands={handleImportScoutedBands}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
      isOpen={bulkProgressState.isOpen}
      onClose={() =>
        setBulkProgressState((prev) => ({ ...prev, isOpen: false }))
      }
      title={bulkProgressState.title}
      subtitle={bulkProgressState.subtitle}
      items={bulkProgressState.items}
      currentIndex={bulkProgressState.currentIndex}
      totalCount={bulkProgressState.totalCount}
      isCompleted={bulkProgressState.isCompleted}
      />
    </>
  );
}
