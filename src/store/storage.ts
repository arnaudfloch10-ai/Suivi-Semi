// Persistance — deux clés localStorage strictement séparées.
// Corriger le programme ne touche jamais au journal, et inversement.

import type { Entree, Reglages } from "../data/types";

const CLE_REGLAGES = "suivi-semi:reglages";
const CLE_JOURNAL = "suivi-semi:journal";

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

export function lireJournal(): Entree[] {
  try {
    const brut = localStorage.getItem(CLE_JOURNAL);
    if (!brut) return [];
    const arr = JSON.parse(brut);
    return Array.isArray(arr) ? (arr as Entree[]) : [];
  } catch {
    return [];
  }
}

export function ecrireJournal(j: Entree[]): void {
  localStorage.setItem(CLE_JOURNAL, JSON.stringify(j));
}

// ---- Export / import ----

export interface Sauvegarde {
  app: "suivi-semi";
  version: 1;
  exporteLe: string;
  reglages: Reglages;
  journal: Entree[];
}

export function construireSauvegarde(reglages: Reglages, journal: Entree[]): Sauvegarde {
  return {
    app: "suivi-semi",
    version: 1,
    exporteLe: new Date().toISOString(),
    reglages,
    journal,
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
  return data as Sauvegarde;
}
