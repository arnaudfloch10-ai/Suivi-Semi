import { useState } from "react";
import { useApp } from "./store/useApp";
import Onboarding from "./screens/Onboarding";
import Accueil from "./screens/Accueil";
import Aujourdhui from "./screens/Aujourdhui";
import Semaines from "./screens/Semaines";
import Reglages from "./screens/Reglages";
import BottomNav from "./components/BottomNav";

export type Ecran = "accueil" | "aujourdhui" | "semaines" | "reglages";

export default function App() {
  const { reglages } = useApp();
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [semaineOuverte, setSemaineOuverte] = useState<number | undefined>(undefined);

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
