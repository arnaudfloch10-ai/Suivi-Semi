// Élément signature — la vague de charge.
// 12 colonnes : hauteur = volume hebdo, couleur = zone d'intensité.
// Passées pleines · en cours marquée d'un trait · futures en contour.
// On tape une colonne, on ouvre la semaine.

import { programme, PLAN_PAR_CHARGE } from "../data/programme";
import { chargeDeSemaine, couleurDeSemaine } from "../lib/vma";

const W = 360;
const H = 150;
const PAD_X = 6;
const GAP = 7;
const BASE = H - 22; // ligne de sol (place pour les numéros)
const TOP = 12;

export default function LoadWave({
  semaineCourante,
  onOuvrir,
  anime = true,
}: {
  semaineCourante: number;
  onOuvrir: (semaine: number) => void;
  anime?: boolean;
}) {
  const semaines = programme.semaines;
  const n = semaines.length;
  const maxVol = Math.max(...semaines.map(chargeDeSemaine));
  const colW = (W - PAD_X * 2 - GAP * (n - 1)) / n;
  const hMax = BASE - TOP;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="group"
        aria-label="Vague de charge — les semaines du plan"
      >
        {/* ligne de sol discrète */}
        <line x1={PAD_X} y1={BASE + 0.5} x2={W - PAD_X} y2={BASE + 0.5} stroke="#16201C" strokeOpacity={0.12} />

        {semaines.map((sem, i) => {
          const x = PAD_X + i * (colW + GAP);
          const h = Math.max(6, (chargeDeSemaine(sem) / maxVol) * hMax);
          const y = BASE - h;
          const couleur = couleurDeSemaine(sem);
          const etat =
            sem.numero < semaineCourante
              ? "passee"
              : sem.numero === semaineCourante
                ? "encours"
                : "future";
          const future = etat === "future";
          const mesure =
            sem.charge_pct != null ? `charge ${sem.charge_pct} %` : `${sem.volume_km} km`;
          const label =
            `Semaine ${sem.numero}, ${mesure}, intensité ${sem.intensite}` +
            (etat === "encours" ? ", en cours" : etat === "passee" ? ", passée" : ", à venir");

          return (
            <g key={sem.numero}>
              {/* barre */}
              <rect
                x={x}
                y={y}
                width={colW}
                height={h}
                rx={3}
                fill={couleur}
                fillOpacity={future ? 0.14 : 1}
                stroke={couleur}
                strokeWidth={future ? 1.4 : 0}
                style={
                  anime
                    ? {
                        transformBox: "fill-box",
                        transformOrigin: "bottom",
                        animation: `wave-rise 620ms cubic-bezier(.22,.61,.36,1) both`,
                        animationDelay: `${i * 45}ms`,
                      }
                    : undefined
                }
              />
              {/* marqueur semaine en cours */}
              {etat === "encours" && (
                <rect x={x} y={y - 6} width={colW} height={3} rx={1.5} fill="#16201C" />
              )}
              {/* numéro */}
              <text
                x={x + colW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={10}
                fontFamily="'Spectral', Georgia, serif"
                fill="#16201C"
                fillOpacity={etat === "future" ? 0.4 : 0.7}
                fontWeight={etat === "encours" ? 600 : 400}
              >
                {sem.numero}
              </text>
              {/* zone tactile pleine hauteur */}
              <rect
                x={x - GAP / 2}
                y={0}
                width={colW + GAP}
                height={H}
                fill="transparent"
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={label}
                onClick={() => onOuvrir(sem.numero)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOuvrir(sem.numero);
                  }
                }}
              />
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex items-center justify-between px-1 text-[11px] text-sourdine">
        <span>
          {PLAN_PAR_CHARGE ? "Charge hebdomadaire" : "Volume hebdomadaire"} · couleur = intensité
        </span>
        <span>Touche une semaine</span>
      </figcaption>
    </figure>
  );
}
