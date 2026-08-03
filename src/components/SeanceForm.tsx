// Formulaire de saisie d'une séance — plein écran, une action primaire.

import { useEffect, useMemo, useState } from "react";
import type { Entree, Ressenti, Seance, Statut, Surface } from "../data/types";
import { allureFrom, nombreFr, parsePace } from "../lib/format";
import { TYPE_LABEL } from "../lib/labels";
import { allureCibleTexte, zoneSeance } from "../lib/vma";
import { estCourue, kmChaussure } from "../lib/chaussures";
import { useApp } from "../store/useApp";
import ZonePill from "./ZonePill";

const SURFACES: Surface[] = ["route", "chemin", "piste", "tapis"];
const CONDITIONS = ["sec", "pluie", "vent", "chaleur"];

const STATUTS: { v: Statut; label: string }[] = [
  { v: "faite", label: "Faite" },
  { v: "adaptee", label: "Adaptée" },
  { v: "manquee", label: "Manquée" },
];

const RESSENTIS: { v: Ressenti; label: string }[] = [
  { v: 1, label: "Très dur" },
  { v: 2, label: "Dur" },
  { v: 3, label: "Correct" },
  { v: 4, label: "Facile" },
  { v: 5, label: "Très facile" },
];

function Champ({
  label,
  children,
  suffixe,
}: {
  label: string;
  children: React.ReactNode;
  suffixe?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-sourdine">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {children}
        {suffixe && <span className="text-sm text-sourdine">{suffixe}</span>}
      </div>
    </label>
  );
}

const inputCls =
  "tnum w-full rounded-md border border-black/15 bg-white/60 px-3 py-2.5 font-mono text-encre focus:border-zone2";

export default function SeanceForm({
  seance,
  dateParDefaut,
  vma,
  existante,
  onEnregistrer,
  onSupprimer,
  onFermer,
}: {
  seance: Seance;
  dateParDefaut: string;
  vma: number;
  existante?: Entree;
  onEnregistrer: (e: Entree) => void;
  onSupprimer?: () => void;
  onFermer: () => void;
}) {
  const [statut, setStatut] = useState<Statut>(existante?.statut ?? "faite");
  const [ressenti, setRessenti] = useState<Ressenti>(existante?.ressenti ?? 3);
  const [date, setDate] = useState(existante?.date ?? dateParDefaut);
  const [duree, setDuree] = useState(
    existante?.duree_min?.toString() ?? seance.duree_min?.toString() ?? "",
  );
  const [distance, setDistance] = useState(
    existante?.distance_km?.toString() ?? seance.distance_km?.toString() ?? "",
  );
  const [allure, setAllure] = useState(existante?.allure ?? "");
  const [allureManuelle, setAllureManuelle] = useState(!!existante?.allure);
  const [fc, setFc] = useState(existante?.fc_moyenne?.toString() ?? "");
  const [commentaire, setCommentaire] = useState(existante?.commentaire ?? "");

  const { reglages, journal, majReglages } = useApp();
  const courue = estCourue(seance.type);
  const chaussuresActives = reglages.chaussures.filter((c) => !c.archivee);
  const [chaussureId, setChaussureId] = useState<string | undefined>(
    existante?.chaussure_id ?? reglages.derniereChaussure ?? chaussuresActives[0]?.id,
  );

  // Contexte (replié par défaut).
  const [contexteOuvert, setContexteOuvert] = useState(false);
  const [surface, setSurface] = useState<Surface | undefined>(existante?.surface);
  const [meteoTemp, setMeteoTemp] = useState(existante?.meteo?.temp_c?.toString() ?? "");
  const [meteoCond, setMeteoCond] = useState<string | undefined>(existante?.meteo?.condition);
  const [denivele, setDenivele] = useState(existante?.denivele_m?.toString() ?? "");

  const zone = zoneSeance(seance);
  const cible = allureCibleTexte(seance, vma);

  // Allure calculée automatiquement tant qu'on ne l'a pas éditée à la main.
  const allureAuto = useMemo(() => {
    const d = parseFloat(duree.replace(",", "."));
    const km = parseFloat(distance.replace(",", "."));
    return allureFrom(isFinite(d) ? d : undefined, isFinite(km) ? km : undefined);
  }, [duree, distance]);

  useEffect(() => {
    if (!allureManuelle && allureAuto) setAllure(allureAuto);
  }, [allureAuto, allureManuelle]);

  const perf = statut !== "manquee";
  const allureValide = !allure || parsePace(allure) != null;

  function enregistrer() {
    const num = (s: string) => {
      const v = parseFloat(s.replace(",", "."));
      return isFinite(v) ? v : undefined;
    };
    const meteo =
      num(meteoTemp) != null || meteoCond
        ? { temp_c: num(meteoTemp), condition: meteoCond }
        : undefined;
    const e: Entree = {
      seanceId: seance.id,
      date,
      statut,
      ressenti,
      ...(perf
        ? {
            duree_min: num(duree),
            distance_km: num(distance),
            allure: allure && parsePace(allure) != null ? allure : undefined,
            fc_moyenne: num(fc),
            chaussure_id: courue ? chaussureId : undefined,
            surface,
            meteo,
            denivele_m: num(denivele),
          }
        : {}),
      commentaire: commentaire.trim() || undefined,
    };
    if (perf && courue && chaussureId) majReglages({ derniereChaussure: chaussureId });
    onEnregistrer(e);
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-fond">
      <div className="mx-auto max-w-app px-5 pb-10">
        <header
          className="sticky top-0 -mx-5 flex items-center justify-between border-b border-black/10 bg-fond/95 px-5 py-3 backdrop-blur"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <button onClick={onFermer} className="py-1 text-sm text-sourdine">
            Annuler
          </button>
          <span className="text-sm font-medium text-encre">Saisir la séance</span>
          <button
            onClick={enregistrer}
            disabled={!allureValide}
            className="py-1 text-sm font-medium text-zone2 disabled:text-sourdine/50"
          >
            Enregistrer
          </button>
        </header>

        <div className="pt-5">
          <h2 className="font-display text-2xl text-encre">
            {seance.sous_type ?? TYPE_LABEL[seance.type]}
          </h2>
          <p className="mt-1 whitespace-pre-line text-sm text-sourdine">{seance.consigne}</p>
          {zone != null && cible && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <ZonePill zone={zone} />
              <span className="tnum font-mono text-sm text-encre">Cible {cible}</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-6">
          <Champ label="Statut">
            <div className="flex w-full gap-2" role="radiogroup" aria-label="Statut">
              {STATUTS.map((s) => (
                <button
                  key={s.v}
                  role="radio"
                  aria-checked={statut === s.v}
                  onClick={() => setStatut(s.v)}
                  className={`min-h-[44px] flex-1 rounded-md border px-2 text-sm transition-colors ${
                    statut === s.v
                      ? "border-zone2 bg-zone2 text-white"
                      : "border-black/15 text-encre"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Champ>

          {perf && (
            <>
              <Champ label="Ressenti">
                <div className="grid w-full grid-cols-5 gap-1.5" role="radiogroup" aria-label="Ressenti">
                  {RESSENTIS.map((r) => (
                    <button
                      key={r.v}
                      role="radio"
                      aria-checked={ressenti === r.v}
                      aria-label={r.label}
                      title={r.label}
                      onClick={() => setRessenti(r.v)}
                      className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-md border transition-colors ${
                        ressenti === r.v ? "border-zone2 bg-zone2/10" : "border-black/15"
                      }`}
                    >
                      <span className="tnum font-mono text-base text-encre">{r.v}</span>
                    </button>
                  ))}
                </div>
              </Champ>
              <p className="-mt-4 text-xs text-sourdine">
                1 = très dur · 5 = très facile — {RESSENTIS.find((r) => r.v === ressenti)?.label}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Champ label="Durée" suffixe="min">
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    value={duree}
                    onChange={(e) => setDuree(e.target.value)}
                    placeholder="—"
                  />
                </Champ>
                <Champ label="Distance" suffixe="km">
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="—"
                  />
                </Champ>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Champ label="Allure" suffixe="/km">
                  <input
                    className={`${inputCls} ${allureValide ? "" : "border-zone5"}`}
                    inputMode="numeric"
                    value={allure}
                    onChange={(e) => {
                      setAllure(e.target.value);
                      setAllureManuelle(true);
                    }}
                    placeholder="mm:ss"
                  />
                </Champ>
                <Champ label="FC moyenne" suffixe="bpm">
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    value={fc}
                    onChange={(e) => setFc(e.target.value)}
                    placeholder="—"
                  />
                </Champ>
              </div>
              {!allureManuelle && allureAuto && (
                <p className="-mt-4 text-xs text-sourdine">Calculée depuis durée et distance.</p>
              )}

              {courue && chaussuresActives.length > 0 && (
                <Champ label="Chaussures">
                  <div className="flex w-full flex-wrap gap-2">
                    {chaussuresActives.map((c) => {
                      const on = chaussureId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setChaussureId(on ? undefined : c.id)}
                          className={`min-h-[44px] rounded-md border px-3 text-sm transition-colors ${
                            on ? "border-zone2 bg-zone2/10 text-encre" : "border-black/15 text-sourdine"
                          }`}
                        >
                          {c.nom}{" "}
                          <span className="tnum font-mono text-xs opacity-70">
                            {nombreFr(Math.round(kmChaussure(c, journal)))} km
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Champ>
              )}

              <div className="border-t border-black/10 pt-3">
                <button
                  onClick={() => setContexteOuvert((v) => !v)}
                  aria-expanded={contexteOuvert}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-sm text-encre">Contexte (facultatif)</span>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 text-sourdine transition-transform ${contexteOuvert ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {contexteOuvert && (
                  <div className="mt-3 space-y-4">
                    <Champ label="Surface">
                      <div className="flex w-full flex-wrap gap-2">
                        {SURFACES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSurface(surface === s ? undefined : s)}
                            className={`min-h-[44px] flex-1 rounded-md border px-2 text-sm capitalize transition-colors ${
                              surface === s ? "border-zone2 bg-zone2/10 text-encre" : "border-black/15 text-sourdine"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </Champ>
                    <div className="grid grid-cols-2 gap-4">
                      <Champ label="Température" suffixe="°C">
                        <input className={inputCls} inputMode="numeric" value={meteoTemp} onChange={(e) => setMeteoTemp(e.target.value)} placeholder="—" />
                      </Champ>
                      <Champ label="Dénivelé +" suffixe="m">
                        <input className={inputCls} inputMode="numeric" value={denivele} onChange={(e) => setDenivele(e.target.value)} placeholder="—" />
                      </Champ>
                    </div>
                    <Champ label="Conditions">
                      <div className="flex w-full flex-wrap gap-2">
                        {CONDITIONS.map((cd) => (
                          <button
                            key={cd}
                            onClick={() => setMeteoCond(meteoCond === cd ? undefined : cd)}
                            className={`min-h-[44px] flex-1 rounded-md border px-2 text-sm capitalize transition-colors ${
                              meteoCond === cd ? "border-zone2 bg-zone2/10 text-encre" : "border-black/15 text-sourdine"
                            }`}
                          >
                            {cd}
                          </button>
                        ))}
                      </div>
                    </Champ>
                  </div>
                )}
              </div>
            </>
          )}

          <Champ label="Date de réalisation">
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Champ>

          <Champ label="Commentaire">
            <textarea
              className="min-h-[80px] w-full rounded-md border border-black/15 bg-white/60 px-3 py-2.5 text-encre focus:border-zone2"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Sensations, météo, douleurs…"
            />
          </Champ>

          <button
            onClick={enregistrer}
            disabled={!allureValide}
            className="min-h-[52px] w-full rounded-md bg-zone2 text-base font-medium text-white disabled:opacity-40"
          >
            Enregistrer la séance
          </button>

          {existante && onSupprimer && (
            <button
              onClick={onSupprimer}
              className="min-h-[44px] w-full text-sm text-zone5"
            >
              Supprimer cette saisie
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
