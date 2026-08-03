// Charge d'entraînement sous la vague : barres hebdomadaires + ratio
// aigu/chronique (affiché seulement après 28 jours d'historique).

import type { Entree } from "../data/types";
import { acwr, chargeParSemaine } from "../lib/charge";
import { nombreFr } from "../lib/format";
import { ZONE_COULEUR } from "../lib/vma";

const W = 360;
const H = 46;
const PAD_X = 6;
const GAP = 7;

export default function ChargeAccueil({
  journal,
  dateDebut,
  semaineCourante,
}: {
  journal: Entree[];
  dateDebut: string;
  semaineCourante: number;
}) {
  const parSem = chargeParSemaine(journal);
  const max = Math.max(1, ...parSem.map((s) => s.charge));
  const n = parSem.length;
  const colW = (W - PAD_X * 2 - GAP * (n - 1)) / n;
  const r = acwr(journal, dateDebut);

  // Couleur / message du ratio selon la zone de confort.
  let couleurRatio = ZONE_COULEUR[2];
  let note: string | null = null;
  if (r.ratio != null) {
    if (r.ratio > 1.5) {
      couleurRatio = ZONE_COULEUR[4];
      note = "Montée de charge rapide — surveille la fatigue.";
    } else if (r.ratio > 1.3 || r.ratio < 0.8) {
      couleurRatio = ZONE_COULEUR[3];
    }
  }

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Charge d'entraînement par semaine">
        {parSem.map((s, i) => {
          const x = PAD_X + i * (colW + GAP);
          const h = s.charge > 0 ? Math.max(2, (s.charge / max) * (H - 4)) : 0;
          const encours = s.semaine === semaineCourante;
          return (
            <rect
              key={s.semaine}
              x={x}
              y={H - h}
              width={colW}
              height={h}
              rx={2}
              fill="#6B7A74"
              fillOpacity={encours ? 0.9 : 0.45}
            />
          );
        })}
      </svg>

      <div className="mt-1 flex items-baseline justify-between px-1 text-[11px] text-sourdine">
        <span>Charge hebdomadaire (sRPE)</span>
        {r.disponible && r.ratio != null ? (
          <span>
            Ratio aigu/chronique{" "}
            <span className="tnum font-mono font-medium" style={{ color: couleurRatio }}>
              {nombreFr(r.ratio, 2)}
            </span>
          </span>
        ) : (
          <span>Ratio dès 28 j de données</span>
        )}
      </div>
      {note && <p className="mt-1 px-1 text-xs" style={{ color: ZONE_COULEUR[4] }}>{note}</p>}
    </div>
  );
}
