// Scores de sommeil et d'énergie — tout en écart à la baseline personnelle,
// jamais en valeur absolue. Aucun score sans ses composantes.
// Ton : suggérer, jamais prescrire ni diagnostiquer.

import type { CheckIn } from "../data/types";

export const CIBLE_SOMMEIL_DEFAUT = 7.5;

// ---- États de montée en puissance ----

export type EtatBaseline = "insuffisant" | "provisoire" | "stable";

export function etatDepuisNuits(n: number): EtatBaseline {
  if (n < 5) return "insuffisant";
  if (n < 14) return "provisoire";
  return "stable";
}

// ---- Petits utilitaires ----

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const moyenne = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function ecartType(xs: number[], m = moyenne(xs)): number {
  if (xs.length < 2) return 0;
  return Math.sqrt(moyenne(xs.map((x) => (x - m) ** 2)));
}

/** Moyenne en excluant les valeurs au-delà de 3 écarts-types. */
export function moyenneSansAberrants(xs: number[]): number | null {
  if (!xs.length) return null;
  if (xs.length < 4) return moyenne(xs);
  const m = moyenne(xs);
  const sd = ecartType(xs, m);
  if (sd === 0) return m;
  const gardes = xs.filter((x) => Math.abs(x - m) <= 3 * sd);
  return moyenne(gardes.length ? gardes : xs);
}

function heuresTexte(h: number): string {
  const e = Math.floor(h);
  const min = Math.round((h - e) * 60);
  return min ? `${e} h ${min.toString().padStart(2, "0")}` : `${e} h`;
}

const signePct = (p: number) => `${p >= 0 ? "+" : ""}${Math.round(p)} %`;
const signeC = (v: number) => `${v >= 0 ? "+" : ""}${(Math.round(v * 10) / 10).toString().replace(".", ",")} °C`;

// ---- Types de sortie ----

export interface Composante {
  id: string;
  label: string;
  score: number | null; // 0..100 (contribution), null si non pertinent
  poids: number;
  texte: string; // valeur lisible ("5 h 20", "−15 %"…)
}

export interface Resultat {
  score: number | null;
  etat: EtatBaseline;
  provisoire: boolean;
  composantes: Composante[];
  plafonds: string[]; // garde-fous appliqués (douleur, charge)
  nuitsManquantes: number; // > 0 seulement en état insuffisant
}

// ---- Accès à l'historique ----

function historique(checkins: CheckIn[], date: string, baselineDepuis?: string): CheckIn[] {
  return checkins
    .filter((c) => c.date <= date && (!baselineDepuis || c.date >= baselineDepuis))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const nuits = (hist: CheckIn[]) => hist.filter((c) => c.sommeil_h != null).length;

type MetriqueNum = "vfc_ms" | "fc_sommeil" | "temp_cutanee" | "sommeil_h";

/** Baseline d'une métrique à la date D (valeurs strictement antérieures). */
function baseline(hist: CheckIn[], m: MetriqueNum, date: string, etat: EtatBaseline): number | null {
  const prior = hist
    .filter((c) => c.date < date && typeof c[m] === "number")
    .map((c) => c[m] as number);
  const fenetre = etat === "stable" ? prior.slice(-30) : prior;
  return moyenneSansAberrants(fenetre);
}

// ---- Score de sommeil ----

/** 100 à la cible, décroissance linéaire, 0 sous 4 h, pas de bonus au-delà de cible+1 h. */
export function scoreDuree(h: number, cible: number): number {
  if (h <= 4) return 0;
  if (h >= cible) return 100; // pas de récompense au-delà (borne cible+1 h implicite)
  return clamp(((h - 4) / (cible - 4)) * 100);
}

/** Régularité = faible écart-type des durées sur 7 nuits. */
function scoreRegularite(hist: CheckIn[], date: string): number | null {
  const durees = hist.filter((c) => c.date <= date && c.sommeil_h != null).map((c) => c.sommeil_h!);
  const last7 = durees.slice(-7);
  if (last7.length < 2) return null;
  const sd = ecartType(last7);
  return clamp(100 * (1 - sd / 1.5)); // sd ≥ 1,5 h → 0
}

function combiner(comps: Composante[]): number {
  const dispo = comps.filter((c) => c.score != null);
  const w = dispo.reduce((s, c) => s + c.poids, 0);
  if (!w) return 0;
  return Math.round(dispo.reduce((s, c) => s + c.poids * (c.score as number), 0) / w);
}

export function scoreSommeil(
  checkins: CheckIn[],
  date: string,
  cible = CIBLE_SOMMEIL_DEFAUT,
  baselineDepuis?: string,
): Resultat {
  const hist = historique(checkins, date, baselineDepuis);
  const etat = etatDepuisNuits(nuits(hist));
  const base = { etat, provisoire: etat === "provisoire", composantes: [] as Composante[], plafonds: [] as string[] };
  if (etat === "insuffisant") return { score: null, nuitsManquantes: 5 - nuits(hist), ...base };

  const jour = hist.find((c) => c.date === date);
  if (jour?.sommeil_h == null) return { score: null, nuitsManquantes: 0, ...base }; // neutralisé

  const comps: Composante[] = [
    { id: "duree", label: "Durée", score: scoreDuree(jour.sommeil_h, cible), poids: 0.7, texte: heuresTexte(jour.sommeil_h) },
  ];
  const reg = scoreRegularite(hist, date);
  if (reg != null) {
    comps.push({ id: "regularite", label: "Régularité", score: reg, poids: 0.3, texte: reg >= 66 ? "régulier" : reg >= 33 ? "variable" : "erratique" });
  }
  return { score: combiner(comps), nuitsManquantes: 0, etat, provisoire: etat === "provisoire", composantes: comps, plafonds: [] };
}

// ---- Score d'énergie ----

export interface OptionsEnergie {
  cibleSommeil?: number;
  acwrRatio?: number | null;
  baselineDepuis?: string;
}

export function scoreEnergie(checkins: CheckIn[], date: string, opts: OptionsEnergie = {}): Resultat {
  const { cibleSommeil = CIBLE_SOMMEIL_DEFAUT, acwrRatio, baselineDepuis } = opts;
  const hist = historique(checkins, date, baselineDepuis);
  const etat = etatDepuisNuits(nuits(hist));
  const provisoire = etat === "provisoire";
  if (etat === "insuffisant") {
    return { score: null, etat, provisoire: false, composantes: [], plafonds: [], nuitsManquantes: 5 - nuits(hist) };
  }
  const jour = hist.find((c) => c.date === date);
  const comps: Composante[] = [];

  if (jour?.fraicheur != null) {
    comps.push({ id: "fraicheur", label: "Fraîcheur", score: ((jour.fraicheur - 1) / 4) * 100, poids: 0.3, texte: `${jour.fraicheur}/5` });
  }
  const bV = baseline(hist, "vfc_ms", date, etat);
  if (bV != null && jour?.vfc_ms != null) {
    const pct = ((jour.vfc_ms - bV) / bV) * 100;
    comps.push({ id: "vfc", label: "VFC", score: clamp(50 + pct * 2), poids: 0.25, texte: signePct(pct) });
  }
  const bF = baseline(hist, "fc_sommeil", date, etat);
  if (bF != null && jour?.fc_sommeil != null) {
    const pct = ((jour.fc_sommeil - bF) / bF) * 100;
    comps.push({ id: "fc", label: "FC sommeil", score: clamp(50 - pct * 2), poids: 0.2, texte: signePct(pct) });
  }
  const som = scoreSommeil(checkins, date, cibleSommeil, baselineDepuis).score;
  if (som != null) comps.push({ id: "sommeil", label: "Sommeil", score: som, poids: 0.15, texte: `${som}` });

  const bT = baseline(hist, "temp_cutanee", date, etat);
  if (bT != null && jour?.temp_cutanee != null) {
    const dev = jour.temp_cutanee - bT;
    comps.push({ id: "temp", label: "Température", score: clamp(100 - Math.abs(dev) * 150), poids: 0.1, texte: signeC(dev) });
  }

  if (!comps.length) return { score: null, etat, provisoire, composantes: [], plafonds: [], nuitsManquantes: 0 };

  let score = combiner(comps);
  const plafonds: string[] = [];

  // Garde-fou douleur ≥ 2.
  const fortes = jour?.douleur
    ? (Object.entries(jour.douleur) as [string, number][]).filter(([, v]) => (v ?? 0) >= 2).map(([z]) => z)
    : [];
  if (fortes.length && score > 50) {
    score = 50;
    plafonds.push(`plafonné à 50 — douleur ${fortes.join(", ")}`);
  }
  // Garde-fou surcharge.
  if (acwrRatio != null && acwrRatio > 1.5) {
    score = Math.max(0, score - 15);
    plafonds.push("−15 — charge en forte hausse");
  }

  return { score, etat, provisoire, composantes: comps, plafonds, nuitsManquantes: 0 };
}

// ---- Paliers de lecture ----

export interface Palier { zone: number; label: string; }

export function palier(score: number, provisoire = false): Palier {
  const d = provisoire ? 10 : 0; // seuils élargis de ±10 en provisoire
  if (score >= 80 - d) return { zone: 2, label: "Bonne disponibilité" };
  if (score >= 60 - d) return { zone: 3, label: "Correct" };
  if (score >= 40 - d) return { zone: 4, label: "Vigilance, envisage d'alléger" };
  return { zone: 5, label: "Récupération prioritaire" };
}

/** Composantes qui tirent le score vers le bas (score < 45), les plus basses d'abord. */
export function tireVersLeBas(r: Resultat): Composante[] {
  return r.composantes
    .filter((c) => c.score != null && (c.score as number) < 45)
    .sort((a, b) => (a.score as number) - (b.score as number));
}
