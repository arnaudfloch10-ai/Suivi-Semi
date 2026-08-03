// État global léger — réglages, journal des séances, mesures de sommeil,
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
import type { Entree, MesureSommeil, Reglages } from "../data/types";
import {
  ecrireJournal,
  ecrireReglages,
  ecrireSommeil,
  lireJournal,
  lireReglages,
  lireSommeil,
} from "./storage";
import { JOURNAL_DEMO, REGLAGES_DEMO, SOMMEIL_DEMO } from "../mock/journalFictif";

interface AppState {
  reglages: Reglages;
  journal: Entree[];
  sommeil: MesureSommeil[];
  demo: boolean;
  majReglages: (patch: Partial<Reglages>) => void;
  enregistrerEntree: (e: Entree) => void;
  supprimerEntree: (seanceId: string) => void;
  entreePour: (seanceId: string) => Entree | undefined;
  enregistrerSommeil: (m: MesureSommeil) => void;
  supprimerSommeil: (date: string) => void;
  sommeilPour: (date: string) => MesureSommeil | undefined;
  remplacerTout: (reglages: Reglages, journal: Entree[], sommeil: MesureSommeil[]) => void;
}

const Ctx = createContext<AppState | null>(null);

const estDemo = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

// Une mesure de sommeil est-elle vide (aucune valeur saisie) ?
const sommeilVide = (m: MesureSommeil) =>
  m.fc_sommeil == null && m.vfc_ms == null && m.temp_var == null;

export function AppProvider({ children }: { children: ReactNode }) {
  const demo = estDemo();
  const [reglages, setReglages] = useState<Reglages>(() =>
    demo ? REGLAGES_DEMO : lireReglages(),
  );
  const [journal, setJournal] = useState<Entree[]>(() =>
    demo ? JOURNAL_DEMO : lireJournal(),
  );
  const [sommeil, setSommeil] = useState<MesureSommeil[]>(() =>
    demo ? SOMMEIL_DEMO : lireSommeil(),
  );

  // Persistance (jamais en mode démo).
  useEffect(() => {
    if (!demo) ecrireReglages(reglages);
  }, [reglages, demo]);
  useEffect(() => {
    if (!demo) ecrireJournal(journal);
  }, [journal, demo]);
  useEffect(() => {
    if (!demo) ecrireSommeil(sommeil);
  }, [sommeil, demo]);

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

  // Une mesure par jour : on remplace celle de la même date (ou on la retire si vide).
  const enregistrerSommeil = useCallback((m: MesureSommeil) => {
    setSommeil((s) => {
      const autres = s.filter((x) => x.date !== m.date);
      if (sommeilVide(m)) return autres.sort((a, b) => a.date.localeCompare(b.date));
      return [...autres, m].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const supprimerSommeil = useCallback((date: string) => {
    setSommeil((s) => s.filter((x) => x.date !== date));
  }, []);

  const sommeilPour = useCallback(
    (date: string) => sommeil.find((m) => m.date === date),
    [sommeil],
  );

  const remplacerTout = useCallback((r: Reglages, j: Entree[], s: MesureSommeil[]) => {
    setReglages(r);
    setJournal(j);
    setSommeil(s);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      reglages,
      journal,
      sommeil,
      demo,
      majReglages,
      enregistrerEntree,
      supprimerEntree,
      entreePour,
      enregistrerSommeil,
      supprimerSommeil,
      sommeilPour,
      remplacerTout,
    }),
    [
      reglages, journal, sommeil, demo, majReglages, enregistrerEntree, supprimerEntree,
      entreePour, enregistrerSommeil, supprimerSommeil, sommeilPour, remplacerTout,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return ctx;
}
