// Réglages — date, VMA (recalcule les allures), zones, points d'attention,
// export / import. Ne jamais écraser le journal sans confirmation.

import { useRef, useState } from "react";
import { useApp } from "../store/useApp";
import { programme } from "../data/programme";
import { zonePaceLabel, ZONE_COULEUR } from "../lib/vma";
import { PLAN_PAR_CHARGE } from "../data/programme";
import { nombreFr } from "../lib/format";
import { joursEntre, parseISODate, aujourdHui } from "../lib/calendar";
import Section from "../components/Section";
import {
  construireSauvegarde,
  validerSauvegarde,
  type Sauvegarde,
} from "../store/storage";

export default function Reglages() {
  const { reglages, journal, majReglages, remplacerTout, demo } = useApp();
  const [editVma, setEditVma] = useState(false);
  const [vmaSaisie, setVmaSaisie] = useState(reglages.vma.toString());
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function validerVma() {
    const v = parseFloat(vmaSaisie.replace(",", "."));
    if (isFinite(v) && v > 5 && v < 25) {
      majReglages({ vma: v });
      setEditVma(false);
    }
  }

  function exporter() {
    const data = construireSauvegarde(reglages, journal);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const jour = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `suivi-semi-${jour}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (!demo) majReglages({ dernierExport: new Date().toISOString() });
    setMessage("Carnet exporté.");
  }

  async function importer(file: File) {
    try {
      const data = JSON.parse(await file.text());
      const s: Sauvegarde = validerSauvegarde(data);
      const nb = journal.length;
      const ok =
        nb === 0 ||
        window.confirm(
          `Importer remplacera ton carnet actuel (${nb} séance${nb > 1 ? "s" : ""} saisie${nb > 1 ? "s" : ""}) par le fichier (${s.journal.length}). Continuer ?`,
        );
      if (!ok) return;
      remplacerTout(s.reglages, s.journal);
      setMessage("Carnet importé.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import impossible.");
    }
  }

  function recommencer() {
    const nb = journal.length;
    const ok = window.confirm(
      nb > 0
        ? `Nouveau plan : une sauvegarde de ton carnet actuel (${nb} séance${nb > 1 ? "s" : ""}) va être téléchargée, puis le journal sera vidé et la date de début redemandée. Continuer ?`
        : "Repartir de zéro : la date de début sera redemandée. Continuer ?",
    );
    if (!ok) return;
    if (nb > 0) exporter(); // sauvegarde avant d'effacer
    remplacerTout({ dateDebut: null, vma: reglages.vma }, []);
  }

  const dernier = reglages.dernierExport
    ? joursEntre(parseISODate(reglages.dernierExport.slice(0, 10)), aujourdHui())
    : null;

  return (
    <div className="animate-[fade-in_400ms_ease-out] pt-2">
      <h1 className="pb-2 font-display text-3xl text-encre">Réglages</h1>

      <Section titre="Départ et VMA">
        <div className="space-y-4">
          <Ligne label="Date de début">
            <input
              type="date"
              value={reglages.dateDebut ?? ""}
              onChange={(e) => e.target.value && majReglages({ dateDebut: e.target.value })}
              className="tnum rounded-md border border-black/15 bg-white/60 px-2 py-1.5 font-mono text-sm text-encre focus:border-zone2"
            />
          </Ligne>

          <Ligne label="VMA">
            {editVma ? (
              <span className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  value={vmaSaisie}
                  onChange={(e) => setVmaSaisie(e.target.value)}
                  className="tnum w-20 rounded-md border border-black/15 bg-white/60 px-2 py-1.5 font-mono text-sm text-encre focus:border-zone2"
                  autoFocus
                />
                <span className="text-sm text-sourdine">km/h</span>
                <button onClick={validerVma} className="text-sm font-medium text-zone2">
                  OK
                </button>
              </span>
            ) : (
              <button
                onClick={() => {
                  setVmaSaisie(reglages.vma.toString());
                  setEditVma(true);
                }}
                className="tnum font-mono text-sm text-encre underline decoration-black/20 underline-offset-4"
              >
                {nombreFr(reglages.vma, 1)} km/h
              </button>
            )}
          </Ligne>
          <p className="text-xs text-sourdine">
            {PLAN_PAR_CHARGE
              ? "Le test initial peut la faire bouger. Les allures cibles du plan sont fixées par ton frère."
              : "Le test de la semaine 8 peut la faire bouger. Toutes les allures cibles se recalculent."}
          </p>
        </div>
      </Section>

      <Section
        titre="Zones d'allure"
        aside={
          <span className="text-xs text-sourdine">
            {PLAN_PAR_CHARGE ? "fixées par le coach" : "selon la VMA"}
          </span>
        }
      >
        <ul className="space-y-2.5">
          {programme.zones.map((z) => (
            <li key={z.zone} className="flex items-center gap-3">
              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ background: ZONE_COULEUR[z.zone] }}
                aria-hidden="true"
              />
              <span className="flex-1">
                <span className="text-sm text-encre">{z.nom ?? `Zone ${z.zone}`}</span>
                <span className="block text-xs text-sourdine">{z.usage}</span>
              </span>
              <span className="tnum shrink-0 text-right font-mono text-sm text-encre">
                {PLAN_PAR_CHARGE ? z.allure : `${zonePaceLabel(reglages.vma, z.zone)} /km`}
                {z.pct_vma && <span className="block text-xs text-sourdine">{z.pct_vma}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Points d'attention" aside={<span className="text-xs text-sourdine">de ton frère</span>}>
        <ul className="space-y-3">
          {programme.points_attention.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-encre">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zone2" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Sauvegarde">
        <p className="mb-4 text-sm text-sourdine">
          Tes données vivent uniquement sur ce téléphone. Exporte régulièrement pour ne rien perdre.
        </p>
        <div className="space-y-2.5">
          <button
            onClick={exporter}
            className="min-h-[48px] w-full rounded-md bg-zone2 text-sm font-medium text-white"
          >
            Exporter le carnet (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-[48px] w-full rounded-md border border-black/15 text-sm font-medium text-encre"
          >
            Importer un carnet
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importer(f);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="mt-3 text-sm text-zone2">{message}</p>}
        {dernier != null && (
          <p className="mt-3 text-xs text-sourdine">
            {dernier === 0
              ? "Dernier export aujourd'hui."
              : `Dernier export il y a ${dernier} jour${dernier > 1 ? "s" : ""}.`}
          </p>
        )}
      </Section>

      <Section titre="Nouveau plan">
        <p className="mb-4 text-sm text-sourdine">
          Recommencer vide le journal et redemande une date de début. Une
          sauvegarde du carnet actuel est téléchargée avant.
        </p>
        <button
          onClick={recommencer}
          className="min-h-[48px] w-full rounded-md border border-zone5/40 text-sm font-medium text-zone5"
        >
          Recommencer un plan
        </button>
      </Section>

      <Section>
        <p className="text-center text-xs text-sourdine">
          {programme.meta.titre}
          <br />
          {programme.meta.auteur} · objectif : {programme.meta.objectif}
        </p>
      </Section>
    </div>
  );
}

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-encre">{label}</span>
      {children}
    </div>
  );
}
