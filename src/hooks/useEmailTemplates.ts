import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../services/api';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements' | 'ayuntamientos';

export function useEmailTemplates() {
  // Template states for Salas
  const [subjectTemplateSala, setSubjectTemplateSala] = useState('Propuesta de concierto: {bandName} ({estilo})');
  const [bodyTemplateSala, setBodyTemplateSala] = useState(`Hola equipo de {{nombre_sala}},

Os escribo desde {bandName} ({estilo}). Seguimos vuestra programación en {{ciudad}} y nos encantaría valorar fecha en vuestra sala para los próximos meses.

Traemos un directo muy cuidado y enérgico, concebido para conectar con el público y dinamizar la sala. Nos adaptamos a taquilla, co-booking o caché, y disponemos de rider técnico claro y ágil.

Podéis consultar nuestro directo y dossier en el enlace adjunto: {enlace_videos}

¿Cómo tenéis la agenda para los próximos meses?

Un saludo,
Booking & Management — {bandName}`);
  const [aiGuidelinesSala, setAiGuidelinesSala] = useState(
    'Escribe siempre en un tono cercano, natural y respetuoso. Enfatiza la calidad del directo y la solvencia escénica de la banda, destacando que es una propuesta idónea para dinamizar la sala y convocar a público.'
  );

  // Template states for Festivales
  const [subjectTemplateFestival, setSubjectTemplateFestival] = useState('Propuesta de cartel / Festival: {bandName} (Live Show)');
  const [bodyTemplateFestival, setBodyTemplateFestival] = useState(`Hola equipo de programación de {{nombre_sala}},

Os escribo de parte de {bandName} para presentar la propuesta de nuestro directo de cara a la próxima edición de vuestro festival.

Es un espectáculo de alta energía pensado para escenarios de festival, con montaje limpio y rotación técnica muy rápida en cambios de set.

Podéis consultar nuestro dossier y vídeos de directo aquí: {enlace_videos}

Quedamos a vuestra disposición para enviar rider técnico y propuesta económica.

Un saludo,
Booking & Management — {bandName}`);
  const [aiGuidelinesFestival, setAiGuidelinesFestival] = useState(
    'Tono muy profesional, conciso y enfocado a directores artísticos y jefes de producción de festivales. Destaca la capacidad de mantener el ritmo alto en escenario, la brevedad del cambio de set técnico y el valor diferencial del show.'
  );

  // Template states for Discotecas / Clubs
  const [subjectTemplateDiscoteca, setSubjectTemplateDiscoteca] = useState('Propuesta Live Show / Session Nocturna: {bandName} (Live Set)');
  const [bodyTemplateDiscoteca, setBodyTemplateDiscoteca] = useState(`Hola equipo de {{nombre_sala}},

Os escribo desde {bandName} para proponer un Live Set de alta intensidad pensado para la sesión de noche y clubbing.

Nuestra propuesta combina ritmos bailables y directo enérgico, manteniendo la pista activa con gran conexión con el público.

Vídeo promocional y directo: {enlace_videos}

¿Tenéis fechas libres para incorporar un set en vivo en vuestra programación nocturna?

Un saludo,
Booking & Management — {bandName}`);
  const [aiGuidelinesDiscoteca, setAiGuidelinesDiscoteca] = useState(
    'Tono moderno, enfocado a clubes y discotecas de noche. Resalta que es una propuesta enérgica y bailable ideal para horario de clubbing o sesiones de noche.'
  );

  // Template states for Medios de Comunicación & Prensa
  const [subjectTemplateMedio, setSubjectTemplateMedio] = useState('[Nota de Prensa / Dossier] {bandName} presenta nuevo material y gira');
  const [bodyTemplateMedio, setBodyTemplateMedio] = useState(`Hola equipo de {{nombre_sala}},

Os escribo desde {bandName} ({estilo}) para haceros llegar nuestro dossier promocional y últimos lanzamientos con motivo de nuestra gira.

Estaríamos encantados de enviaros los temas en calidad broadcast (WAV) para vuestra programación, o ponernos a vuestra disposición para entrevistas, acústicos o reseñas.

Dossier y videoclip oficial: {enlace_videos}

Muchas gracias por apoyar la música independiente en directo,

Prensa & Comunicación — {bandName}`);
  const [aiGuidelinesMedio, setAiGuidelinesMedio] = useState(
    'Tono periodístico, profesional y directo para medios de comunicación. Dirígete al redactor, locutor o equipo de redacción. Destaca la nota de prensa y la disponibilidad para entrevistas, acústicos o reseñas.'
  );

  // Template states for Grupos & Bandas (Co-Booking)
  const [subjectTemplateGrupo, setSubjectTemplateGrupo] = useState(
    'Concierto compartido e intercambio de fechas: {bandName} x {{nombre_sala}}'
  );
  const [bodyTemplateGrupo, setBodyTemplateGrupo] = useState(`¡Buenas, gente de {{nombre_sala}}!

Os escribimos desde {bandName}. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectarían genial en una fecha compartida.

Queríamos proponeros un intercambio de fechas (date swap): os invitamos a tocar con nosotros en nuestra ciudad compartiendo sala y taquilla, y montamos la fecha de vuelta en {{ciudad}} para sumar públicos y compartir gastos.

Podéis escuchar lo que hacemos aquí: {enlace_videos}

¿Cómo lo veis? ¿Hablamos por WhatsApp esta semana para cuadrarlo?

¡Un abrazo!
{bandName}`);
  const [aiGuidelinesGrupo, setAiGuidelinesGrupo] = useState(
    'Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local y abaratar gastos.'
  );

  // Template states for Managements & Agencias
  const [subjectTemplateManagement, setSubjectTemplateManagement] = useState('Propuesta de colaboración / Roster: {bandName} (Live Show)');
  const [bodyTemplateManagement, setBodyTemplateManagement] = useState(`Hola equipo de {{nombre_sala}},

Os escribo en representación de {bandName} para presentar nuestra propuesta artística con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking.

Es un proyecto con un directo muy sólido, buena respuesta en venta de entradas y una logística de producción muy eficiente y fácil de girar.

Dossier corporativo y vídeos: {enlace_videos}

Estaré encantado de hacer una breve llamada cuando os vaya bien para valorar posibles sinergias.

Un saludo,
Booking & Management — {bandName}`);
  const [aiGuidelinesManagement, setAiGuidelinesManagement] = useState(
    'Tono profesional y directo para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial y la facilidad logística.'
  );

  // Template states for Ayuntamientos y Fiestas Patronales
  const [subjectTemplateAyuntamiento, setSubjectTemplateAyuntamiento] = useState(
    'Propuesta de concierto para fiestas patronales: {bandName} en {{nombre_sala}}'
  );
  const [bodyTemplateAyuntamiento, setBodyTemplateAyuntamiento] =
    useState(`Estimados responsables del Área de Cultura y Festejos de {{nombre_sala}},

Nos dirigimos a ustedes desde la representación de {bandName} para presentar nuestra propuesta de concierto en directo de cara a la programación cultural y fiestas patronales.

Ofrecemos un espectáculo participativo y de alta energía, adecuado para todos los públicos en plazas y recintos al aire libre. Disponemos de solvencia técnica, facturación oficial y rigurosa puntualidad en producción.

Material promocional, dossier y rider técnico: {enlace_videos}

Quedamos a su disposición para remitirles la propuesta presupuestaria formal.

Atentamente,
Oficina de Producción — {bandName}`);
  const [aiGuidelinesAyuntamiento, setAiGuidelinesAyuntamiento] = useState(
    'Tono formal e institucional. Dirígete a "ustedes", destaca facturación oficial y solvencia técnica.'
  );

  // Selected template category in Editor
  const [templateTab, setTemplateTab] = useState<TemplateCategory>('salas');
  const [testPromptResult, setTestPromptResult] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [isOptimizingTemplate, setIsOptimizingTemplate] = useState(false);
  const [isGeneratingAllTemplates, setIsGeneratingAllTemplates] = useState(false);
  const [optimizationFeedbackMsg, setOptimizationFeedbackMsg] = useState<string | null>(null);
  const [templateCustomInstruction, setTemplateCustomInstruction] = useState('');
  const [templateToneRating, setTemplateToneRating] = useState<number>(0);
  const [templateContentRating, setTemplateContentRating] = useState<number>(0);

  // Estadísticas de éxito por categoría
  const [templateStats, setTemplateStats] = useState<
    Record<
      string,
      {
        totalUses: number;
        positiveResponses: number;
        responseRate: number;
        invalidEmails: number;
        bouncedEmails: number;
      }
    >
  >({});

  const applyTemplatesMap = (t: Record<string, any>) => {
    if (!t) return;
    if (t.salas) {
      setSubjectTemplateSala(t.salas.subject || '');
      setBodyTemplateSala(t.salas.body || '');
      setAiGuidelinesSala(t.salas.guidelines || '');
    }
    if (t.festivales) {
      setSubjectTemplateFestival(t.festivales.subject || '');
      setBodyTemplateFestival(t.festivales.body || '');
      setAiGuidelinesFestival(t.festivales.guidelines || '');
    }
    if (t.discotecas) {
      setSubjectTemplateDiscoteca(t.discotecas.subject || '');
      setBodyTemplateDiscoteca(t.discotecas.body || '');
      setAiGuidelinesDiscoteca(t.discotecas.guidelines || '');
    }
    if (t.medios) {
      setSubjectTemplateMedio(t.medios.subject || '');
      setBodyTemplateMedio(t.medios.body || '');
      setAiGuidelinesMedio(t.medios.guidelines || '');
    }
    if (t.grupos) {
      setSubjectTemplateGrupo(t.grupos.subject || '');
      setBodyTemplateGrupo(t.grupos.body || '');
      setAiGuidelinesGrupo(t.grupos.guidelines || '');
    }
    if (t.managements) {
      setSubjectTemplateManagement(t.managements.subject || '');
      setBodyTemplateManagement(t.managements.body || '');
      setAiGuidelinesManagement(t.managements.guidelines || '');
    }
    if (t.ayuntamientos) {
      setSubjectTemplateAyuntamiento(t.ayuntamientos.subject || '');
      setBodyTemplateAyuntamiento(t.ayuntamientos.body || '');
      setAiGuidelinesAyuntamiento(t.ayuntamientos.guidelines || '');
    }
  };

  const handleGenerateAllFromBase = async (baseProposal: string): Promise<boolean> => {
    if (!baseProposal || !baseProposal.trim()) return false;
    setIsGeneratingAllTemplates(true);
    setOptimizationFeedbackMsg(null);
    try {
      const authHeaders = getAuthHeaders() as Record<string, string>;
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(token ? { 'x-auth-token': token } : {}),
      };
      const res = await fetch('/api/templates/generate-all', {
        method: 'POST',
        headers,
        body: JSON.stringify({ baseProposal }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.templates) {
        applyTemplatesMap(data.templates);
        setOptimizationFeedbackMsg(
          `✨ ¡Éxito! Se han generado y adaptado automáticamente las 7 plantillas maestras y sus 7 pautas de IA para cada escenario.`
        );
        return true;
      } else {
        const errorMsg = data?.error || data?.message || 'No se pudieron generar todas las plantillas.';
        setOptimizationFeedbackMsg(`⚠️ ${errorMsg}`);
        return false;
      }
    } catch (err: any) {
      console.error('Error generating all templates:', err);
      setOptimizationFeedbackMsg(`⚠️ Error de conexión al generar las 7 plantillas.`);
      return false;
    } finally {
      setIsGeneratingAllTemplates(false);
    }
  };

  const handleOptimizeTemplate = async (overrideInstruction?: string) => {
    setIsOptimizingTemplate(true);
    setOptimizationFeedbackMsg(null);
    const instructionToUse =
      typeof overrideInstruction === 'string' && overrideInstruction.trim() !== '' ? overrideInstruction.trim() : templateCustomInstruction;
    try {
      const activeData = getActiveTemplateData();
      const authHeaders = getAuthHeaders() as Record<string, string>;
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(token ? { 'x-auth-token': token } : {}),
      };
      const res = await fetch('/api/templates/optimize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: templateTab,
          currentSubject: activeData.subject,
          currentBody: activeData.body,
          currentGuidelines: activeData.guidelines,
          customInstruction: instructionToUse,
          toneRating: templateToneRating,
          contentRating: templateContentRating,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.optimized) {
        activeData.setSubject(data.optimized.subject);
        activeData.setBody(data.optimized.body);
        activeData.setGuidelines(data.optimized.guidelines);

        setTestPromptResult(`Asunto: ${data.optimized.subject}\n\n${data.optimized.body}`);

        const countNote =
          data.feedbackCountUsed > 0
            ? `Aplicado aprendizaje de ${data.feedbackCountUsed} valoraciones previas del mánager.`
            : 'Refrescada con pautas de estilo de Bakandeya.';
        const ratingsAppliedNote =
          templateToneRating > 0 || templateContentRating > 0
            ? ` (Estrellitas aplicadas: Tono ${templateToneRating || '-'}/5, Contenido ${templateContentRating || '-'}/5)`
            : '';

        setOptimizationFeedbackMsg(`✨ Plantilla re-generada con IA: ${data.optimized.explanation || countNote}${ratingsAppliedNote}`);
        setTemplateCustomInstruction('');
        setTemplateToneRating(0);
        setTemplateContentRating(0);
      } else {
        const errorMsg = data?.error || data?.message || 'No se pudo re-generar la plantilla. Inténtalo de nuevo.';
        setOptimizationFeedbackMsg(`⚠️ ${errorMsg}`);
      }
    } catch (err: any) {
      console.error('Error optimizing template:', err);
      setOptimizationFeedbackMsg(`⚠️ Error al re-generar la plantilla: ${err?.message || 'Error de conexión'}`);
    } finally {
      setIsOptimizingTemplate(false);
    }
  };

  // Helper to retrieve current active template fields by category
  const getActiveTemplateData = () => {
    switch (templateTab) {
      case 'salas':
        return {
          subject: subjectTemplateSala,
          body: bodyTemplateSala,
          guidelines: aiGuidelinesSala,
          setSubject: setSubjectTemplateSala,
          setBody: setBodyTemplateSala,
          setGuidelines: setAiGuidelinesSala,
          title: '🏛️ Editando Plantilla para Salas y Teatros',
          desc: 'Propuestas directas de fechas, aforo, taquilla/caché e invitaciones a programadores de salas.',
        };
      case 'festivales':
        return {
          subject: subjectTemplateFestival,
          body: bodyTemplateFestival,
          guidelines: aiGuidelinesFestival,
          setSubject: setSubjectTemplateFestival,
          setBody: setBodyTemplateFestival,
          setGuidelines: setAiGuidelinesFestival,
          title: '🎪 Editando Plantilla para Festivales de Música',
          desc: 'Presentación de dossier, rider técnico compacto y propuesta para escenarios principales de festival.',
        };
      case 'discotecas':
        return {
          subject: subjectTemplateDiscoteca,
          body: bodyTemplateDiscoteca,
          guidelines: aiGuidelinesDiscoteca,
          setSubject: setSubjectTemplateDiscoteca,
          setBody: setBodyTemplateDiscoteca,
          setGuidelines: setAiGuidelinesDiscoteca,
          title: '🪩 Editando Plantilla para Discotecas y Clubbing',
          desc: 'Live Performance & Clubbing set para horarios nocturnos y sesiones de madrugada.',
        };
      case 'medios':
        return {
          subject: subjectTemplateMedio,
          body: bodyTemplateMedio,
          guidelines: aiGuidelinesMedio,
          setSubject: setSubjectTemplateMedio,
          setBody: setBodyTemplateMedio,
          setGuidelines: setAiGuidelinesMedio,
          title: '📻 Editando Plantilla para Medios de Comunicación, Radio y Prensa',
          desc: 'Nota de prensa, material de difusión, bio/fotos y propuesta para sonar en antena o entrevistas.',
        };
      case 'grupos':
        return {
          subject: subjectTemplateGrupo,
          body: bodyTemplateGrupo,
          guidelines: aiGuidelinesGrupo,
          setSubject: setSubjectTemplateGrupo,
          setBody: setBodyTemplateGrupo,
          setGuidelines: setAiGuidelinesGrupo,
          title: '🎸 Editando Plantilla para Grupos y Bandas (Co-Booking)',
          desc: 'Intercambio de fechas (Date Swap), doble cartel en sala grande y compartir furgoneta/backline.',
        };
      case 'managements':
        return {
          subject: subjectTemplateManagement,
          body: bodyTemplateManagement,
          guidelines: aiGuidelinesManagement,
          setSubject: setSubjectTemplateManagement,
          setBody: setBodyTemplateManagement,
          setGuidelines: setAiGuidelinesManagement,
          title: '💼 Editando Plantilla para Agencias de Booking y Management',
          desc: 'Propuestas corporativas para coproducción, representación de gira e inclusión en catálogo.',
        };
      case 'ayuntamientos':
        return {
          subject: subjectTemplateAyuntamiento,
          body: bodyTemplateAyuntamiento,
          guidelines: aiGuidelinesAyuntamiento,
          setSubject: setSubjectTemplateAyuntamiento,
          setBody: setBodyTemplateAyuntamiento,
          setGuidelines: setAiGuidelinesAyuntamiento,
          title: '🏛️ Editando Plantilla para Ayuntamientos y Fiestas Patronales',
          desc: 'Registro formal e institucional para programación cultural, fiestas patronales y eventos municipales.',
        };
    }
  };

  const handleTestPrompt = async () => {
    setIsTestingPrompt(true);
    setTestPromptResult('');

    const activeData = getActiveTemplateData();

    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      const res = await fetch('/api/templates/preview', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: templateTab,
          subject: activeData.subject,
          body: activeData.body,
          guidelines: activeData.guidelines,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestPromptResult(`Asunto: ${data.subject}\n\n${data.body}`);
      } else {
        setTestPromptResult(`⚠️ ${data.error || 'No se pudo simular la plantilla.'}`);
      }
    } catch (err) {
      console.error('Error testing prompt:', err);
      setTestPromptResult('⚠️ Error de conexión al simular la plantilla.');
    } finally {
      setIsTestingPrompt(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-auth-token'] = token;
        }
        const res = await fetch('/api/templates', { headers });
        const data = await res.json();
        if (res.ok && data.success && data.templates) {
          const t = data.templates;
          if (t.salas) {
            setSubjectTemplateSala(t.salas.subject);
            setBodyTemplateSala(t.salas.body);
            setAiGuidelinesSala(t.salas.guidelines);
          }
          if (t.festivales) {
            setSubjectTemplateFestival(t.festivales.subject);
            setBodyTemplateFestival(t.festivales.body);
            setAiGuidelinesFestival(t.festivales.guidelines);
          }
          if (t.discotecas) {
            setSubjectTemplateDiscoteca(t.discotecas.subject);
            setBodyTemplateDiscoteca(t.discotecas.body);
            setAiGuidelinesDiscoteca(t.discotecas.guidelines);
          }
          if (t.medios) {
            setSubjectTemplateMedio(t.medios.subject);
            setBodyTemplateMedio(t.medios.body);
            setAiGuidelinesMedio(t.medios.guidelines);
          }
          if (t.grupos) {
            setSubjectTemplateGrupo(t.grupos.subject);
            setBodyTemplateGrupo(t.grupos.body);
            setAiGuidelinesGrupo(t.grupos.guidelines);
          }
          if (t.managements) {
            setSubjectTemplateManagement(t.managements.subject);
            setBodyTemplateManagement(t.managements.body);
            setAiGuidelinesManagement(t.managements.guidelines);
          }
          if (t.ayuntamientos) {
            setSubjectTemplateAyuntamiento(t.ayuntamientos.subject);
            setBodyTemplateAyuntamiento(t.ayuntamientos.body);
            setAiGuidelinesAyuntamiento(t.ayuntamientos.guidelines);
          }
        }
      } catch (err) {
        console.warn('Could not load saved templates from API:', err);
      }
    };
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-auth-token'] = token;
        }
        const res = await fetch('/api/templates/stats', { headers });
        const data = await res.json();
        if (res.ok && data.success && data.stats) {
          setTemplateStats(data.stats);
        }
      } catch (err) {
        console.warn('Could not load template stats from API:', err);
      }
    };
    fetchTemplates();
    fetchStats();
  }, []);

  const handleSaveTemplates = async () => {
    const activeData = getActiveTemplateData();
    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: templateTab,
          subject: activeData.subject,
          body: activeData.body,
          guidelines: activeData.guidelines,
          customInstruction: templateCustomInstruction,
          toneRating: templateToneRating,
          contentRating: templateContentRating,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOptimizationFeedbackMsg(
          `✅ Plantilla y Pautas para [${activeData.title}] guardadas y ya se usarán al generar pitches para esta categoría.`
        );
        setTemplateCustomInstruction('');
        setTemplateToneRating(0);
        setTemplateContentRating(0);
      } else {
        alert('⚠️ Error al guardar en el servidor.');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      alert('⚠️ Error de conexión al guardar la plantilla.');
    }
  };

  const handleResetTemplate = async () => {
    if (!confirm(`¿Restaurar la plantilla de ${templateTab} a valores por defecto?`)) return;

    try {
      const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      const res = await fetch('/api/templates/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ category: templateTab }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const activeData = getActiveTemplateData();
        activeData.setSubject(data.template.subject);
        activeData.setBody(data.template.body);
        activeData.setGuidelines(data.template.guidelines);
        setOptimizationFeedbackMsg(`✅ ${data.message}`);
        setTemplateCustomInstruction('');
        setTemplateToneRating(0);
        setTemplateContentRating(0);
      } else {
        setOptimizationFeedbackMsg('⚠️ Error al resetear la plantilla.');
      }
    } catch (err) {
      console.error('Error resetting template:', err);
      setOptimizationFeedbackMsg('⚠️ Error de conexión al resetear la plantilla.');
    }
  };

  return {
    templateTab,
    setTemplateTab,
    testPromptResult,
    isTestingPrompt,
    isOptimizingTemplate,
    optimizationFeedbackMsg,
    setOptimizationFeedbackMsg,
    isGeneratingAllTemplates,
    handleGenerateAllFromBase,
    templateCustomInstruction,
    setTemplateCustomInstruction,
    templateToneRating,
    setTemplateToneRating,
    templateContentRating,
    setTemplateContentRating,
    templateStats,
    getActiveTemplateData,
    handleOptimizeTemplate,
    handleTestPrompt,
    handleSaveTemplates,
    handleResetTemplate,
  };
}
