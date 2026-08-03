// Tout ce qui touche à la VMA, aux zones et aux allures cibles.
// La couleur d'un élément dit toujours quelque chose de vrai sur son intensité.

import type { Seance, Semaine, Zone } from "../data/types";
import { paceToStr, parsePace } from "./format";

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

// Plages de % VMA par zone (fraction). lo = bas, hi = haut.
// Bandes CONTIGUËS : le haut d'une zone = le bas de la suivante, aucun trou
// d'allure. Chaque plage cible du coach (récup, EF, SV1, SV2, VMA) tombe bien
// à l'intérieur de sa zone.
const ZONE_PCT: Record<number, { lo: number; hi: number }> = {
  1: { lo: 0.6, hi: 0.7 }, // récupération
  2: { lo: 0.7, hi: 0.77 }, // endurance fondamentale
  3: { lo: 0.77, hi: 0.85 }, // seuil aérobie (SV1)
  4: { lo: 0.85, hi: 0.925 }, // seuil anaérobie (SV2)
  5: { lo: 0.925, hi: 1.05 }, // VMA / piste
};

/** "70 – 77 % VMA" pour une zone. */
export function zonePctLabel(zone: number): string {
  const { lo, hi } = ZONE_PCT[zone];
  return `${Math.round(lo * 100)} – ${Math.round(hi * 100)} % VMA`;
}

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
 * Allure d'une zone recalculée selon la VMA.
 * On déduit le % de VMA de chaque borne à partir des allures fournies par le
 * coach (à la VMA de référence du plan), puis on les recalcule à la VMA
 * courante. À la VMA de référence, on retrouve exactement les valeurs du coach.
 */
export function zoneAllureSelonVma(zone: Zone, vmaRef: number, vma: number): string {
  const bornes = (zone.allure.match(/\d{1,2}:[0-5]\d/g) ?? [])
    .map(parsePace)
    .filter((p): p is number => p != null)
    .slice(0, 2);
  if (bornes.length === 2 && vmaRef > 0 && vma > 0) {
    const recalc = bornes.map((p) => {
      const pct = 60 / p / vmaRef; // fraction de VMA à la référence
      return paceToStr(60 / (vma * pct));
    });
    return `${recalc[0]} – ${recalc[1]} /km`;
  }
  // Repli : plages génériques par zone.
  return `${zonePaceLabel(vma, zone.zone)} /km`;
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

/**
 * Zone d'une séance pour la couleur — gère le plan 10 km (libellés Z1/Z2/
 * SV1/SV2/piste/côte) comme le plan par %VMA. null = pas d'allure de course.
 */
export function zoneSeance(seance: Seance): number | null {
  if (seance.type === "repos") return null;
  if (seance.type === "renfo") return null;
  if (seance.type === "test") return 5;
  if (seance.type === "course") return 3;

  const t = `${seance.libelle ?? ""} ${seance.sous_type ?? ""} ${seance.consigne}`.toLowerCase();
  if (/piste|vma/.test(t)) return 5;
  if (/c[oô]te/.test(t)) return 4;
  if (/sv2/.test(t)) return 4;
  if (/sv1/.test(t)) return 3;
  if (/\bz2\b/.test(t)) return 2;
  if (/\bz1\b/.test(t)) return 1;
  if (/10k|as10k|objectif|intervalle/.test(t)) return 3;

  // Repli sur la logique du plan par %VMA.
  return primaryZone(seance);
}

/** Allure cible affichable : d'abord celle fournie par le coach, sinon calculée. */
export function allureCibleTexte(seance: Seance, vma: number): string | undefined {
  if (seance.allure_cible) return seance.allure_cible;
  const z = primaryZone(seance);
  if (z == null) return undefined;
  return `${zonePaceLabel(vma, z)} /km`;
}

// ---- Vague de charge : hauteur + couleur d'une semaine ----
// Deux modes de périodisation :
//  • par charge d'intensité (charge_pct, plan 10 km) → couleur = bande de charge
//  • par volume (intensite "+"…"++++", plan semi)   → couleur = intensité

const INTENSITE_ZONE: Record<string, number> = {
  "+": 2,
  "++": 3,
  "+++": 4,
  "++++": 5,
  "(course)": 3,
};

/** Zone de couleur d'après la charge (%). Rouge réservé aux pics (≥ 90 %). */
export function zoneDeCharge(pct: number): number {
  if (pct <= 52) return 2;
  if (pct <= 62) return 3;
  if (pct <= 85) return 4;
  return 5;
}

/** Zone de couleur d'une semaine, quel que soit le mode du plan. */
export function zoneDeSemaine(sem: Semaine): number {
  if (sem.charge_pct != null) return zoneDeCharge(sem.charge_pct);
  return INTENSITE_ZONE[sem.intensite.trim()] ?? 2;
}

export function couleurDeSemaine(sem: Semaine): string {
  return ZONE_COULEUR[zoneDeSemaine(sem)];
}

/** Hauteur relative d'une semaine dans la vague (charge % ou volume km). */
export function chargeDeSemaine(sem: Semaine): number {
  return sem.charge_pct ?? sem.volume_km ?? 0;
}
