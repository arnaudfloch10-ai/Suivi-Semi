// Semaines — toutes les semaines du plan, chacune dépliable sur ses 7 jours.

import { useEffect, useState } from "react";
import { useApp } from "../store/useApp";
import { programme } from "../data/programme";
import type { Seance, Semaine } from "../data/types";
import { dateSeance, etatSeance, toISODate } from "../lib/calendar";
import { couleurDeSemaine, zoneSeance, ZONE_COULEUR } from "../lib/vma";
import { JOURS_COURTS, TYPE_LABEL_COURT } from "../lib/labels";
import { nombreFr } from "../lib/format";
import SeanceForm from "../components/SeanceForm";

export default function Semaines({ semaineInitiale }: { semaineInitiale?: number }) {
  const { reglages, entreePour, enregistrerEntree, supprimerEntree } = useApp();
  const dateDebut = reglages.dateDebut!;
  const [ouverte, setOuverte] = useState<number | null>(semaineInitiale ?? null);
  const [saisie, setSaisie] = useState<Seance | null>(null);

  useEffect(() => {
    if (semaineInitiale) setOuverte(semaineInitiale);
  }, [semaineInitiale]);

  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <h1 className="pb-4 font-display text-3xl text-encre">
        Les {programme.meta.duree_semaines} semaines
      </h1>
      <div className="-mx-5">
        {programme.semaines.map((sem) => (
          <BlocSemaine
            key={sem.numero}
            sem={sem}
            dateDebut={dateDebut}
            ouverte={ouverte === sem.numero}
            onBascule={() => setOuverte((o) => (o === sem.numero ? null : sem.numero))}
            entreePour={entreePour}
            onSaisir={setSaisie}
          />
        ))}
      </div>

      {saisie && (
        <SeanceForm
          seance={saisie}
          dateParDefaut={toISODate(
            dateSeance(dateDebut, Number(saisie.id.match(/^S(\d+)/)![1]), saisie.jour_index),
          )}
          vma={reglages.vma}
          existante={entreePour(saisie.id)}
          onEnregistrer={(e) => {
            enregistrerEntree(e);
            setSaisie(null);
          }}
          onSupprimer={
            entreePour(saisie.id)
              ? () => {
                  supprimerEntree(saisie.id);
                  setSaisie(null);
                }
              : undefined
          }
          onFermer={() => setSaisie(null)}
        />
      )}
    </div>
  );
}

function BlocSemaine({
  sem,
  dateDebut,
  ouverte,
  onBascule,
  entreePour,
  onSaisir,
}: {
  sem: Semaine;
  dateDebut: string;
  ouverte: boolean;
  onBascule: () => void;
  entreePour: ReturnType<typeof useApp>["entreePour"];
  onSaisir: (s: Seance) => void;
}) {
  const couleur = couleurDeSemaine(sem);
  const mesure = sem.charge_pct != null ? `${sem.charge_pct} %` : `${nombreFr(sem.volume_km ?? 0)} km`;
  return (
    <div className="border-b border-black/10">
      <button
        onClick={onBascule}
        aria-expanded={ouverte}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: couleur }} aria-hidden="true" />
        <span className="flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-lg text-encre">S{sem.numero}</span>
            <span className="text-sm text-sourdine">{sem.periode}</span>
          </span>
          <span className="mt-0.5 block text-xs text-sourdine">{sem.mesocycle}</span>
        </span>
        <span className="text-right">
          <span className="tnum block font-mono text-sm text-encre">{mesure}</span>
          <span className="tnum block text-xs text-sourdine">{sem.intensite}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-sourdine transition-transform ${ouverte ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {ouverte && (
        <ul className="animate-[fade-in_250ms_ease-out] pb-2">
          {sem.seances.map((s) => (
            <LigneSeance
              key={s.id}
              seance={s}
              dateDebut={dateDebut}
              semaine={sem.numero}
              entree={entreePour(s.id)}
              onSaisir={onSaisir}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LigneSeance({
  seance,
  dateDebut,
  semaine,
  entree,
  onSaisir,
}: {
  seance: Seance;
  dateDebut: string;
  semaine: number;
  entree: ReturnType<ReturnType<typeof useApp>["entreePour"]>;
  onSaisir: (s: Seance) => void;
}) {
  const jour = JOURS_COURTS[seance.jour_index - 1];
  const etat = etatSeance(dateDebut, semaine, seance.jour_index);
  const zone = zoneSeance(seance);
  const repos = seance.type === "repos" || !seance.a_saisir;

  const contenu = (
    <div className="flex items-center gap-3 py-2.5 pl-9 pr-5">
      <span className="tnum w-8 shrink-0 text-xs text-sourdine">{jour}</span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm ${repos ? "text-sourdine" : "text-encre"}`}>
          {repos ? "Repos" : (seance.sous_type ?? TYPE_LABEL_COURT[seance.type])}
        </span>
        {!repos && (
          <span className="block truncate text-xs text-sourdine">
            {seance.consigne.split("\n")[0]}
          </span>
        )}
      </span>
      {!repos && (
        <span className="shrink-0 text-right">
          {entree ? (
            <span className="tnum inline-flex items-center gap-1.5 font-mono text-xs text-encre">
              {entree.allure ? `${entree.allure}/km` : entree.statut === "manquee" ? "manquée" : "faite"}
              <Etat etat={entree.statut === "manquee" ? "manquee" : "faite"} zone={zone} />
            </span>
          ) : (
            <Etat etat={etat === "future" ? "future" : "a_saisir"} zone={zone} />
          )}
        </span>
      )}
    </div>
  );

  if (repos) return <li>{contenu}</li>;

  return (
    <li>
      <button
        onClick={() => onSaisir(seance)}
        className="w-full text-left transition-colors hover:bg-black/[0.02]"
      >
        {contenu}
      </button>
    </li>
  );
}

function Etat({
  etat,
  zone,
}: {
  etat: "faite" | "manquee" | "future" | "a_saisir";
  zone: number | null;
}) {
  const c = zone ? ZONE_COULEUR[zone] : "#6B7A74";
  if (etat === "faite") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-label="faite">
        <circle cx="8" cy="8" r="7" fill={c} />
        <path d="m4.5 8.2 2.3 2.3 4.7-4.9" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (etat === "manquee") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-label="manquée">
        <circle cx="8" cy="8" r="7" fill="none" stroke="#8C2C21" strokeWidth="1.4" />
        <path d="M5.5 5.5 10.5 10.5M10.5 5.5 5.5 10.5" stroke="#8C2C21" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  // future / à saisir : contour
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-label={etat === "future" ? "à venir" : "à saisir"}>
      <circle cx="8" cy="8" r="6.4" fill="none" stroke={c} strokeWidth="1.4" strokeDasharray={etat === "future" ? "2.5 2.5" : "0"} strokeOpacity={etat === "future" ? 0.6 : 1} />
    </svg>
  );
}
