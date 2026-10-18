/**
 * Pestaña de logística técnica (horarios, PA, monitores, backline).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Clock,Truck,Wrench } from "lucide-react";
import { Input,Textarea } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useEventDetail } from "./EventDetailContext";

/**
 * Pestaña de logística técnica (horarios, PA, monitores, backline).
 * @returns Sección de interfaz.
 */
export function TechnicalLogisticsTab() {
  const { modalActiveTab, textTitle, textSub, modalRoadbook, updateRoadbookField, modalRoadbookKey } = useEventDetail();
  return (
    <>
{/* TAB 2: 1. LOGÍSTICA TÉCNICA */}
            {modalActiveTab === 'tecnica' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)] text-[var(--on-acc)]">
                      Sección 1
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Logística técnica, horarios y rider</h3>
                  </div>
                  <span className="text-micro font-mono text-[var(--ink-2)]">Guardado automático local</span>
                </div>

                {/* Horarios de Producción */}
                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-3 ${'bg-[var(--sunken)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cronograma de producción del día</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>Llegada / descarga</label>
                      <Input
                        size="sm"
                        type="text"
                        value={modalRoadbook.horaLlegada || '17:00'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaLlegada: e.target.value })}
                        placeholder="17:00"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>Prueba sonido</label>
                      <Input
                        size="sm"
                        type="text"
                        value={modalRoadbook.horaPruebaSonido || '18:00 - 19:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaPruebaSonido: e.target.value })}
                        placeholder="18:00 - 19:30"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>Apertura Puertas</label>
                      <Input
                        size="sm"
                        type="text"
                        value={modalRoadbook.horaAperturaPuertas || '20:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaAperturaPuertas: e.target.value })}
                        placeholder="20:30"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 text-[var(--acc)]`}>Show / directo</label>
                      <Input
                        size="sm"
                        type="text"
                        value={modalRoadbook.horaShow || '21:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaShow: e.target.value })}
                        placeholder="21:30"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>Toque de Queda</label>
                      <Input
                        size="sm"
                        type="text"
                        value={modalRoadbook.horaCierreToque || '01:00'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaCierreToque: e.target.value })}
                        placeholder="01:00"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Sonido P.A. & Monitores */}
                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-3 ${'bg-[var(--sunken)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Sistema de Sonido (P.A. & Monitoreo)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>
                        Especificaciones P.A. de sala
                      </label>
                      <Textarea
                        rows={2}
                        value={modalRoadbook.paEspecificaciones || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { paEspecificaciones: e.target.value })}
                        placeholder="Ej: Line Array L-Acoustics / D&B, subwoofers estéreo, presión homogénea"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>
                        Monitoreo (In-Ears / Cuñas)
                      </label>
                      <Textarea
                        rows={2}
                        value={modalRoadbook.monitoresTipo || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { monitoresTipo: e.target.value })}
                        placeholder="Ej: In-Ears estéreo de la banda (traemos transmisores) + 2 cuñas de refuerzo"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>
                      Canales de envíos auxiliares
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      value={modalRoadbook.canalesMonitores || ''}
                      onChange={(e) => updateRoadbookField(modalRoadbookKey, { canalesMonitores: e.target.value })}
                      placeholder="Ej: 4 envíos auxiliares XLR independientes a rack de IEMs"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Backline y Electricidad */}
                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-3 ${'bg-[var(--sunken)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Backline aportado vs traído y toma eléctrica</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>Backline (Sala vs banda)</label>
                      <Textarea
                        rows={3}
                        value={modalRoadbook.backlineInfo || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { backlineInfo: e.target.value })}
                        placeholder="Sala aporta: Batería básica. Banda trae: Platos, pedal, guitarras, amplificadores y teclado."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={`block text-micro font-mono font-bold mb-1 ${textSub}`}>
                        Potencia y tomas eléctricas en escenario
                      </label>
                      <Textarea
                        rows={3}
                        value={modalRoadbook.potenciaElectrica || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { potenciaElectrica: e.target.value })}
                        placeholder="Ej: 2 líneas independientes Schuko 220V 16A limpias (frontal y trasera)"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Input List / Rider de Canales */}
                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-2.5 ${'bg-[var(--sunken)]'}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
                      <span><ShowIcon inline emoji="🎛️" /></span>
                      <span>Input list / lista de canales de microfonía</span>
                    </h4>
                    <span className="text-micro font-mono text-[var(--ink-2)]">
                      {(modalRoadbook.inputList || '').split('\n').filter(Boolean).length} canales especificados
                    </span>
                  </div>
                  <Textarea
                    rows={6}
                    value={modalRoadbook.inputList || ''}
                    onChange={(e) => updateRoadbookField(modalRoadbookKey, { inputList: e.target.value })}
                    placeholder="1. Bombo (Beta 52)&#10;2. Caja Top (SM57)&#10;3. Bajo (D.I. Radial)&#10;4. Guitarra (e906)&#10;5. Voz (Beta 58)…"
                    className="w-full"
                  />
                </div>

                {/* Notas de Producción y Carga */}
                <div
                  className={`p-4 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--sunken)]'}`}
                >
                  <label className={`block text-micro font-mono font-bold ${textSub}`}>
                    Notas de acceso, muelle de carga y observaciones
                  </label>
                  <Textarea
                    rows={2}
                    value={modalRoadbook.notasTecnicas || ''}
                    onChange={(e) => updateRoadbookField(modalRoadbookKey, { notasTecnicas: e.target.value })}
                    placeholder="Ej: Acceso por puerta trasera calle peatonal. Se requiere autorización de matrícula para la furgoneta."
                    className="w-full"
                  />
                </div>
              </div>
            )}
    </>
  );
}
