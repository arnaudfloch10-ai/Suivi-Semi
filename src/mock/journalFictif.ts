// Données de démonstration — servent uniquement à valider le rendu de
// l'accueil et de la vague. Chargées via ?demo, jamais en usage réel.

import type { Entree, Reglages } from "../data/types";

// Lundi de la S1 calé pour qu'aujourd'hui tombe en fin de semaine 6.
export const REGLAGES_DEMO: Reglages = {
  dateDebut: "2026-06-22",
  vma: 14,
  dernierExport: undefined,
};

export const JOURNAL_DEMO: Entree[] = [
  // Semaine 1 — on démarre prudemment, ça tire un peu.
  { seanceId: "S1-J1", date: "2026-06-22", statut: "faite", ressenti: 2, duree_min: 6, commentaire: "Test VMA, FC vite haute." },
  { seanceId: "S1-J3", date: "2026-06-24", statut: "faite", ressenti: 2, duree_min: 35, distance_km: 5.1, allure: "6:52" },
  { seanceId: "S1-J5", date: "2026-06-26", statut: "faite", ressenti: 3, duree_min: 30, distance_km: 4.5, allure: "6:40" },
  { seanceId: "S1-J7", date: "2026-06-28", statut: "faite", ressenti: 2, duree_min: 51, distance_km: 7.0, allure: "7:17", commentaire: "Marché 2 min à la fin." },

  // Semaine 2
  { seanceId: "S2-J1", date: "2026-06-29", statut: "faite", ressenti: 3, duree_min: 35, distance_km: 5.2, allure: "6:44" },
  { seanceId: "S2-J3", date: "2026-07-01", statut: "faite", ressenti: 2, duree_min: 40 },
  { seanceId: "S2-J5", date: "2026-07-03", statut: "faite", ressenti: 3, duree_min: 30, distance_km: 4.6, allure: "6:31" },
  { seanceId: "S2-J6", date: "2026-07-04", statut: "faite", ressenti: 4 },
  { seanceId: "S2-J7", date: "2026-07-05", statut: "faite", ressenti: 3, duree_min: 57, distance_km: 8.0, allure: "7:07" },

  // Semaine 3
  { seanceId: "S3-J1", date: "2026-07-06", statut: "faite", ressenti: 3, duree_min: 40, distance_km: 6.1, allure: "6:33" },
  { seanceId: "S3-J3", date: "2026-07-08", statut: "faite", ressenti: 3, duree_min: 42 },
  { seanceId: "S3-J4", date: "2026-07-09", statut: "manquee", ressenti: 3, commentaire: "Journée trop chargée." },
  { seanceId: "S3-J5", date: "2026-07-10", statut: "faite", ressenti: 3, duree_min: 35, distance_km: 5.5, allure: "6:22" },
  { seanceId: "S3-J7", date: "2026-07-12", statut: "faite", ressenti: 3, duree_min: 68, distance_km: 10.0, allure: "6:48" },

  // Semaine 4 — régénération, on se sent mieux.
  { seanceId: "S4-J2", date: "2026-07-14", statut: "faite", ressenti: 4, duree_min: 30, distance_km: 4.7, allure: "6:23" },
  { seanceId: "S4-J4", date: "2026-07-16", statut: "faite", ressenti: 3, duree_min: 28 },
  { seanceId: "S4-J5", date: "2026-07-17", statut: "faite", ressenti: 4 },
  { seanceId: "S4-J7", date: "2026-07-19", statut: "faite", ressenti: 4, duree_min: 46, distance_km: 7.0, allure: "6:34" },

  // Semaine 5 — développement.
  { seanceId: "S5-J1", date: "2026-07-20", statut: "faite", ressenti: 3, duree_min: 40, distance_km: 6.4, allure: "6:15" },
  { seanceId: "S5-J2", date: "2026-07-21", statut: "adaptee", ressenti: 4, duree_min: 25, commentaire: "Marche souple." },
  { seanceId: "S5-J3", date: "2026-07-22", statut: "faite", ressenti: 2, duree_min: 50, commentaire: "Seuil dur mais tenu." },
  { seanceId: "S5-J5", date: "2026-07-24", statut: "faite", ressenti: 4, duree_min: 35, distance_km: 5.7, allure: "6:08" },
  { seanceId: "S5-J7", date: "2026-07-26", statut: "faite", ressenti: 3, duree_min: 66, distance_km: 10.0, allure: "6:36" },

  // Semaine 6 — en cours (aujourd'hui = dimanche S6).
  { seanceId: "S6-J1", date: "2026-07-27", statut: "faite", ressenti: 4, duree_min: 40, distance_km: 6.5, allure: "6:09" },
  { seanceId: "S6-J3", date: "2026-07-29", statut: "faite", ressenti: 3, duree_min: 55, commentaire: "3x6 min seuil, mieux passé." },
  { seanceId: "S6-J5", date: "2026-07-31", statut: "faite", ressenti: 4, duree_min: 40, distance_km: 6.7, allure: "5:58" },
];
