import type { ReactNode } from "react";

/** Bloc titré, séparé par un filet fin. Pas de carte, pas d'ombre. */
export default function Section({
  titre,
  aside,
  children,
}: {
  titre?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-black/10 py-5">
      {titre && (
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-sourdine">
            {titre}
          </h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
