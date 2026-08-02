# Suivi — carnet d'entraînement

Application mobile (PWA) pour suivre **un** plan d'entraînement de course à
pied. Un carnet, rien de plus — la séance du jour, la saisie après-coup, la
progression. Le plan actuellement embarqué : **10 km, 9 semaines** (objectif
terminer en moins de 60 min).

Le plan peut être remplacé : il suffit de fournir un nouveau `programme.json`.
L'app s'adapte à la durée (nombre de semaines) et au mode de périodisation —
par **volume** (km/semaine) ou par **charge d'intensité** (`charge_pct`).

Soigné, calme, lisible. Fonctionne **100 % hors-ligne**, aucune donnée ne quitte
le téléphone.

## Ce que fait l'app

- **Accueil « Où j'en suis »** — la *vague de charge* (12 semaines : hauteur =
  volume, couleur = intensité), l'assiduité, les kilomètres cumulés vs prévus,
  la courbe du ressenti et celle de l'allure d'endurance, un compte à rebours.
- **Aujourd'hui** — la consigne du jour, sa zone et son allure cible (calculée
  depuis la VMA), une seule action pour saisir. Les jours de repos ne demandent
  rien.
- **Semaines** — les 12 semaines dépliables sur leurs 7 jours, état de chaque
  séance.
- **Réglages** — date de début, VMA (modifiable : toutes les allures se
  recalculent), zones, points d'attention, et **export / import JSON**.

## Données

- `public/programme.json` — le plan, importé statiquement, **jamais modifié**.
- `localStorage` — deux clés séparées : `suivi-semi:reglages` et
  `suivi-semi:journal`. Corriger le programme ne touche jamais au journal, et
  inversement.

Filet de sécurité : export JSON daté depuis Réglages, import avec confirmation
avant tout écrasement, rappel discret toutes les 2 semaines.

## Stack

React + Vite + TypeScript · Tailwind CSS · vite-plugin-pwa · Recharts (courbes)
· polices serif auto-hébergées (Playfair Display pour les titres, Spectral pour
le texte et les données).

## Développement

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production (+ service worker PWA)
npm run preview    # prévisualiser le build
npm test           # tests unitaires (calculs)
```

Astuce : ouvrir avec `?demo` charge un carnet de démonstration (semaines 1 à 6
remplies) sans rien écrire dans le navigateur.

## Installation sur le téléphone

Ouvrir l'URL du build dans le navigateur mobile, puis « Ajouter à l'écran
d'accueil ». L'app s'installe et fonctionne ensuite hors-ligne.
