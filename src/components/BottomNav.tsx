import type { Ecran } from "../App";

const ITEMS: { id: Ecran; label: string; icone: JSX.Element }[] = [
  {
    id: "accueil",
    label: "Accueil",
    icone: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" />
    ),
  },
  {
    id: "aujourdhui",
    label: "Aujourd'hui",
    icone: (
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M8 3v3m8-3v3" />
        <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    id: "semaines",
    label: "Semaines",
    icone: (
      <path d="M4 19V10m5 9V5m5 14v-7m5 7V8" />
    ),
  },
  {
    id: "reglages",
    label: "Réglages",
    icone: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2.5M12 18.5V21M4.2 7l2.2 1.3M17.6 15.7l2.2 1.3M4.2 17l2.2-1.3M17.6 8.3l2.2-1.3" />
      </>
    ),
  },
];

export default function BottomNav({
  actif,
  onChange,
}: {
  actif: Ecran;
  onChange: (e: Ecran) => void;
}) {
  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-black/10 bg-fond/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-app">
        {ITEMS.map((it) => {
          const on = actif === it.id;
          return (
            <li key={it.id} className="flex-1">
              <button
                onClick={() => onChange(it.id)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors ${
                  on ? "text-zone2" : "text-sourdine"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={on ? 2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {it.icone}
                </svg>
                <span className={on ? "font-medium" : ""}>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
