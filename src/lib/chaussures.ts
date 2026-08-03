// Chaussures — kilométrage cumulé et alerte d'usure (suggestive).

import type { Chaussure, Entree, SeanceType } from "../data/types";

const TYPES_COURUS: SeanceType[] = [
  "ef",
  "fractionne",
  "sortie_longue",
  "course",
  "recup_active",
  "test",
];

export function estCourue(type: SeanceType): boolean {
  return TYPES_COURUS.includes(type);
}

/** Km courant d'une paire = km de départ + distances des séances associées. */
export function kmChaussure(ch: Chaussure, journal: Entree[]): number {
  const parcourus = journal.reduce(
    (km, e) => km + (e.chaussure_id === ch.id ? (e.distance_km ?? 0) : 0),
    0,
  );
  return ch.km + parcourus;
}

export type NiveauUsure = "ok" | "surveiller" | "marque";

export function alerteUsure(km: number): { niveau: NiveauUsure; texte: string | null } {
  if (km >= 800) {
    return { niveau: "marque", texte: "Usure élevée — pense à surveiller de près." };
  }
  if (km >= 600) {
    return { niveau: "surveiller", texte: "Au-delà de 600 km — garde un œil sur l'usure." };
  }
  return { niveau: "ok", texte: null };
}
