// État global léger — réglages + journal, persistés en localStorage.
// Un seul contexte, pas de dépendance externe.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Entree, Reglages } from "../data/types";
import {
  ecrireJournal,
  ecrireReglages,
  lireJournal,
  lireReglages,
} from "./storage";
import { JOURNAL_DEMO, REGLAGES_DEMO } from "../mock/journalFictif";

interface AppState {
  reglages: Reglages;
  journal: Entree[];
  demo: boolean;
  majReglages: (patch: Partial<Reglages>) => void;
  enregistrerEntree: (e: Entree) => void;
  supprimerEntree: (seanceId: string) => void;
  entreePour: (seanceId: string) => Entree | undefined;
  remplacerTout: (reglages: Reglages, journal: Entree[]) => void;
}

const Ctx = createContext<AppState | null>(null);

const estDemo = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

export function AppProvider({ children }: { children: ReactNode }) {
  const demo = estDemo();
  const [reglages, setReglages] = useState<Reglages>(() =>
    demo ? REGLAGES_DEMO : lireReglages(),
  );
  const [journal, setJournal] = useState<Entree[]>(() =>
    demo ? JOURNAL_DEMO : lireJournal(),
  );

  // Persistance (jamais en mode démo).
  useEffect(() => {
    if (!demo) ecrireReglages(reglages);
  }, [reglages, demo]);
  useEffect(() => {
    if (!demo) ecrireJournal(journal);
  }, [journal, demo]);

  const majReglages = useCallback((patch: Partial<Reglages>) => {
    setReglages((r) => ({ ...r, ...patch }));
  }, []);

  const enregistrerEntree = useCallback((e: Entree) => {
    setJournal((j) => {
      const autres = j.filter((x) => x.seanceId !== e.seanceId);
      return [...autres, e].sort((a, b) => a.seanceId.localeCompare(b.seanceId));
    });
  }, []);

  const supprimerEntree = useCallback((seanceId: string) => {
    setJournal((j) => j.filter((x) => x.seanceId !== seanceId));
  }, []);

  const entreePour = useCallback(
    (seanceId: string) => journal.find((e) => e.seanceId === seanceId),
    [journal],
  );

  const remplacerTout = useCallback((r: Reglages, j: Entree[]) => {
    setReglages(r);
    setJournal(j);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      reglages,
      journal,
      demo,
      majReglages,
      enregistrerEntree,
      supprimerEntree,
      entreePour,
      remplacerTout,
    }),
    [reglages, journal, demo, majReglages, enregistrerEntree, supprimerEntree, entreePour, remplacerTout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}
