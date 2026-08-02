import { ZONE_COULEUR, ZONE_NOM } from "../lib/vma";

export default function ZonePill({ zone }: { zone: number }) {
  const c = ZONE_COULEUR[zone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: c, background: `${c}18` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c }} aria-hidden="true" />
      Zone {zone} · {ZONE_NOM[zone]}
    </span>
  );
}
