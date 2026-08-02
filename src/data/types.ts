// Modèle de données — miroir strict de programme.json (lecture seule)
// et du journal (écriture). Deux mondes séparés, jamais mélangés.

export type SeanceType =
  | "repos"
  | "ef"
  | "fractionne"
  | "sortie_longue"
  | "renfo"
  | "test"
  | "recup_active"
  | "course";

export interface Seance {
  id: string; // "S3-J7"
  jour: string; // "Dimanche"
  jour_index: number; // 1 = lundi … 7 = dimanche
  type: SeanceType;
  consigne: string;
  duree_min: number | null;
  distance_km: number | null;
  a_saisir: boolean;
}

export interface Semaine {
  numero: number;
  mesocycle: string;
  periode: string;
  intensite: string; // "+" … "++++" | "(course)"
  volume_km: number;
  seances: Seance[];
}

export interface Zone {
  zone: number; // 1 … 5
  pct_vma: string; // "65-75%"
  allure: string; // "5:40 - 6:35 /km"
  usage: string;
}

export interface Meta {
  titre: string;
  athlete: string;
  auteur: string;
  vma_kmh: number;
  objectif: string;
  duree_semaines: number;
  date_debut: string | null;
  volume_total_km: number;
}

export interface Programme {
  meta: Meta;
  zones: Zone[];
  points_attention: string[];
  semaines: Semaine[];
}

// ---- Journal (écriture) ----

export type Statut = "faite" | "adaptee" | "manquee";
export type Ressenti = 1 | 2 | 3 | 4 | 5;

export interface Entree {
  seanceId: string;
  date: string; // ISO, date réelle de réalisation
  statut: Statut;
  ressenti: Ressenti;
  duree_min?: number;
  distance_km?: number;
  allure?: string; // "5:42"
  fc_moyenne?: number;
  commentaire?: string;
}

// ---- Réglages ----

export interface Reglages {
  dateDebut: string | null; // lundi de la semaine 1 (ISO)
  vma: number;
  dernierExport?: string; // ISO
}
