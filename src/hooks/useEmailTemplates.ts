import { useState, useEffect } from 'react';

export type TemplateCategory = 'salas' | 'festivales' | 'discotecas' | 'medios' | 'grupos' | 'managements';

export function useEmailTemplates() {
 // Template states for Salas
 const [subjectTemplateSala, setSubjectTemplateSala] = useState('Propuesta de concierto: {bandName} (Fusión)');
 const [bodyTemplateSala, setBodyTemplateSala] = useState(`Hola equipo de booking de {{nombre_sala}},

Somos {bandName}, banda que fusiona {estilo}. Hemos visto su programación en {{ciudad}} y creemos que nuestra propuesta encaja perfecto para su público.

Disponemos de fechas abiertas para nuestra gira 2026. Les invitamos a ver nuestros directos de alta energía: {enlace_videos}

Un saludo,
{bandName} Agent Manager IA`);
 const [aiGuidelinesSala, setAiGuidelinesSala] = useState('Escribe siempre en un tono enérgico, cercano pero muy respetuoso con los programadores de salas. Enfatiza que disponemos de un potente show con violín enérgico, loops en directo y percusión reciclada, y que aseguramos llenar el aforo gracias a nuestra campaña de promo local.');

 // Template states for Festivales
 const [subjectTemplateFestival, setSubjectTemplateFestival] = useState('Propuesta de Cartel / Booking Festival: {bandName} (Live Show)');
 const [bodyTemplateFestival, setBodyTemplateFestival] = useState(`Hola equipo de producción y booking de {{nombre_sala}},

Escribimos de parte de {bandName} para presentar la propuesta de nuestro show directo para la próxima edición de {{nombre_sala}} en {{ciudad}}.

Nuestra propuesta combina una fiesta explosiva con un directo de alta energía en tiempo real, ideal para escenarios principales de tarde/noche. Hemos formado parte de eventos de gran formato destacando por la conexión total con el público.

Podéis ver nuestro dossier y directo aquí: {enlace_videos}

Quedamos a vuestra disposición para enviar rider técnico y caché de contratación.

Un saludo atento,
{bandName} Agent Manager IA`);
 const [aiGuidelinesFestival, setAiGuidelinesFestival] = useState('Tono muy profesional, conciso y enfocado a directores artísticos y jefes de producción de festivales. Destaca la capacidad de mantener el ritmo alto en un escenario de festival, la brevedad del cambio de línea técnico y el valor diferencial del show directo.');

 // Template states for Discotecas / Clubs
 const [subjectTemplateDiscoteca, setSubjectTemplateDiscoteca] = useState('Propuesta Live Show / Session Nocturna: {bandName} (Live Set)');
 const [bodyTemplateDiscoteca, setBodyTemplateDiscoteca] = useState(`Hola equipo de programación de {{nombre_sala}},

Os contactamos desde {bandName} para proponer una noche diferente en {{ciudad}}: un Live Performance & Clubbing Set de alta intensidad que fusiona ritmos bailables, instrumentos en directo y bases de potencia.

Nuestro formato está diseñado para horarios nocturnos en club/discoteca, manteniendo la pista encendida con bpm progresivos sin perder la energía orgánica de la música en vivo.

Vídeo promocional y sesión en directo: {enlace_videos}

¿Tenéis fechas libres para incorporar un set en vivo en vuestra programación nocturna?

Saludos cordiales,
{bandName} Agent Manager IA`);
 const [aiGuidelinesDiscoteca, setAiGuidelinesDiscoteca] = useState('Tono moderno, enfocado a clubes y discotecas de noche. Resalta que no somos un grupo acústico tradicional, sino un Live Set electrónico con impulsos bailables ideales para horario de clubbing o sesiones de madrugada.');

 // Template states for Medios de Comunicación & Prensa
 const [subjectTemplateMedio, setSubjectTemplateMedio] = useState('[Nota de Prensa / Dossier] {bandName} presenta su nuevo videoclip y gira');
 const [bodyTemplateMedio, setBodyTemplateMedio] = useState(`Hola equipo de redacción de {{nombre_sala}},

Nos ponemos en contacto desde {bandName}, proyecto independiente con propuesta enérgica y sonido propio.

Les remitimos nuestro último comunicado de prensa y dossier promocional con motivo del lanzamiento de nuestro nuevo videoclip y la gira de conciertos. Nos encantaría enviarles el tema en calidad broadcast para sonar en su programa/radio, o ponernos a su disposición para entrevistas, acústicos en directo o reseñas.

Dossier y videoclip oficial: {enlace_videos}
Material en alta resolución (fotos, bio y audio): {{website}}

Muchas gracias por su apoyo a la difusión de la música independiente,
{bandName} Agent Manager IA`);
 const [aiGuidelinesMedio, setAiGuidelinesMedio] = useState('Tono periodístico, profesional y directo para medios de comunicación (radio, podcasts, prensa escrita, blogs). Dirígete al redactor, locutor o equipo de redacción de prensa. Destaca la nota de prensa, la propuesta sonora y la disponibilidad para entrevistas, acústicos en estudio o reseñas.');

 // Template states for Grupos & Bandas (Co-Booking)
 const [subjectTemplateGrupo, setSubjectTemplateGrupo] = useState('Propuesta de concierto compartido e intercambio de fechas: {bandName} x {{nombre_sala}}');
 const [bodyTemplateGrupo, setBodyTemplateGrupo] = useState(`¡Buenas chavales de {{nombre_sala}}!

Os escribimos desde {bandName}. Nos mola mucho vuestro proyecto y creemos que nuestros estilos conectan genial en directo.

Queremos proponer un INTERCAMBIO DE FECHAS / CO-BOOKING para esta temporada:
1. Os invitamos a tocar con nosotros en nuestra ciudad compartiendo escenario y taquilla.
2. Vosotros nos invitáis a tocar en {{ciudad}} en vuestro espacio habitual.

Así aseguramos llenar las dos salas sumando ambos públicos y compartimos gastos de viaje y backline.

Podéis escuchar lo que hacemos aquí: {enlace_videos}

¿Cómo lo veis? ¿Hablamos por WhatsApp o hacemos llamada esta semana?

¡Un abrazo!
{bandName} Agent Manager IA`);
 const [aiGuidelinesGrupo, setAiGuidelinesGrupo] = useState('Tono de músico a músico: cercano, colega, directo y colaborativo. Propón claramente la estrategia de ganar-ganar (date swap), compartir público local, compartir backline y abaratar gastos de furgoneta.');

 // Template states for Managements & Agencias
 const [subjectTemplateManagement, setSubjectTemplateManagement] = useState('Propuesta de colaboración / Roster: {bandName} (Live Show)');
 const [bodyTemplateManagement, setBodyTemplateManagement] = useState(`Estimado equipo de {{nombre_sala}},

Nos dirigimos a vuestra agencia para presentar la propuesta artística de {bandName} con vista a posibles colaboraciones, coproducciones o inclusión en vuestro catálogo de booking para giras y festivales.

{bandName} es un proyecto consolidado de alta energía. Destacamos por una logística ágil, alta rentabilidad en venta de entradas y un directo arrollador probado en salas y festivales.

Dossier corporativo y resumen en vídeo: {enlace_videos}

Estaríamos encantados de agendar una breve reunión telefónica para valorar posibles sinergias.

Atentamente,
{bandName} Agent Manager IA`);
 const [aiGuidelinesManagement, setAiGuidelinesManagement] = useState('Tono ejecutivo-musical profesional para mánagers, agencias y agentes de booking. Destaca la profesionalidad técnica, el atractivo comercial, la sencillez logística del cuarteto y los datos positivos de aforo.');

 // Selected template category in Editor
 const [templateTab, setTemplateTab] = useState<TemplateCategory>('salas');
 const [testPromptResult, setTestPromptResult] = useState('');
 const [isTestingPrompt, setIsTestingPrompt] = useState(false);
 const [isOptimizingTemplate, setIsOptimizingTemplate] = useState(false);
 const [optimizationFeedbackMsg, setOptimizationFeedbackMsg] = useState<string | null>(null);
 const [templateCustomInstruction, setTemplateCustomInstruction] = useState('');
  const [templateToneRating, setTemplateToneRating] = useState<number>(0);
  const [templateContentRating, setTemplateContentRating] = useState<number>(0);

 const handleOptimizeTemplate = async () => {
   setIsOptimizingTemplate(true);
   setOptimizationFeedbackMsg(null);
   try {
     const activeData = getActiveTemplateData();
     const res = await fetch('/api/templates/optimize', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         category: templateTab,
         currentSubject: activeData.subject,
         currentBody: activeData.body,
         currentGuidelines: activeData.guidelines,
         customInstruction: templateCustomInstruction,
         toneRating: templateToneRating,
         contentRating: templateContentRating
       })
     });
     const data = await res.json();
     if (res.ok && data.success && data.optimized) {
       activeData.setSubject(data.optimized.subject);
       activeData.setBody(data.optimized.body);
       activeData.setGuidelines(data.optimized.guidelines);
       
       setTestPromptResult(`Asunto: ${data.optimized.subject}

${data.optimized.body}`);
       
       const countNote = data.feedbackCountUsed > 0 
         ? `Aplicado aprendizaje de ${data.feedbackCountUsed} valoraciones previas del mánager.`
         : 'Refrescada con pautas de estilo de Bakandeya.';
       const ratingsAppliedNote = (templateToneRating > 0 || templateContentRating > 0)
         ? ` (Estrellitas aplicadas: Tono ${templateToneRating || '-'}/5, Contenido ${templateContentRating || '-'}/5)`
         : '';

       setOptimizationFeedbackMsg(`✨ Plantilla re-generada con IA: ${data.optimized.explanation || countNote}${ratingsAppliedNote}`);
       setTemplateCustomInstruction('');
       setTemplateToneRating(0);
       setTemplateContentRating(0);
     } else {
       setOptimizationFeedbackMsg('⚠️ No se pudo re-generar la plantilla. Inténtalo de nuevo.');
     }
   } catch (err) {
     console.error('Error optimizing template:', err);
     setOptimizationFeedbackMsg('⚠️ Error de conexión al re-generar la plantilla.');
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
 desc: 'Propuestas directas de fechas, aforo, taquilla/caché e invitaciones a programadores de salas.'
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
 desc: 'Presentación de dossier, rider técnico compacto y propuesta para escenarios principales de festival.'
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
 desc: 'Live Performance & Clubbing set para horarios nocturnos y sesiones de madrugada.'
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
 desc: 'Nota de prensa, material de difusión, bio/fotos y propuesta para sonar en antena o entrevistas.'
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
 desc: 'Intercambio de fechas (Date Swap), doble cartel en sala grande y compartir furgoneta/backline.'
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
 desc: 'Propuestas corporativas para coproducción, representación de gira e inclusión en catálogo.'
 };
 }
 };

 const handleTestPrompt = () => {
 setIsTestingPrompt(true);
 setTestPromptResult('');
 
 const activeData = getActiveTemplateData();
 
 setTimeout(() => {
 if (templateTab === 'medios') {
 setTestPromptResult(`Asunto: [Nota de Prensa / Radio 3] Bakandeya presenta su gira y single 2026

Hola equipo de redacción de Radio 3 / Revista Musical,

Os enviamos la nota de prensa de Bakandeya para su difusión en medios. Siguiendo las directrices de prensa ("${activeData.guidelines.substring(0, 55)}..."), destacamos nuestro concepto sonoro que fusiona balkan-ska, violín enérgico, loops y percusión reciclada con electrónica.

Nos encantaría ponernos a vuestra disposición para una entrevista en estudio, un acústico en directo o la presentación del nuevo videoclip.

Adjuntamos fotos en alta resolución, bio y enlace al videoclip: https://youtube.com/bakandeya_live

Un saludo muy atento,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'festivales') {
 setTestPromptResult(`Asunto: Propuesta de Cartel / Booking Festival: Bakandeya (Balkan Ska & Electronic Live)

Hola equipo de producción y booking del Festival Ejemplo,

Escribimos de parte de Bakandeya para presentar la propuesta de nuestro show directo de alta energía. Siguiendo las directrices de festival ("${activeData.guidelines.substring(0, 50)}..."), hemos optimizado la logística del escenario.

Disponemos de un cuarteto con violín virtuosístico, loops y sintetizadores en tiempo real ideal para escenarios principales de tarde/noche.

Dossier y vídeo promocional: https://youtube.com/bakandeya_live

Quedamos a su disposición.

Atentamente,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'discotecas') {
 setTestPromptResult(`Asunto: Propuesta Live Performance & Clubbing: Bakandeya

Hola equipo de programación de Discoteca Ejemplo,

Os contactamos desde Bakandeya para proponer una sesión en vivo de electro-balkan & ska instrumental en horario nocturno. Siguiendo las pautas de clubbing ("${activeData.guidelines.substring(0, 50)}..."), nuestro set mantiene la pista en tensión constante.

Vídeo promocional: https://youtube.com/bakandeya_live

¿Tenéis fechas libres para un live set nocturno?

Un saludo,
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'grupos') {
 setTestPromptResult(`Asunto: Propuesta de concierto compartido e intercambio de fechas: Bakandeya x Banda Ejemplo

¡Buenas chavales de Banda Ejemplo!

Os escribimos desde Bakandeya. Siguiendo las pautas de co-booking entre bandas ("${activeData.guidelines.substring(0, 50)}..."), nos mola mucho vuestro proyecto y queremos proponer un INTERCAMBIO DE FECHAS (Date Swap):

1. Os invitamos a tocar con nosotros en Madrid/Sevilla compartiendo taquilla al 50%.
2. Montamos fecha conjunta en vuestra ciudad natal para llenar el local sumando ambas aficiones y compartir furgoneta.

¿Cómo lo veis? ¿Hablamos esta semana?

¡Un abrazo!
Bakandeya Agent Manager IA`);
 } else if (templateTab === 'managements') {
 setTestPromptResult(`Asunto: Propuesta de colaboración / Roster 2026: Bakandeya

Estimado equipo de Agencia Ejemplo,

Nos dirigimos a vuestra oficina para presentar la propuesta de Bakandeya con vista a posibles coproducciones o inclusión en catálogo. Siguiendo las pautas de agencias ("${activeData.guidelines.substring(0, 50)}..."), destacamos la solidez de nuestro cuarteto con violín solista.

Dossier corporativo: https://youtube.com/bakandeya_live

Atentamente,
Bakandeya Agent Manager IA`);
 } else {
 setTestPromptResult(`Asunto: Propuesta de concierto: Bakandeya en Sala Ejemplo

Hola equipo de booking de Sala Ejemplo,

Le escribimos de parte de Bakandeya. Siguiendo sus pautas de directo ("${activeData.guidelines.substring(0, 50)}..."), hemos adaptado nuestro show para vuestro aforo. Disponemos de un cuarteto con violín enérgico, loops, percusión reciclada y una electrónica demoledora en directo.

¿Qué os parece el viernes 23 de Octubre de 2026?

Atentamente,
Bakandeya Agent Manager IA`);
 }
 setIsTestingPrompt(false);
 }, 1200);
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
        }
      } catch (err) {
        console.warn('Could not load saved templates from API:', err);
      }
    };
    fetchTemplates();
  }, []);

 const handleSaveTemplates = async () => {
   const activeData = getActiveTemplateData();
   try {
     const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
     const headers: Record<string, string> = {
       'Content-Type': 'application/json'
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
         contentRating: templateContentRating
       })
     });
     const data = await res.json();
     if (res.ok && data.success) {
       setOptimizationFeedbackMsg(`✅ Plantilla y Pautas para [${activeData.title}] guardadas en Memoria IA, Supabase (tab plantillas_pautas_ia) y PROMPTS_AGENTES_IA.md.`);
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

  return {
    templateTab, setTemplateTab,
    testPromptResult, isTestingPrompt,
    isOptimizingTemplate, optimizationFeedbackMsg, setOptimizationFeedbackMsg,
    templateCustomInstruction, setTemplateCustomInstruction,
    templateToneRating, setTemplateToneRating,
    templateContentRating, setTemplateContentRating,
    getActiveTemplateData,
    handleOptimizeTemplate,
    handleTestPrompt,
    handleSaveTemplates,
  };
}
