import { describe, expect, it } from "vitest";
import { allureFrom, parsePace, paceToStr } from "./format";
import {
  couleurDeSemaine,
  paceFromVma,
  primaryZone,
  zoneDeSemaine,
  zonePaceLabel,
} from "./vma";
import { dateCourse, dateSeance, semaineCourante, toISODate } from "./calendar";
import { assiduite, kmPrevusAJour, KM_TOTAL_PREVU } from "./stats";
import { programme } from "../data/programme";
import type { Entree, Seance } from "../data/types";

describe("format", () => {
  it("paceToStr", () => {
    expect(paceToStr(5.7)).toBe("5:42");
    expect(paceToStr(6)).toBe("6:00");
    expect(paceToStr(0)).toBe("—");
  });
  it("parsePace round-trip", () => {
    expect(parsePace("5:42")).toBeCloseTo(5.7, 5);
    expect(parsePace("bad")).toBeNull();
  });
  it("allureFrom", () => {
    expect(allureFrom(60, 10)).toBe("6:00");
    expect(allureFrom(undefined, 10)).toBeUndefined();
  });
});

describe("vma", () => {
  it("paceFromVma : 100% VMA 14 = 4:17", () => {
    expect(paceToStr(paceFromVma(14, 1))).toBe("4:17");
  });
  it("paceFromVma : 70% VMA 14 ≈ 6:07", () => {
    expect(paceToStr(paceFromVma(14, 0.7))).toBe("6:07");
  });
  it("le recalcul suit la VMA", () => {
    expect(zonePaceLabel(14, 2)).not.toBe(zonePaceLabel(15, 2));
  });
  it("zone principale par type", () => {
    const mk = (over: Partial<Seance>): Seance => ({
      id: "x", jour: "Lundi", jour_index: 1, type: "ef",
      consigne: "", duree_min: 30, distance_km: null, a_saisir: true, ...over,
    });
    expect(primaryZone(mk({ type: "repos", duree_min: null }))).toBeNull();
    expect(primaryZone(mk({ type: "ef" }))).toBe(2);
    expect(primaryZone(mk({ type: "test" }))).toBe(5);
    expect(primaryZone(mk({ type: "course" }))).toBe(3);
    expect(primaryZone(mk({ type: "sortie_longue", consigne: "SL 7 km ZONE 1" }))).toBe(1);
    expect(primaryZone(mk({ type: "fractionne", consigne: "4x2 min allure semi (80% VMA)" }))).toBe(3);
    expect(primaryZone(mk({ type: "fractionne", consigne: "3x5 min seuil (85-88% VMA)" }))).toBe(4);
    expect(primaryZone(mk({ type: "fractionne", consigne: "3x1 min vive (90% VMA)" }))).toBe(5);
    expect(primaryZone(mk({ type: "fractionne", consigne: "3x3' en Z3 contrôlé" }))).toBe(3);
    expect(primaryZone(mk({ type: "renfo", consigne: "Musculation", duree_min: null }))).toBeNull();
  });
  it("couleur de semaine suit l'intensité", () => {
    expect(zoneDeSemaine("+")).toBe(2);
    expect(zoneDeSemaine("++++")).toBe(5);
    expect(zoneDeSemaine("(course)")).toBe(3);
    expect(couleurDeSemaine("++++")).toBe("#8C2C21");
  });
});

describe("calendar", () => {
  const debut = "2026-06-22"; // lundi
  it("date d'une séance", () => {
    expect(toISODate(dateSeance(debut, 1, 1))).toBe("2026-06-22");
    expect(toISODate(dateSeance(debut, 2, 3))).toBe("2026-07-01");
  });
  it("date de la course = dimanche S12", () => {
    // 11 semaines complètes + 6 jours = 83 jours après le lundi S1.
    expect(toISODate(dateCourse(debut))).toBe("2026-09-13");
  });
  it("semaine courante bornée 1..12", () => {
    expect(semaineCourante(debut)).toBeGreaterThanOrEqual(1);
    expect(semaineCourante(debut)).toBeLessThanOrEqual(12);
  });
});

describe("stats", () => {
  const debut = "2000-01-03"; // lundi très ancien → tout est « passé »
  const journal: Entree[] = [
    { seanceId: "S1-J3", date: "2000-01-05", statut: "faite", ressenti: 3, distance_km: 5 },
    { seanceId: "S1-J7", date: "2000-01-09", statut: "manquee", ressenti: 3 },
  ];
  it("assiduité : manquée ne compte pas comme réalisée", () => {
    const a = assiduite(debut, journal);
    expect(a.realisees).toBe(1);
    expect(a.prevues).toBeGreaterThan(1);
  });
  it("km prévus cumulés = total quand tout est passé", () => {
    expect(kmPrevusAJour(debut)).toBeCloseTo(KM_TOTAL_PREVU, 5);
  });
  it("le total prévu correspond à la somme des volumes hebdo", () => {
    const somme = programme.semaines.reduce((n, s) => n + s.volume_km, 0);
    expect(somme).toBeCloseTo(KM_TOTAL_PREVU, 5);
  });
});
