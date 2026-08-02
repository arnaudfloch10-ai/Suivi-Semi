// Import statique du programme. Ne jamais muter cet objet.
import brut from "../../public/programme.json";
import type { Programme } from "./types";

export const programme = brut as unknown as Programme;

export const TOTAL_SEANCES = programme.semaines.reduce(
  (n, s) => n + s.seances.filter((se) => se.a_saisir).length,
  0,
);

// Un plan peut être périodisé par volume (km hebdo) ou par charge d'intensité
// (charge_pct). On détecte le mode une fois pour tout le reste de l'app.
export const PLAN_PAR_CHARGE = programme.semaines.some(
  (s) => s.charge_pct != null && s.volume_km == null,
);

export const VOLUME_TOTAL =
  programme.meta.volume_total_km ??
  programme.semaines.reduce((n, s) => n + (s.volume_km ?? 0), 0);
