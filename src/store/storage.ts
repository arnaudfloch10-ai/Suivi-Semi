// Persistance — clés localStorage séparées : réglages, journal des séances,
// check-ins du matin. Migration silencieuse des anciennes données.

import type { Chaussure, CheckIn, Entree, Reglages } from "../data/types";

const CLE_REGLAGES = "suivi-semi:reglages";
const CLE_JOURNAL = "suivi-semi:journal";
const CLE_CHECKINS = "suivi-semi:checkins";
const CLE_SOMMEIL_V1 = "suivi-semi:sommeil"; // ancienne clé (avant v2)

export const CHAUSSURES_DEFAUT: Chaussure[] = [
  { id: "vomero", nom: "Nike Vomero Plus", km: 8, archivee: false },
  { id: "pegasus", nom: "Nike Pegasus 42", km: 4, archivee: false },
];

const REGLAGES_DEFAUT: Reglages = {
  dateDebut: null,
  vma: 14,
  chaussures: CHAUSSURES_DEFAUT,
};

/** Complète des réglages potentiellement anciens (chaussures manquantes…). */
function normaliserReglages(r: Partial<Reglages> | null | undefined): Reglages {
  const base = { ...REGLAGES_DEFAUT, ...(r ?? {}) };
  if (!Array.isArray(base.chaussures) || base.chaussures.length === 0) {
    base.chaussures = CHAUSSURES_DEFAUT;
  }
  return base;
}

export function lireReglages(): Reglages {
  try {
    const brut = localStorage.getItem(CLE_REGLAGES);
    return normaliserReglages(brut ? (JSON.parse(brut) as Partial<Reglages>) : null);
  } catch {
    return normaliserReglages(null);
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

/** Ancienne mesure de sommeil (v1) → check-in (v2). */
export function migrerCheckin(v: Record<string, unknown>): CheckIn {
  return {
    date: String(v.date),
    fc_sommeil: v.fc_sommeil as number | undefined,
    vfc_ms: v.vfc_ms as number | undefined,
    temp_cutanee: (v.temp_cutanee ?? v.temp_var) as number | undefined,
    sommeil_h: v.sommeil_h as number | undefined,
    fraicheur: v.fraicheur as CheckIn["fraicheur"],
    douleur: v.douleur as CheckIn["douleur"],
  };
}

export function lireCheckins(): CheckIn[] {
  const actuels = lireTableau<CheckIn>(CLE_CHECKINS);
  if (actuels.length) return actuels;
  // Migration depuis l'ancienne clé "sommeil".
  const anciens = lireTableau<Record<string, unknown>>(CLE_SOMMEIL_V1);
  if (anciens.length) {
    const migres = anciens.map(migrerCheckin);
    ecrireCheckins(migres);
    return migres;
  }
  return [];
}

export function ecrireCheckins(c: CheckIn[]): void {
  localStorage.setItem(CLE_CHECKINS, JSON.stringify(c));
}

// ---- Export / import ----

export interface Sauvegarde {
  app: "suivi-semi";
  version: 2;
  exporteLe: string;
  reglages: Reglages;
  journal: Entree[];
  checkins: CheckIn[];
}

export function construireSauvegarde(
  reglages: Reglages,
  journal: Entree[],
  checkins: CheckIn[],
): Sauvegarde {
  return {
    app: "suivi-semi",
    version: 2,
    exporteLe: new Date().toISOString(),
    reglages,
    journal,
    checkins,
  };
}

/** Valide et migre une sauvegarde (accepte les anciens fichiers v1). */
export function validerSauvegarde(data: unknown): Sauvegarde {
  if (
    !data ||
    typeof data !== "object" ||
    (data as { app?: string }).app !== "suivi-semi" ||
    !Array.isArray((data as { journal?: unknown }).journal)
  ) {
    throw new Error("Fichier non reconnu : ce n'est pas une sauvegarde Suivi Semi.");
  }
  const d = data as Record<string, unknown>;

  // Check-ins : soit déjà présents, soit migrés depuis l'ancien "sommeil".
  let checkins: CheckIn[] = [];
  if (Array.isArray(d.checkins)) {
    checkins = d.checkins as CheckIn[];
  } else if (Array.isArray(d.sommeil)) {
    checkins = (d.sommeil as Record<string, unknown>[]).map(migrerCheckin);
  }

  const reglages = normaliserReglages(d.reglages as Partial<Reglages>);

  return {
    app: "suivi-semi",
    version: 2,
    exporteLe: typeof d.exporteLe === "string" ? d.exporteLe : new Date().toISOString(),
    reglages,
    journal: d.journal as Entree[],
    checkins,
  };
}
