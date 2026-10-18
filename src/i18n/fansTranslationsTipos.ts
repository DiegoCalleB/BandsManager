// Forma del diccionario del formulario de fans. Vive aparte para que fansTranslations.ts (los textos) no crezca más.

export type FanFormDict = {
  officialChannel: string;
  joinTitle: string; // {bandName}
  thanksConcertWithName: string; // {concertName}
  thanksConcertGeneric: string;
  thanksSupport: string;
  supportIntro: string;
  tabFollow: string;
  tabJoin: string;
  followHelpTitle: string;
  followHelpBody: string;
  followCTA: string;
  teaserTitle: string;
  teaserBody: string;
  teaserButton: string;
  errorRequiredFields: string;
  errorGenericSignup: string;
  labelName: string;
  placeholderName: string;
  labelEmail: string;
  labelCity: string;
  placeholderCity: string;
  labelHowFound: string;
  optionSelect: string;
  optionConcert: string;
  optionSocial: string;
  optionFriend: string;
  optionSpotify: string;
  optionOther: string;
  labelFavSong: string; // {bandName}
  placeholderFavSong: string;
  labelInstagram: string;
  placeholderInstagram: string;
  labelMessage: string;
  placeholderMessage: string;
  consentPrefix: string;
  consentPrivacyLink: string;
  consentMiddle: string;
  consentExplicit: string;
  consentSuffix: string;
  submitJoin: string; // {bandName}
  submitting: string;
  followUsAlso: string;
  bookingTitle: string;
  bookingBadgeLive: string;
  bookingQuestion: string; // {bandName}
  bookingEmailSubject: string; // {bandName}
  bookingWhatsappText: string; // {bandName}
  backHome: string;
  welcomeTitle: string; // {bandName}
  registeredDefaultMessage: string; // {bandName}
  benefitsTitle: string;
  downloadExclusive: string;
  merchCode: string;
  followUsPlatforms: string;
  epkCardTitle: string;
  epkCardSubtitle: string;
  epkSuccessLink: string; // {bandName}
  economicSupportTitle: string; // {bandName}
  economicSupportSubtitle: string;
  openButton: string;
  clickSingular: string;
  clickPlural: string;
  revolutButton: string;
  revolutCopied: string;
  revolutHandle: string;
  revolutSuccessPrompt: string; // {bandName}
  revolutStepTitle: string;
  revolutBadge: string;
  revolutSecureDirect: string;
  paypalButton: string;
  paypalCopied: string;
  paypalHandle: string;
  paypalBadge: string;
  bizumButton: string;
  bizumHandle: string;
  payWithBizum: string;
  payWithRevolut: string;
  payWithPaypal: string;
  selectPaymentMethod: string;
  privacyModalTitle: string;
  privacyPara1: string; // {bandName} x2
  privacyPara2: string;
  privacyPara3: string; // {bandName}
  privacyPara4: string;
  understood: string;
  interactiveSimulation: string;
  backToForm: string;
  previewModalTitle: string;
  previewMobile: string;
  previewDesktop: string;
  previewTabForm: string;
  previewTabSuccess: string;
  previewLanguageLabel: string;
  previewConcertLabel: string;
  previewGeneralConcert: string;
  previewReset: string;
  previewClose: string;
  previewProductionSyncBadge: string;
  previewDisclaimer: string;
  // Nuevas mejoras: Incentivo, compartir y próximos bolos
  incentiveBannerTitle: string;
  incentiveItemTickets: string;
  incentiveItemTrack: string;
  incentiveItemMerch: string;
  shareWithFriend: string;
  shareSuccessText: string;
  shareCopied: string;
  upcomingConcertsTitle: string;
  buyTickets: string;
  optionalFieldsToggle: string;
  hideOptionalFields: string;
  quickJoinSubtitle: string;
  audioPreviewPlaying: string;
  audioPreviewPrompt: string;
  audioPreviewPlay: string;
  audioPreviewPause: string;
  bizumCopiedNotification: string;
  shareCardPrompt: string;
  whatsappShareMessage: string;
  upcomingShowsTitle: string;
  // Banner para músicos y bandas al final del formulario
  musicianBannerTitle: string;
  musicianBannerSubtitle: string;
  musicianBannerCTA: string;
};
