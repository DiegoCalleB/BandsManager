/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Plus,Trash2 } from "lucide-react";
import { IconButton,Input } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function GearChecklistTab() {
  const { activeTab, handleAddRunOfShow, newRunTime, setNewRunTime, newRunActivity, setNewRunActivity, handleAddGear, newGearLabel, setNewGearLabel, currentRunOfShow, textMuted, handleToggleRunOfShow, handleDeleteRunOfShow, currentGear, handleToggleGear, handleDeleteGear } = useCalendar();
  return (
    <>
      <>
        {/* Form to add new item */}
        <div className="mb-3">
          {activeTab === 'runofshow' ? (
            <form onSubmit={handleAddRunOfShow} className="flex gap-1.5 items-center">
              <Input
                size="sm"
                type="text"
                placeholder="17:30"
                value={newRunTime}
                onChange={(e) => setNewRunTime(e.target.value)}
                className="w-16"
              />
              <Input
                size="sm"
                type="text"
                placeholder="Nueva actividad/horario…"
                value={newRunActivity}
                onChange={(e) => setNewRunActivity(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  'bg-[var(--acc)]/15 text-[var(--ink)] hover:bg-[var(--acc)]/15'
                }`}
                title="Añadir horario"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddGear} className="flex gap-1.5 items-center">
              <Input
                size="sm"
                type="text"
                placeholder="Añadir instrumento, cable o cacharro de directo…"
                value={newGearLabel}
                onChange={(e) => setNewGearLabel(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  'bg-[var(--acc)]/15 text-[var(--ink)] hover:bg-[var(--acc)]/15'
                }`}
                title="Añadir material"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Interactive Lists */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {activeTab === 'runofshow' ? (
            currentRunOfShow.length === 0 ? (
              <p className={`text-micro italic text-center py-4 ${textMuted}`}>Sin horarios: apunta prueba de sonido, puertas y salida.</p>
            ) : (
              currentRunOfShow.map((item) => {
                const isItemDone = item.done;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleRunOfShow(item.id)}
                    className={`p-2 rounded-[var(--r-s)] flex items-center gap-2.5 cursor-pointer transition-colors group ${
                      isItemDone
                        ? 'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
                        : 'bg-[var(--surface)] text-[var(--ink)]'
                    }`}
                  >
                    <span
                      className={`font-mono text-micro font-bold shrink-0 ${
                        isItemDone
                          ? 'text-[var(--ink-2)]'
                          : 'text-[var(--acc)]'
                      }`}
                    >
                      {item.time}
                    </span>
                    <p className="text-micro font-sans leading-normal flex-1">{item.activity}</p>
                    <IconButton
                      label="Eliminar"
                      variant="danger"
                      size="icon-xs"
                      type="button"
                      onClick={(e) => handleDeleteRunOfShow(item.id, e)}
                      className="opacity-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </IconButton>
                  </div>
                );
              })
            )
          ) : currentGear.length === 0 ? (
            <p className={`text-micro italic text-center py-4 ${textMuted}`}>Sin material apuntado: backline, cables y merchan.</p>
          ) : (
            currentGear.map((item) => {
              const isChecked = item.checked;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleGear(item.id)}
                  className={`p-2 rounded-[var(--r-s)] flex items-center gap-2.5 cursor-pointer transition-colors group ${
                    isChecked
                      ? 'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
                      : 'bg-[var(--surface)] text-[var(--ink)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by div click
                    className={`rounded focus:ring-0 cursor-pointer h-3.5 w-3.5 ${
                      ' text-[var(--acc)] bg-[var(--sunken)]'
                    }`}
                  />
                  <p className="text-micro font-sans leading-normal flex-1">{item.label}</p>
                  <IconButton
                    label="Eliminar"
                    variant="danger"
                    size="icon-xs"
                    type="button"
                    onClick={(e) => handleDeleteGear(item.id, e)}
                    className="opacity-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </IconButton>
                </div>
              );
            })
          )}
        </div>
      </>
    </>
  );
}
