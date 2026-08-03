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
  // Champs enrichis (plan 10 km) — optionnels pour rester compatible.
  sous_type?: string; // "Seuil SV1", "Piste (VMA)"…
  libelle?: string; // "SV1", "PISTE"…
  allure_cible?: string | null; // allure fournie par le coach, ex. "5'10-5'20/km"
  intensite_seance?: number; // 0 à 4
}

export interface Semaine {
  numero: number;
  mesocycle: string;
  periode: string;
  intensite: string; // "+" … "++++" | "(course)"
  volume_km: number | null; // plan par volume
  charge_pct?: number | null; // plan par charge d'intensité (10 km)
  seances: Seance[];
}

export interface Zone {
  zone: number; // 1 … 5
  nom?: string; // "SV1 — seuil aérobie"
  pct_vma?: string; // "65-75%" (plan semi)
  allure: string; // plage d'allure fournie
  usage: string;
}

export interface Meta {
  titre: string;
  athlete: string;
  auteur: string;
  vma_kmh: number;
  objectif: string;
  allure_objectif?: string;
  duree_semaines: number;
  date_debut: string | null;
  volume_total_km: number | null;
  note_charge?: string;
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

export type Surface = "route" | "chemin" | "piste" | "tapis";

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
  // Contexte (facultatif)
  chaussure_id?: string;
  surface?: Surface;
  meteo?: { temp_c?: number; condition?: string };
  denivele_m?: number;
  charge?: number; // calculé : (6 − ressenti) × duree_min
}

// ---- Check-in du matin (une entrée par jour) ----

export type Note03 = 0 | 1 | 2 | 3;

export interface Douleur {
  cheville?: Note03;
  genou?: Note03;
  tendon?: Note03;
}

export interface CheckIn {
  date: string; // ISO YYYY-MM-DD (une entrée par jour)
  sommeil_h?: number; // durée de sommeil (heures)
  fraicheur?: 1 | 2 | 3 | 4 | 5; // 1 = épuisé … 5 = frais
  douleur?: Douleur; // 0 à 3 par articulation, 0 par défaut
  // Mesures de la montre (facultatives)
  fc_sommeil?: number; // FC moyenne de sommeil (bpm)
  vfc_ms?: number; // variabilité de la FC (ms)
  temp_cutanee?: number; // variation de température cutanée (°C, signée)
}

// ---- Chaussures ----

export interface Chaussure {
  id: string;
  nom: string;
  km: number; // kilométrage de départ du compteur
  date_mise_en_service?: string; // ISO
  archivee: boolean;
}

// ---- Réglages ----

export interface Reglages {
  dateDebut: string | null; // lundi de la semaine 1 (ISO)
  vma: number;
  dernierExport?: string; // ISO
  chaussures: Chaussure[];
  derniereChaussure?: string; // id de la dernière paire choisie
}
