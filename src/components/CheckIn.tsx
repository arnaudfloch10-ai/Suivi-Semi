// Check-in du matin — rattaché à « Aujourd'hui », 3 taps, sauvegarde auto.
// L'essentiel est visible ; la montre et l'historique sont repliés.

import { useState } from "react";
import { useApp } from "../store/useApp";
import type { CheckIn as TCheckIn, Note03 } from "../data/types";
import { aujourdHui, parseISODate, toISODate } from "../lib/calendar";
import { formatDateCourt, nombreFr } from "../lib/format";
import { alerteRecuperation, ecartBaseline, METRIQUES, type Ecart, type MetriqueId } from "../lib/baseline";
import { ZONE_COULEUR } from "../lib/vma";
import Sparkline from "./Sparkline";

const inputCls =
  "tnum w-28 rounded-md border border-black/15 bg-white/60 px-3 py-2 font-mono text-encre focus:border-zone2";

function heuresStr(h: number): string {
  const entier = Math.floor(h);
  const min = Math.round((h - entier) * 60);
  return min ? `${entier} h ${min.toString().padStart(2, "0")}` : `${entier} h`;
}

const num = (s: string): number | undefined => {
  const v = parseFloat(s.replace(",", "."));
  return isFinite(v) ? v : undefined;
};

const ARTICS: { cle: keyof NonNullable<TCheckIn["douleur"]>; label: string }[] = [
  { cle: "cheville", label: "Cheville" },
  { cle: "genou", label: "Genou" },
  { cle: "tendon", label: "Tendon" },
];

export default function CheckIn() {
  const { checkins, enregistrerCheckin, checkinPour } = useApp();
  const dateIso = toISODate(aujourdHui());
  const actuel = checkinPour(dateIso);

  const [c, setC] = useState<TCheckIn>(actuel ?? { date: dateIso });
  const [montre, setMontre] = useState(false);
  const [histo, setHisto] = useState(false);
  const aDouleur = !!c.douleur && Object.values(c.douleur).some((v) => (v ?? 0) > 0);
  const [douleurOuverte, setDouleurOuverte] = useState(aDouleur);

  // Champs texte de la montre (édités à la main).
  const [fc, setFc] = useState(actuel?.fc_sommeil?.toString() ?? "");
  const [vfc, setVfc] = useState(actuel?.vfc_ms?.toString() ?? "");
  const [temp, setTemp] = useState(actuel?.temp_cutanee?.toString() ?? "");

  function maj(patch: Partial<TCheckIn>) {
    const suivant = { ...c, ...patch, date: dateIso };
    setC(suivant);
    enregistrerCheckin(suivant);
  }

  function majDouleur(cle: keyof NonNullable<TCheckIn["douleur"]>, val: Note03) {
    const d = { ...(c.douleur ?? {}), [cle]: val };
    maj({ douleur: d });
  }

  const sommeilVal = c.sommeil_h ?? 7;
  const alerte = alerteRecuperation(checkins);

  return (
    <section className="rounded-md border border-black/10 bg-white/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-sourdine">
          Check-in du matin
        </h2>
        {actuel && <span className="text-xs text-zone2">✓ enregistré</span>}
      </div>

      {/* Sommeil — curseur */}
      <div className="mb-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-encre">Sommeil</span>
          <span className="tnum font-mono text-lg text-encre">
            {c.sommeil_h != null ? heuresStr(sommeilVal) : "—"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={0.25}
          value={sommeilVal}
          onChange={(e) => maj({ sommeil_h: parseFloat(e.target.value) })}
          className="w-full accent-zone2"
          aria-label="Durée de sommeil en heures"
        />
      </div>

      {/* Fraîcheur */}
      <div className="mb-4">
        <div className="mb-1.5 text-sm text-encre">Fraîcheur au réveil</div>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Fraîcheur">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={c.fraicheur === n}
              onClick={() => maj({ fraicheur: n as TCheckIn["fraicheur"] })}
              className={`tnum min-h-[44px] rounded-md border font-mono text-base transition-colors ${
                c.fraicheur === n ? "border-zone2 bg-zone2/10 text-encre" : "border-black/15 text-sourdine"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-sourdine">1 = épuisé · 5 = frais</p>
      </div>

      {/* Douleur */}
      <div className="mb-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-encre">Douleur</span>
          {!douleurOuverte && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zone2/10 px-2.5 py-1 text-xs font-medium text-zone2">
                Tout va bien ✓
              </span>
              <button onClick={() => setDouleurOuverte(true)} className="text-xs text-sourdine underline underline-offset-2">
                + signaler
              </button>
            </div>
          )}
        </div>
        {douleurOuverte && (
          <div className="mt-2 space-y-2">
            {ARTICS.map(({ cle, label }) => (
              <div key={cle} className="flex items-center justify-between">
                <span className="text-sm text-sourdine">{label}</span>
                <div className="flex gap-1" role="radiogroup" aria-label={label}>
                  {[0, 1, 2, 3].map((n) => {
                    const on = (c.douleur?.[cle] ?? 0) === n;
                    return (
                      <button
                        key={n}
                        role="radio"
                        aria-checked={on}
                        onClick={() => majDouleur(cle, n as Note03)}
                        className={`tnum h-9 w-9 rounded-md border font-mono text-sm ${
                          on ? "border-zone4 bg-zone4/10 text-encre" : "border-black/15 text-sourdine"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                maj({ douleur: undefined });
                setDouleurOuverte(false);
              }}
              className="text-xs text-sourdine underline underline-offset-2"
            >
              Tout va bien, replier
            </button>
          </div>
        )}
      </div>

      {alerte && (
        <p className="mt-3 rounded-md border border-zone4/30 bg-zone4/5 px-3 py-2 text-sm text-encre">
          {alerte}
        </p>
      )}

      {/* Mesures de la montre (repliées) */}
      <Repli titre="Mesures de la montre" ouvert={montre} onToggle={() => setMontre((v) => !v)}>
        <div className="space-y-3">
          <LigneMontre label="FC de sommeil" unite="bpm" value={fc} onChange={(v) => { setFc(v); maj({ fc_sommeil: num(v) }); }} ecart={ecartBaseline(checkins, "fc_sommeil")} />
          <LigneMontre label="Variabilité FC (VFC)" unite="ms" value={vfc} onChange={(v) => { setVfc(v); maj({ vfc_ms: num(v) }); }} ecart={ecartBaseline(checkins, "vfc_ms")} />
          <LigneMontre label="Température cutanée" unite="°C" value={temp} onChange={(v) => { setTemp(v); maj({ temp_cutanee: num(v) }); }} ecart={ecartBaseline(checkins, "temp_cutanee")} />
        </div>
      </Repli>

      {/* Historique récupération (replié) */}
      <Repli titre="Historique récupération" ouvert={histo} onToggle={() => setHisto((v) => !v)}>
        <HistoriqueRecup />
      </Repli>
    </section>
  );
}

function Repli({ titre, ouvert, onToggle, children }: { titre: string; ouvert: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      <button onClick={onToggle} aria-expanded={ouvert} className="flex w-full items-center justify-between text-left">
        <span className="text-sm text-encre">{titre}</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-sourdine transition-transform ${ouvert ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {ouvert && <div className="mt-3">{children}</div>}
    </div>
  );
}

function EcartBadge({ ecart }: { ecart: Ecart }) {
  if (!ecart.disponible) return <span className="text-xs text-sourdine">baseline en cours</span>;
  if (ecart.ecart == null) return null;
  const couleur = ecart.favorable ? ZONE_COULEUR[2] : ZONE_COULEUR[4];
  const txt =
    ecart.affichage === "pct"
      ? `${ecart.ecart >= 0 ? "+" : ""}${Math.round(ecart.ecart)} % vs 7 j`
      : `${ecart.ecart >= 0 ? "+" : ""}${nombreFr(ecart.ecart, 1)} °C vs 7 j`;
  return <span className="text-xs font-medium" style={{ color: couleur }}>{txt}</span>;
}

function LigneMontre({ label, unite, value, onChange, ecart }: { label: string; unite: string; value: string; onChange: (v: string) => void; ecart: Ecart }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-encre">{label}</span>
        <div className="flex items-center gap-2">
          <input className={inputCls} inputMode="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" />
          <span className="w-8 text-sm text-sourdine">{unite}</span>
        </div>
      </div>
      <div className="mt-0.5 text-right">
        <EcartBadge ecart={ecart} />
      </div>
    </div>
  );
}

function HistoriqueRecup() {
  const { checkins } = useApp();
  const chrono = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const recents = chrono.slice(-14);
  const anti = [...recents].reverse();
  if (recents.length === 0) return <p className="text-sm text-sourdine">Aucune donnée pour l'instant.</p>;

  const metriques: MetriqueId[] = ["vfc_ms", "fc_sommeil", "temp_cutanee"];
  const couleurs = [ZONE_COULEUR[2], ZONE_COULEUR[1], ZONE_COULEUR[3]];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {metriques.map((m, i) => (
          <div key={m}>
            <div className="text-xs uppercase tracking-[0.08em] text-sourdine">{METRIQUES[m].label}</div>
            <Sparkline valeurs={recents.map((c) => (c[m] as number) ?? null)} couleur={couleurs[i]} />
          </div>
        ))}
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.08em] text-sourdine">
            <th className="pb-2 font-medium">Jour</th>
            <th className="pb-2 text-right font-medium">Som.</th>
            <th className="pb-2 text-right font-medium">Fr.</th>
            <th className="pb-2 text-right font-medium">FC</th>
            <th className="pb-2 text-right font-medium">VFC</th>
          </tr>
        </thead>
        <tbody className="tnum font-mono">
          {anti.map((c) => (
            <tr key={c.date} className="border-t border-black/5">
              <td className="py-1.5 text-encre">{formatDateCourt(parseISODate(c.date))}</td>
              <td className="py-1.5 text-right text-encre">{c.sommeil_h != null ? heuresStr(c.sommeil_h) : "—"}</td>
              <td className="py-1.5 text-right text-encre">{c.fraicheur ?? "—"}</td>
              <td className="py-1.5 text-right text-encre">{c.fc_sommeil ?? "—"}</td>
              <td className="py-1.5 text-right text-encre">{c.vfc_ms ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
