// Gestion des chaussures dans les réglages : km cumulé, mise en service,
// ajout / archivage, alerte d'usure suggestive.

import { useState } from "react";
import { useApp } from "../store/useApp";
import type { Chaussure } from "../data/types";
import { alerteUsure, kmChaussure } from "../lib/chaussures";
import { nombreFr } from "../lib/format";
import { ZONE_COULEUR } from "../lib/vma";
import Section from "./Section";

export default function ChaussuresReglages() {
  const { reglages, journal, majReglages } = useApp();
  const chaussures = reglages.chaussures;
  const actives = chaussures.filter((c) => !c.archivee);
  const archivees = chaussures.filter((c) => c.archivee);
  const [nom, setNom] = useState("");
  const [km, setKm] = useState("");

  const majListe = (next: Chaussure[]) => majReglages({ chaussures: next });
  const patch = (id: string, p: Partial<Chaussure>) =>
    majListe(chaussures.map((c) => (c.id === id ? { ...c, ...p } : c)));

  function ajouter() {
    if (!nom.trim()) return;
    const km0 = parseFloat(km.replace(",", ".")) || 0;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}`;
    majListe([...chaussures, { id, nom: nom.trim(), km: km0, archivee: false }]);
    setNom("");
    setKm("");
  }

  return (
    <Section titre="Chaussures">
      <ul className="space-y-4">
        {actives.map((c) => {
          const total = kmChaussure(c, journal);
          const usure = alerteUsure(total);
          const couleur =
            usure.niveau === "marque" ? ZONE_COULEUR[4] : usure.niveau === "surveiller" ? ZONE_COULEUR[3] : ZONE_COULEUR[2];
          return (
            <li key={c.id}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-encre">{c.nom}</span>
                <span className="tnum font-mono text-sm font-medium" style={{ color: couleur }}>
                  {nombreFr(Math.round(total))} km
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-sourdine">
                <label className="flex items-center gap-1">
                  départ
                  <input
                    inputMode="numeric"
                    value={c.km}
                    onChange={(e) => patch(c.id, { km: parseFloat(e.target.value.replace(",", ".")) || 0 })}
                    className="tnum w-14 rounded border border-black/15 bg-white/60 px-1.5 py-1 font-mono text-encre"
                  />
                  km
                </label>
                <label className="flex items-center gap-1">
                  depuis
                  <input
                    type="date"
                    value={c.date_mise_en_service ?? ""}
                    onChange={(e) => patch(c.id, { date_mise_en_service: e.target.value || undefined })}
                    className="tnum rounded border border-black/15 bg-white/60 px-1.5 py-1 font-mono text-encre"
                  />
                </label>
                <button onClick={() => patch(c.id, { archivee: true })} className="ml-auto text-sourdine underline underline-offset-2">
                  archiver
                </button>
              </div>
              {usure.texte && <p className="mt-1 text-xs" style={{ color: couleur }}>{usure.texte}</p>}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-end gap-2 border-t border-black/10 pt-4">
        <label className="flex-1 text-xs text-sourdine">
          Ajouter une paire
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Modèle"
            className="mt-1 w-full rounded-md border border-black/15 bg-white/60 px-2 py-1.5 text-sm text-encre"
          />
        </label>
        <input
          inputMode="numeric"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          placeholder="km"
          className="tnum w-16 rounded-md border border-black/15 bg-white/60 px-2 py-1.5 font-mono text-sm text-encre"
        />
        <button onClick={ajouter} className="min-h-[38px] rounded-md bg-zone2 px-3 text-sm font-medium text-white">
          +
        </button>
      </div>

      {archivees.length > 0 && (
        <div className="mt-4 text-xs text-sourdine">
          <span className="uppercase tracking-[0.08em]">Archivées</span>
          <ul className="mt-1.5 space-y-1">
            {archivees.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.nom} · {nombreFr(Math.round(kmChaussure(c, journal)))} km</span>
                <button onClick={() => patch(c.id, { archivee: false })} className="underline underline-offset-2">
                  réactiver
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
