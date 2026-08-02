// Statistiques de l'accueil — assiduité, kilomètres, ressenti, allure EF.

import { programme } from "../data/programme";
import type { Entree, Seance } from "../data/types";
import { aujourdHui, dateSeance, joursEntre, parseISODate, toISODate } from "./calendar";
import { parsePace } from "./format";

// Index séance par id + semaine associée.
const INDEX: Record<string, { seance: Seance; semaine: number }> = {};
for (const sem of programme.semaines) {
  for (const s of sem.seances) INDEX[s.id] = { seance: s, semaine: sem.numero };
}

export function semaineDeId(id: string): number {
  const m = id.match(/^S(\d+)-/);
  return m ? Number(m[1]) : 0;
}

/** Séances à saisir dont la date est aujourd'hui ou avant. */
export function seancesPrevuesAJour(dateDebut: string): number {
  const today = aujourdHui();
  let n = 0;
  for (const sem of programme.semaines) {
    for (const s of sem.seances) {
      if (!s.a_saisir) continue;
      if (joursEntre(dateSeance(dateDebut, sem.numero, s.jour_index), today) >= 0) n++;
    }
  }
  return n;
}

export interface StatsAssiduite {
  prevues: number;
  realisees: number;
  taux: number; // 0..1
}

export function assiduite(dateDebut: string, journal: Entree[]): StatsAssiduite {
  const prevues = seancesPrevuesAJour(dateDebut);
  const idsFaits = new Set(
    journal.filter((e) => e.statut === "faite" || e.statut === "adaptee").map((e) => e.seanceId),
  );
  const today = aujourdHui();
  let realisees = 0;
  for (const id of idsFaits) {
    const info = INDEX[id];
    if (!info) continue;
    if (joursEntre(dateSeance(dateDebut, info.semaine, info.seance.jour_index), today) >= 0) {
      realisees++;
    }
  }
  return { prevues, realisees, taux: prevues ? realisees / prevues : 0 };
}

/** Km réellement parcourus (somme des distances saisies). */
export function kmRealises(journal: Entree[]): number {
  return journal.reduce((km, e) => km + (e.distance_km ?? 0), 0);
}

/**
 * Km prévus « à ce stade » : volume des semaines écoulées + prorata de la
 * semaine en cours (jours écoulés / 7). Total sur 12 semaines = 233 km.
 */
export function kmPrevusAJour(dateDebut: string): number {
  const today = aujourdHui();
  let km = 0;
  for (const sem of programme.semaines) {
    // Jours écoulés depuis le lundi de cette semaine (1 = premier jour).
    const joursEcoules = joursEntre(dateSeance(dateDebut, sem.numero, 1), today) + 1;
    if (joursEcoules <= 0) continue; // semaine future
    const frac = Math.min(joursEcoules / 7, 1);
    km += sem.volume_km * frac;
  }
  return km;
}

export const KM_TOTAL_PREVU = programme.meta.volume_total_km;

export interface PointSemaine {
  semaine: number;
  valeur: number | null;
}

/** Ressenti moyen par semaine (1..5), null si aucune saisie. */
export function ressentiParSemaine(journal: Entree[]): PointSemaine[] {
  const acc: Record<number, number[]> = {};
  for (const e of journal) {
    if (e.statut === "manquee") continue;
    const w = semaineDeId(e.seanceId);
    (acc[w] ??= []).push(e.ressenti);
  }
  return programme.semaines.map((sem) => {
    const vals = acc[sem.numero];
    return {
      semaine: sem.numero,
      valeur: vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
    };
  });
}

/**
 * Allure EF moyenne par semaine (min/km) — sur les séances d'endurance
 * fondamentale saisies avec une allure. Sert à voir si ça devient plus facile.
 */
export function allureEfParSemaine(journal: Entree[]): PointSemaine[] {
  const acc: Record<number, number[]> = {};
  for (const e of journal) {
    if (e.statut === "manquee") continue;
    const info = INDEX[e.seanceId];
    if (!info || info.seance.type !== "ef") continue;
    if (!e.allure) continue;
    const p = parsePace(e.allure);
    if (p == null) continue;
    (acc[info.semaine] ??= []).push(p);
  }
  return programme.semaines.map((sem) => {
    const vals = acc[sem.numero];
    return {
      semaine: sem.numero,
      valeur: vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
    };
  });
}

/** Un rappel d'export est-il utile ? (> 14 jours depuis le dernier). */
export function exportConseille(dernierExport: string | undefined, journalVide: boolean): boolean {
  if (journalVide) return false;
  if (!dernierExport) return true;
  return joursEntre(parseISODate(toISODate(new Date(dernierExport))), aujourdHui()) >= 14;
}
