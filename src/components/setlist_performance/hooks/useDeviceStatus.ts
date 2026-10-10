/**
 * Estado del dispositivo en el escenario: conexión y batería.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";

/** Subconjunto de la Battery Status API que usa el visor (no está en lib.dom: Chrome sí, Safari/Firefox no). */
interface BatteryManagerLike {
  level: number;
  charging: boolean;
  addEventListener: (type: "levelchange" | "chargingchange", listener: () => void) => void;
  removeEventListener: (type: "levelchange" | "chargingchange", listener: () => void) => void;
}
type NavigatorWithBattery = Navigator & { getBattery: () => Promise<BatteryManagerLike> };

/**
 * Estado del dispositivo en el escenario: conexión y batería.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useDeviceStatus() {
  // Battery Status API: Chrome la soporta (con datos redondeados por privacidad), pero Firefox
  // y Safari/iOS nunca la han implementado. null ="no se sabe" y no se muestra nada — mejor
  // eso que fingir un dato de batería falso en la mitad de los móviles.
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  const [batteryCharging, setBatteryCharging] = useState(false);

  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // BATERÍA: con pantalla+wake lock+fullscreen encendidos todo el bolo, avisar antes de que se
  // apague en el bis es más útil que descubrirlo cuando ya se apagó. Se degrada en silencio
  // donde el navegador no lo soporta (batteryLevel se queda en null y no se muestra nada).
  useEffect(() => {
    let batteryRef: BatteryManagerLike | null = null;
    const handleChange = () => {
      if (batteryRef) {
        setBatteryLevel(batteryRef.level);
        setBatteryCharging(batteryRef.charging);
      }
    };
    if ("getBattery" in navigator) {
      (navigator as NavigatorWithBattery)
        .getBattery()
        .then((battery) => {
          batteryRef = battery;
          handleChange();
          battery.addEventListener("levelchange", handleChange);
          battery.addEventListener("chargingchange", handleChange);
        })
        .catch(() => {});
    }
    return () => {
      if (batteryRef) {
        batteryRef.removeEventListener("levelchange", handleChange);
        batteryRef.removeEventListener("chargingchange", handleChange);
      }
    };
  }, []);

  return { isOffline, batteryLevel, batteryCharging };
}
