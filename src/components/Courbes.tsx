// Deux courbes sobres (Recharts) : ressenti et allure EF par semaine.
// Pas de grille lourde, couleurs = zones, graduations en mono.

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PointSemaine } from "../lib/stats";
import { paceToStr, nombreFr } from "../lib/format";
import { ZONE_COULEUR } from "../lib/vma";

const AXE = { fill: "#6B7A74", fontSize: 10, fontFamily: "'Spectral', Georgia, serif" };

function aDesDonnees(data: PointSemaine[]): boolean {
  return data.some((d) => d.valeur != null);
}

function InfoBulle({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
  format: (v: number) => string;
}) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="rounded border border-black/10 bg-fond px-2 py-1 text-xs shadow-none">
      <span className="text-sourdine">S{label}</span>{" "}
      <span className="tnum font-mono text-encre">{format(payload[0].value)}</span>
    </div>
  );
}

function Vide({ texte }: { texte: string }) {
  return (
    <div className="flex h-[150px] items-center justify-center text-center text-sm text-sourdine">
      {texte}
    </div>
  );
}

export function CourbeRessenti({ data }: { data: PointSemaine[] }) {
  if (!aDesDonnees(data)) {
    return <Vide texte="Saisis quelques séances pour voir si ça devient plus facile." />;
  }
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <ReferenceLine y={3} stroke="#16201C" strokeOpacity={0.08} />
        <XAxis
          dataKey="semaine"
          tick={AXE}
          tickLine={false}
          axisLine={{ stroke: "#16201C", strokeOpacity: 0.12 }}
          interval={0}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 3, 5]}
          tick={AXE}
          tickLine={false}
          axisLine={false}
          width={34}
        />
        <Tooltip
          cursor={{ stroke: "#16201C", strokeOpacity: 0.15 }}
          content={<InfoBulle format={(v) => nombreFr(v, 1)} />}
        />
        <Line
          type="monotone"
          dataKey="valeur"
          stroke={ZONE_COULEUR[2]}
          strokeWidth={2}
          dot={{ r: 2.5, fill: ZONE_COULEUR[2], strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CourbeAllure({ data }: { data: PointSemaine[] }) {
  if (!aDesDonnees(data)) {
    return <Vide texte="Saisis tes footings pour suivre ton allure d'endurance." />;
  }
  const vals = data.filter((d) => d.valeur != null).map((d) => d.valeur as number);
  const min = Math.floor(Math.min(...vals) * 10) / 10 - 0.1;
  const max = Math.ceil(Math.max(...vals) * 10) / 10 + 0.1;
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
        <XAxis
          dataKey="semaine"
          tick={AXE}
          tickLine={false}
          axisLine={{ stroke: "#16201C", strokeOpacity: 0.12 }}
          interval={0}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          domain={[min, max]}
          tick={AXE}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => paceToStr(v)}
        />
        <Tooltip
          cursor={{ stroke: "#16201C", strokeOpacity: 0.15 }}
          content={<InfoBulle format={(v) => `${paceToStr(v)} /km`} />}
        />
        <Line
          type="monotone"
          dataKey="valeur"
          stroke={ZONE_COULEUR[3]}
          strokeWidth={2}
          dot={{ r: 2.5, fill: ZONE_COULEUR[3], strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
