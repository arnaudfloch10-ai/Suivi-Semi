// Récup — récupération, énergie, douleur et charge. Lecture des données déjà
// saisies (aucune ressaisie). Suggérer, jamais prescrire.

import { useEffect, useState } from "react";
import { useApp } from "../store/useApp";
import { programme } from "../data/programme";
import type { SeanceType } from "../data/types";
import { aujourdHui, parseISODate, toISODate } from "../lib/calendar";
import { formatDateCourt, nombreFr } from "../lib/format";
import {
  palier,
  scoreEnergie,
  scoreSommeil,
  tireVersLeBas,
  type Resultat,
} from "../lib/scores";
import { ecartBaseline, METRIQUES, type MetriqueId } from "../lib/baseline";
import { acwr } from "../lib/charge";
import { ZONE_COULEUR } from "../lib/vma";
import Section from "../components/Section";
import Sparkline from "../components/Sparkline";
import ChargeAccueil from "../components/ChargeAccueil";

// Type de séance par id (pour marquer les jours durs).
const TYPE_PAR_ID: Record<string, SeanceType> = {};
for (const sem of programme.semaines) for (const s of sem.seances) TYPE_PAR_ID[s.id] = s.type;

function heuresStr(h: number): string {
  const e = Math.floor(h);
  const m = Math.round((h - e) * 60);
  return m ? `${e} h ${m.toString().padStart(2, "0")}` : `${e} h`;
}

const derniersJours = (n: number): string[] => {
  const t = aujourdHui();
  return Array.from({ length: n }, (_, i) => toISODate(new Date(t.getTime() - (n - 1 - i) * 86400000)));
};

export default function Recup() {
  const { reglages, journal, checkins, majReglages, demo } = useApp();
  const cible = reglages.cibleSommeil ?? 7.5;
  const depuis = reglages.baselineDepuis;
  const todayIso = toISODate(aujourdHui());
  const ratio = reglages.dateDebut ? acwr(journal, reglages.dateDebut).ratio : null;

  const som = scoreSommeil(checkins, todayIso, cible, depuis);
  const ener = scoreEnergie(checkins, todayIso, { cibleSommeil: cible, acwrRatio: ratio, baselineDepuis: depuis });

  // Signale une fois le passage en mode stable.
  useEffect(() => {
    if (som.etat === "stable" && !reglages.scoresStableVu && !demo) {
      majReglages({ scoresStableVu: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [som.etat]);

  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <h1 className="pb-4 font-display text-3xl text-encre">Récup</h1>

      {reglages.masquerScores ? (
        <p className="rounded-md border border-black/10 bg-white/40 px-4 py-3 text-sm text-sourdine">
          Scores masqués. Tu continues de saisir tes données ; réactive-les dans Réglages.
        </p>
      ) : (
        <EnTete som={som} ener={ener} />
      )}

      {!reglages.masquerScores && som.etat !== "insuffisant" && (
        <Section titre="Tendance 30 jours">
          <TendanceScores cible={cible} depuis={depuis} />
        </Section>
      )}

      <Section titre="Sommeil">
        <SommeilBloc cible={cible} />
      </Section>

      <SignauxMontre />

      <Section titre="Douleur">
        <FriseDouleur />
      </Section>

      <Section titre="Charge">
        {reglages.dateDebut && (
          <ChargeAccueil journal={journal} dateDebut={reglages.dateDebut} semaineCourante={0} />
        )}
        <p className="mt-2 text-xs text-sourdine">Zone de confort du ratio : 0,8 – 1,3.</p>
      </Section>
    </div>
  );
}

// ---- En-tête : deux scores ----

function EnTete({ som, ener }: { som: Resultat; ener: Resultat }) {
  if (som.etat === "insuffisant" && ener.etat === "insuffisant") {
    const manque = Math.max(som.nuitsManquantes, ener.nuitsManquantes);
    return (
      <div className="rounded-md border border-black/10 bg-white/40 px-4 py-5 text-center">
        <p className="text-sm text-encre">
          Encore <span className="tnum font-mono">{manque}</span> nuit{manque > 1 ? "s" : ""} avant tes premiers scores.
        </p>
        <p className="mt-1 text-xs text-sourdine">Les scores se construisent sur ton historique.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <CarteScore titre="Sommeil" res={som} />
      <CarteScore titre="Énergie" res={ener} />
    </div>
  );
}

function phraseDrivers(res: Resultat): string {
  const bas = tireVersLeBas(res);
  if (!bas.length) return res.score != null && res.score >= 80 ? "Bien équilibré." : "";
  const parts = bas.slice(0, 2).map((c) => `${c.label.toLowerCase()} (${c.texte})`);
  return `Tiré vers le bas par ${parts.join(" et ")}.`;
}

function CarteScore({ titre, res }: { titre: string; res: Resultat }) {
  const [ouvert, setOuvert] = useState(false);
  const dispo = res.score != null;
  const pal = dispo ? palier(res.score!, res.provisoire) : null;
  const couleur = pal ? ZONE_COULEUR[pal.zone] : "#6B7A74";
  const drivers = dispo ? phraseDrivers(res) : "";

  return (
    <div className="rounded-md border border-black/10 bg-white/40 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-sourdine">{titre}</span>
        {res.provisoire && <span className="text-[10px] text-sourdine">provisoire</span>}
      </div>

      {dispo ? (
        <>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tnum font-display text-4xl leading-none" style={{ color: couleur }}>
              {res.score}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: couleur }}>{pal!.label}</p>
          {drivers && <p className="mt-1.5 text-xs text-sourdine">{drivers}</p>}
          {res.plafonds.map((p, i) => (
            <p key={i} className="mt-1 text-xs" style={{ color: ZONE_COULEUR[4] }}>⚠ {p}</p>
          ))}
          <button onClick={() => setOuvert((v) => !v)} className="mt-2 text-xs text-sourdine underline underline-offset-2">
            {ouvert ? "Masquer" : "Composantes"}
          </button>
          {ouvert && (
            <ul className="mt-2 space-y-1">
              {res.composantes.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between text-xs">
                  <span className="text-sourdine">{c.label}</span>
                  <span className="tnum font-mono text-encre">
                    {c.texte} · {c.score != null ? Math.round(c.score) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-sourdine">Non calculé aujourd'hui (donnée manquante).</p>
      )}
    </div>
  );
}

// ---- Tendance 30 jours (deux lignes, jours durs marqués) ----

function estDur(type: SeanceType): boolean {
  return type === "fractionne" || type === "sortie_longue";
}

function TendanceScores({ cible, depuis }: { cible: number; depuis?: string }) {
  const { checkins, journal } = useApp();
  const jours = derniersJours(30);
  const joursDurs = new Set(
    journal.filter((e) => estDur(TYPE_PAR_ID[e.seanceId])).map((e) => e.date),
  );
  const data = jours.map((iso) => ({
    iso,
    som: scoreSommeil(checkins, iso, cible, depuis).score,
    ener: scoreEnergie(checkins, iso, { cibleSommeil: cible, baselineDepuis: depuis }).score,
    dur: joursDurs.has(iso),
  }));

  const W = 360, H = 120, PAD = 6;
  const x = (i: number) => PAD + (i / (jours.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - v / 100) * (H - PAD * 2);
  const path = (key: "som" | "ener") => {
    let d = "";
    let started = false;
    data.forEach((p, i) => {
      const v = p[key];
      if (v == null) { started = false; return; }
      d += `${started ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      started = true;
    });
    return d.trim();
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tendance des scores sur 30 jours">
        {[40, 60, 80].map((g) => (
          <line key={g} x1={PAD} y1={y(g)} x2={W - PAD} y2={y(g)} stroke="#16201C" strokeOpacity={0.06} />
        ))}
        {/* jours durs : petits repères en bas */}
        {data.map((p, i) => p.dur && <rect key={i} x={x(i) - 0.8} y={H - 4} width={1.6} height={4} fill="#8A7A2E" />)}
        <path d={path("som")} fill="none" stroke={ZONE_COULEUR[1]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path("ener")} fill="none" stroke={ZONE_COULEUR[2]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex gap-4 px-1 text-[11px] text-sourdine">
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: ZONE_COULEUR[1] }} /> Sommeil</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: ZONE_COULEUR[2] }} /> Énergie</span>
        <span className="ml-auto flex items-center gap-1"><i className="inline-block h-2 w-1.5" style={{ background: ZONE_COULEUR[3] }} /> séance dure</span>
      </div>
    </div>
  );
}

// ---- Sommeil : barres + cible + moyennes + régularité ----

function SommeilBloc({ cible }: { cible: number }) {
  const { checkins } = useApp();
  const jours = derniersJours(30);
  const durees = jours.map((iso) => checkins.find((c) => c.date === iso)?.sommeil_h ?? null);
  const dispo = durees.filter((v): v is number => v != null);
  if (!dispo.length) return <p className="text-sm text-sourdine">Aucune durée de sommeil saisie.</p>;

  const moy = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const last = (n: number) => dispo.slice(-n);
  const m7 = last(7).length ? moy(last(7)) : null;
  const m30 = moy(dispo);
  const sd7 = (() => {
    const l = last(7);
    if (l.length < 2) return null;
    const mm = moy(l);
    return Math.sqrt(moy(l.map((x) => (x - mm) ** 2)));
  })();
  const reg = sd7 == null ? "—" : sd7 < 0.5 ? "régulier" : sd7 < 1 ? "variable" : "erratique";

  const W = 360, H = 90, PAD = 6;
  const max = Math.max(cible + 1.5, ...dispo);
  const bw = (W - PAD * 2) / jours.length;
  const yCible = PAD + (1 - cible / max) * (H - PAD * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Durées de sommeil sur 30 jours">
        {durees.map((v, i) => {
          if (v == null) return null;
          const h = (v / max) * (H - PAD * 2);
          return <rect key={i} x={PAD + i * bw + 0.6} y={H - PAD - h} width={bw - 1.2} height={h} rx={1} fill={ZONE_COULEUR[1]} fillOpacity={0.55} />;
        })}
        <line x1={PAD} y1={yCible} x2={W - PAD} y2={yCible} stroke={ZONE_COULEUR[2]} strokeDasharray="3 3" />
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-sourdine">
        <span>Cible <span className="tnum font-mono text-encre">{heuresStr(cible)}</span></span>
        {m7 != null && <span>Moy. 7 j <span className="tnum font-mono text-encre">{heuresStr(m7)}</span></span>}
        <span>30 j <span className="tnum font-mono text-encre">{heuresStr(m30)}</span></span>
        <span>Régularité <span className="text-encre">{reg}</span></span>
      </div>
    </div>
  );
}

// ---- Signaux de la montre (replié) ----

function SignauxMontre() {
  const { checkins } = useApp();
  const [ouvert, setOuvert] = useState(false);
  const jours = derniersJours(30);
  const metriques: MetriqueId[] = ["vfc_ms", "fc_sommeil", "temp_cutanee"];
  const couleurs = [ZONE_COULEUR[2], ZONE_COULEUR[1], ZONE_COULEUR[3]];

  return (
    <section className="border-t border-black/10 py-5">
      <button onClick={() => setOuvert((v) => !v)} aria-expanded={ouvert} className="flex w-full items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-sourdine">Signaux de la montre</h2>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-sourdine transition-transform ${ouvert ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {ouvert && (
        <div className="mt-4 space-y-4">
          {metriques.map((m, i) => {
            const e = ecartBaseline(checkins, m);
            const serie = jours.map((iso) => (checkins.find((c) => c.date === iso)?.[m] as number) ?? null);
            const couleur = e.disponible ? (e.favorable ? ZONE_COULEUR[2] : ZONE_COULEUR[4]) : "#6B7A74";
            const ecartTxt = !e.disponible
              ? "baseline en cours"
              : e.affichage === "pct"
                ? `${e.ecart! >= 0 ? "+" : ""}${Math.round(e.ecart!)} %`
                : `${e.ecart! >= 0 ? "+" : ""}${nombreFr(e.ecart!, 1)} °C`;
            return (
              <div key={m} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <div className="text-xs text-sourdine">{METRIQUES[m].label}</div>
                  <div className="tnum font-mono text-sm text-encre">
                    {e.valeur != null ? `${nombreFr(e.valeur, e.affichage === "abs" ? 1 : 0)} ${METRIQUES[m].unite}` : "—"}
                  </div>
                  <div className="text-xs font-medium" style={{ color: couleur }}>{ecartTxt}</div>
                </div>
                <div className="flex-1"><Sparkline valeurs={serie} couleur={couleurs[i]} /></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---- Douleur : frise 30 jours ----

const NIVEAU_COULEUR = ["#DDE2E0", "#7C93A3", "#B4552B", "#8C2C21"]; // 0..3 (≥2 = brique/rouge)

function FriseDouleur() {
  const { checkins } = useApp();
  const jours = derniersJours(30);
  const zones: { cle: "cheville" | "genou" | "tendon"; label: string }[] = [
    { cle: "cheville", label: "Cheville" },
    { cle: "genou", label: "Genou" },
    { cle: "tendon", label: "Tendon" },
  ];
  const parJour = (iso: string) => checkins.find((c) => c.date === iso);
  const rien = !checkins.some((c) => c.douleur && Object.values(c.douleur).some((v) => (v ?? 0) > 0));

  return (
    <div>
      {zones.map(({ cle, label }) => (
        <div key={cle} className="mb-2 flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-sourdine">{label}</span>
          <div className="flex flex-1 gap-[2px]">
            {jours.map((iso) => {
              const n = parJour(iso)?.douleur?.[cle] ?? 0;
              return <span key={iso} className="h-4 flex-1 rounded-[1px]" style={{ background: NIVEAU_COULEUR[n] }} title={`${formatDateCourt(parseISODate(iso))} · ${n}`} />;
            })}
          </div>
        </div>
      ))}
      <p className="mt-1 text-xs text-sourdine">
        {rien ? "Aucune douleur signalée sur 30 jours." : "Une couleur soutenue = douleur ≥ 2, à surveiller."}
      </p>
    </div>
  );
}
