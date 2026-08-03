// Persistance — clés localStorage strictement séparées.
// Programme (lecture seule), journal des séances, mesures de sommeil : trois
// mondes indépendants. Corriger l'un ne touche jamais aux autres.

import type { Entree, MesureSommeil, Reglages } from "../data/types";

const CLE_REGLAGES = "suivi-semi:reglages";
const CLE_JOURNAL = "suivi-semi:journal";
const CLE_SOMMEIL = "suivi-semi:sommeil";

const REGLAGES_DEFAUT: Reglages = { dateDebut: null, vma: 14 };

export function lireReglages(): Reglages {
  try {
    const brut = localStorage.getItem(CLE_REGLAGES);
    if (!brut) return { ...REGLAGES_DEFAUT };
    return { ...REGLAGES_DEFAUT, ...(JSON.parse(brut) as Partial<Reglages>) };
  } catch {
    return { ...REGLAGES_DEFAUT };
  }
}

export function ecrireReglages(r: Reglages): void {
  localStorage.setItem(CLE_REGLAGES, JSON.stringify(r));
}

function lireTableau<T>(cle: string): T[] {
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return [];
    const arr = JSON.parse(brut);
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch {
    return [];
  }
}

export function lireJournal(): Entree[] {
  return lireTableau<Entree>(CLE_JOURNAL);
}

export function ecrireJournal(j: Entree[]): void {
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(j));
}

export function lireSommeil(): MesureSommeil[] {
  return lireTableau<MesureSommeil>(CLE_SOMMEIL);
}

export function ecrireSommeil(s: MesureSommeil[]): void {
  localStorage.setItem(CLE_SOMMEIL, JSON.stringify(s));
}

// ---- Export / import ----

export interface Sauvegarde {
  app: "suivi-semi";
  version: 1;
  exporteLe: string;
  reglages: Reglages;
  journal: Entree[];
  sommeil: MesureSommeil[];
}

export function construireSauvegarde(
  reglages: Reglages,
  journal: Entree[],
  sommeil: MesureSommeil[],
): Sauvegarde {
  return {
    app: "suivi-semi",
    version: 1,
    exporteLe: new Date().toISOString(),
    reglages,
    journal,
    sommeil,
  };
}

export function validerSauvegarde(data: unknown): Sauvegarde {
  if (
    !data ||
    typeof data !== "object" ||
    (data as { app?: string }).app !== "suivi-semi" ||
    !Array.isArray((data as { journal?: unknown }).journal)
  ) {
    throw new Error("Fichier non reconnu : ce n'est pas une sauvegarde Suivi Semi.");
  }
  const d = data as Sauvegarde;
  // Rétrocompatibilité : les sauvegardes antérieures n'ont pas de sommeil.
  if (!Array.isArray(d.sommeil)) d.sommeil = [];
  return d;
}
