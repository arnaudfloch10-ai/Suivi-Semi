// Formatage — allures (mm:ss), dates en français, nombres.

/** Minutes décimales par km → "m:ss". Ex. 5.7 → "5:42". */
export function paceToStr(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return "—";
  const totalSec = Math.round(minPerKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "5:42" → 5.7 (minutes décimales/km). null si invalide. */
export function parsePace(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):([0-5]?\d)$/);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

/** Allure depuis durée (min) et distance (km) → "m:ss". */
export function allureFrom(dureeMin?: number, distanceKm?: number): string | undefined {
  if (!dureeMin || !distanceKm || distanceKm <= 0) return undefined;
  return paceToStr(dureeMin / distanceKm);
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const MOIS_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "lun. 4 août" */
export function formatDateCourt(d: Date): string {
  return `${JOURS[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** "Mercredi 3 septembre" (première lettre capitale) */
export function formatDateLong(d: Date): string {
  const jour = JOURS[d.getDay()];
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${d.getDate()} ${MOIS_LONG[d.getMonth()]}`;
}

/** "4 août 2025" */
export function formatDateComplet(d: Date): string {
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Nombre avec virgule décimale française. */
export function nombreFr(n: number, decimales = 0): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
