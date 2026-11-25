# Cartes interactives

Cartes de géographie à explorer puis à retrouver : pays d'Europe, cantons suisses et départements français. On
navigue dans la carte (zoom, déplacement, région par région), on ouvre la fiche de chaque région, puis on se teste avec
un quiz corrigé sur la carte. L'univers est celui d'un carnet d'explorateur : carte ancienne en tête et en pied de page,
carte du monde pixelisée en fond, atlas d'école en couleurs, timbres de gravures anciennes.

En ligne : https://cartes-interactives.lecagibi.ch/

## Ce qu'on y fait

- **Explorer** : la carte remplit tout l'écran, mer et pays voisins compris, sans bord visible ; atlas politique en
  couleurs pastel (deux régions voisines n'ont jamais la même teinte), méridiens et parallèles, rose des vents ; zoom à la molette,
  au pincement ou aux boutons ; glisser avec inertie ; double-clic pour zoomer ; noms qui apparaissent selon la place
  disponible (numéros de départements, codes des cantons) ; échelle graphique en km ; mini-carte dès qu'on zoome ;
  plein écran pour le TBI.
- **Fiches** : capitale ou chef-lieu, population, superficie, langues, monnaie ou entrée dans la Confédération,
  région, et voisins cliquables pour passer d'une région à l'autre.
- **Quiz** : trois types de questions par carte (noms, capitales ou chefs-lieux ou préfectures, drapeaux ou numéros),
  10, 20 ou toutes les questions, trois essais par question, sur une carte muette. Après le troisième, la carte montre
  la bonne réponse. À la fin, le bilan s'ouvre à la place de la fiche, comme la légende de la carte corrigée : jusqu'à
  trois étoiles, score, record, nombre de régions par type de correction, erreurs à revoir sur la carte, puis révision
  des seules erreurs. Le meilleur résultat de chaque carte s'affiche en étoiles sur l'accueil.
- **Accessibilité** : clavier (recherche, flèches pour se déplacer, Entrée pour parcourir les régions), correction
  jamais portée par la couleur seule (motifs hachuré et pointillé), `prefers-reduced-motion` respecté.

## Lancer en local

Site statique, sans build ni dépendance côté navigateur :

```sh
python3 -m http.server 8790
# puis ouvrir http://127.0.0.1:8790/
```

Ouvrir `index.html` directement dans le navigateur fonctionne aussi : les scripts ne sont pas des modules et les cartes
sont intégrées aux pages.

## Organisation

```
index.html                 accueil (planche jouable, cartes, fonctionnement)
maps/<carte>/index.html    page de la carte : SVG intégré entre <!-- carte:debut --> et <!-- carte:fin -->
maps/<carte>/data.js       données de la carte (fiches, questions, sources) : window.ATLAS_MAP
maps/<carte>/drapeaux/     drapeaux (Europe : flag-icons, licence MIT ; Suisse : armoiries cantonales)
assets/css/                base.css (jetons, composants), map.css (écran de carte), home.css (accueil)
assets/js/atlas-map.js     moteur de carte : caméra, gestes, écritures, repères, mini-carte
assets/js/atlas-game.js    modes Explorer et Quiz, communs à toutes les cartes
assets/fonts/              IM Fell DW Pica, IM Fell English SC et Manrope (SIL OFL, voir OFL.txt)
assets/img/                carte ancienne et carte pixelisée de la v1, gravures du domaine public, vignettes des cartes
                           (chaque image porte son origine dans un fichier .json voisin)
tools/cartes/              génération des fonds de carte à partir de données ouvertes
```

## Fonds de carte

Les SVG sont générés par `tools/cartes/build.mjs` (mapshaper) puis injectés dans les pages :

```sh
cd tools/cartes
npm install
npm run sources   # télécharge Natural Earth et les départements IGN dans .sources/
npm run build     # ou : node build.mjs europe
```

| Carte | Projection | Sources |
|---|---|---|
| Europe | Lambert azimutale équivalente (centre 52° N, 10° E) | Natural Earth 1:10m, vue officielle de la France |
| Suisse | MN95 (EPSG:2056) | OFS et swisstopo, limites généralisées 2026 (paquet `swiss-maps`) ; Natural Earth pour les voisins |
| France | Lambert-93 (EPSG:2154) | IGN Admin Express COG (via `france-geojson`, Licence Ouverte) ; Natural Earth pour les voisins |

Chaque fond dépasse largement le pays (jusqu'à l'Arctique et l'Afrique pour l'Europe) pour remplir tous les écrans,
du téléphone au TBI ; le pays de départ et son cadrage sont inscrits dans le SVG (`data-home`, `data-km`). Le contexte
garde tout son détail près du pays et s'allège au loin, et les tracés sont écrits en coordonnées relatives : les pages
pèsent de 90 à 160 Ko.

Le moteur ne dépend pas d'une carte précise : une nouvelle carte (le monde, par exemple) demande un fond généré par
`build.mjs`, un `data.js` et une page copiée sur les autres.

## Tests

Tests de bout en bout dans le Google Chrome installé (aucun navigateur à télécharger) :

```sh
cd tools/tests
npm install
npm test
```

Ils vérifient l'accueil et sa planche jouable, la cohérence des trois cartes (régions, fiches, drapeaux), le plein
cadre sur six tailles d'écran (fond sans bord, pays entier, échelle), l'exploration (fiche, voisins, recherche), la
navigation (boutons, molette, recadrage, mini-carte), une partie de quiz complète avec correction et bilan dans le
panneau, la révision des erreurs, l'enregistrement du record, le clavier et l'affichage téléphone.

## Données

- Europe : Banque mondiale (population 2024), Eurostat et offices statistiques nationaux (superficie), Journal officiel
  (noms et capitales).
- Suisse : Office fédéral de la statistique (population au 31.12.2025, superficie, limites 2026 avec Moutier dans le
  Jura).
- France : Insee, Code officiel géographique et populations de référence 2023 (en vigueur au 1er janvier 2026), via
  geo.api.gouv.fr.

Chaque fichier `data.js` rappelle ses sources en tête et dans la fiche affichée.

## Crédits

- Images de la v1 (carte ancienne sur parchemin, carte du monde pixelisée) : Thomas Wünsche.
- Gravures du domaine public, via Wikimedia Commons : rose des vents d'Emanuel Bowen (1748), monstre marin de Sebastian
  Münster (*Cosmographia*), le navire *Victoria* de Magellan sur la carte *Maris Pacifici* d'Abraham Ortelius (1589).
- Polices : IM Fell DW Pica et IM Fell English SC (caractères de Peter de Walpergen et John Fell, XVIIe siècle,
  numérisés par Igino Marini) et Manrope, sous SIL Open Font License.
- Drapeaux des pays : [flag-icons](https://github.com/lipis/flag-icons) (MIT).

Conçu et propulsé par [Le Cagibi](https://www.lecagibi.ch). Usage pédagogique autorisé.
