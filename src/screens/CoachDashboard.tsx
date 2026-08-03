// Tableau de bord coach — lecture seule. Alimenté par un instantané décodé
// depuis le lien de partage ; ne touche jamais au localStorage.

import { lazy, Suspense } from "react";
import { programme } from "../data/programme";
import type { Sauvegarde } from "../store/storage";
import type { Entree, Seance } from "../data/types";
import { semaineCourante } from "../lib/calendar";
import {
  allureEfParSemaine,
  kmPrevusAJour,
  kmRealises,
  ressentiParSemaine,
  seancesRealisees,
} from "../lib/stats";
import { PLAN_PAR_CHARGE, TOTAL_SEANCES, VOLUME_TOTAL } from "../data/programme";
import { couleurDeSemaine, zoneSeance, ZONE_COULEUR } from "../lib/vma";
import { formatDateComplet, formatDateCourt, nombreFr } from "../lib/format";
import { parseISODate } from "../lib/calendar";
import { TYPE_LABEL, STATUT_LABEL } from "../lib/labels";
import type { MesureSommeil } from "../data/types";
import LoadWave from "../components/LoadWave";
import Section from "../components/Section";
import Sparkline from "../components/Sparkline";
import Countdown from "../components/Countdown";

const signe = (n: number) => `${n > 0 ? "+" : ""}${nombreFr(n, 1)}`;

const CourbeRessenti = lazy(() =>
  import("../components/Courbes").then((m) => ({ default: m.CourbeRessenti })),
);
const CourbeAllure = lazy(() =>
  import("../components/Courbes").then((m) => ({ default: m.CourbeAllure })),
);
const Placeholder = () => <div className="h-[150px]" aria-hidden="true" />;

// Index séance par id.
const SEANCE_PAR_ID: Record<string, { seance: Seance; semaine: number }> = {};
for (const sem of programme.semaines) {
  for (const s of sem.seances) SEANCE_PAR_ID[s.id] = { seance: s, semaine: sem.numero };
}

const STATUT_COULEUR = { faite: ZONE_COULEUR[2], adaptee: ZONE_COULEUR[3], manquee: ZONE_COULEUR[5] };

function Chiffre({ valeur, unite, legende }: { valeur: string; unite?: string; legende: string }) {
  return (
    <div>
      <div className="font-display text-3xl leading-none text-encre">
        <span className="tnum">{valeur}</span>
        {unite && <span className="ml-1 text-base text-sourdine">{unite}</span>}
      </div>
      <div className="mt-1.5 text-sm text-sourdine">{legende}</div>
    </div>
  );
}

export default function CoachDashboard({ sauvegarde }: { sauvegarde: Sauvegarde }) {
  const { reglages, journal } = sauvegarde;
  const dateDebut = reglages.dateDebut;
  const journalTrie = [...journal].sort((a, b) => a.seanceId.localeCompare(b.seanceId));

  const exporteLe = sauvegarde.exporteLe
    ? formatDateComplet(new Date(sauvegarde.exporteLe))
    : null;

  return (
    <div className="mx-auto min-h-full w-full max-w-app px-5 pb-16">
      <header className="border-b border-black/10 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-sourdine">
          Vue coach · lecture seule
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight text-encre">
          {programme.meta.athlete}
        </h1>
        <p className="mt-1 text-sm text-sourdine">{programme.meta.titre}</p>
        {exporteLe && (
          <p className="mt-1 text-xs text-sourdine">Instantané du {exporteLe}</p>
        )}
      </header>

      {dateDebut ? (
        <StatsPlan dateDebut={dateDebut} journal={journal} />
      ) : (
        <p className="py-6 text-sm text-sourdine">
          La date de début n'est pas encore fixée. Voici les séances déjà saisies.
        </p>
      )}

      {sauvegarde.sommeil.length > 0 && <SommeilCoach mesures={sauvegarde.sommeil} />}

      <Section titre="Journal des séances">
        {journalTrie.length === 0 ? (
          <p className="text-sm text-sourdine">Aucune séance saisie pour l'instant.</p>
        ) : (
          <JournalComplet journal={journalTrie} />
        )}
      </Section>
    </div>
  );
}

function SommeilCoach({ mesures }: { mesures: MesureSommeil[] }) {
  const chrono = [...mesures].sort((a, b) => a.date.localeCompare(b.date));
  const recents = chrono.slice(-14);
  const anti = [...recents].reverse();
  const d = chrono[chrono.length - 1];

  return (
    <Section titre="Sommeil & récupération">
      <div className="grid grid-cols-3 gap-3">
        <TuileCoach label="VFC" valeur={d.vfc_ms != null ? `${d.vfc_ms}` : "—"} unite="ms" couleur={ZONE_COULEUR[2]} valeurs={recents.map((m) => m.vfc_ms ?? null)} />
        <TuileCoach label="FC sommeil" valeur={d.fc_sommeil != null ? `${d.fc_sommeil}` : "—"} unite="bpm" couleur={ZONE_COULEUR[1]} valeurs={recents.map((m) => m.fc_sommeil ?? null)} />
        <TuileCoach label="Temp." valeur={d.temp_var != null ? signe(d.temp_var) : "—"} unite="°C" couleur={ZONE_COULEUR[3]} valeurs={recents.map((m) => m.temp_var ?? null)} />
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.08em] text-sourdine">
            <th className="pb-2 font-medium">Jour</th>
            <th className="pb-2 text-right font-medium">FC</th>
            <th className="pb-2 text-right font-medium">VFC</th>
            <th className="pb-2 text-right font-medium">°C</th>
          </tr>
        </thead>
        <tbody className="tnum font-mono">
          {anti.map((m) => (
            <tr key={m.date} className="border-t border-black/5">
              <td className="py-1.5 text-encre">{formatDateCourt(parseISODate(m.date))}</td>
              <td className="py-1.5 text-right text-encre">{m.fc_sommeil ?? "—"}</td>
              <td className="py-1.5 text-right text-encre">{m.vfc_ms ?? "—"}</td>
              <td className="py-1.5 text-right text-encre">{m.temp_var != null ? signe(m.temp_var) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function TuileCoach({ label, valeur, unite, couleur, valeurs }: { label: string; valeur: string; unite: string; couleur: string; valeurs: (number | null)[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-sourdine">{label}</div>
      <div className="mt-1 font-display text-2xl leading-none text-encre">
        <span className="tnum">{valeur}</span>
        <span className="ml-1 text-xs text-sourdine">{unite}</span>
      </div>
      <div className="mt-1.5">
        <Sparkline valeurs={valeurs} couleur={couleur} />
      </div>
    </div>
  );
}

function StatsPlan({ dateDebut, journal }: { dateDebut: string; journal: Entree[] }) {
  const semNum = semaineCourante(dateDebut);
  const sem = programme.semaines.find((s) => s.numero === semNum)!;
  const faites = seancesRealisees(journal);
  const pctPlan = TOTAL_SEANCES ? Math.round((faites / TOTAL_SEANCES) * 100) : 0;
  const kmFaits = kmRealises(journal);
  const kmPrevus = kmPrevusAJour(dateDebut);
  const ressenti = ressentiParSemaine(journal);
  const allure = allureEfParSemaine(journal);

  return (
    <>
      <div className="py-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: couleurDeSemaine(sem) }}
            aria-hidden="true"
          />
          <span className="tnum text-sm text-sourdine">
            Semaine {sem.numero} · {sem.intensite}
          </span>
        </div>
        <LoadWave semaineCourante={semNum} onOuvrir={() => {}} anime={false} />
      </div>

      <Section titre="À ce stade du plan">
        <div className="grid grid-cols-2 gap-6">
          <Chiffre
            valeur={nombreFr(faites)}
            unite={`/ ${TOTAL_SEANCES}`}
            legende={`séances réalisées · ${pctPlan}% du plan`}
          />
          {PLAN_PAR_CHARGE ? (
            <Chiffre valeur={nombreFr(Math.round(kmFaits))} unite="km" legende="parcourus et saisis" />
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
        <Suspense fallback={<Placeholder />}>
          <CourbeRessenti data={ressenti} />
        </Suspense>
        <p className="mt-2 text-xs text-sourdine">1 = très dur · 5 = très facile</p>
      </Section>

      <Section titre="Allure d'endurance dans le temps">
        <Suspense fallback={<Placeholder />}>
          <CourbeAllure data={allure} />
        </Suspense>
        <p className="mt-2 text-xs text-sourdine">min/km · plus bas = plus rapide</p>
      </Section>

      <Section>
        <Countdown dateDebut={dateDebut} />
      </Section>
    </>
  );
}

function JournalComplet({ journal }: { journal: Entree[] }) {
  // Groupé par semaine, dans l'ordre du plan.
  const parSemaine = new Map<number, Entree[]>();
  for (const e of journal) {
    const w = SEANCE_PAR_ID[e.seanceId]?.semaine ?? 0;
    if (!parSemaine.has(w)) parSemaine.set(w, []);
    parSemaine.get(w)!.push(e);
  }
  const semaines = [...parSemaine.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {semaines.map((w) => (
        <div key={w}>
          <h3 className="mb-2 font-display text-lg text-encre">Semaine {w}</h3>
          <ul className="space-y-3">
            {parSemaine.get(w)!.map((e) => (
              <LigneJournal key={e.seanceId} entree={e} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LigneJournal({ entree }: { entree: Entree }) {
  const info = SEANCE_PAR_ID[entree.seanceId];
  const seance = info?.seance;
  const zone = seance ? zoneSeance(seance) : null;
  const titre = seance ? (seance.sous_type ?? TYPE_LABEL[seance.type]) : entree.seanceId;

  return (
    <li className="border-l-2 pl-3" style={{ borderColor: zone ? ZONE_COULEUR[zone] : "#DDE2E0" }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-encre">{titre}</span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: STATUT_COULEUR[entree.statut], background: `${STATUT_COULEUR[entree.statut]}18` }}
        >
          {STATUT_LABEL[entree.statut]}
        </span>
      </div>

      {seance && (
        <p className="mt-0.5 text-xs text-sourdine">{seance.consigne.split("\n")[0]}</p>
      )}

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-encre">
        <span className="tnum font-mono">ressenti {entree.ressenti}/5</span>
        {entree.allure && <span className="tnum font-mono">{entree.allure}/km</span>}
        {entree.distance_km != null && (
          <span className="tnum font-mono">{nombreFr(entree.distance_km, 1)} km</span>
        )}
        {entree.duree_min != null && <span className="tnum font-mono">{entree.duree_min} min</span>}
        {entree.fc_moyenne != null && (
          <span className="tnum font-mono">{entree.fc_moyenne} bpm</span>
        )}
      </div>

      {entree.commentaire && (
        <p className="mt-1.5 border-l border-black/10 pl-2 text-sm italic text-encre/80">
          « {entree.commentaire} »
        </p>
      )}
    </li>
  );
}
