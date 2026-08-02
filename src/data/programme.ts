// Import statique du programme. Ne jamais muter cet objet.
import brut from "../../public/programme.json";
import type { Programme } from "./types";

export const programme = brut as unknown as Programme;

export const TOTAL_SEANCES = programme.semaines.reduce(
  (n, s) => n + s.seances.filter((se) => se.a_saisir).length,
  0,
);

export const VOLUME_TOTAL = programme.meta.volume_total_km;
