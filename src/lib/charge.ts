// Charge d'entraînement (sRPE) — tout est calculé, aucune saisie.
// charge = intensité perçue × durée, avec intensité = 6 − ressenti
// (ressenti 1 = très dur … 5 = très facile).

import { programme } from "../data/programme";
import type { Entree } from "../data/types";
import { aujourdHui, joursEntre, parseISODate } from "./calendar";

/** Charge d'une séance, ou undefined si la durée manque. */
export function chargeSeance(e: Pick<Entree, "ressenti" | "duree_min">): number | undefined {
  if (e.duree_min == null || !isFinite(e.duree_min)) return undefined;
  return (6 - e.ressenti) * e.duree_min;
}

function chargeDe(e: Entree): number {
  return e.charge ?? chargeSeance(e) ?? 0;
}

/** Charge cumulée par semaine du plan. */
export function chargeParSemaine(journal: Entree[]): { semaine: number; charge: number }[] {
  const parW: Record<number, number> = {};
  for (const e of journal) {
    const m = e.seanceId.match(/^S(\d+)/);
    if (!m) continue;
    const w = Number(m[1]);
    parW[w] = (parW[w] ?? 0) + chargeDe(e);
  }
  return programme.semaines.map((s) => ({ semaine: s.numero, charge: parW[s.numero] ?? 0 }));
}

/** Charge cumulée sur les `jours` derniers jours (fenêtre glissante). */
export function chargeSurFenetre(journal: Entree[], jours: number): number {
  const today = aujourdHui();
  let total = 0;
  for (const e of journal) {
    const d = joursEntre(parseISODate(e.date), today);
    if (d >= 0 && d < jours) total += chargeDe(e);
  }
  return total;
}

export interface Acwr {
  disponible: boolean; // faux tant que < 28 jours d'historique
  ratio: number | null;
  aigue: number;
  chronique: number; // moyenne hebdo sur 28 jours
}

/** Rapport charge aiguë (7 j) / chronique (moyenne hebdo sur 28 j). */
export function acwr(journal: Entree[], dateDebut: string | null): Acwr {
  const historique = dateDebut
    ? joursEntre(parseISODate(dateDebut), aujourdHui()) + 1
    : 0;
  const aigue = chargeSurFenetre(journal, 7);
  const chronique = chargeSurFenetre(journal, 28) / 4;
  if (historique < 28) {
    return { disponible: false, ratio: null, aigue, chronique };
  }
  return {
    disponible: true,
    ratio: chronique > 0 ? aigue / chronique : null,
    aigue,
    chronique,
  };
}
