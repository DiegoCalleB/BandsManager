/**
 * Pasos del asistente según el plan (idioma, identidad, bio…) y paso actual.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { User } from "../../../../types";
import { normalizePlan } from "../../../../utils/planPermissions";
import { WizardStepDef } from "../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface WizardStepsParams {
  bandPlan: string;
  currentUser: User;
}

/**
 * Pasos del asistente según el plan (idioma, identidad, bio…) y paso actual.
 * @param params Estado y callbacks del contenedor ({@link WizardStepsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useWizardSteps({ bandPlan, currentUser }: WizardStepsParams) {
  const userPlanId = normalizePlan(bandPlan || currentUser?.plan);

  const isPromoPlan = userPlanId === "promo" || userPlanId === "promo_plus";

  const hasBookingAccess = !isPromoPlan;

 // only non-promo plans have booking CRM
  const hasAiAgentAccess = ["local", "de_gira", "cabeza_de_cartel"].includes(
    userPlanId,
  );

  // Dynamic step list based on user plan (Paso 1 prioritario: Idioma)
  const activeSteps: WizardStepDef[] = [
    {
      key: "language",
      title: "Idioma de la Plataforma & Banda",
      shortTitle: "Idioma",
      iconName: "Globe",
      description: "Idioma para la app, agentes de IA y dossier de prensa",
    },
    {
      key: "identity",
      title: "Identidad, Nombre & Tipografía",
      shortTitle: "Identidad",
      iconName: "Guitar",
      description: "Nombre de banda, estilo visual, género, ciudad y logo",
    },
    {
      key: "bio",
      title: "Biografía, Slogan & Formato Directo",
      shortTitle: "Biografía",
      iconName: "FileText",
      description: "Slogan, biografía y formato de escenario",
    },
    {
      key: "members",
      title: "Miembros de la Banda & Invitaciones",
      shortTitle: "Miembros",
      iconName: "Users",
      description: "Integrantes, roles e invitaciones por correo",
    },
    {
      key: "socials_merch",
      title: "Redes Sociales & Tienda Oficial",
      shortTitle: "Redes & Merch",
      iconName: "Globe",
      description: "Spotify, Instagram, YouTube, Web y Merch",
    },
    {
      key: "videos",
      title: "Vídeos de YouTube & Directos",
      shortTitle: "Vídeos",
      iconName: "Video",
      description: "Videoclips y directos destacados para el Dossier",
    },
    {
      key: "music",
      title: "Discografía, Canciones & Setlists",
      shortTitle: "Música & Setlist",
      iconName: "Disc3",
      description: "Importar desde Spotify, subir audio o lista",
    },
    {
      key: "rider",
      title: "Rider Técnico & Stage Plot",
      shortTitle: "Rider Técnico",
      iconName: "Layers",
      description: "Requerimientos técnicos, PDF de rider y escenario",
    },
    {
      key: "press_proof",
      title: "Hitos, Reseñas de Prensa & Social Proof",
      shortTitle: "Prensa & Hitos",
      iconName: "Award",
      description: "Citas de medios, festivales y cifras clave",
    },
    ...(hasBookingAccess
      ? [
          {
            key: "booking_conditions",
            title: "Caché & Condiciones de Contratación",
            shortTitle: "Contratación",
            iconName: "DollarSign",
            description: "Caché estimado, gastos de gira y contacto de booking",
          },
        ]
      : []),
    ...(hasAiAgentAccess
      ? [
          {
            key: "agent_email",
            title: "Agentes IA & Conexión de Correo",
            shortTitle: "Agente IA",
            iconName: "Sparkles",
            description: "Configuración de buzón para despacho de propuestas",
          },
        ]
      : []),
    {
      key: "events",
      title: "Próximos Conciertos & Ensayos",
      shortTitle: "Agenda",
      iconName: "Calendar",
      description: "Fechas confirmadas de directos y ensayos",
    },
    {
      key: "photos",
      title: "Galería de Fotos para Prensa",
      shortTitle: "Fotos EPK",
      iconName: "Camera",
      description: "Fotografías oficiales en alta resolución",
    },
    {
      key: "fans_payments",
      title: "Captación de Fans, Regalo & Pagos",
      shortTitle: "Fans & Pagos",
      iconName: "Heart",
      description:
        "QR para conciertos, lead magnet descargable y métodos de pago",
    },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const isCelebrationStep = currentStepIndex >= activeSteps.length;

  const currentStepDef = !isCelebrationStep
    ? activeSteps[currentStepIndex]
    : null;

  return { currentStepIndex, activeSteps, setCurrentStepIndex, userPlanId, isCelebrationStep, currentStepDef };
}
