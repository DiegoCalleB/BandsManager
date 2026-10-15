/**
 * Pasos 1 a 6 del asistente (idioma, identidad, bio, miembros, redes, vídeos y música).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { StepBio } from "../steps/StepBio";
import { StepIdentity } from "../steps/StepIdentity";
import { StepLanguage } from "../steps/StepLanguage";
import { StepMembers } from "../steps/StepMembers";
import { StepMusicSetlist } from "../steps/StepMusicSetlist";
import { StepSocialsMerch } from "../steps/StepSocialsMerch";
import { StepVideos } from "../steps/StepVideos";
import { useOnboardingWizard } from "./OnboardingWizardContext";
import { COMMON_GENRES,COMMON_LANGUAGES } from "./wizardOptions";

/**
 * Pasos 1 a 6 del asistente (idioma, identidad, bio, miembros, redes, vídeos y música).
 * @returns Sección de interfaz.
 */
export function WizardStepsEarly() {
  const { currentStepDef, language, setLanguage, handleNextStep, localBandName, setLocalBandName, genre, setGenre, fontStyle, setFontStyle, city, setCity, logoUrl, setLogoUrl, isUploadingLogo, handleLogoUpload, slogan, setSlogan, bio, setBio, formato, setFormato, numMusicos, setNumMusicos, duracionDirecto, setDuracionDirecto, handleGenerateBioAI, members, newMemberName, setNewMemberName, newMemberRole, setNewMemberRole, newMemberEmail, setNewMemberEmail, newMemberInstagram, setNewMemberInstagram, handleAddMember, handleRemoveMember, socialLinks, setSocialLinks, merchStoreUrl, setMerchStoreUrl, merchHighlight, setMerchHighlight, videos, newVideoUrl, setNewVideoUrl, newVideoTitle, setNewVideoTitle, newVideoType, setNewVideoType, handleAddVideo, handleRemoveVideo, handleToggleHighlightVideo, musicSubTab, setMusicSubTab, spotifyQuery, setSpotifyQuery, isSearchingSpotify, spotifyAlbums, selectedSpotifyTracks, handleSearchSpotify, handleToggleTrackSelection, handleSelectAllTracksInAlbum, handleImportSpotifyTracks, isImportingSpotify, uploadedSongs, isUploadingAudio, handleAudioFileUpload, manualSongs, newManualTitle, setNewManualTitle, newManualTonalidad, setNewManualTonalidad, newManualBpm, setNewManualBpm, newManualDuracion, setNewManualDuracion, handleAddManualSong, handleRemoveManualSong, handleBulkAddManualSongs, createdSetlistName, isCreatingSetlist, handleGenerateSetlist, totalImportedSongsCount } = useOnboardingWizard();
  return (
    <>
      {currentStepDef?.key === "language" && (
      <StepLanguage
        language={language}
        setLanguage={setLanguage}
        onContinue={handleNextStep}
      />
      )}

      {/* Step 2: Identidad */}
      {currentStepDef?.key === "identity" && (
      <StepIdentity
        localBandName={localBandName}
        setLocalBandName={setLocalBandName}
        genre={genre}
        setGenre={setGenre}
        language={language}
        setLanguage={setLanguage}
        fontStyle={fontStyle}
        setFontStyle={setFontStyle}
        city={city}
        setCity={setCity}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        isUploadingLogo={isUploadingLogo}
        onLogoUpload={handleLogoUpload}
        commonGenres={COMMON_GENRES}
        commonLanguages={COMMON_LANGUAGES}
      />
      )}

      {/* Step 2 */}
      {currentStepDef?.key === "bio" && (
      <StepBio
        slogan={slogan}
        setSlogan={setSlogan}
        bio={bio}
        setBio={setBio}
        formato={formato}
        setFormato={setFormato}
        numMusicos={numMusicos}
        setNumMusicos={setNumMusicos}
        duracionDirecto={duracionDirecto}
        setDuracionDirecto={setDuracionDirecto}
        onGenerateBioAI={handleGenerateBioAI}
      />
      )}

      {/* Step 3 */}
      {currentStepDef?.key === "members" && (
      <StepMembers
        members={members}
        newMemberName={newMemberName}
        setNewMemberName={setNewMemberName}
        newMemberRole={newMemberRole}
        setNewMemberRole={setNewMemberRole}
        newMemberEmail={newMemberEmail}
        setNewMemberEmail={setNewMemberEmail}
        newMemberInstagram={newMemberInstagram}
        setNewMemberInstagram={setNewMemberInstagram}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
      )}

      {/* Step 4 */}
      {currentStepDef?.key === "socials_merch" && (
      <StepSocialsMerch
        socialLinks={socialLinks}
        setSocialLinks={setSocialLinks}
        merchStoreUrl={merchStoreUrl}
        setMerchStoreUrl={setMerchStoreUrl}
        merchHighlight={merchHighlight}
        setMerchHighlight={setMerchHighlight}
      />
      )}

      {/* Step 5 */}
      {currentStepDef?.key === "videos" && (
      <StepVideos
        videos={videos}
        newVideoUrl={newVideoUrl}
        setNewVideoUrl={setNewVideoUrl}
        newVideoTitle={newVideoTitle}
        setNewVideoTitle={setNewVideoTitle}
        newVideoType={newVideoType}
        setNewVideoType={setNewVideoType}
        onAddVideo={handleAddVideo}
        onRemoveVideo={handleRemoveVideo}
        onToggleHighlightVideo={handleToggleHighlightVideo}
      />
      )}

      {/* Step 6 */}
      {currentStepDef?.key === "music" && (
      <StepMusicSetlist
        musicSubTab={musicSubTab}
        setMusicSubTab={setMusicSubTab}
        spotifyQuery={spotifyQuery}
        setSpotifyQuery={setSpotifyQuery}
        isSearchingSpotify={isSearchingSpotify}
        spotifyAlbums={spotifyAlbums}
        selectedSpotifyTracks={selectedSpotifyTracks}
        onSearchSpotify={handleSearchSpotify}
        onToggleTrackSelection={handleToggleTrackSelection}
        onSelectAllTracksInAlbum={handleSelectAllTracksInAlbum}
        onImportSpotifyTracks={handleImportSpotifyTracks}
        isImportingSpotify={isImportingSpotify}
        uploadedSongs={uploadedSongs}
        isUploadingAudio={isUploadingAudio}
        onAudioFileUpload={handleAudioFileUpload}
        manualSongs={manualSongs}
        newManualTitle={newManualTitle}
        setNewManualTitle={setNewManualTitle}
        newManualTonalidad={newManualTonalidad}
        setNewManualTonalidad={setNewManualTonalidad}
        newManualBpm={newManualBpm}
        setNewManualBpm={setNewManualBpm}
        newManualDuracion={newManualDuracion}
        setNewManualDuracion={setNewManualDuracion}
        onAddManualSong={handleAddManualSong}
        onRemoveManualSong={handleRemoveManualSong}
        onBulkAddManualSongs={handleBulkAddManualSongs}
        createdSetlistName={createdSetlistName}
        isCreatingSetlist={isCreatingSetlist}
        onGenerateSetlist={handleGenerateSetlist}
        totalImportedSongsCount={totalImportedSongsCount}
      />
      )}
    </>
  );
}
