/**
 * Aplicación raíz: orquesta controlador, contexto, puerta de entrada y armazón interno.
 * La lógica vive en `app/` (AGENTS.md §5.6).
 */
import { AppGate } from "./app/AppGate";
import { AppProvider } from "./app/AppProvider";
import { AppShell } from "./app/AppShell";
import { useAppController } from "./app/hooks/useAppController";

/**
 * Raíz de la aplicación.
 * @returns La pantalla pública, el acceso o la aplicación interna según la ruta y la sesión.
 */
export default function App() {
  const controller = useAppController();

  return (
    <AppProvider value={controller}>
      <AppGate>
        <AppShell />
      </AppGate>
    </AppProvider>
  );
}
