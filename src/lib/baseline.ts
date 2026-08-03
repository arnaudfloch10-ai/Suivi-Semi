// Baselines de récupération — on affiche toujours l'écart à la moyenne
// glissante, jamais la valeur brute seule. Ton suggestif, jamais un diagnostic.

import type { CheckIn } from "../data/types";

export type MetriqueId = "vfc_ms" | "fc_sommeil" | "temp_cutanee" | "fraicheur";

interface Config {
  label: string;
  unite: string;
  sens: "haut" | "bas"; // sens favorable (haut = plus haut vaut mieux)
  affichage: "pct" | "abs"; // écart en % ou en valeur absolue (°C)
}

export const METRIQUES: Record<MetriqueId, Config> = {
  vfc_ms: { label: "VFC", unite: "ms", sens: "haut", affichage: "pct" },
  fc_sommeil: { label: "FC sommeil", unite: "bpm", sens: "bas", affichage: "pct" },
  temp_cutanee: { label: "Température", unite: "°C", sens: "bas", affichage: "abs" },
  fraicheur: { label: "Fraîcheur", unite: "/5", sens: "haut", affichage: "pct" },
};

function valeurs(checkins: CheckIn[], m: MetriqueId): number[] {
  return [...checkins]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => c[m])
    .filter((v): v is number => typeof v === "number");
}

const moyenne = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface Ecart {
  disponible: boolean; // ≥ 7 jours de données pour cette métrique
  valeur: number | null;
  moyenne7: number | null;
  moyenne30: number | null;
  ecart: number | null; // % (affichage "pct") ou °C (affichage "abs")
  favorable: boolean | null;
  affichage: "pct" | "abs";
}

/** Écart de la dernière valeur à la baseline 7 j (et 30 j) pour une métrique. */
export function ecartBaseline(checkins: CheckIn[], m: MetriqueId): Ecart {
  const cfg = METRIQUES[m];
  const vals = valeurs(checkins, m);
  if (vals.length < 7) {
    return { disponible: false, valeur: vals.length ? vals[vals.length - 1] : null, moyenne7: null, moyenne30: null, ecart: null, favorable: null, affichage: cfg.affichage };
  }
  const valeur = vals[vals.length - 1];
  const moyenne7 = moyenne(vals.slice(-7));
  const moyenne30 = moyenne(vals.slice(-30));
  const brut = valeur - moyenne7;
  const ecart = cfg.affichage === "pct" ? (moyenne7 !== 0 ? (brut / moyenne7) * 100 : 0) : brut;
  const favorable = cfg.sens === "haut" ? brut >= 0 : brut <= 0;
  return { disponible: true, valeur, moyenne7, moyenne30, ecart, favorable, affichage: cfg.affichage };
}

/**
 * Suggestion douce si la VFC des 3 derniers jours est sous la baseline 7 j.
 * Ne jamais affirmer un état de santé — seulement suggérer.
 */
export function alerteRecuperation(checkins: CheckIn[]): string | null {
  const vals = valeurs(checkins, "vfc_ms");
  if (vals.length < 7) return null;
  const base = moyenne(vals.slice(-7));
  const trois = vals.slice(-3);
  if (trois.length === 3 && trois.every((v) => v < base)) {
    return "Trois jours de VFC sous ta baseline — tu peux envisager de lever le pied.";
  }
  return null;
}
