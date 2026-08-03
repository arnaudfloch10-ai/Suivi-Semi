// Accueil — « Où j'en suis ». Écran d'ouverture, le plus important.

import { useApp } from "../store/useApp";
import { programme, PLAN_PAR_CHARGE, TOTAL_SEANCES, VOLUME_TOTAL } from "../data/programme";
import { semaineCourante } from "../lib/calendar";
import {
  allureEfParSemaine,
  exportConseille,
  kmPrevusAJour,
  kmRealises,
  ressentiParSemaine,
  seancesRealisees,
} from "../lib/stats";
import { couleurDeSemaine } from "../lib/vma";
import { nombreFr } from "../lib/format";
import { lazy, Suspense } from "react";
import LoadWave from "../components/LoadWave";
import ChargeAccueil from "../components/ChargeAccueil";
import Section from "../components/Section";
import Countdown from "../components/Countdown";

// Recharts est chargé après le premier rendu : la vague et les chiffres
// s'affichent tout de suite, les courbes arrivent ensuite.
const CourbeRessenti = lazy(() =>
  import("../components/Courbes").then((m) => ({ default: m.CourbeRessenti })),
);
const CourbeAllure = lazy(() =>
  import("../components/Courbes").then((m) => ({ default: m.CourbeAllure })),
);

const PlaceholderCourbe = () => <div className="h-[150px]" aria-hidden="true" />;

function Chiffre({
  valeur,
  unite,
  legende,
}: {
  valeur: string;
  unite?: string;
  legende: string;
}) {
  return (
    <div>
      <div className="font-display text-4xl leading-none text-encre">
        <span className="tnum">{valeur}</span>
        {unite && <span className="ml-1 text-lg text-sourdine">{unite}</span>}
      </div>
      <div className="mt-1.5 text-sm text-sourdine">{legende}</div>
    </div>
  );
}

export default function Accueil({
  onOuvrirSemaine,
  onAllerReglages,
}: {
  onOuvrirSemaine: (n: number) => void;
  onAllerReglages: () => void;
}) {
  const { reglages, journal } = useApp();
  const dateDebut = reglages.dateDebut!;
  const semNum = semaineCourante(dateDebut);
  const sem = programme.semaines.find((s) => s.numero === semNum)!;

  const faites = seancesRealisees(journal);
  const pctPlan = TOTAL_SEANCES ? Math.round((faites / TOTAL_SEANCES) * 100) : 0;
  const kmFaits = kmRealises(journal);
  const kmPrevus = kmPrevusAJour(dateDebut);
  const ressenti = ressentiParSemaine(journal);
  const allure = allureEfParSemaine(journal);
  const rappelExport = exportConseille(reglages.dernierExport, journal.length === 0);

  return (
    <div className="animate-[fade-in_400ms_ease-out]">
      <header className="flex items-start justify-between pb-4 pt-2">
        <h1 className="font-display text-3xl leading-none text-encre">Où j'en suis</h1>
        <div className="flex items-center gap-2 pt-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: couleurDeSemaine(sem) }}
            aria-hidden="true"
          />
          <span className="tnum text-sm text-sourdine">
            S{sem.numero} · {sem.intensite}
          </span>
        </div>
      </header>

      <LoadWave semaineCourante={semNum} onOuvrir={onOuvrirSemaine} />
      <ChargeAccueil journal={journal} dateDebut={dateDebut} semaineCourante={semNum} />

      {rappelExport && (
        <button
          onClick={onAllerReglages}
          className="mt-4 flex w-full items-center justify-between rounded-md border border-zone3/40 bg-zone3/5 px-3 py-2.5 text-left text-sm"
        >
          <span className="text-encre">Pense à sauvegarder ton carnet.</span>
          <span className="text-zone3">Exporter →</span>
        </button>
      )}

      <Section titre="À ce stade du plan">
        <div className="grid grid-cols-2 gap-6">
          <Chiffre
            valeur={nombreFr(faites)}
            unite={`/ ${TOTAL_SEANCES}`}
            legende={`séances réalisées · ${pctPlan}% du plan`}
          />
          {PLAN_PAR_CHARGE ? (
            <Chiffre
              valeur={nombreFr(Math.round(kmFaits))}
              unite="km"
              legende="parcourus et saisis"
            />
          ) : (
            <Chiffre
              valeur={nombreFr(Math.round(kmFaits))}
              unite={`/ ${nombreFr(Math.round(kmPrevus))} km`}
              legende={`prévu à ce jour · ${nombreFr(VOLUME_TOTAL)} km au total`}
            />
          )}
        </div>
      </Section>

      <Section titre="Ressenti moyen par semaine">
        <Suspense fallback={<PlaceholderCourbe />}>
          <CourbeRessenti data={ressenti} />
        </Suspense>
        <p className="mt-2 text-xs text-sourdine">1 = très dur · 5 = très facile</p>
      </Section>

      <Section titre="Allure d'endurance dans le temps">
        <Suspense fallback={<PlaceholderCourbe />}>
          <CourbeAllure data={allure} />
        </Suspense>
        <p className="mt-2 text-xs text-sourdine">min/km · plus bas = plus rapide</p>
      </Section>

      <Section>
        <Countdown dateDebut={dateDebut} />
      </Section>
    </div>
  );
}
