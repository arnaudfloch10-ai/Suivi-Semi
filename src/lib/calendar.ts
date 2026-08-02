// Calendrier — tout découle de la date du lundi de la semaine 1.
// On travaille en dates locales (YYYY-MM-DD), sans dérive de fuseau.

import { programme } from "../data/programme";
import type { Seance } from "../data/types";

const JOUR_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" → Date locale à minuit. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date locale → "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function aujourdHui(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * JOUR_MS);
}

/** Nombre de jours entiers entre deux dates locales (b - a). */
export function joursEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / JOUR_MS);
}

/** Date d'une séance : lundi S1 + (semaine-1)*7 + (jour_index-1). */
export function dateSeance(dateDebut: string, semaine: number, jourIndex: number): Date {
  return addDays(parseISODate(dateDebut), (semaine - 1) * 7 + (jourIndex - 1));
}

/** Date du jour de la course = dimanche de la semaine 12. */
export function dateCourse(dateDebut: string): Date {
  const derniere = programme.semaines[programme.semaines.length - 1];
  return dateSeance(dateDebut, derniere.numero, 7);
}

/** Jours restants avant la course (négatif si passée). */
export function joursAvantCourse(dateDebut: string): number {
  return joursEntre(aujourdHui(), dateCourse(dateDebut));
}

/**
 * Numéro de semaine courante (1..12) selon aujourd'hui.
 * Avant le début → 1 ; après la fin → 12.
 */
export function semaineCourante(dateDebut: string): number {
  const diff = joursEntre(parseISODate(dateDebut), aujourdHui());
  const n = Math.floor(diff / 7) + 1;
  const max = programme.semaines.length;
  return Math.min(Math.max(n, 1), max);
}

/** La séance du jour, ou null (jour hors plan). */
export function seanceDuJour(
  dateDebut: string,
): { seance: Seance; semaine: number } | null {
  const iso = toISODate(aujourdHui());
  for (const sem of programme.semaines) {
    for (const s of sem.seances) {
      if (toISODate(dateSeance(dateDebut, sem.numero, s.jour_index)) === iso) {
        return { seance: s, semaine: sem.numero };
      }
    }
  }
  return null;
}

export type EtatSeance = "passee" | "aujourdhui" | "future";

export function etatSeance(dateDebut: string, semaine: number, jourIndex: number): EtatSeance {
  const d = joursEntre(dateSeance(dateDebut, semaine, jourIndex), aujourdHui());
  if (d === 0) return "aujourdhui";
  return d > 0 ? "passee" : "future";
}
