/**
 * Cuerpo del Atril: cifrado, estructura, diagramas y panel de ideas según la pestaña.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Edit3,GraduationCap,Save,UserCheck,Zap } from "lucide-react";
import { DrawerDiagramas } from "../chords/DrawerDiagramas";
import { PanelArmonia } from "../chords/PanelArmonia";
import { ProfesorIA } from "../chords/ProfesorIA";
import { SelectorArmonia } from "../chords/SelectorArmonia";
import { Button,Input,LinkButton,Textarea } from "../ui";
import { useAtril } from "./AtrilContext";
import { renderFormattedChordSheet } from "./chordSheetRender";

/**
 * Cuerpo del Atril: cifrado, estructura, diagramas y panel de ideas según la pestaña.
 * @returns Sección de interfaz.
 */
export function AtrilBody() {
  const { buscarEnAudio, scrollContainerRef, activeTab, guiaSustituto, setActiveTab, armonia, estiloArmonia, cambiarEstiloArmonia, funcionesPresentes, acordesPorFuncion, nombreTonalidadVista, processedText, lineasConLetra, letraTranscrita, seguirEnCifrado, letraActiva, audioRef, sincronizado, alineacion, analisisAcordes, tiemposAcordes, acordeActivo, transpose, song, notation, pedirProfesor, handleSaveEdits, cifradoTexto, setCifradoTexto, setGuiaSustituto, showChordDiagrams, uniqueChords, contextoAcordes, vistaAcordes, setVistaAcordes, setShowChordDiagrams, acordeSonando } = useAtril();
  return (
    <>
      <div className="shrink-0 h-[75vh] md:h-auto md:flex-1 md:shrink overflow-hidden flex flex-col md:flex-row relative">
        {/* MAIN CONTENT AREA */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
        >
          {/* TAB 1: CHORDS & LYRICS SHEET (LaCuerda style) */}
          {activeTab === "chords" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* SUBSTITUTE QUICK SUMMARY BANNER */}
              {guiaSustituto?.estructura && (
                <div className="bg-[var(--acc)]/40 p-3.5 rounded-[var(--r-m)] text-xs font-sans space-y-1.5">
                  <div className="flex items-center justify-between text-[var(--tentative)]/80 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[var(--acc)]" />
                      Estructura Rápida para el Músico:
                    </span>
                    <LinkButton
                      size="xs"
                      onClick={() => setActiveTab("substitute")}
                    >
                      Ver ficha completa →
                    </LinkButton>
                  </div>
                  <p className="text-[var(--ink-2)] text-sm font-semibold bg-[var(--sunken)] p-2 rounded-[var(--r-s)]5">
                    {guiaSustituto.estructura}
                  </p>
                </div>
              )}

              {/* THE CHORD SHEET DISPLAY */}
              {armonia && (
                <SelectorArmonia
                  estilo={estiloArmonia}
                  onCambio={cambiarEstiloArmonia}
                  resumen={`${armonia.tonalidad.nombre.replace("m", " menor").replace(/^([A-G]#?)$/, "$1 mayor")} · ${armonia.modo.nombre}${armonia.tonalidadEstimada ? " (estimado)" : ""}`}
                  presentes={funcionesPresentes}
                  acordesPorFuncion={acordesPorFuncion}
                  nombreTonalidad={nombreTonalidadVista}
                />
              )}
              <div translate="no" className="notranslate bg-[var(--sunken)] p-6 rounded-[var(--r-l)] font-sans text-sm leading-relaxed whitespace-pre-wrap select-text">
                {renderFormattedChordSheet(
                  processedText,
                  lineasConLetra && letraTranscrita && seguirEnCifrado
                    ? {
                        porLinea: lineasConLetra,
                        lineas: letraTranscrita,
                        activa: letraActiva,
                        onSeek: buscarEnAudio,
                      }
                    : undefined,
                  sincronizado && alineacion && analisisAcordes
                    ? {
                        pares: alineacion.pares,
                        tiempos: tiemposAcordes,
                        activo: acordeActivo,
                        audioRef,
                        duracion: analisisAcordes.duracionSegundos,
                        onSeek: buscarEnAudio,
                      }
                    : undefined,
                  armonia ? { tonalidad: armonia.tonalidad, transpose, estilo: estiloArmonia, nombreTonalidad: nombreTonalidadVista } : undefined,
                )}
              </div>
            </div>
          )}

          {/* TAB: ARMONÍA (profesor determinista) */}
          {activeTab === "armonia" && (
            armonia ? (
              <PanelArmonia
                armonia={armonia}
                analisis={analisisAcordes}
                bpm={song.bpm}
                notation={notation}
                transpose={transpose}
                estilo={estiloArmonia}
                profesor={
                  analisisAcordes ? (
                    <ProfesorIA profesor={analisisAcordes.profesor} onPedir={pedirProfesor} />
                  ) : (
                    <p className="text-xs text-[var(--ink-2)]">Para pedir la explicación del profesor, primero analiza los acordes del audio («Acordes del audio»).</p>
                  )
                }
              />
            ) : (
              <div className="max-w-xl mx-auto text-center space-y-2 py-10 font-sans">
                <GraduationCap className="w-10 h-10 mx-auto text-[var(--ink-2)]" />
                <p className="font-bold text-[var(--ink)]">Aún no hay armonía que contar.</p>
                <p className="text-sm text-[var(--ink-2)]">
                  Escribe el cifrado de la canción o pulsa «Acordes del audio» y aquí verás la tonalidad, el modo, los grados y qué tocar sobre cada acorde.
                </p>
              </div>
            )
          )}

          {/* TAB 2: SUBSTITUTE QUICK GUIDE (FICHA PARA MÚSICO SUSTITUTO) */}
          {activeTab === "substitute" && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="bg-[var(--acc)] p-6 rounded-[var(--r-l)] space-y-5">
                <div className="flex items-center gap-3/30 pb-4">
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)]">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">
                      Ficha de sustitución urgente
                    </h3>
                    <p className="text-xs text-[var(--tentative)]/80 font-sans">
                      Resumen express para tocar el tema correctamente en
                      directo o ensayo sin margen de error.
                    </p>
                  </div>
                </div>

                {/* GUIDES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                    <span className="text-[var(--acc)] font-bold block text-xs">
                      1. Estructura Exacta del Tema
                    </span>
                    <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
                      {guiaSustituto.estructura ||
                        "Sin estructura definida."}
                    </p>
                  </div>

                  <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                    <span className="text-[var(--ok)] font-bold block text-xs">
                      2. Progresión Armónica Clave
                    </span>
                    <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
                      {guiaSustituto.progresionClave ||
                        "Ver cifrado completo."}
                    </p>
                  </div>

                  <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                    <span className="text-[var(--alert)] font-bold block text-xs">
                      3. Cortes, Entradas y Claves
                    </span>
                    <p className="text-[var(--ink-2)] leading-relaxed">
                      {guiaSustituto.cortesYClaves ||
                        "Sin indicaciones especiales de cortes."}
                    </p>
                  </div>

                  <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                    <span className="text-[var(--tentative)]/80 font-bold block text-xs">
                      4. Capo / afinación
                    </span>
                    <p className="text-[var(--ink-2)] leading-relaxed">
                      {guiaSustituto.capoTraste || "Standard / Sin Capo"}
                    </p>
                  </div>

                  <div className="sm:col-span-2 bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                    <span className="text-[var(--acc)] font-bold block text-xs">
                      5. Protagonismo de instrumentos / arreglos
                    </span>
                    <p className="text-[var(--ink-2)] leading-relaxed">
                      {guiaSustituto.instrumentosClave ||
                        "Seguir el pulso principal de batería y bajo."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar esta ficha de sustitución</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT MODE */}
          {activeTab === "edit" && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
              <div className="bg-[var(--surface)]/90 p-5 rounded-[var(--r-l)] space-y-4">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="font-bold text-[var(--ink)] flex items-center gap-2 text-sm font-sans">
                    <Edit3 className="w-4 h-4 text-[var(--acc)]" />
                    Editor de cifrado y ficha
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleSaveEdits}
                    className="items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-sans font-bold text-[var(--acc)] block mb-1">
                    Texto con Letra y Acordes (Formato LaCuerda o [Acorde]
                    inline):
                  </label>
                  <Textarea
                    value={cifradoTexto}
                    onChange={(e) => setCifradoTexto(e.target.value)}
                    rows={14}
                    className="w-full"
                    placeholder={`[Intro]\nMim  Do  Re  Mim\n\n[Estribillo]\n[Sol] Que tiene tu [Re] veneno [Mim] ...`}
                  />
                </div>

                <div className="pt-3 space-y-3">
                  <h4 className="text-xs font-sans font-bold text-[var(--tentative)]/80">
                    Campos de la Ficha del Músico Sustituto:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <label className="text-[var(--ink-2)] block mb-0.5">
                        Estructura Exacta del Tema:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={guiaSustituto.estructura || ""}
                        onChange={(e) =>
                          setGuiaSustituto({
                            ...guiaSustituto,
                            estructura: e.target.value,
                          })
                        }
                        className="w-full"
                        placeholder="Intro -> Verso -> Estribillo -> Outro"
                      />
                    </div>

                    <div>
                      <label className="text-[var(--ink-2)] block mb-0.5">
                        Progresiones Clave:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={guiaSustituto.progresionClave || ""}
                        onChange={(e) =>
                          setGuiaSustituto({
                            ...guiaSustituto,
                            progresionClave: e.target.value,
                          })
                        }
                        className="w-full"
                        placeholder="Verso: Mim - Do | Estribillo: Sol - Re"
                      />
                    </div>

                    <div>
                      <label className="text-[var(--ink-2)] block mb-0.5">
                        Cortes y Claves en Vivo:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={guiaSustituto.cortesYClaves || ""}
                        onChange={(e) =>
                          setGuiaSustituto({
                            ...guiaSustituto,
                            cortesYClaves: e.target.value,
                          })
                        }
                        className="w-full"
                        placeholder="Parón en compás 8…"
                      />
                    </div>

                    <div>
                      <label className="text-[var(--ink-2)] block mb-0.5">
                        Capo / Afinación:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={guiaSustituto.capoTraste || ""}
                        onChange={(e) =>
                          setGuiaSustituto({
                            ...guiaSustituto,
                            capoTraste: e.target.value,
                          })
                        }
                        className="w-full"
                        placeholder="Capo 2º traste"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: CHORD DIAGRAMS DRAWER */}
        {activeTab === "chords" && showChordDiagrams && (
          <DrawerDiagramas
            acordes={uniqueChords}
            contexto={contextoAcordes}
            vista={vistaAcordes}
            onVista={setVistaAcordes}
            onCerrar={() => setShowChordDiagrams(false)}
            sonando={acordeSonando}
            estiloArmonia={estiloArmonia}
          />
        )}
      </div>
    </>
  );
}
