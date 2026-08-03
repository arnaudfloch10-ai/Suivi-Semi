import { describe, expect, it } from "vitest";
import { allureFrom, parsePace, paceToStr } from "./format";
import {
  allureCibleTexte,
  couleurDeSemaine,
  paceFromVma,
  zoneAllureSelonVma,
  zoneDeCharge,
  zoneDeSemaine,
  zoneSeance,
} from "./vma";
import type { Zone } from "../data/types";
import { aujourdHui, dateCourse, dateSeance, semaineCourante, toISODate } from "./calendar";
import { assiduite, kmRealises } from "./stats";
import { PLAN_PAR_CHARGE, programme } from "../data/programme";
import type { Entree, Seance, Semaine } from "../data/types";

const mkSeance = (over: Partial<Seance>): Seance => ({
  id: "x",
  jour: "Lundi",
  jour_index: 1,
  type: "ef",
  consigne: "",
  duree_min: 30,
  distance_km: null,
  a_saisir: true,
  ...over,
});

const mkSemaine = (over: Partial<Semaine>): Semaine => ({
  numero: 1,
  mesocycle: "",
  periode: "",
  intensite: "+++",
  volume_km: null,
  seances: [],
  ...over,
});

describe("format", () => {
  it("paceToStr / parsePace", () => {
    expect(paceToStr(5.7)).toBe("5:42");
    expect(parsePace("5:42")).toBeCloseTo(5.7, 5);
    expect(allureFrom(60, 10)).toBe("6:00");
  });
});

describe("vma — allures", () => {
  it("paceFromVma", () => {
    expect(paceToStr(paceFromVma(14, 1))).toBe("4:17");
    expect(paceToStr(paceFromVma(14, 0.7))).toBe("6:07");
  });
  it("allure cible : priorité à celle du coach", () => {
    const s = mkSeance({ type: "fractionne", sous_type: "Seuil SV1", allure_cible: "5'10-5'20/km" });
    expect(allureCibleTexte(s, 14)).toBe("5'10-5'20/km");
  });
  it("allure cible : calcul de repli si non fournie", () => {
    const s = mkSeance({ type: "ef", allure_cible: null });
    expect(allureCibleTexte(s, 14)).toMatch(/\/km$/);
  });
});

describe("vma — zone d'une séance (plan 10 km)", () => {
  it("mappe les libellés du plan", () => {
    expect(zoneSeance(mkSeance({ type: "repos" }))).toBeNull();
    expect(zoneSeance(mkSeance({ type: "renfo", sous_type: "Étirements" }))).toBeNull();
    expect(zoneSeance(mkSeance({ type: "test", libelle: "TEST INITIAL" }))).toBe(5);
    expect(zoneSeance(mkSeance({ type: "course", libelle: "10KM" }))).toBe(3);
    expect(zoneSeance(mkSeance({ type: "fractionne", sous_type: "Piste (VMA)", libelle: "PISTE" }))).toBe(5);
    expect(zoneSeance(mkSeance({ type: "fractionne", sous_type: "Côtes", libelle: "CÔTE" }))).toBe(4);
    expect(zoneSeance(mkSeance({ type: "fractionne", sous_type: "Seuil SV2", libelle: "SV2" }))).toBe(4);
    expect(zoneSeance(mkSeance({ type: "fractionne", sous_type: "Seuil SV1", libelle: "SV1" }))).toBe(3);
    expect(zoneSeance(mkSeance({ type: "ef", libelle: "FOOTING Z1" }))).toBe(1);
    expect(zoneSeance(mkSeance({ type: "sortie_longue", libelle: "SL Z2" }))).toBe(2);
  });
});

describe("vma — zones recalculées selon la VMA", () => {
  const z2: Zone = { zone: 2, nom: "Z2", allure: "5:50 - 6:05 /km", usage: "" };
  it("reproduit les valeurs du coach à la VMA de référence", () => {
    expect(zoneAllureSelonVma(z2, 14, 14)).toBe("5:50 – 6:05 /km");
  });
  it("accélère les zones quand la VMA monte", () => {
    const ref = zoneAllureSelonVma(z2, 14, 14);
    const plus = zoneAllureSelonVma(z2, 14, 15);
    expect(plus).not.toBe(ref);
    expect(parsePace(plus.split(" ")[0])!).toBeLessThan(parsePace(ref.split(" ")[0])!);
  });
});

describe("vma — vague de charge", () => {
  it("bandes de charge : rouge réservé aux pics", () => {
    expect(zoneDeCharge(50)).toBe(2);
    expect(zoneDeCharge(60)).toBe(3);
    expect(zoneDeCharge(70)).toBe(4);
    expect(zoneDeCharge(80)).toBe(4);
    expect(zoneDeCharge(90)).toBe(5);
  });
  it("couleur de semaine pilotée par la charge si présente", () => {
    expect(zoneDeSemaine(mkSemaine({ charge_pct: 90 }))).toBe(5);
    expect(zoneDeSemaine(mkSemaine({ charge_pct: 50 }))).toBe(2);
    // repli sur l'intensité (plan par volume)
    expect(zoneDeSemaine(mkSemaine({ charge_pct: null, intensite: "++++" }))).toBe(5);
    expect(couleurDeSemaine(mkSemaine({ charge_pct: 90 }))).toBe("#8C2C21");
  });
});

describe("plan 10 km chargé", () => {
  it("est bien périodisé par charge", () => {
    expect(PLAN_PAR_CHARGE).toBe(true);
    expect(programme.semaines).toHaveLength(9);
  });
});

describe("calendar", () => {
  const debut = "2026-06-22"; // lundi
  it("date d'une séance", () => {
    expect(toISODate(dateSeance(debut, 1, 1))).toBe("2026-06-22");
    expect(toISODate(dateSeance(debut, 2, 3))).toBe("2026-07-01");
  });
  it("course = dimanche de la dernière semaine (S9)", () => {
    // 8 semaines complètes + 6 jours = 62 jours après le lundi S1.
    expect(toISODate(dateCourse(debut))).toBe("2026-08-23");
  });
  it("semaine courante bornée", () => {
    const n = semaineCourante(debut);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(9);
  });
});

describe("partage (lien coach)", () => {
  it("round-trip encode → décode", async () => {
    const { encoderPartage, decoderPartage } = await import("./share");
    const reglages = { dateDebut: "2026-06-22", vma: 14, chaussures: [] };
    const journal: Entree[] = [
      { seanceId: "S1-J3", date: "2026-06-24", statut: "faite", ressenti: 3, allure: "6:22", commentaire: "jambes ok" },
      { seanceId: "S3-J7", date: "2026-07-12", statut: "manquee", ressenti: 3 },
    ];
    const checkins = [{ date: "2026-08-01", vfc_ms: 60, fc_sommeil: 50, temp_cutanee: -0.2 }];
    const payload = await encoderPartage(reglages, journal, checkins);
    const s = await decoderPartage(payload);
    expect(s.journal).toHaveLength(2);
    expect(s.reglages.vma).toBe(14);
    expect(s.journal[0].commentaire).toBe("jambes ok");
    expect(s.checkins).toHaveLength(1);
    expect(s.checkins[0].vfc_ms).toBe(60);
  });
});

describe("charge (sRPE) & ACWR", () => {
  const iso = (offset: number) =>
    toISODate(new Date(aujourdHui().getTime() - offset * 86400000));
  it("charge = (6 − ressenti) × durée", async () => {
    const { chargeSeance } = await import("./charge");
    expect(chargeSeance({ ressenti: 3, duree_min: 40 })).toBe(120);
    expect(chargeSeance({ ressenti: 1, duree_min: 30 })).toBe(150);
    expect(chargeSeance({ ressenti: 3, duree_min: undefined })).toBeUndefined();
  });
  it("ACWR gelé tant que < 28 jours d'historique", async () => {
    const { acwr } = await import("./charge");
    expect(acwr([], null).disponible).toBe(false);
    expect(acwr([], iso(10)).disponible).toBe(false);
  });
  it("ACWR calculé au-delà de 28 jours", async () => {
    const { acwr } = await import("./charge");
    const journal: Entree[] = [
      { seanceId: "S1-J1", date: iso(0), statut: "faite", ressenti: 3, duree_min: 60 }, // charge 180
    ];
    const r = acwr(journal, iso(40));
    expect(r.disponible).toBe(true);
    expect(r.aigue).toBe(180);
    expect(r.ratio).toBeCloseTo(4, 5); // 180 / (180/4)
  });
});

describe("baseline", () => {
  it("écart indisponible sous 7 jours", async () => {
    const { ecartBaseline } = await import("./baseline");
    const cks = [1, 2, 3].map((d) => ({ date: `2026-08-0${d}`, vfc_ms: 50 }));
    expect(ecartBaseline(cks, "vfc_ms").disponible).toBe(false);
  });
  it("dérive favorable quand la VFC dépasse la baseline", async () => {
    const { ecartBaseline } = await import("./baseline");
    const cks = [50, 50, 50, 50, 50, 50, 70].map((v, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      vfc_ms: v,
    }));
    const e = ecartBaseline(cks, "vfc_ms");
    expect(e.disponible).toBe(true);
    expect(e.favorable).toBe(true);
    expect(e.ecart! > 0).toBe(true);
  });
});

describe("migration v1 → v2", () => {
  it("un carnet v1 (sommeil/temp_var) se réimporte sans perte", async () => {
    const { validerSauvegarde } = await import("../store/storage");
    const v1 = {
      app: "suivi-semi",
      version: 1,
      reglages: { dateDebut: "2026-06-22", vma: 14 },
      journal: [{ seanceId: "S1-J3", date: "2026-06-24", statut: "faite", ressenti: 3 }],
      sommeil: [{ date: "2026-06-24", vfc_ms: 55, temp_var: -0.2 }],
    };
    const s = validerSauvegarde(v1);
    expect(s.version).toBe(2);
    expect(s.journal).toHaveLength(1);
    expect(s.checkins).toHaveLength(1);
    expect(s.checkins[0].temp_cutanee).toBe(-0.2);
    expect(s.reglages.chaussures.length).toBeGreaterThan(0); // paires par défaut ajoutées
  });
});

describe("stats", () => {
  const debut = "2000-01-03"; // lundi très ancien → tout est « passé »
  const journal: Entree[] = [
    { seanceId: "S1-J3", date: "2000-01-05", statut: "faite", ressenti: 3, distance_km: 5 },
    { seanceId: "S1-J7", date: "2000-01-09", statut: "manquee", ressenti: 3 },
  ];
  it("assiduité : une manquée ne compte pas comme réalisée", () => {
    const a = assiduite(debut, journal);
    expect(a.realisees).toBe(1);
    expect(a.prevues).toBeGreaterThan(1);
  });
  it("km réalisés = somme des distances saisies", () => {
    expect(kmRealises(journal)).toBe(5);
  });
});
