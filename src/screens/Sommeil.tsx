// Sommeil & récupération — une mesure par jour, indépendante des séances.

import { useState } from "react";
import { useApp } from "../store/useApp";
import { aujourdHui, parseISODate, toISODate } from "../lib/calendar";
import { formatDateCourt, formatDateLong, nombreFr } from "../lib/format";
import { ZONE_COULEUR } from "../lib/vma";
import Section from "../components/Section";
import Sparkline from "../components/Sparkline";
import type { MesureSommeil } from "../data/types";

const inputCls =
  "tnum w-full rounded-md border border-black/15 bg-white/60 px-3 py-2.5 font-mono text-encre focus:border-zone2";

const num = (s: string): number | undefined => {
  const v = parseFloat(s.replace(",", "."));
  return isFinite(v) ? v : undefined;
};

function Champ({ label, suffixe, children }: { label: string; suffixe: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-sourdine">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {children}
        <span className="shrink-0 text-sm text-sourdine">{suffixe}</span>
      </div>
    </label>
  );
}

function signe(n: number): string {
  return `${n > 0 ? "+" : ""}${nombreFr(n, 1)}`;
}

export default function Sommeil() {
  const { sommeil, enregistrerSommeil, supprimerSommeil, sommeilPour } = useApp();
  const dateIso = toISODate(aujourdHui());
  const existante = sommeilPour(dateIso);

  const [fc, setFc] = useState(existante?.fc_sommeil?.toString() ?? "");
  const [vfc, setVfc] = useState(existante?.vfc_ms?.toString() ?? "");
  const [temp, setTemp] = useState(existante?.temp_var?.toString() ?? "");
  const [message, setMessage] = useState<string | null>(null);

  function enregistrer() {
    enregistrerSommeil({
      date: dateIso,
      fc_sommeil: num(fc),
      vfc_ms: num(vfc),
      temp_var: num(temp),
    });
    setMessage("Enregistré.");
    setTimeout(() => setMessage(null), 1500);
  }

  // Ordre chronologique pour les tendances, anti-chronologique pour l'historique.
  const chrono = [...sommeil].sort((a, b) => a.date.localeCompare(b.date));
  const recents = chrono.slice(-14);
  const anti = [...chrono].reverse();
  const dernier: MesureSommeil | undefined = chrono[chrono.length - 1];

  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <div className="flex items-baseline justify-between pb-4">
        <h1 className="font-display text-3xl text-encre">Sommeil</h1>
        <span className="tnum text-sm text-sourdine">{formatDateLong(aujourdHui())}</span>
      </div>

      <Section titre="Cette nuit">
        <div className="space-y-4">
          <Champ label="FC moyenne de sommeil" suffixe="bpm">
            <input className={inputCls} inputMode="numeric" value={fc} onChange={(e) => setFc(e.target.value)} placeholder="—" />
          </Champ>
          <Champ label="Variabilité FC (VFC)" suffixe="ms">
            <input className={inputCls} inputMode="numeric" value={vfc} onChange={(e) => setVfc(e.target.value)} placeholder="—" />
          </Champ>
          <Champ label="Variation de température de la peau" suffixe="°C">
            <input className={inputCls} inputMode="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="ex. -0,2" />
          </Champ>

          <button
            onClick={enregistrer}
            className="min-h-[52px] w-full rounded-md bg-zone2 text-base font-medium text-white"
          >
            {existante ? "Mettre à jour la nuit" : "Enregistrer la nuit"}
          </button>
          {message && <p className="text-sm text-zone2">{message}</p>}
          {existante && (
            <button
              onClick={() => {
                supprimerSommeil(dateIso);
                setFc("");
                setVfc("");
                setTemp("");
              }}
              className="min-h-[44px] w-full text-sm text-zone5"
            >
              Supprimer la mesure du jour
            </button>
          )}
        </div>
      </Section>

      {dernier && (
        <Section titre="Tendances">
          <div className="grid grid-cols-3 gap-3">
            <Tuile
              label="VFC"
              valeur={dernier.vfc_ms != null ? `${dernier.vfc_ms}` : "—"}
              unite="ms"
              couleur={ZONE_COULEUR[2]}
              valeurs={recents.map((m) => m.vfc_ms ?? null)}
            />
            <Tuile
              label="FC sommeil"
              valeur={dernier.fc_sommeil != null ? `${dernier.fc_sommeil}` : "—"}
              unite="bpm"
              couleur={ZONE_COULEUR[1]}
              valeurs={recents.map((m) => m.fc_sommeil ?? null)}
            />
            <Tuile
              label="Temp."
              valeur={dernier.temp_var != null ? signe(dernier.temp_var) : "—"}
              unite="°C"
              couleur={ZONE_COULEUR[3]}
              valeurs={recents.map((m) => m.temp_var ?? null)}
            />
          </div>
          <p className="mt-2 text-xs text-sourdine">VFC haute et FC de sommeil basse = bonne récupération.</p>
        </Section>
      )}

      <Section titre="Historique">
        {anti.length === 0 ? (
          <p className="text-sm text-sourdine">
            Aucune mesure pour l'instant. Renseigne ta nuit chaque matin.
          </p>
        ) : (
          <table className="w-full text-sm">
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
                  <td className="py-1.5 text-right text-encre">
                    {m.temp_var != null ? signe(m.temp_var) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function Tuile({
  label,
  valeur,
  unite,
  couleur,
  valeurs,
}: {
  label: string;
  valeur: string;
  unite: string;
  couleur: string;
  valeurs: (number | null)[];
}) {
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
