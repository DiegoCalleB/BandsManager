/**
 * Pasos 7 a 13 del asistente (rider, prensa, booking, agente, eventos, fotos, fans) y la celebración final.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { StepAgentEmail } from "../steps/StepAgentEmail";
import { StepBookingConditions } from "../steps/StepBookingConditions";
import { StepCompletedCelebration } from "../steps/StepCompletedCelebration";
import { StepEvents } from "../steps/StepEvents";
import { StepFansPayments } from "../steps/StepFansPayments";
import { StepPhotos } from "../steps/StepPhotos";
import { StepPressProof } from "../steps/StepPressProof";
import { StepRider } from "../steps/StepRider";
import { useOnboardingWizard } from "./OnboardingWizardContext";

/**
 * Pasos 7 a 13 del asistente (rider, prensa, booking, agente, eventos, fotos, fans) y la celebración final.
 * @returns Sección de interfaz.
 */
export function WizardStepsLate() {
  const { currentStepDef, riderTecnicoText, setRiderTecnicoText, riderPdfUrl, setRiderPdfUrl, riderPdfName, setRiderPdfName, isUploadingRider, handleRiderUpload, canalesMesa, setCanalesMesa, llevaMicrofoniaPropia, setLlevaMicrofoniaPropia, llevaInEars, setLlevaInEars, necesitaBacklineBateria, setNecesitaBacklineBateria, pressQuotes, newQuoteText, setNewQuoteText, newQuoteMedia, setNewQuoteMedia, handleAddQuote, handleRemoveQuote, festivalesDestacados, setFestivalesDestacados, cifrasOyentes, setCifrasOyentes, cifrasDirectos, setCifrasDirectos, cifrasComunidad, setCifrasComunidad, cacheAcustico, setCacheAcustico, cacheSala, setCacheSala, cacheFestival, setCacheFestival, condicionesKm, setCondicionesKm, requiereAlojamiento, setRequiereAlojamiento, contactoBookingNombre, setContactoBookingNombre, contactoBookingEmail, setContactoBookingEmail, contactoBookingTelefono, setContactoBookingTelefono, signatureName, setSignatureName, signatureCargo, setSignatureCargo, signaturePhone, setSignaturePhone, senderEmail, setSenderEmail, events, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventCity, setNewEventCity, newEventVenue, setNewEventVenue, newEventTicketUrl, setNewEventTicketUrl, newEventAttendancePropia, setNewEventAttendancePropia, newEventAttendanceOtras, setNewEventAttendanceOtras, newEventSharedBands, setNewEventSharedBands, newEventPostShowReview, setNewEventPostShowReview, newEventIsMilestone, setNewEventIsMilestone, handleAddEvent, handleRemoveEvent, photos, isUploadingPhoto, handlePhotoUpload, handleRemovePhoto, newPhotoUrl, setNewPhotoUrl, handleAddPhotoUrl, fanCallToAction, setFanCallToAction, fanWelcomeMessage, setFanWelcomeMessage, fanRewardDescription, setFanRewardDescription, fanRewardLink, setFanRewardLink, leadMagnetFileName, setLeadMagnetFileName, isUploadingLeadMagnet, handleLeadMagnetUpload, discountCode, setDiscountCode, bizumNumber, setBizumNumber, revolutTag, setRevolutTag, paypalEmail, setPaypalEmail, ibanNumber, setIbanNumber, isCelebrationStep, localBandName, totalImportedSongsCount, videos, userPlanId, handleFinishWizard } = useOnboardingWizard();
  return (
    <>
      {currentStepDef?.key === "rider" && (
      <StepRider
        riderTecnicoText={riderTecnicoText}
        setRiderTecnicoText={setRiderTecnicoText}
        riderPdfUrl={riderPdfUrl}
        setRiderPdfUrl={setRiderPdfUrl}
        riderPdfName={riderPdfName}
        setRiderPdfName={setRiderPdfName}
        isUploadingRider={isUploadingRider}
        onRiderUpload={handleRiderUpload}
        canalesMesa={canalesMesa}
        setCanalesMesa={setCanalesMesa}
        llevaMicrofoniaPropia={llevaMicrofoniaPropia}
        setLlevaMicrofoniaPropia={setLlevaMicrofoniaPropia}
        llevaInEars={llevaInEars}
        setLlevaInEars={setLlevaInEars}
        necesitaBacklineBateria={necesitaBacklineBateria}
        setNecesitaBacklineBateria={setNecesitaBacklineBateria}
      />
      )}

      {/* Step 8 */}
      {currentStepDef?.key === "press_proof" && (
      <StepPressProof
        pressQuotes={pressQuotes}
        newQuoteText={newQuoteText}
        setNewQuoteText={setNewQuoteText}
        newQuoteMedia={newQuoteMedia}
        setNewQuoteMedia={setNewQuoteMedia}
        onAddQuote={handleAddQuote}
        onRemoveQuote={handleRemoveQuote}
        festivalesDestacados={festivalesDestacados}
        setFestivalesDestacados={setFestivalesDestacados}
        cifrasOyentes={cifrasOyentes}
        setCifrasOyentes={setCifrasOyentes}
        cifrasDirectos={cifrasDirectos}
        setCifrasDirectos={setCifrasDirectos}
        cifrasComunidad={cifrasComunidad}
        setCifrasComunidad={setCifrasComunidad}
      />
      )}

      {/* Step 9 (Plan-gated: Booking Conditions) */}
      {currentStepDef?.key === "booking_conditions" && (
      <StepBookingConditions
        cacheAcustico={cacheAcustico}
        setCacheAcustico={setCacheAcustico}
        cacheSala={cacheSala}
        setCacheSala={setCacheSala}
        cacheFestival={cacheFestival}
        setCacheFestival={setCacheFestival}
        condicionesKm={condicionesKm}
        setCondicionesKm={setCondicionesKm}
        requiereAlojamiento={requiereAlojamiento}
        setRequiereAlojamiento={setRequiereAlojamiento}
        contactoBookingNombre={contactoBookingNombre}
        setContactoBookingNombre={setContactoBookingNombre}
        contactoBookingEmail={contactoBookingEmail}
        setContactoBookingEmail={setContactoBookingEmail}
        contactoBookingTelefono={contactoBookingTelefono}
        setContactoBookingTelefono={setContactoBookingTelefono}
      />
      )}

      {/* Step 10 (Plan-gated: AI Agent & Email) */}
      {currentStepDef?.key === "agent_email" && (
      <StepAgentEmail
        signatureName={signatureName}
        setSignatureName={setSignatureName}
        signatureCargo={signatureCargo}
        setSignatureCargo={setSignatureCargo}
        signaturePhone={signaturePhone}
        setSignaturePhone={setSignaturePhone}
        senderEmail={senderEmail}
        setSenderEmail={setSenderEmail}
      />
      )}

      {/* Step 11 */}
      {currentStepDef?.key === "events" && (
      <StepEvents
        events={events}
        newEventTitle={newEventTitle}
        setNewEventTitle={setNewEventTitle}
        newEventType={newEventType}
        setNewEventType={setNewEventType}
        newEventDate={newEventDate}
        setNewEventDate={setNewEventDate}
        newEventTime={newEventTime}
        setNewEventTime={setNewEventTime}
        newEventCity={newEventCity}
        setNewEventCity={setNewEventCity}
        newEventVenue={newEventVenue}
        setNewEventVenue={setNewEventVenue}
        newEventTicketUrl={newEventTicketUrl}
        setNewEventTicketUrl={setNewEventTicketUrl}
        newEventAttendancePropia={newEventAttendancePropia}
        setNewEventAttendancePropia={setNewEventAttendancePropia}
        newEventAttendanceOtras={newEventAttendanceOtras}
        setNewEventAttendanceOtras={setNewEventAttendanceOtras}
        newEventSharedBands={newEventSharedBands}
        setNewEventSharedBands={setNewEventSharedBands}
        newEventPostShowReview={newEventPostShowReview}
        setNewEventPostShowReview={setNewEventPostShowReview}
        newEventIsMilestone={newEventIsMilestone}
        setNewEventIsMilestone={setNewEventIsMilestone}
        onAddEvent={handleAddEvent}
        onRemoveEvent={handleRemoveEvent}
      />
      )}

      {/* Step 12 */}
      {currentStepDef?.key === "photos" && (
      <StepPhotos
        photos={photos}
        isUploadingPhoto={isUploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        onRemovePhoto={handleRemovePhoto}
        newPhotoUrl={newPhotoUrl}
        setNewPhotoUrl={setNewPhotoUrl}
        onAddPhotoUrl={handleAddPhotoUrl}
      />
      )}

      {/* Step 13 */}
      {currentStepDef?.key === "fans_payments" && (
      <StepFansPayments
        fanCallToAction={fanCallToAction}
        setFanCallToAction={setFanCallToAction}
        fanWelcomeMessage={fanWelcomeMessage}
        setFanWelcomeMessage={setFanWelcomeMessage}
        fanRewardDescription={fanRewardDescription}
        setFanRewardDescription={setFanRewardDescription}
        fanRewardLink={fanRewardLink}
        setFanRewardLink={setFanRewardLink}
        leadMagnetFileName={leadMagnetFileName}
        setLeadMagnetFileName={setLeadMagnetFileName}
        isUploadingLeadMagnet={isUploadingLeadMagnet}
        onLeadMagnetUpload={handleLeadMagnetUpload}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        bizumNumber={bizumNumber}
        setBizumNumber={setBizumNumber}
        revolutTag={revolutTag}
        setRevolutTag={setRevolutTag}
        paypalEmail={paypalEmail}
        setPaypalEmail={setPaypalEmail}
        ibanNumber={ibanNumber}
        setIbanNumber={setIbanNumber}
      />
      )}

      {/* Final Celebration */}
      {isCelebrationStep && (
      <StepCompletedCelebration
        bandName={localBandName}
        totalSongs={totalImportedSongsCount}
        totalVideos={videos.length}
        totalPhotos={photos.length}
        totalEvents={events.length}
        hasRider={Boolean(riderPdfUrl || riderTecnicoText)}
        planName={userPlanId}
        onFinish={handleFinishWizard}
      />
      )}
    </>
  );
}
