// Aujourd'hui — le check-in du matin, puis la séance du jour.

import { useState } from "react";
import { useApp } from "../store/useApp";
import { aujourdHui, seanceDuJour, toISODate } from "../lib/calendar";
import { allureCibleTexte, zoneSeance } from "../lib/vma";
import { STATUT_LABEL, TYPE_LABEL } from "../lib/labels";
import { formatDateLong, nombreFr } from "../lib/format";
import ZonePill from "../components/ZonePill";
import SeanceForm from "../components/SeanceForm";
import CheckIn from "../components/CheckIn";

export default function Aujourdhui() {
  const { reglages, entreePour, enregistrerEntree, supprimerEntree } = useApp();
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const dateDebut = reglages.dateDebut!;
  const info = seanceDuJour(dateDebut);
  const dateJour = formatDateLong(aujourdHui());
  const meta = info ? `S${info.semaine} · ${info.seance.jour}` : undefined;

  const seance = info?.seance;
  const courue = seance && seance.a_saisir && seance.type !== "repos";
  const entree = seance ? entreePour(seance.id) : undefined;

  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <div className="flex items-baseline justify-between pb-5">
        <span className="tnum text-sm text-sourdine">{dateJour}</span>
        {meta && <span className="tnum text-sm text-sourdine">{meta}</span>}
      </div>

      <CheckIn />

      <div className="mt-6 border-t border-black/10 pt-6">
        {!info && (
          <>
            <h1 className="font-display text-3xl text-encre">Hors plan</h1>
            <p className="mt-2 text-sourdine">
              Aucune séance prévue aujourd'hui par le programme. Profites-en pour récupérer.
            </p>
          </>
        )}

        {seance && !courue && (
          <>
            <h1 className="font-display text-3xl text-encre">Repos</h1>
            <p className="mt-2 max-w-[26ch] text-sourdine">
              Rien à faire aujourd'hui. Récupère : c'est la séance.
            </p>
          </>
        )}

        {seance && courue && (
          <>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-sourdine">
              {seance.sous_type ?? TYPE_LABEL[seance.type]}
            </p>
            <h1 className="mt-1 whitespace-pre-line font-display text-3xl leading-tight text-encre">
              {seance.consigne}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              {zoneSeance(seance) != null && <ZonePill zone={zoneSeance(seance)!} />}
              {allureCibleTexte(seance, reglages.vma) && (
                <span className="tnum font-mono text-encre">
                  Allure cible <span className="font-medium">{allureCibleTexte(seance, reglages.vma)}</span>
                </span>
              )}
              {seance.distance_km && (
                <span className="tnum font-mono text-encre">{nombreFr(seance.distance_km, 1)} km</span>
              )}
            </div>

            {entree && (
              <div className="mt-6 border-t border-black/10 pt-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-sourdine">Déjà saisie</p>
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
          </>
        )}
      </div>

      {saisieOuverte && seance && (
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
    </div>
  );
}
