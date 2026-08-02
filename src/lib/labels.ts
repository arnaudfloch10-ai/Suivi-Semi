import type { SeanceType, Statut } from "../data/types";

export const TYPE_LABEL: Record<SeanceType, string> = {
  repos: "Repos",
  ef: "Endurance fondamentale",
  fractionne: "Fractionné",
  sortie_longue: "Sortie longue",
  renfo: "Renforcement",
  test: "Test",
  recup_active: "Récupération active",
  course: "Course",
};

export const TYPE_LABEL_COURT: Record<SeanceType, string> = {
  repos: "Repos",
  ef: "Endurance",
  fractionne: "Fractionné",
  sortie_longue: "Sortie longue",
  renfo: "Renfo",
  test: "Test",
  recup_active: "Récup active",
  course: "Course",
};

export const STATUT_LABEL: Record<Statut, string> = {
  faite: "Faite",
  adaptee: "Adaptée",
  manquee: "Manquée",
};

export const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
