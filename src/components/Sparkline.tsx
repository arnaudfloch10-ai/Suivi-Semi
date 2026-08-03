// Mini-courbe SVG (sans dépendance) — pour les tendances de sommeil.

export default function Sparkline({
  valeurs,
  couleur,
  hauteur = 40,
  largeur = 120,
}: {
  valeurs: (number | null)[];
  couleur: string;
  hauteur?: number;
  largeur?: number;
}) {
  const points = valeurs
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (points.length < 2) {
    return <div style={{ height: hauteur }} className="text-xs text-sourdine">—</div>;
  }
  const vals = points.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const n = valeurs.length - 1 || 1;
  const pad = 3;
  const x = (i: number) => pad + (i / n) * (largeur - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (hauteur - pad * 2);
  const d = points.map((p, k) => `${k === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const dernier = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="w-full" aria-hidden="true">
      <path d={d} fill="none" stroke={couleur} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(dernier.i)} cy={y(dernier.v)} r={2.4} fill={couleur} />
    </svg>
  );
}
