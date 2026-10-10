/**
 * Contenido de la pestaña de logística activa: hoja de ruta, escaleta, contactos, merchandising, cierre o material.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Download } from "lucide-react";
import { escapeHtml } from "../../../utils/escapeHtml";
import { Input,Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import { ClosingChecklistTab } from "./ClosingChecklistTab";
import { ContactsTab } from "./ContactsTab";
import { GearChecklistTab } from "./GearChecklistTab";
import { MerchTab } from "./MerchTab";
import { RunOfShowTab } from "./RunOfShowTab";

/**
 * Contenido de la pestaña de logística activa: hoja de ruta, escaleta, contactos, merchandising, cierre o material.
 * @returns Sección de interfaz.
 */
export function LogisticsTabContent() {
  const { activeTab, allRoadbooks, selectedDateKey, selectedConcert, textSub, saveRoadbook, activeBandName, selectedEventTitle, selectedDate, selectedEventDetails, isPromoPlan, currentRunOfShow, currentGear } = useCalendar();
  return (
    <>
      {/* Content for Subtabs */}
       {activeTab === 'roadbook' ? (
         <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-micro">
           {(() => {
             const currentRb = allRoadbooks[selectedDateKey] || {
               contactoPromotor: 'Manuel (Producción)',
               telefonoPromotor: '+34 654 321 987',
               tecnicoSonido: 'FOH',
               hotelNombre: 'Hotel de Gira',
               hotelDireccion: selectedConcert?.ciudad || 'Por confirmar',
               cateringInfo: 'Cena tras prueba de sonido',
               inputList:
                 '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)',
             };

             return (
               <div className="space-y-3">
                 <div className={`p-3 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--surface)]'}`}>
                   <div className="flex items-center justify-between">
                     <span className={`text-micro font-mono font-bold ${'text-[var(--acc)]'}`}>
                       <ShowIcon inline emoji="📞" />Contacto producción y hotel
                     </span>
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-micro">
                     <div>
                       <label className={`block text-micro font-mono ${textSub}`}>Promotor / sala</label>
                       <Input size="sm" aria-label="Promotor / sala"
                         type="text"
                         value={currentRb.contactoPromotor}
                         onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, contactoPromotor: e.target.value })}
                         className="w-full"
                       />
                     </div>
                     <div>
                       <label className={`block text-micro font-mono ${textSub}`}>Teléfono</label>
                       <Input size="sm" aria-label="Teléfono"
                         type="text"
                         value={currentRb.telefonoPromotor}
                         onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, telefonoPromotor: e.target.value })}
                         className="w-full"
                       />
                     </div>
                   </div>

                   <div>
                     <label className={`block text-micro font-mono ${textSub}`}>Hotel Alojamientos</label>
                     <Input size="sm" aria-label="Hotel Alojamientos"
                       type="text"
                       value={currentRb.hotelNombre}
                       onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, hotelNombre: e.target.value })}
                       className="w-full"
                     />
                   </div>

                   <div>
                     <label className={`block text-micro font-mono ${textSub}`}>Catering y Menús</label>
                     <Input size="sm" aria-label="Catering y Menús"
                       type="text"
                       value={currentRb.cateringInfo}
                       onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, cateringInfo: e.target.value })}
                       className="w-full"
                     />
                   </div>
                 </div>

                 <div className={`p-3 rounded-[var(--r-m)] space-y-1.5 ${'bg-[var(--surface)]'}`}>
                   <span className={`text-micro font-mono font-bold ${'text-[var(--acc)]'}`}>
                     <ShowIcon inline emoji="🎸" />Input list / rider de canales
                   </span>
                   <Textarea
                     rows={4}
                     value={currentRb.inputList}
                     onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, inputList: e.target.value })}
                     className="w-full"
                   />
                 </div>

                 <button
                   type="button"
                   onClick={() => {
                     const currentRbData = allRoadbooks[selectedDateKey] || currentRb;
                     const printWindow = window.open('', '_blank');
                     if (!printWindow) return;
                     printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>Hoja de Ruta - ${selectedConcert ? selectedConcert.sala : 'Concierto'}</title>
 <style>
 body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #111; line-height: 1.5; }
 h1 { font-size: 22px; margin: 0; text-transform:; color: #d97706; }
 h2 { font-size: 14px; color: #555; margin-top: 2px; margin-bottom: 20px; font-weight: normal; }
 .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; font-weight: bold; border-radius: 4px; font-size: 11px; font-family: monospace; }
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
 .card { : 1px solid #e5e7eb; padding: 12px 15px; border-radius: 8px; background: #fafafa; }
 .card-title { font-size: 11px; text-transform:; font-weight: bold; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 6px; }
 .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px; }
 .time { font-weight: bold; font-family: monospace; color: #d97706; width: 60px; }
 pre { font-family: monospace; font-size: 11px; background: #fff; padding: 10px; : 1px solid #e5e7eb; border-radius: 6px; white-space: pre-wrap; margin: 0; }
 .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
 </style>
 </head>
 <body>
 <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f59e0b; padding-bottom:12px; margin-bottom:20px;">
 <div>
 <h1>${escapeHtml(activeBandName)} — Hoja de Ruta de Gira</h1>
 <h2>${selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` : selectedEventTitle}</h2>
 </div>
 <div>
 <span class="badge">FECHA: ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}</span>
 </div>
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">📍 Ubicación y Logística</div>
 <p style="margin:2px 0; font-size:13px; font-weight:bold;">${selectedEventDetails.lugar}</p>
 <p style="margin:2px 0; font-size:11px; color:#555;">${selectedEventDetails.direccion || 'Dirección no especificada'}</p>
 ${!isPromoPlan ? `<p style="margin:8px 0 2px 0; font-size:11px;"><strong>Caché / Condición:</strong> ${selectedEventDetails.fee}</p>` : ''}
 </div>

 <div class="card">
 <div class="card-title">📞 Contactos y Hotel</div>
 <p style="margin:2px 0; font-size:11px;"><strong>Promotor/Contacto:</strong> ${currentRbData.contactoPromotor} (${currentRbData.telefonoPromotor})</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Técnico Sonido:</strong> ${currentRbData.tecnicoSonido}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Hotel:</strong> ${currentRbData.hotelNombre}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Catering:</strong> ${currentRbData.cateringInfo}</p>
 </div>
 </div>

 <div class="card" style="margin-bottom: 20px;">
 <div class="card-title">⏱️ Horarios / Run of Show</div>
 ${
   currentRunOfShow.length === 0
     ? '<p style="font-size:11px; color:#888;">Sin horarios definidos.</p>'
     : currentRunOfShow
      .map(
        (i) => `
 <div class="item-row">
 <span class="time">${i.time}</span>
 <span style="flex:1;">${i.activity}</span>
 </div>
 `
      )
      .join('')
 }
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">🎸 Lista de Canales / Input List (Rider)</div>
 <pre>${currentRbData.inputList}</pre>
 </div>
 <div class="card">
 <div class="card-title">🎒 Check-list Cacharros y Backline</div>
 ${
   currentGear.length === 0
     ? '<p style="font-size:11px; color:#888;">Sin material asignado.</p>'
     : currentGear
      .map(
        (g) => `
 <div class="item-row">
 <span>${g.checked ? '☑' : '☐'} ${g.label}</span>
 </div>
 `
      )
      .join('')
 }
 </div>
 </div>

 <div class="footer">
 Documento Oficial de Gira • Generado por BandManager
 </div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
                     printWindow.document.close();
                   }}
                   className={`w-full py-2 px-3 rounded-[var(--r-m)] font-mono text-micro font-bold flex items-center justify-center gap-2 cursor-pointer transition-ui ${
                     'bg-[var(--acc)]  text-[var(--on-acc)]'
                   }`}
                 >
                   <Download className="w-3.5 h-3.5" />
                   <span>Imprimir / exportar hoja de ruta (PDF)</span>
                 </button>
               </div>
             );
           })()}
         </div>
       ) : activeTab === 'tecnica' ? (
         <RunOfShowTab />
       ) : activeTab === 'contactos' ? (
         <ContactsTab />
       ) : activeTab === 'merchan' ? (
         <MerchTab />
       ) : activeTab === 'cierre' ? (
         <ClosingChecklistTab />
       ) : (
         <GearChecklistTab />
       )}
    </>
  );
}
