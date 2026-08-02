import { dateCourse, joursAvantCourse } from "../lib/calendar";
import { formatDateComplet } from "../lib/format";

export default function Countdown({ dateDebut }: { dateDebut: string }) {
  const j = joursAvantCourse(dateDebut);
  const date = formatDateComplet(dateCourse(dateDebut));

  let valeur: string;
  let libelle: string;
  if (j > 1) {
    valeur = `${j}`;
    libelle = "jours avant la course";
  } else if (j === 1) {
    valeur = "1";
    libelle = "jour avant la course";
  } else if (j === 0) {
    valeur = "Aujourd'hui";
    libelle = "c'est le jour J";
  } else {
    valeur = "Terminé";
    libelle = "course courue";
  }

  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div className="font-display text-2xl leading-none text-encre">
          {j > 0 ? <span className="tnum">{valeur}</span> : valeur}
        </div>
        <div className="mt-1 text-sm text-sourdine">{libelle}</div>
      </div>
      <div className="text-right text-xs text-sourdine">
        <div className="uppercase tracking-[0.14em]">Jour de course</div>
        <div className="tnum mt-0.5">{date}</div>
      </div>
    </div>
  );
}
