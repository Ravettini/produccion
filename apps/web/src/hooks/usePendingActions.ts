import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listEvents } from "../api/events";
import type { Event } from "../types";
import { getEventPendingForUser } from "../utils/changeAlerts";
import { useAuth } from "./useAuth";

export interface PendingActionsSummary {
  /** Eventos que necesitan una acción del usuario. */
  eventos: number;
  /** Requerimientos enviados esperando validación. */
  porValidar: number;
  /** Eventos donde falta la aprobación del área del usuario. */
  faltaMiAprobacion: number;
}

/**
 * Resumen de lo que le falta hacer al usuario, calculado del estado real
 * (requerimientos enviados y aprobaciones de área sin decidir).
 */
export function usePendingActions(): PendingActionsSummary {
  const { user } = useAuth();
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
    enabled: !!user,
  });

  return useMemo(() => {
    let eventos = 0;
    let porValidar = 0;
    let faltaMiAprobacion = 0;

    for (const event of events as Event[]) {
      const pending = getEventPendingForUser(user?.role, event);
      if (pending.requiereAccion) eventos += 1;
      porValidar += pending.porValidar;
      if (pending.faltaMiAprobacion) faltaMiAprobacion += 1;
    }

    return { eventos, porValidar, faltaMiAprobacion };
  }, [events, user?.role]);
}
