/**
 * Celda de contacto directo de la fila: email, teléfonos e Instagram.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle,Instagram,Phone,Smartphone } from "lucide-react";
import { getEmailStatus,isBouncedLead } from "../../../hooks/useEmailValidation";
import { Lead } from "../../../types";
import { useLeadsTable } from "./LeadsTableContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadRowContactProps {
  lead: Lead;
  hasMovil: boolean;
  hasFijo: boolean;
  rawMovil: string;
  rawFijo: string;
}

/**
 * Celda de contacto directo de la fila: email, teléfonos e Instagram.
 * @returns Sección de interfaz.
 */
export function LeadRowContact({ lead, hasMovil, hasFijo, rawMovil, rawFijo }: LeadRowContactProps) {
  const { emailValidities } = useLeadsTable();
  return (
    <>
      {/* Direct Contact Column */}
      <td className="py-1.5 px-2 min-w-[130px] align-middle">
      <div className="flex flex-col justify-center leading-tight">
      {lead.email_contacto ? (
        <div className="flex items-center gap-1">
          {(() => {
            const bounced = isBouncedLead(lead.notas);
            const invalid =
              getEmailStatus(
                lead.id,
                lead.email_contacto,
                emailValidities,
              ) === "invalid";
            const broken = bounced || invalid;
            return (
              <>
                <a
                  href={`mailto:${lead.email_contacto}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`font-normal truncate max-w-[115px] text-xs inline-block ${
                    broken
                      ? "text-[var(--alert)] hover:text-[var(--alert)] line-through"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:underline"
                  }`}
                  title={lead.email_contacto}
                >
                  {lead.email_contacto}
                </a>
                {broken && (
                  <div
                    title={
                      bounced
                        ? "Email rebotado"
                        : "Email inválido"
                    }
                  >
                    <AlertCircle className="w-3 h-3 text-[var(--alert)] shrink-0" />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <span className="text-[var(--ink-3)] italic text-micro">
          Sin email
        </span>
      )}
      {(hasMovil || hasFijo || lead.instagram) && (
        <div className="flex items-center gap-1.5 mt-0.5 text-micro">
          {hasMovil ? (
            <span
              className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
              title={`Móvil: ${rawMovil}`}
            >
              <Smartphone className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[75px]">
                {rawMovil}
              </span>
            </span>
          ) : hasFijo ? (
            <span
              className="inline-flex items-center gap-0.5 text-[var(--ink-2)]"
              title={`Fijo: ${rawFijo}`}
            >
              <Phone className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[75px]">
                {rawFijo}
              </span>
            </span>
          ) : null}
          {lead.instagram ? (
            <a
              href={
                lead.instagram.startsWith("http")
                  ? lead.instagram
                  : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-pink-500 hover:text-pink-600 font-medium"
              title={`Instagram: ${lead.instagram}`}
            >
              <Instagram className="w-2.5 h-2.5 text-pink-500 shrink-0" />
              <span className="truncate max-w-[65px]">
                {lead.instagram.replace(/^@/, "")}
              </span>
            </a>
          ) : null}
        </div>
      )}
      </div>
      </td>
    </>
  );
}
