---
name: Cartes interactives
description: Le carnet d'explorateur de Thomas, en version améliorée. Une carte ancienne ouvre et ferme chaque page, la carte du monde pixelisée sert de papier, et l'on joue sur un atlas d'école en couleurs.
colors:
  navy: "#123b7a"
  navy-deep: "#0b2a5a"
  navy-soft: "#e2e9f4"
  gold: "#e7b552"
  gold-deep: "#c8912b"
  gold-ink: "#7d5408"
  gold-soft: "#fbedc8"
  cream: "#f7f2e8"
  paper: "#fffdf8"
  paper-2: "#f6efe0"
  paper-3: "#ece2cc"
  ink: "#1a2233"
  ink-2: "#3c4458"
  ink-3: "#635c4c"
  line: "#e4dccb"
  line-strong: "#cdbd99"
  sea: "#a9d4ea"
  sea-deep: "#7fb3d0"
  sea-ink: "#1d5584"
  context: "#e6d9bc"
  context-line: "#cdb88c"
  context-ink: "#7a5a35"
  mute: "#fffaee"
  mute-line: "#a98e60"
  tint-0: "#f3d27f"
  tint-1: "#f2a98d"
  tint-2: "#a9d38f"
  tint-3: "#c6b3e3"
  tint-4: "#ecb6d1"
  selection: "#ffd451"
  hit: "#2a9364"
  hit-ink: "#1c6e49"
  hit-soft: "#d5f0e1"
  retry: "#e39a1c"
  retry-soft: "#fdedc9"
  miss: "#d6453a"
  miss-ink: "#b3342a"
  miss-soft: "#fadbd5"
typography:
  script:
    fontFamily: "Parisienne, Brush Script MT, cursive"
    fontSize: "clamp(3.2rem, 1.9rem + 5.4vw, 6.4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.01em"
  display:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "clamp(2.6rem, 1.6rem + 3.6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
    fontVariation: "'SOFT' 100, 'WONK' 0"
  headline:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "clamp(2rem, 1.4rem + 2vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.12
    fontVariation: "'SOFT' 100, 'WONK' 0"
  title:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "1.375rem"
    fontWeight: 750
    lineHeight: 1.15
    fontVariation: "'SOFT' 100, 'WONK' 0"
  quiz-target:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "clamp(1.6rem, 1.15rem + 1.5vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'SOFT' 100"
  body:
    fontFamily: "Manrope, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, Arial, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.3
  map-name:
    fontFamily: "Manrope, Arial, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 750
    lineHeight: 1.1
  map-water:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "14px"
    fontWeight: 560
    letterSpacing: "0.04em"
  map-country:
    fontFamily: "Fraunces, Times New Roman, serif"
    fontSize: "12.5px"
    fontWeight: 650
    letterSpacing: "0.2em"
rounded:
  sm: "8px"
  md: "12px"
  control: "14px"
  lg: "18px"
  xl: "24px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
    textColor: "#ffffff"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.gold-soft}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  segmented-active:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "40px"
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  map-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
  notebook-panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    width: "372px"
  quiz-hud:
    backgroundColor: "{colors.paper}"
    typography: "{typography.quiz-target}"
    rounded: "{rounded.lg}"
  quiz-counter:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "54px"
  map-pin:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
---

# Design System: Cartes interactives

## Overview

**Creative North Star: "Le carnet d'explorateur"**

Le monde est celui de la première version de Thomas, repris et amélioré à sa demande : une carte ancienne sur parchemin
(deux hémisphères, gravure dorée) ouvre et ferme chaque page, la carte du monde pixelisée sert de papier sous le contenu,
et les titres s'écrivent à la plume (Parisienne) en blanc sur la gravure. Tout ce qui est jeu se passe sur un atlas
d'école : régions en couleurs pastel bordées de blanc pour explorer, carte muette couleur parchemin pour le quiz, mer
bleu clair traversée de méridiens.

Le ton est ludique et chaleureux, pour des élèves de 9 à 15 ans, sans tomber dans l'enfantin : encre bleu marine pour
l'action, laiton doré pour les liserés, les étoiles et les accents, gravures anciennes (rose des vents, monstres marins)
en timbres-poste. La carte reste lisible avant tout : les couleurs de correction (vert, pointillé ambre, hachure
vermillon) sont réservées à la correction. Ce que le monde refuse : la vitrine sobre en blanc et gris, la carte
encadrée, la modale qui voile la carte corrigée, les émojis en guise d'icônes.

**Key Characteristics:**
- Bandeau « carte ancienne » sous le voile ardoise de la v1 (en multiplication, le sépia reste miel), liseré doré ou bord
  déchiré, titre en écriture.
- Papier crème posé sur la carte du monde pixelisée de la v1.
- Atlas politique pastel (cinq teintes, jamais deux voisines pareilles) et carte muette pour le quiz.
- Encre bleu marine, laiton doré, coins arrondis et généreux.
- Récompenses claires : coche, série « 3 d'affilée », trois étoiles, record.

## Colors

La palette de la v1 (bleu marine, doré, crème) étendue à un atlas d'école : mer bleu clair, parchemin, cinq pastels.

### Primary
- **Encre bleu marine** (`navy`) : boutons principaux, compteur du quiz, épingles, onglet actif, sélection (trait),
  badge des départements. Version profonde (`navy-deep`) au survol et pour les traits de sélection.

### Secondary
- **Laiton doré** (`gold`) : liserés des bandeaux et des calques, essais restants, étoiles, ruban « Nouveau », bouton
  « Nouveau : la France ». En texte, toujours la version encre (`gold-ink`) pour le contraste ; fond doux `gold-soft`
  pour les survols et le record.

### Tertiary
- **Atlas pastel** (`tint-0` à `tint-4`) : jaune, corail, vert tendre, lilas, rose. Une teinte par région en
  exploration, attribuée au générateur pour que deux voisines ne se ressemblent jamais.
- **Jaune soleil** (`selection`) : la région choisie, avec un trait d'encre de 3 px.

### Neutral
- **Bleu mer** (`sea`) : toute l'eau et le fond de l'écran de carte ; noms d'eau en `sea-ink`, rives en `sea-deep`.
- **Parchemin** (`mute`) : la carte muette du quiz, traits sépia `mute-line`.
- **Sable** (`context`) : les pays hors jeu, traits `context-line`, noms en `context-ink`.
- **Papier** (`cream` pour la page, `paper` pour les calques, `paper-2` et `paper-3` pour les cases et les pistes). Le
  fond de la page d'accueil et le papier du carnet des cartes sont la carte du monde pixelisée de la v1.
- **Encres** (`ink`, `ink-2`, `ink-3`) et **filets** (`line`, `line-strong`).

### Named Rules
**La règle de la correction seule.** Vert, ambre et vermillon ne servent qu'à corriger ; aucun bouton ni décor ne les
emprunte.

**La règle du motif.** Un état de correction n'est jamais porté par la couleur seule : aplat, pointillé ou hachure, et un
pictogramme ou un mot dans le bandeau.

**La règle de la carte muette.** En quiz, les régions perdent leurs couleurs : seul ce que l'élève a joué se colore.

## Typography

**Display Font:** Fraunces, axe SOFT à 100 (repli : Times New Roman ajusté aux mêmes mesures)
**Body Font:** Manrope (repli : Arial ajusté)
**Script Font:** Parisienne, pour le nom du site, sa devise et le titre de chaque carte sur la bande

**Character:** le trio de la v1 : une écriture à la plume pour la signature, un serif arrondi et gourmand pour les
titres et les noms à trouver, un sans-serif net pour tout ce qui se lit et se clique.

### Hierarchy
- **Script** (400, clamp 3,2 à 6,4 rem) : « Cartes interactives » sur la carte ancienne ; devise en doré ; titre de la
  carte (2,1 rem) dans la bande.
- **Display** (800, clamp 2,6 à 4,5 rem) : « Bienvenue à bord ! ».
- **Headline** (800, clamp 2 à 2,75 rem) : titres de section (soulignés d'une barre marine vers dorée), nom de la région
  dans la fiche.
- **Title** (750, 1,375 rem) : titres des cartes du catalogue, des étapes, des sous-parties.
- **Quiz target** (800, clamp 1,6 à 2,4 rem) : la région à trouver ; plus grande en plein écran.
- **Body** (500, 1 rem, 1,55) : textes et fiches.
- **Label** (700, 0,875 rem) : intitulés, puces, métadonnées.
- **Écritures de carte** : régions en Manrope 750 avec halo blanc ; mers et lacs en Fraunces italique bleu ; pays voisins
  en Fraunces capitales espacées, sépia.

### Named Rules
**La règle de la plume.** Parisienne ne sert qu'aux titres de signature, en grand et en blanc sur la gravure ; jamais
pour un texte à lire ni pour une consigne.

## Layout

L'accueil suit la v1 : bandeau carte ancienne plein large (hauteur fixe, au plus 46 % de l'écran, bord déchiré en bas),
puis sur le papier : « Bienvenue à bord ! » et ses deux boutons à gauche, toujours au-dessus de la ligne de flottaison,
et la planche jouable à droite qui chevauche le bord déchiré ; les cartes disponibles en quatre colonnes (deux sous
1080 px, une sous 680 px) ; les trois timbres « Explore, Découvre, Relève le défi » reliés par une route en pointillé
doré ; « Pensé pour la classe » sur une page de carnet lignée (marge rouge, ruban doré, monstre marin de Münster en bas
de page) ; le pied de page sur la carte ancienne.

L'écran de carte est plein cadre sous une bande de 66 px (58 px sous 900 px). Le fond dessiné couvre toujours toute la
scène ; la caméra cadre le pays dans la zone libre (hors carnet, bandeau, échelle et, sur téléphone, commandes de zoom).
Bureau : carnet de 372 px à droite, zoom en bas à droite, rose des vents en haut à gauche, échelle en bas à gauche,
mini-carte au-dessus d'elle. Téléphones et tablettes en portrait : carnet collé en bas (46 % au plus, repliable),
bandeau de quiz sur deux rangs sous 560 px pour que le nom tienne en entier.

## Elevation & Depth

Les calques papier flottent sur la carte et sur le papier avec une ombre chaude et douce ; les bandeaux et les commandes
portent un liseré doré. Les cartes du catalogue se soulèvent de 4 px au survol.

### Shadow Vocabulary
- **Calque** (`box-shadow: 0 2px 4px rgba(26, 34, 51, 0.06), 0 10px 26px -8px rgba(26, 34, 51, 0.24)`) : cartes du
  catalogue, cases de « Pensé pour la classe », commandes de zoom, épingles.
- **Calque levé** (`box-shadow: 0 4px 8px rgba(26, 34, 51, 0.08), 0 22px 44px -14px rgba(26, 34, 51, 0.34)`) : carnet,
  bandeau de quiz, planche jouable, carte survolée.
- **Liseré doré** (`box-shadow: 0 0 0 2px #e7b552`) combiné à l'une des ombres : boutons ronds de la bande, commandes,
  bandeau de quiz, mini-carte.

### Named Rules
**La règle du papier posé.** Un calque est du papier : coins de 18 px, une ombre ; le liseré doré marque ce qui se
manipule. Le carnet des cartes est fait de la carte pixelisée de la v1, les cases de faits et de chiffres sont du papier
presque opaque posé dessus.

## Shapes

Coins généreux et amicaux : 8 px (petites cases), 12 px (cases de faits, éléments de liste), 14 px (boutons, champs,
compteur), 18 px (calques et cartes), 24 px (planche jouable, carnet du téléphone), pilule pour les puces, l'onglet
Explorer/Quiz et les épingles. Les timbres ont des dents découpées ; la bande d'en-tête et le pied de page ont le bord
déchiré du parchemin de la v1 ; les drapeaux sont collés comme des autocollants, bord blanc et légère rotation.

## Components

### Buttons
- **Shape:** coins de 14 px, 46 px de haut (54 px en grand).
- **Primary:** encre bleu marine, texte blanc, léger reflet en haut ; se soulève d'un pixel au survol.
- **Gold:** laiton doré, texte encre : pour une nouveauté (« Nouveau : la France »).
- **Secondary:** papier, texte marine, filet sable ; au survol fond doré pâle et filet doré.
- **Focus:** anneau papier puis doré (2 px + 3 px).

### Chips
- **Style:** pilule papier, filet sable, texte marine ; au survol fond doré pâle.
- **State:** voisins dans la fiche, erreurs à revoir dans le bilan (avec leur motif de correction) ; voisins hors carte
  en pointillé.

### Cards / Containers
- **Corner Style:** 18 px.
- **Background:** papier ; zone image en mer bleu clair avec la vignette pastel de la carte et son drapeau autocollant.
- **Shadow Strategy:** calque, levé au survol.
- **Internal Padding:** 20 px.

### Inputs / Fields
- **Style:** recherche de 48 px, filet sable de 2 px, coins de 14 px, loupe marine ; posée sur la carte pixelisée dans
  l'en-tête du carnet.
- **Focus:** filet marine et halo doré.

### Navigation
- **Accueil:** liens blancs sur la carte ancienne, boussole de Bowen comme logo.
- **Cartes:** bouton rond « accueil » papier à liseré doré, titre en écriture, onglet Explorer/Quiz en pilule papier,
  son et plein écran en boutons ronds. Sous 900 px, le libellé du bouton accueil et le compte disparaissent.

### Bandeau de quiz (signature)
Calque papier à liseré doré centré en haut : compteur marine (« 3/10 »), question sur une ligne (« Trouve : Pays-Bas »,
nom en Fraunces), trois essais dorés, score avec « 3 d'affilée » en vert dessous, temps, « Je ne sais pas » et
« Arrêter ». Bonne réponse : ligne verte, coche, liseré vert et petit rebond. Réponse montrée : ligne vermillon,
pictogramme de repère et bouton « Suivant ». Sous 560 px, deux rangs.

### Bilan (signature)
Dans le carnet, à la place de la fiche : la rose des vents de Bowen en sceau cerclé d'or, trois étoiles qui s'allument
une à une (3 sans faute, 2 dès 80 %, 1 dès 50 %), titre (« Sans faute, bravo ! », « Bien joué ! », « Expédition
réussie », « Continue l'exploration »), score en Fraunces, trois cases qui se lisent comme une phrase (« 80 % du 1er
coup », « 0:08 au chrono », « 5 d'affilée »), la légende de la carte corrigée avec ses nombres, les erreurs en puces qui
volent vers leur région. La carte reste nette et se cadre sur les corrections.

### Timbres (signature de l'accueil)
Gravures du domaine public (rose des vents de Bowen, monstre marin de Münster, serpent de mer d'Olaus Magnus) en timbres
à dents découpées, légèrement tournés, reliés par une route en pointillé doré ; ils se redressent au survol.

## Do's and Don'ts

### Do:
- **Do** ouvrir et fermer chaque page sur la carte ancienne de la v1 (`assets/img/carte-ancienne*.webp`) sous son voile
  bleu marine, avec le liseré doré ou le bord déchiré.
- **Do** poser le contenu sur la carte du monde pixelisée (`assets/img/fond-carte-pixel.webp`) : fond de l'accueil,
  papier du carnet des cartes.
- **Do** colorer les régions en pastel pour explorer et passer en carte muette pour le quiz.
- **Do** écrire la question sur une ligne et le nom à trouver en Fraunces.
- **Do** récompenser par la coche, la série, les étoiles et le record, jamais par du texte seul.

### Don't:
- **Don't** revenir à une vitrine sobre en blanc et gris, ni à une grille de cartes icône-titre-texte : c'est le « trop
  corporate » que Thomas a refusé.
- **Don't** assombrir la carte ancienne d'un voile bleu marine : elle doit rester miel, comme dans la v1.
- **Don't** encadrer la carte ni la voiler d'une modale pour annoncer un résultat.
- **Don't** utiliser l'écriture Parisienne pour une consigne, une étiquette ou un texte à lire.
- **Don't** utiliser le vert, l'ambre ou le vermillon ailleurs que dans la correction.
- **Don't** mettre d'émoji ni de pictogramme de police : les icônes sont les SVG de `assets/js/icons.js`, les images
  sont des gravures réelles ou les images de la v1.
