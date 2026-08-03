// État global léger — réglages, journal des séances, check-ins du matin,
// persistés en localStorage. Un seul contexte, pas de dépendance externe.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CheckIn, Entree, Reglages } from "../data/types";
import {
  ecrireCheckins,
  ecrireJournal,
  ecrireReglages,
  lireCheckins,
  lireJournal,
  lireReglages,
} from "./storage";
import { chargeSeance } from "../lib/charge";
import { CHECKINS_DEMO, JOURNAL_DEMO, REGLAGES_DEMO } from "../mock/journalFictif";

interface AppState {
  reglages: Reglages;
  journal: Entree[];
  checkins: CheckIn[];
  demo: boolean;
  majReglages: (patch: Partial<Reglages>) => void;
  enregistrerEntree: (e: Entree) => void;
  supprimerEntree: (seanceId: string) => void;
  entreePour: (seanceId: string) => Entree | undefined;
  enregistrerCheckin: (c: CheckIn) => void;
  supprimerCheckin: (date: string) => void;
  checkinPour: (date: string) => CheckIn | undefined;
  remplacerTout: (reglages: Reglages, journal: Entree[], checkins: CheckIn[]) => void;
}

const Ctx = createContext<AppState | null>(null);

const estDemo = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

// Un check-in est-il vide (aucune valeur) ?
const checkinVide = (c: CheckIn) =>
  c.sommeil_h == null &&
  c.fraicheur == null &&
  c.fc_sommeil == null &&
  c.vfc_ms == null &&
  c.temp_cutanee == null &&
  !c.douleur;

export function AppProvider({ children }: { children: ReactNode }) {
  const demo = estDemo();
  const [reglages, setReglages] = useState<Reglages>(() =>
    demo ? REGLAGES_DEMO : lireReglages(),
  );
  const [journal, setJournal] = useState<Entree[]>(() =>
    demo ? JOURNAL_DEMO : lireJournal(),
  );
  const [checkins, setCheckins] = useState<CheckIn[]>(() =>
    demo ? CHECKINS_DEMO : lireCheckins(),
  );

  useEffect(() => {
    if (!demo) ecrireReglages(reglages);
  }, [reglages, demo]);
  useEffect(() => {
    if (!demo) ecrireJournal(journal);
  }, [journal, demo]);
  useEffect(() => {
    if (!demo) ecrireCheckins(checkins);
  }, [checkins, demo]);

  const majReglages = useCallback((patch: Partial<Reglages>) => {
    setReglages((r) => ({ ...r, ...patch }));
  }, []);

  const enregistrerEntree = useCallback((e: Entree) => {
    // Charge sRPE calculée à l'enregistrement.
    const avecCharge = { ...e, charge: chargeSeance(e) };
    setJournal((j) => {
      const autres = j.filter((x) => x.seanceId !== e.seanceId);
      return [...autres, avecCharge].sort((a, b) => a.seanceId.localeCompare(b.seanceId));
    });
  }, []);

  const supprimerEntree = useCallback((seanceId: string) => {
    setJournal((j) => j.filter((x) => x.seanceId !== seanceId));
  }, []);

  const entreePour = useCallback(
    (seanceId: string) => journal.find((e) => e.seanceId === seanceId),
    [journal],
  );

  const enregistrerCheckin = useCallback((c: CheckIn) => {
    setCheckins((s) => {
      const autres = s.filter((x) => x.date !== c.date);
      const suite = checkinVide(c) ? autres : [...autres, c];
      return suite.sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const supprimerCheckin = useCallback((date: string) => {
    setCheckins((s) => s.filter((x) => x.date !== date));
  }, []);

  const checkinPour = useCallback(
    (date: string) => checkins.find((c) => c.date === date),
    [checkins],
  );

  const remplacerTout = useCallback((r: Reglages, j: Entree[], c: CheckIn[]) => {
    setReglages(r);
    setJournal(j);
    setCheckins(c);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      reglages, journal, checkins, demo,
      majReglages, enregistrerEntree, supprimerEntree, entreePour,
      enregistrerCheckin, supprimerCheckin, checkinPour, remplacerTout,
    }),
    [
      reglages, journal, checkins, demo, majReglages, enregistrerEntree,
      supprimerEntree, entreePour, enregistrerCheckin, supprimerCheckin,
      checkinPour, remplacerTout,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}
