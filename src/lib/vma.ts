// Tout ce qui touche à la VMA, aux zones et aux allures cibles.
// La couleur d'un élément dit toujours quelque chose de vrai sur son intensité.

import type { Seance } from "../data/types";
import { paceToStr } from "./format";

export const ZONE_COULEUR: Record<number, string> = {
  1: "#7C93A3",
  2: "#2F6E52",
  3: "#8A7A2E",
  4: "#B4552B",
  5: "#8C2C21",
};

export const ZONE_NOM: Record<number, string> = {
  1: "bleu-gris",
  2: "vert profond",
  3: "ocre",
  4: "brique",
  5: "rouge sombre",
};

// Plages de % VMA par zone (fraction). min = pourcentage bas, max = haut.
const ZONE_PCT: Record<number, { lo: number; hi: number }> = {
  1: { lo: 0.5, hi: 0.6 },
  2: { lo: 0.65, hi: 0.75 },
  3: { lo: 0.78, hi: 0.83 },
  4: { lo: 0.85, hi: 0.9 },
  5: { lo: 0.9, hi: 1.0 },
};

/** Allure (min/km) pour un % de VMA. vitesse = vma·pct ; allure = 60/vitesse. */
export function paceFromVma(vma: number, pct: number): number {
  return 60 / (vma * pct);
}

/** Plage d'allure d'une zone, recalculée depuis la VMA. min = plus rapide. */
export function zonePaceRange(vma: number, zone: number): { min: number; max: number } {
  const { lo, hi } = ZONE_PCT[zone];
  return { min: paceFromVma(vma, hi), max: paceFromVma(vma, lo) };
}

/** "4:45 – 5:00" pour une zone donnée. */
export function zonePaceLabel(vma: number, zone: number): string {
  const { min, max } = zonePaceRange(vma, zone);
  return `${paceToStr(min)} – ${paceToStr(max)}`;
}

/**
 * Zone principale d'une séance — l'effort qui la définit.
 * Sert à l'allure cible et à l'affichage par séance (le test et les lignes
 * vives peuvent donc être en zone 5, c'est voulu ici).
 * Renvoie null quand il n'y a pas d'allure de course pertinente (renfo pur, repos).
 */
export function primaryZone(seance: Seance): number | null {
  const c = seance.consigne;
  switch (seance.type) {
    case "repos":
      return null;
    case "recup_active":
      return 1;
    case "ef":
      return 2;
    case "test":
      return 5;
    case "course":
      return 3;
    case "renfo":
      // Renfo avec une portion courue → base zone 2 ; renfo pur → aucune allure.
      return seance.duree_min != null ? 2 : null;
    case "sortie_longue":
      return /z\s*1|zone\s*1/i.test(c) ? 1 : 2;
    case "fractionne": {
      const zExplicite = c.match(/z\s*([1-5])|zone\s*([1-5])/i);
      if (zExplicite) return Number(zExplicite[1] ?? zExplicite[2]);
      if (/90\s*%|vive/i.test(c)) return 5;
      if (/8[5-9]\s*%|seuil/i.test(c)) return 4;
      if (/80\s*%|allure\s+semi/i.test(c)) return 3;
      return 4;
    }
  }
}

/** Allure cible d'une séance, ou undefined si non pertinent. */
export function allureCible(seance: Seance, vma: number): string | undefined {
  const z = primaryZone(seance);
  if (z == null) return undefined;
  return zonePaceLabel(vma, z);
}

// Correspondance intensité hebdo → zone de couleur pour la vague de charge.
// C'est l'attribut d'intensité du plan (établi par le frère) qui pilote la
// chaleur de la colonne : creux verts, pic S7 en rouge, finale = allure course.
const INTENSITE_ZONE: Record<string, number> = {
  "+": 2,
  "++": 3,
  "+++": 4,
  "++++": 5,
  "(course)": 3,
};

export function zoneDeSemaine(intensite: string): number {
  return INTENSITE_ZONE[intensite.trim()] ?? 2;
}

export function couleurDeSemaine(intensite: string): string {
  return ZONE_COULEUR[zoneDeSemaine(intensite)];
}
