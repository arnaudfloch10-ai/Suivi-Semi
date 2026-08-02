// Premier lancement — on demande le lundi de la semaine 1.

import { useState } from "react";
import { useApp } from "../store/useApp";
import { aujourdHui, toISODate } from "../lib/calendar";
import { formatDateCourt } from "../lib/format";

function lundiDeCetteSemaine(): string {
  const d = aujourdHui();
  const jour = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - jour);
  return toISODate(d);
}

export default function Onboarding() {
  const { majReglages } = useApp();
  const [date, setDate] = useState(lundiDeCetteSemaine());

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-app">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-sourdine">
          Semi-marathon
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-encre">
          12 semaines pour finir les 21,1 km.
        </h1>
        <p className="mt-4 text-sourdine">
          Ton carnet d'entraînement. Pour commencer, indique le lundi de la
          semaine 1 — tout le calendrier en découle.
        </p>

        <div className="mt-10">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-sourdine">
              Lundi de la semaine 1
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="tnum w-full rounded-md border border-black/15 bg-white/60 px-4 py-3 font-mono text-lg text-encre focus:border-zone2"
            />
          </label>
          <p className="mt-2 text-sm text-sourdine">
            {date ? `Départ : ${formatDateCourt(new Date(date + "T00:00"))}` : "Choisis une date."}
          </p>
        </div>

        <button
          onClick={() => date && majReglages({ dateDebut: date })}
          disabled={!date}
          className="mt-10 min-h-[52px] w-full rounded-md bg-zone2 text-base font-medium text-white disabled:opacity-40"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
