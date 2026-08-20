import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { Lead } from '../types';

export function useNegotiationSimulation(
  selectedLead: Lead | null,
  setSelectedLead: (updater: (prev: Lead | null) => Lead | null) => void,
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void,
  setManualEmailStatus: (status: string) => void
) {
 // Advanced Simulation States
 const [isSimulatingAvanzado, setIsSimulatingAvanzado] = useState(false);
 const [simulationRole, setSimulationRole] = useState<'sala' | 'banda'>('sala');
 const [simulationScenario, setSimulationScenario] = useState('taquilla');
 const [simulationCustomInstruction, setSimulationCustomInstruction] = useState('');
 const [simulationSenderName, setSimulationSenderName] = useState('Programación');
 const [simulationSubject, setSimulationSubject] = useState('');
 const [simulationMessage, setSimulationMessage] = useState('');
 const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);
 const [simulationGenerated, setSimulationGenerated] = useState(false);

 const PREDEFINED_SCENARIOS = {
 sala: [
 { key: 'taquilla', label: 'Interés y reparto de taquilla (70/30 o similar)', defaultInstruction: 'La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.' },
 { key: 'rider', label: 'Exigencias de Rider Técnico y horarios', defaultInstruction: 'La sala está interesada pero exige revisar detalladamente el rider de violín, percusión y sintetizadores analógicos, y pregunta por la hora de montaje de Bakandeya.' },
 { key: 'lleno', label: 'Rechazo amable por calendario lleno', defaultInstruction: 'La sala felicita a la banda por su dossier pero explica que tiene el calendario de otoño cerrado. Ofrece dejar el contacto para la gira de primavera.' },
 { key: 'contrato', label: 'Aceptación final y petición de datos fiscales', defaultInstruction: 'La sala confirma la fecha sugerida en el pitch, acepta las condiciones de la banda y solicita los datos fiscales (CIF, dirección, representante) para redactar el contrato oficial.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ],
 banda: [
 { key: 'contrapropuesta', label: 'Contrapropuesta de fecha (Fin de semana) y co-organización', defaultInstruction: 'Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.' },
 { key: 'aceptacion_rider', label: 'Aceptación de condiciones y especificación de sintetizadores', defaultInstruction: 'Diego (guitarra) responde aceptando el reparto de taquilla propuesto y especifica que los sintetizadores analógicos van listos en dos líneas estéreo balanceadas.' },
 { key: 'cache_minimo', label: 'Solicitud de caché o mínimo garantizado para cubrir furgoneta', defaultInstruction: 'Filgue (bajo) responde explicando de forma amigable que al viajar desde Madrid/Sevilla necesitan un mínimo garantizado de 300€ para cubrir gastos de gasolina y viaje.' },
 { key: 'custom', label: 'Instrucción libre personalizada...', defaultInstruction: '' }
 ]
 };

 const handleRoleChange = (role: 'sala' | 'banda') => {
 setSimulationRole(role);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 if (role === 'sala') {
 setSimulationSenderName(selectedLead ? `Programador de ${selectedLead.nombre_sala}` : 'Programación');
 setSimulationScenario('taquilla');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 } else {
 setSimulationSenderName('Bakandeya Agent Manager IA');
 setSimulationScenario('contrapropuesta');
 setSimulationSubject(selectedLead?.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('Bakandeya Agent Manager IA responde sugiriendo cambiar un concierto propuesto en miércoles a un viernes o sábado de noviembre, y sugiere compartir cartel con una banda local para asegurar aforo.');
 }
 };

 const handleScenarioChange = (scenarioKey: string) => {
 setSimulationScenario(scenarioKey);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 const scenarios = simulationRole === 'sala' ? PREDEFINED_SCENARIOS.sala : PREDEFINED_SCENARIOS.banda;
 const found = scenarios.find(s => s.key === scenarioKey);
 if (found) {
 setSimulationCustomInstruction(found.defaultInstruction);
 }
 };

 const handleOpenAdvancedSimulation = () => {
 if (!selectedLead) return;
 setIsSimulatingAvanzado(true);
 setSimulationGenerated(false);
 setSimulationMessage('');
 
 setSimulationRole('sala');
 setSimulationScenario('taquilla');
 setSimulationSenderName(`Programador de ${selectedLead.nombre_sala}`);
 setSimulationSubject(selectedLead.hilo_emails && selectedLead.hilo_emails.length > 0
 ? `RE: ${selectedLead.hilo_emails[selectedLead.hilo_emails.length - 1].asunto}`
 : 'Re: Propuesta de concierto - Bakandeya');
 setSimulationCustomInstruction('La sala muestra gran interés por el directo. Propone una fecha de viernes o sábado de noviembre, un reparto de taquilla del 70/30 a favor de la banda, y entradas a 12€.');
 };

 const handleGenerateSimulationEmail = async () => {
 if (!selectedLead) return;
 setIsGeneratingSimulation(true);
 try {
 const res = await apiFetch('/api/generate-simulated-email', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId: selectedLead.id,
 role: simulationRole,
 scenario: simulationScenario,
 customInstruction: simulationCustomInstruction,
 senderName: simulationSenderName
 })
 });
 if (res.ok) {
 const data = await res.json();
 setSimulationMessage(data.message);
 setSimulationGenerated(true);
 } else {
 alert('Error al generar la simulación.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión al generar la simulación.');
 } finally {
 setIsGeneratingSimulation(false);
 }
 };

 const handleCommitSimulation = () => {
 if (!selectedLead || !simulationMessage) return;

 const now = new Date();
 const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

 const newMsg = {
 id: `em-sim-${Date.now()}`,
 fecha: fechaStr,
 remitente: simulationRole,
 remitente_nombre: simulationSenderName,
 asunto: simulationSubject || 'Re: Propuesta de concierto - Bakandeya',
 mensaje: simulationMessage
 };

 const currentHilo = selectedLead.hilo_emails || [];
 const nuevoHilo = [...currentHilo, newMsg];
 
 let nuevoEstado = selectedLead.estado;
 if (simulationRole === 'sala') {
 const lowerMsg = simulationMessage.toLowerCase();
 if (lowerMsg.includes('cerrado') || lowerMsg.includes('lo siento') || lowerMsg.includes('lleno')) {
 // No cambia de estado a negociando si es un rechazo claro
 } else {
 nuevoEstado = 'negociando';
 }
 } else {
 if (selectedLead.estado === 'nuevo' || selectedLead.estado === 'pendiente_aprobacion' || selectedLead.estado === 'aprobado') {
 nuevoEstado = 'esperando_respuesta';
 }
 }

 const today = new Date().toISOString().split('T')[0];
 const roleLabel = simulationRole === 'sala' ? 'sala' : 'banda';
 const nuevaNota = `*** [${today}] Correo de simulación de ${roleLabel} (${simulationSenderName}) ***\n` + (selectedLead.notas || '');

 onUpdateLead(selectedLead.id, {
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 });

 setSelectedLead(prev => prev ? {
 ...prev,
 hilo_emails: nuevoHilo,
 estado: nuevoEstado,
 notas: nuevaNota,
 fecha_ultima_respuesta: today
 } : null);

 setIsSimulatingAvanzado(false);
 setManualEmailStatus(`¡Simulación completada! Correo de ${simulationRole === 'sala' ? 'sala' : 'banda'} registrado y sincronizado.`);
 setTimeout(() => {
 setManualEmailStatus('');
 }, 5000);
 };

  return {
    isSimulatingAvanzado, setIsSimulatingAvanzado,
    simulationRole,
    simulationScenario,
    simulationCustomInstruction, setSimulationCustomInstruction,
    simulationSenderName, setSimulationSenderName,
    simulationSubject, setSimulationSubject,
    simulationMessage, setSimulationMessage,
    isGeneratingSimulation,
    simulationGenerated,
    PREDEFINED_SCENARIOS,
    handleRoleChange,
    handleScenarioChange,
    handleOpenAdvancedSimulation,
    handleGenerateSimulationEmail,
    handleCommitSimulation,
  };
}
