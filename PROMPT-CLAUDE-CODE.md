# Brief pour Claude Code — App de suivi « Semi-marathon 12 semaines »

## 1. Contexte

Je suis Arnaud. Mon frère m'a construit un plan d'entraînement de 12 semaines
pour préparer un semi-marathon (objectif : **terminer**, pas de chrono).
Ce plan existe aujourd'hui dans un Excel que je n'ouvre jamais. Je veux une
application mobile qui me serve de **carnet d'entraînement** : la séance du
jour, la saisie après-coup, et une vue de ma progression.

Contrainte forte : le rendu doit être **soigné, calme et lisible**. Si l'app
est moche ou confuse, je ne l'utiliserai pas. La qualité visuelle compte
autant que la fonctionnalité.

## 2. Périmètre

Cette app fait **une seule chose** : suivre ce plan-là. Elle ne fait pas :
pas de GPS, pas de chronomètre, pas de compte utilisateur, pas de backend,
pas de réseau social, pas de synchro cloud, pas d'autres plans
d'entraînement. Toute fonctionnalité non demandée ici est hors périmètre —
ne l'ajoute pas « au cas où ».

## 3. Stack

- **React + Vite + TypeScript**
- **Tailwind CSS**
- **PWA installable** (`vite-plugin-pwa`) : manifest, icônes, service worker,
  `display: standalone`, fonctionnement 100 % hors-ligne
- **Aucun backend.** Persistance en `localStorage` (le volume de données est
  minuscule : ~53 séances à saisir)
- Recharts (ou SVG à la main) pour les graphes
- Interface **entièrement en français**

## 4. Données

### 4.1 Le programme (lecture seule)

Le fichier `programme.json` est fourni. Il est importé statiquement et **n'est
jamais modifié par l'app**. Structure :

```
meta         : titre, athlete, vma_kmh (14), objectif, duree_semaines, date_debut
zones[]      : zone (1-5), pct_vma, allure, usage
points_attention[] : rappels de mon frère (chevilles, FC, sommeil…)
semaines[]   : numero, mesocycle, periode, intensite ("+" à "++++"), volume_km
  └ seances[] : id, jour, jour_index (1=lundi), type, consigne,
                duree_min, distance_km, a_saisir
```

`type` ∈ `repos` | `ef` | `fractionne` | `sortie_longue` | `renfo` | `test` |
`recup_active` | `course`.
`a_saisir: false` sur les jours de repos → aucun formulaire, aucune relance.

`meta.date_debut` est à `null` : au premier lancement, l'app me demande la
**date du lundi de la semaine 1** et la stocke. Tout le calendrier en découle.

### 4.2 Le journal (écriture)

Séparé du programme, jamais mélangé avec lui. Une entrée par séance réalisée :

```ts
type Entree = {
  seanceId: string;        // "S3-J7"
  date: string;            // ISO, date réelle de réalisation
  statut: "faite" | "adaptee" | "manquee";
  ressenti: 1 | 2 | 3 | 4 | 5;   // 1 = très dur, 5 = très facile
  duree_min?: number;
  distance_km?: number;
  allure?: string;         // "5:42" — saisie mm:ss, calculée auto si durée+distance
  fc_moyenne?: number;     // optionnel
  commentaire?: string;
};
```

Règle : **le programme peut être corrigé sans perdre le journal, et
inversement.** Deux clés `localStorage` distinctes.

## 5. Écrans

### Accueil — « Où j'en suis »
C'est l'écran d'ouverture et le plus important. Il contient :
- La **vague de charge** (voir §6, élément signature)
- Séances réalisées / prévues à ce stade du plan, et taux d'assiduité
- Kilomètres cumulés vs kilomètres prévus
- Courbe du ressenti moyen par semaine (est-ce que ça devient plus facile ?)
- Courbe de l'allure moyenne en endurance fondamentale dans le temps
- Un compte à rebours discret jusqu'au jour de la course

### Aujourd'hui
La consigne du jour en grand, sa zone d'allure et l'allure cible
correspondante calculée depuis la VMA. Un bouton unique pour saisir. Si c'est
un jour de repos : le dire clairement et ne rien demander d'autre.

### Semaines
Les 12 semaines, chacune dépliable sur ses 7 jours. Mésocycle, période,
volume et intensité visibles en tête de semaine. Une séance passée montre son
état ; une séance future montre sa consigne.

### Réglages
Date de début, VMA (modifiable — le test de la semaine 8 peut la faire
bouger, et toutes les allures cibles doivent alors se recalculer), les zones,
les points d'attention de mon frère, et **export / import JSON**.

## 6. Direction artistique

**Le système de couleurs, c'est le système de zones.** Le plan a 5 zones
d'intensité réelles : elles deviennent la palette. Pas d'accent décoratif
posé par-dessus — la couleur d'un élément dit toujours quelque chose de vrai
sur son intensité.

```
Fond        #F1F3F2   papier froid, très légèrement vert-gris
Encre       #16201C   texte principal
Sourdine    #6B7A74   labels, méta
Zone 1      #7C93A3   bleu-gris, récupération
Zone 2      #2F6E52   vert profond, la base du plan
Zone 3      #8A7A2E   ocre
Zone 4      #B4552B   brique
Zone 5      #8C2C21   rouge sombre, rare
Repos       #DDE2E0   surface neutre, aucune saturation
```

Typographie — trois rôles distincts :
- **Display** : Bricolage Grotesque (titres, numéros de semaine, gros chiffres)
- **Texte** : Inter Tight
- **Données** : IBM Plex Mono — toutes les allures, durées, distances, FC.
  Les chiffres sont des données, ils doivent se lire comme telles et
  s'aligner en colonne.

**Élément signature — la vague de charge.** Le plan est littéralement une
vague : intensité `+ ++ +++ + ++ +++ ++++ + +++ ++ + course`, avec des
semaines de régénération en creux (S4, S8). L'accueil s'ouvre sur cette
vague : 12 colonnes, hauteur = volume hebdo, couleur = zone dominante de la
semaine. Les semaines passées sont pleines, la semaine en cours est marquée
d'un trait, les futures sont en contour. On tape une colonne, on ouvre la
semaine. C'est le seul endroit où l'app se permet d'être spectaculaire.

Partout ailleurs : sobriété, blancs généreux, hiérarchie nette, pas de
gradients, pas d'ombres portées, pas de cartes arrondies génériques
empilées, pas d'emoji. Une seule action primaire par écran.

Motion : discrète. Un remplissage de la vague au chargement, une transition
douce à l'ouverture d'une semaine. Respecter `prefers-reduced-motion`.

## 7. Filet de sécurité

Les données vivent uniquement sur mon téléphone, donc :
- **Export JSON** en un bouton depuis Réglages (fichier daté)
- **Import JSON** qui restaure tout
- Un rappel discret à me proposer un export toutes les 2 semaines
- Ne jamais écraser le journal sans confirmation explicite

## 8. Qualité attendue

Mobile-first (cible : iPhone, écran ~390 px). Zones tactiles ≥ 44 px.
Focus clavier visible. États vides rédigés comme une invitation à agir, pas
comme une erreur. Textes en français, voix active, phrases courtes.

## 9. Méthode

1. Lis `programme.json` avant de coder, et vérifie que tu comprends bien le
   modèle de données.
2. Écris ton plan de design (tokens, layout, wireframes ASCII) et montre-le
   moi **avant** d'écrire du code.
3. Construis d'abord l'accueil et la vague de charge avec des données de
   journal fictives, pour qu'on valide le rendu.
4. Puis les autres écrans, puis la persistance, puis la PWA.
5. Pas de bibliothèque supplémentaire sans me demander.
