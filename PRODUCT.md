# Product

<!-- impeccable:product-schema 1 -->

> Rédigé le 2026-11-24 sans entretien : session autonome (goal), l'outil de questions est refusé. Les faits marqués
> *(déduit)* viennent de la demande de Thomas du 2026-11-24, de la fiche NewBrain « Cartes interactives » et du code ;
> Thomas peut les corriger.

## Platform

web

## Users

- **Élèves de 9 à 15 ans** (primaire et secondaire, Suisse romande et France) qui révisent la géographie : en classe
  sur le TBI projeté, ou seuls sur ordinateur, tablette ou téléphone. *(fiche NewBrain)*
- **Enseignants** qui projettent la carte au TBI, la montrent avec ou sans les noms, puis lancent un quiz pour la
  classe. *(fiche NewBrain)*
- **Clients potentiels de Thomas** (écoles, éditeurs, porteurs de projets éducatifs) qui découvrent l'application dans
  son portfolio pour juger ce qu'il sait produire. *(demande du 2026-11-24)*

## Product Purpose

Remplacer la liste de pays ou de cantons à mémoriser par une carte qui se joue : on explore un territoire (nom, chef-lieu,
drapeau, chiffres clés), puis on se teste en retrouvant chaque région sur la carte, avec une correction immédiate qui
montre où était la bonne réponse. Réussir, c'est situer sans hésiter les pays d'Europe, les cantons suisses et les
départements français.

## Positioning

Une même mécanique de jeu pour toutes les cartes : navigation fluide dans la carte (zoom, déplacement, recentrage),
mode exploration, quiz chronométré avec correction sur la carte et reprise des erreurs. Gratuit, sans compte, sans
publicité, conçu par un enseignant pour la classe et le TBI.

## Operating Context

- Projection au TBI dans une salle éclairée : grands caractères, contrastes forts, cibles larges, plein écran utile.
- Usage individuel sur Chromebook, iPad ou téléphone : tactile, pincement pour zoomer, une main.
- Démonstration à un client sur ordinateur portable : la première impression doit être professionnelle.

## Capabilities and Constraints

- Site statique HTML, CSS et JavaScript sans build ni dépendance, servi tel quel par Caddy (`file_server`) depuis un
  clone git sur le VPS : une mise en ligne est un `git pull`.
- Cartes en SVG (chemins identifiés par code) ; une carte = un dossier dans `maps/`.
- Cartes : Europe (pays), Suisse (26 cantons), France (96 départements de métropole). Carte du monde : plus tard
  *(demande du 2026-11-24)* ; le moteur de navigation doit déjà la supporter.
- Données en français, langue unique de l'interface.
- Les scores restent dans le navigateur (`localStorage`) ; aucune donnée personnelle n'est collectée.

## Brand Commitments

- Nom : « Cartes interactives », domaine `cartes-interactives.lecagibi.ch`.
- Signature « Conçu et propulsé par Le Cagibi » avec le logo existant (`assets/lecagibi_logo_Cff.png`), et la mention
  « usage pédagogique autorisé ».
- Direction demandée par Thomas le 2026-11-24 : navigation dans la carte comme Seterra (choisir son niveau de zoom, se
  déplacer de région en région), « fluide, smooth, vraiment plus moderne, 2.0, bien épuré, vraiment clair », et
  « beaucoup moins IA » que la version 1.
- Monde visuel confirmé par Thomas le 2026-11-24 au soir : garder **son design d'origine** et en faire une version
  améliorée, « ludifiée pour les enfants, pour apprendre », pas « corporate ». Ses images restent la signature : la carte
  ancienne sur parchemin en tête et en pied de page, la carte du monde pixelisée en fond de page, l'encre bleu marine et
  le doré. D'autres images d'exploration peuvent s'y ajouter (gravures du domaine public).
- Retouche demandée par Thomas le 2026-11-25 : garder cet esprit « explorateur, grandes découvertes » mais « nickel,
  pro, magnifique » : bandeau et pied de page aux bonnes proportions (ils étaient « géants »), tailles et positions
  revues partout, l'écriture cursive remplacée (« pas top »), liberté laissée sur la police ; le serpent vert est retiré.

## Evidence on Hand

- Données réelles : pays d'Europe (`maps/europe`), cantons suisses (`maps/suisse`), 96 départements (`maps/france`),
  avec sources dans chaque `data.js`.
- Images de Thomas (v1, branche `main`) : `assets/banner-world.webp` (carte ancienne sur parchemin déchiré) et
  `assets/bg-body.webp` (carte du monde pixelisée), d'où viennent `assets/img/carte-ancienne*.webp` et
  `assets/img/fond-carte-pixel.webp`.
- Aucun témoignage, chiffre d'usage ou résultat pédagogique mesuré : ne pas en inventer.

## Product Principles

1. La carte est l'interface : tout se fait sur elle, le reste s'efface.
2. Chaque clic reçoit une réponse visible, et chaque erreur montre la bonne réponse sur la carte.
3. Lisible au fond de la classe comme sur un téléphone.
4. Un seul système pour toutes les cartes : ce qu'on apprend sur l'Europe sert en Suisse, en France et demain dans le
   monde.
5. Ludique et chaleureux, dans le monde de l'explorateur, sans jamais gêner la lecture de la carte ni la correction.

## Accessibility & Inclusion

- WCAG 2.2 AA visé : contrastes, focus visible, cibles d'au moins 44 px, `prefers-reduced-motion` respecté.
- Correction jamais portée par la couleur seule (icône, texte, motif hachuré).
- Clavier : recherche des régions, boutons de navigation nommés, zoom et déplacement au clavier quand la carte a le
  focus.
