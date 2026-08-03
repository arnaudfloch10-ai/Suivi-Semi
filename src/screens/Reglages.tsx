// Réglages — date, VMA (recalcule les allures), zones, points d'attention,
// export / import. Ne jamais écraser le journal sans confirmation.

import { useRef, useState } from "react";
import { useApp } from "../store/useApp";
import { programme } from "../data/programme";
import { zonePaceLabel, zonePctLabel, ZONE_COULEUR } from "../lib/vma";
import { nombreFr } from "../lib/format";
import { joursEntre, parseISODate, aujourdHui, toISODate } from "../lib/calendar";
import Section from "../components/Section";
import ChaussuresReglages from "../components/ChaussuresReglages";
import {
  construireSauvegarde,
  validerSauvegarde,
  type Sauvegarde,
} from "../store/storage";
import { encoderPartage, lienCoach } from "../lib/share";

export default function Reglages() {
  const { reglages, journal, checkins, majReglages, remplacerTout, demo } = useApp();
  const cibleSommeil = reglages.cibleSommeil ?? 7.5;
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
    const data = construireSauvegarde(reglages, journal, checkins);
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
      remplacerTout(s.reglages, s.journal, s.checkins);
      setMessage("Carnet importé.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import impossible.");
    }
  }

  async function partagerCoach() {
    try {
      const url = lienCoach(await encoderPartage(reglages, journal, checkins));
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Mon carnet d'entraînement — vue coach",
            text: "Voici mes séances (lecture seule).",
            url,
          });
          return;
        } catch {
          /* partage annulé → on tente le presse-papier */
        }
      }
      await navigator.clipboard.writeText(url);
      setMessage("Lien coach copié. Envoie-le à ton frère.");
    } catch {
      setMessage("Impossible de créer le lien coach.");
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
    // On garde les check-ins : ils ne sont pas liés au plan.
    remplacerTout(
      { dateDebut: null, vma: reglages.vma, chaussures: reglages.chaussures },
      [],
      checkins,
    );
  }

  function reinitBaselines() {
    if (window.confirm("Réinitialiser les baselines à partir d'aujourd'hui ? Les moyennes glissantes ignoreront les données antérieures.")) {
      majReglages({ baselineDepuis: toISODate(aujourdHui()), scoresStableVu: false });
      setMessage("Baselines réinitialisées.");
    }
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
            Modifie la VMA pour recalculer tes zones d'allure ci-dessous. Les
            consignes de chaque séance restent celles de ton frère.
          </p>
        </div>
      </Section>

      <Section titre="Récupération & scores">
        <div className="space-y-4">
          <Ligne label="Cible de sommeil">
            <span className="flex items-center gap-2">
              <button onClick={() => majReglages({ cibleSommeil: Math.max(4, cibleSommeil - 0.25) })} className="h-8 w-8 rounded-md border border-black/15 text-encre">−</button>
              <span className="tnum w-16 text-center font-mono text-sm text-encre">{heuresReglages(cibleSommeil)}</span>
              <button onClick={() => majReglages({ cibleSommeil: Math.min(11, cibleSommeil + 0.25) })} className="h-8 w-8 rounded-md border border-black/15 text-encre">+</button>
            </span>
          </Ligne>
          <Ligne label="Masquer les scores">
            <button
              role="switch"
              aria-checked={!!reglages.masquerScores}
              onClick={() => majReglages({ masquerScores: !reglages.masquerScores })}
              className={`relative h-7 w-12 rounded-full transition-colors ${reglages.masquerScores ? "bg-zone2" : "bg-black/15"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${reglages.masquerScores ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </Ligne>
          <p className="text-xs text-sourdine">
            Surveiller un score de sommeil peut dégrader le sommeil : tu peux couper l'affichage tout en continuant à saisir tes données.
          </p>
          <button onClick={reinitBaselines} className="min-h-[44px] w-full rounded-md border border-black/15 text-sm text-encre">
            Réinitialiser les baselines
          </button>
          <p className="text-xs text-sourdine">Utile après un changement de montre : les moyennes repartent d'aujourd'hui.</p>
        </div>
      </Section>

      <Section
        titre="Zones d'allure"
        aside={<span className="text-xs text-sourdine">selon la VMA</span>}
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
                {zonePaceLabel(reglages.vma, z.zone)} /km
                <span className="block text-xs text-sourdine">{zonePctLabel(z.zone)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <ChaussuresReglages />

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
          Tes données vivent uniquement sur ce téléphone. Exporte régulièrement
          pour ne rien perdre. Le fichier embarque aussi ton plan : c'est lui que
          ton frère importe dans son tableau de bord coach.
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

      <Section titre="Partager avec ton frère">
        <p className="mb-4 text-sm text-sourdine">
          Génère un lien de suivi (lecture seule) : ton frère voit chaque séance,
          tes commentaires et ta progression. Le lien contient un instantané de
          ton carnet — renvoie-en un nouveau quand tu veux qu'il voie la suite.
        </p>
        <button
          onClick={partagerCoach}
          className="min-h-[48px] w-full rounded-md bg-zone2 text-sm font-medium text-white"
        >
          Partager le suivi (lien coach)
        </button>
        <p className="mt-3 text-xs text-sourdine">
          À n'envoyer qu'à ton frère : toute personne ayant le lien voit tes données.
        </p>
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

function heuresReglages(h: number): string {
  const e = Math.floor(h);
  const m = Math.round((h - e) * 60);
  return m ? `${e} h ${m.toString().padStart(2, "0")}` : `${e} h`;
}

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-encre">{label}</span>
      {children}
    </div>
  );
}
