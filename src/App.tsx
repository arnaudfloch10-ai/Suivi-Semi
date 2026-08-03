import { useEffect, useState } from "react";
import { useApp } from "./store/useApp";
import Onboarding from "./screens/Onboarding";
import Accueil from "./screens/Accueil";
import Aujourdhui from "./screens/Aujourdhui";
import Semaines from "./screens/Semaines";
import Sommeil from "./screens/Sommeil";
import Reglages from "./screens/Reglages";
import CoachDashboard from "./screens/CoachDashboard";
import BottomNav from "./components/BottomNav";
import { decoderPartage, payloadDansUrl } from "./lib/share";
import type { Sauvegarde } from "./store/storage";

export type Ecran = "accueil" | "aujourdhui" | "semaines" | "sommeil" | "reglages";

type CoachState =
  | { statut: "chargement" }
  | { statut: "ok"; data: Sauvegarde }
  | { statut: "erreur" };

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-full max-w-app items-center justify-center px-6 text-center text-sourdine">
      {children}
    </main>
  );
}

export default function App() {
  const { reglages } = useApp();
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [semaineOuverte, setSemaineOuverte] = useState<number | undefined>(undefined);

  // Mode coach : le lien porte un instantané dans le fragment (#c=…).
  const [coach, setCoach] = useState<CoachState | null>(() =>
    payloadDansUrl() ? { statut: "chargement" } : null,
  );
  useEffect(() => {
    const p = payloadDansUrl();
    if (!p) return;
    decoderPartage(p)
      .then((data) => setCoach({ statut: "ok", data }))
      .catch(() => setCoach({ statut: "erreur" }));
  }, []);

  if (coach) {
    if (coach.statut === "chargement") return <Centre>Chargement du suivi…</Centre>;
    if (coach.statut === "erreur") return <Centre>Lien de suivi invalide ou incomplet.</Centre>;
    return (
      <main className="min-h-full">
        <CoachDashboard sauvegarde={coach.data} />
      </main>
    );
  }

  if (!reglages.dateDebut) {
    return (
      <main className="min-h-full">
        <Onboarding />
      </main>
    );
  }

  function ouvrirSemaine(n: number) {
    setSemaineOuverte(n);
    setEcran("semaines");
  }

  return (
    <div className="flex min-h-full flex-col">
      <main
        className="mx-auto w-full max-w-app flex-1 px-5"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        {ecran === "accueil" && (
          <Accueil onOuvrirSemaine={ouvrirSemaine} onAllerReglages={() => setEcran("reglages")} />
        )}
        {ecran === "aujourdhui" && <Aujourdhui />}
        {ecran === "semaines" && <Semaines semaineInitiale={semaineOuverte} />}
        {ecran === "sommeil" && <Sommeil />}
        {ecran === "reglages" && <Reglages />}
      </main>
      <BottomNav
        actif={ecran}
        onChange={(e) => {
          if (e !== "semaines") setSemaineOuverte(undefined);
          setEcran(e);
        }}
      />
    </div>
  );
}
