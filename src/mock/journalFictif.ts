// Données de démonstration — servent uniquement à valider le rendu (?demo),
// jamais en usage réel. Calées sur le plan 10 km (9 semaines).

import type { CheckIn, Entree, Reglages } from "../data/types";

// Lundi de la S1 calé pour qu'aujourd'hui tombe en fin de semaine 6.
export const REGLAGES_DEMO: Reglages = {
  dateDebut: "2026-06-22",
  vma: 14,
  dernierExport: undefined,
  chaussures: [
    { id: "vomero", nom: "Nike Vomero Plus", km: 8, date_mise_en_service: "2026-06-20", archivee: false },
    { id: "pegasus", nom: "Nike Pegasus 42", km: 4, date_mise_en_service: "2026-06-20", archivee: false },
  ],
  derniereChaussure: "vomero",
};

export const JOURNAL_DEMO: Entree[] = [
  // Semaine 1 — on démarre, ça tire un peu.
  { seanceId: "S1-J1", date: "2026-06-22", statut: "faite", ressenti: 2, duree_min: 6, commentaire: "Test terrain : ~1250 m sur 6 min." },
  { seanceId: "S1-J3", date: "2026-06-24", statut: "faite", ressenti: 3, duree_min: 35, distance_km: 5.2, allure: "6:44", chaussure_id: "pegasus", surface: "route" },
  { seanceId: "S1-J5", date: "2026-06-26", statut: "faite", ressenti: 2, duree_min: 42, commentaire: "10 x 200m piste, jambes lourdes." },
  { seanceId: "S1-J6", date: "2026-06-27", statut: "faite", ressenti: 4, duree_min: 15 },
  { seanceId: "S1-J7", date: "2026-06-28", statut: "faite", ressenti: 3, duree_min: 60, distance_km: 9.6, allure: "6:15", chaussure_id: "vomero", surface: "chemin", denivele_m: 80 },

  // Semaine 2
  { seanceId: "S2-J2", date: "2026-06-30", statut: "faite", ressenti: 2, duree_min: 35, commentaire: "10 x 100m en côte, dur." },
  { seanceId: "S2-J3", date: "2026-07-01", statut: "faite", ressenti: 3, duree_min: 35, distance_km: 5.3, allure: "6:36" },
  { seanceId: "S2-J5", date: "2026-07-03", statut: "faite", ressenti: 3, duree_min: 35, commentaire: "20 min SV1 tenu." },
  { seanceId: "S2-J6", date: "2026-07-04", statut: "faite", ressenti: 4, duree_min: 15 },
  { seanceId: "S2-J7", date: "2026-07-05", statut: "faite", ressenti: 3, duree_min: 60, distance_km: 9.8, allure: "6:07" },

  // Semaine 3 — grosse charge (90 %).
  { seanceId: "S3-J1", date: "2026-07-06", statut: "faite", ressenti: 2, duree_min: 48, commentaire: "2 x 15 min SV1." },
  { seanceId: "S3-J3", date: "2026-07-08", statut: "faite", ressenti: 4, duree_min: 30, distance_km: 4.7, allure: "6:22" },
  { seanceId: "S3-J5", date: "2026-07-10", statut: "adaptee", ressenti: 2, duree_min: 40, commentaire: "6 x 400m, coupé à 5, fatigue." },
  { seanceId: "S3-J6", date: "2026-07-11", statut: "faite", ressenti: 4, duree_min: 30, distance_km: 4.8, allure: "6:18" },
  { seanceId: "S3-J7", date: "2026-07-12", statut: "manquee", ressenti: 3, commentaire: "Côtes annulées, chevilles sensibles." },

  // Semaine 4 — régénération (60 %).
  { seanceId: "S4-J2", date: "2026-07-14", statut: "faite", ressenti: 4, duree_min: 40, distance_km: 6.5, allure: "6:09", chaussure_id: "pegasus" },
  { seanceId: "S4-J4", date: "2026-07-16", statut: "faite", ressenti: 3, duree_min: 40 },
  { seanceId: "S4-J5", date: "2026-07-17", statut: "faite", ressenti: 3, duree_min: 40, commentaire: "3 x 8 min SV2, bien passé." },
  { seanceId: "S4-J6", date: "2026-07-18", statut: "faite", ressenti: 4, duree_min: 30, distance_km: 4.8, allure: "6:12" },
  { seanceId: "S4-J7", date: "2026-07-19", statut: "faite", ressenti: 5, duree_min: 20 },

  // Semaine 5
  { seanceId: "S5-J1", date: "2026-07-20", statut: "faite", ressenti: 4, duree_min: 40, distance_km: 6.6, allure: "6:04" },
  { seanceId: "S5-J2", date: "2026-07-21", statut: "faite", ressenti: 3, duree_min: 45, commentaire: "2 x 15 min SV1, plus à l'aise." },
  { seanceId: "S5-J3", date: "2026-07-22", statut: "faite", ressenti: 5, duree_min: 15 },
  { seanceId: "S5-J5", date: "2026-07-24", statut: "faite", ressenti: 3, duree_min: 42, commentaire: "5 x 500m piste, allure tenue." },
  { seanceId: "S5-J7", date: "2026-07-26", statut: "faite", ressenti: 4, duree_min: 70, distance_km: 11.4, allure: "6:08", chaussure_id: "vomero", surface: "route", denivele_m: 60 },

  // Semaine 6 — en cours (aujourd'hui = dimanche S6, SL pas encore faite).
  { seanceId: "S6-J2", date: "2026-07-28", statut: "faite", ressenti: 3, duree_min: 40, commentaire: "4 x 6 min SV2." },
  { seanceId: "S6-J4", date: "2026-07-30", statut: "faite", ressenti: 4, duree_min: 35, distance_km: 5.9, allure: "5:58" },
  { seanceId: "S6-J5", date: "2026-07-31", statut: "faite", ressenti: 4, duree_min: 40, commentaire: "25 min SV1 en continu." },
];

// Check-ins de démonstration (assez de nuits pour atteindre l'état « stable »).
export const CHECKINS_DEMO: CheckIn[] = [
  { date: "2026-07-15", sommeil_h: 6.5, fraicheur: 3, fc_sommeil: 56, vfc_ms: 46, temp_cutanee: 0.1 },
  { date: "2026-07-16", sommeil_h: 7.0, fraicheur: 3, fc_sommeil: 55, vfc_ms: 48, temp_cutanee: 0.0 },
  { date: "2026-07-17", sommeil_h: 6.0, fraicheur: 2, fc_sommeil: 57, vfc_ms: 43, temp_cutanee: 0.2, douleur: { tendon: 1 } },
  { date: "2026-07-18", sommeil_h: 7.5, fraicheur: 4, fc_sommeil: 54, vfc_ms: 50, temp_cutanee: -0.1 },
  { date: "2026-07-19", sommeil_h: 8.0, fraicheur: 4, fc_sommeil: 53, vfc_ms: 52, temp_cutanee: 0.0 },
  { date: "2026-07-20", sommeil_h: 6.5, fraicheur: 3, fc_sommeil: 55, vfc_ms: 46, temp_cutanee: 0.1 },
  { date: "2026-07-21", sommeil_h: 7.0, fraicheur: 4, fc_sommeil: 54, vfc_ms: 49, temp_cutanee: -0.1 },
  { date: "2026-07-22", sommeil_h: 5.5, fraicheur: 2, fc_sommeil: 58, vfc_ms: 42, temp_cutanee: 0.3, douleur: { genou: 2 } },
  { date: "2026-07-23", sommeil_h: 7.0, fraicheur: 3, fc_sommeil: 55, vfc_ms: 47, temp_cutanee: 0.0 },
  { date: "2026-07-24", sommeil_h: 7.5, fraicheur: 4, fc_sommeil: 53, vfc_ms: 51, temp_cutanee: -0.1 },
  { date: "2026-07-25", sommeil_h: 6.5, fraicheur: 3, fc_sommeil: 55, vfc_ms: 47, temp_cutanee: 0.1 },
  { date: "2026-07-26", sommeil_h: 7.0, fraicheur: 3, fc_sommeil: 54, vfc_ms: 48, temp_cutanee: -0.1 },
  { date: "2026-07-27", sommeil_h: 6.0, fraicheur: 2, fc_sommeil: 54, vfc_ms: 48, temp_cutanee: -0.1, douleur: { cheville: 1 } },
  { date: "2026-07-28", sommeil_h: 7.5, fraicheur: 4, fc_sommeil: 53, vfc_ms: 52, temp_cutanee: 0.0 },
  { date: "2026-07-29", sommeil_h: 6.5, fraicheur: 3, fc_sommeil: 56, vfc_ms: 44, temp_cutanee: 0.3 },
  { date: "2026-07-30", sommeil_h: 7.0, fraicheur: 4, fc_sommeil: 52, vfc_ms: 55, temp_cutanee: -0.2 },
  { date: "2026-07-31", sommeil_h: 7.5, fraicheur: 4, fc_sommeil: 51, vfc_ms: 58, temp_cutanee: -0.1 },
  { date: "2026-08-01", sommeil_h: 8.0, fraicheur: 5, fc_sommeil: 50, vfc_ms: 61, temp_cutanee: 0.1 },
  { date: "2026-08-02", sommeil_h: 7.0, fraicheur: 4, fc_sommeil: 49, vfc_ms: 63, temp_cutanee: 0.0 },
  { date: "2026-08-03", sommeil_h: 6.0, fraicheur: 3, fc_sommeil: 52, vfc_ms: 58, temp_cutanee: 0.1, douleur: { cheville: 1 } },
];
