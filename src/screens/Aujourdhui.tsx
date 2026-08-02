// Aujourd'hui — la consigne du jour en grand, une seule action.

import { useState } from "react";
import { useApp } from "../store/useApp";
import { aujourdHui, seanceDuJour, toISODate } from "../lib/calendar";
import { allureCible, primaryZone } from "../lib/vma";
import { TYPE_LABEL } from "../lib/labels";
import { formatDateLong, nombreFr } from "../lib/format";
import ZonePill from "../components/ZonePill";
import SeanceForm from "../components/SeanceForm";
import { STATUT_LABEL } from "../lib/labels";

export default function Aujourdhui() {
  const { reglages, entreePour, enregistrerEntree, supprimerEntree } = useApp();
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const dateDebut = reglages.dateDebut!;
  const info = seanceDuJour(dateDebut);
  const dateJour = formatDateLong(aujourdHui());

  if (!info) {
    return (
      <Cadre date={dateJour}>
        <h1 className="font-display text-3xl text-encre">Hors plan</h1>
        <p className="mt-2 text-sourdine">
          Aucune séance prévue aujourd'hui par le programme. Profites-en pour récupérer.
        </p>
      </Cadre>
    );
  }

  const { seance, semaine } = info;

  if (seance.type === "repos" || !seance.a_saisir) {
    return (
      <Cadre date={dateJour} meta={`S${semaine} · ${seance.jour}`}>
        <h1 className="font-display text-3xl text-encre">Repos</h1>
        <p className="mt-2 max-w-[26ch] text-sourdine">
          Rien à faire aujourd'hui. Récupère : c'est la séance.
        </p>
      </Cadre>
    );
  }

  const zone = primaryZone(seance);
  const cible = allureCible(seance, reglages.vma);
  const entree = entreePour(seance.id);

  return (
    <>
      <Cadre date={dateJour} meta={`S${semaine} · ${seance.jour}`}>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-sourdine">
          {TYPE_LABEL[seance.type]}
        </p>
        <h1 className="mt-1 whitespace-pre-line font-display text-3xl leading-tight text-encre">
          {seance.consigne}
        </h1>

        {(zone != null || seance.distance_km) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            {zone != null && <ZonePill zone={zone} />}
            {cible && (
              <span className="tnum font-mono text-encre">
                Allure cible <span className="font-medium">{cible}</span> /km
              </span>
            )}
            {seance.distance_km && (
              <span className="tnum font-mono text-encre">{nombreFr(seance.distance_km, 1)} km</span>
            )}
          </div>
        )}

        {entree && (
          <div className="mt-6 border-t border-black/10 pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-sourdine">
              Déjà saisie
            </p>
            <p className="mt-1.5 text-encre">
              {STATUT_LABEL[entree.statut]}
              {entree.allure && <span className="tnum font-mono"> · {entree.allure}/km</span>}
              {entree.distance_km != null && (
                <span className="tnum font-mono"> · {nombreFr(entree.distance_km, 1)} km</span>
              )}
              {" · ressenti "}
              <span className="tnum font-mono">{entree.ressenti}</span>
            </p>
          </div>
        )}

        <button
          onClick={() => setSaisieOuverte(true)}
          className="mt-8 min-h-[52px] w-full rounded-md bg-zone2 text-base font-medium text-white"
        >
          {entree ? "Modifier la saisie" : "Saisir la séance"}
        </button>
      </Cadre>

      {saisieOuverte && (
        <SeanceForm
          seance={seance}
          dateParDefaut={toISODate(aujourdHui())}
          vma={reglages.vma}
          existante={entree}
          onEnregistrer={(e) => {
            enregistrerEntree(e);
            setSaisieOuverte(false);
          }}
          onSupprimer={
            entree
              ? () => {
                  supprimerEntree(seance.id);
                  setSaisieOuverte(false);
                }
              : undefined
          }
          onFermer={() => setSaisieOuverte(false)}
        />
      )}
    </>
  );
}

function Cadre({
  date,
  meta,
  children,
}: {
  date: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <div className="flex items-baseline justify-between pb-6">
        <span className="tnum text-sm text-sourdine">{date}</span>
        {meta && <span className="tnum text-sm text-sourdine">{meta}</span>}
      </div>
      {children}
    </div>
  );
}
