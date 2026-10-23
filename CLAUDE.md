# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Portfolio animé de l'agence **Prestacomm** (agence marketing digital à Orléans et en Nouvelle-Aquitaine : réseaux sociaux, contenus, sites web), destiné à être partagé par lien (Linktree, envoi direct à des clients et prospects). Le but est commercial : convaincre, puis amener à une **réservation de rendez-vous** (30 min en visio). Les visiteurs arrivent surtout depuis un téléphone, donc **le mobile passe avant le desktop**.

Tout le texte du site est en français, au vouvoiement. Domaine prévu : `prestacomm.com`. Coordonnées affichées : `contact@prestacomm.fr`, 06 79 16 03 53, « Agence Prestacomm » sur Instagram (identifiant exact non fourni : ne pas inventer de lien).

## Structure

- `maquette/` : le site (HTML/CSS/JS statique, aucun build, aucune dépendance npm, aucun test, aucun linter). `maquette/assets/` contient `logo-bordeaux.png` et `logo-cream.png`.
- `contenu/` : dépôt du contenu fourni par l'utilisateur (`logo/`, `video-equipe/`, `equipe/`, `clients/client-01..04/fiche.md`, modèle `fiche-client-modele.md`). Le logo d'origine et sa version détourée y sont déjà. Le reste est à remplir par l'utilisateur.
- Ne pas lire le dossier `~/Desktop/Site prestacomm` : l'utilisateur a refusé l'accès, tout doit venir de ce dossier.

**Contenu réel vs à compléter** : les 4 clients sont réels (La Villa Dunois, Foie gras Quillot, Ixina Agen, Oh My Pop ; descriptions tirées de leurs bios Instagram publiques). « Ce qu'on a fait » liste uniquement les services **confirmés par l'utilisateur** (pastilles `.did` : réseaux sociaux, photos et vidéos, publicité en ligne pour les 4 clients ; site web en plus pour Foie gras Quillot et Oh My Pop). Le **« Résultat » n'est pas renseigné** : il s'affiche en pastille pointillée (`.todo`). Ne jamais inventer de chiffres ou de résultats pour un client réel. Les j'aime et commentaires des cartes `.pub` sont des **chiffres publics** relevés le 16/10/2026 dans les extraits de recherche Instagram (Instagram bloque la lecture automatique des profils), donc potentiellement incomplets ou périmés ; les vues et la portée ne sont visibles que dans les statistiques Instagram des comptes, que seule l'agence possède. Rappel de la date de relevé : texte « chiffres publics au 16/10/2026 » dans chaque `.art__label`. Textes à faire valider par l'utilisateur : promesses de la section Services, étapes de la Méthode, phrase d'accroche, « Disponible pour de nouveaux projets », chiffres de la section « En bref ».

## Lancer et vérifier

Fichiers statiques seulement : pas de build, de test ni de linter. Serveur local **sans cache**, depuis la racine du dépôt :

```bash
python3 -c "
import http.server as h, socketserver as s, os
os.chdir('maquette')
class H(h.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
s.ThreadingTCPServer.allow_reuse_address = True
s.ThreadingTCPServer(('127.0.0.1', 8791), H).serve_forever()"
```

Le lancer avec Bash en arrière-plan, puis ouvrir `http://127.0.0.1:8791/index.html` dans le panneau navigateur (`preview_start` avec `url`). **Ne pas passer par `.claude/launch.json`** : le serveur lancé par l'app n'a pas accès à `~/Desktop` (`PermissionError`) et sert une page blanche. Le port 8765 est parfois déjà pris par un autre processus du poste. Avec un `http.server` classique, le panneau garde CSS et JS en cache : ajouter `?v=N` à l'URL.

Pièges de test dans le panneau navigateur :
- Les animations GSAP et les transitions CSS n'avancent que lorsque la page est rendue (capture, interaction) : une intro ou une couleur de nav « à moitié faite » sur une capture est un artefact. Reprendre une capture un instant après.
- Si `document.visibilityState` vaut `"hidden"`, les captures sont périmées : `tabs_select` sur l'onglet.
- Pour aller à une slide : `const st = ScrollTrigger.getAll().find(s => s.pin && s.pin.classList.contains('cases'))` puis `window.scrollTo(0, st.start + (st.end - st.start) * i / (n - 1))`. Attendre plus d'1 s entre deux sauts (l'aimantation Lenis, 0,8 s, écrase un scroll lancé pendant son animation) et attendre la fin de l'intro (Lenis est gelé, `scrollTo` ne fait rien).

Vérification attendue après un changement visuel : desktop (~1024 px) **et** mobile (375 px), en faisant défiler chaque section, et contrôler qu'il n'y a pas de débordement horizontal (`document.documentElement.scrollWidth` doit valoir `innerWidth`, sinon le viewport mobile s'élargit).

## Architecture (ce qui demande de lire plusieurs fichiers)

`index.html` contient tout le balisage, `css/style.css` tous les styles (palette et polices dans `:root`), `js/main.js` toute l'animation dans une seule IIFE. GSAP 3.12.5, ScrollTrigger et Lenis 1.1.13 sont chargés par CDN avec `defer` ; les polices viennent de Google Fonts.

**Cycle de démarrage (`start()` dans `main.js`)** : attend les polices (1,5 s max), enregistre ScrollTrigger, démarre Lenis (gelé pendant le chargement), puis appelle les `init*()` **dans l'ordre du DOM** (le hero, le bandeau, … jusqu'à la réservation ; `initBlobs`, `initFab`, `initWhere`, `initUI` à la fin). Cet ordre compte : ScrollTrigger calcule les espaces des sections épinglées dans l'ordre de création. Le loader (`runLoader` puis `heroIntro`) libère le scroll à la fin et passe en version express si la page a déjà été vue dans la session. Un filet de sécurité à 7 s masque le loader si l'intro n'a pas fini.

**Modes d'affichage, pilotés par des classes/attributs sur `<html>`** :
- `js` (script inline dans le `<head>`) : fait apparaître le loader. Sans elle, la page est lisible telle quelle.
- `reduce` : `prefers-reduced-motion`, ou GSAP indisponible. Pas d'animation ; les slides des réalisations s'empilent verticalement (règles `html.reduce` en fin de CSS). Toute nouvelle animation doit rester lisible dans ce mode.
- `lenis` : ajoutée par Lenis ; le CSS Lenis recommandé est en tête de `style.css`.
- `data-ui="cream" | "bordeaux"` : couleur de l'interface fixe (nav, repère « 04/09 », curseur, points de progression), via les variables `--ui` / `--ui-inv`. Chaque section et chaque slide déclare son `data-ui` (couleur lisible sur son fond) et `initUI()` choisit la dernière section dont le rectangle contient la ligne y = 56 px (pour les slides épinglées, selon l'index de progression). `initWhere()` (repère « 04/09 ») calcule aussi sa valeur depuis les rectangles des sections à chaque scroll, et non par événements d'entrée/sortie, pour rester juste après un saut de scroll. **Toute nouvelle section doit porter `data-ui`.** Les deux logos de la nav (`.l-c`, `.l-b`) se fondent selon cet attribut.

**Palette et contraste** : crème `#FDEAAD`, bleu `#87AFE9`, bordeaux `#7C0F27`, corail `#E64F61`, gris clair `#F1F1F1` (charte de l'agence), plus deux dérivés (`--bordeaux-deep`, `--cream-2`). Le **corail ne donne que 2,9:1 de contraste avec le bordeaux et 3,1:1 avec le crème** : ne l'utiliser que pour des aplats, bulles, puces et très gros titres, jamais comme fond d'un texte courant. Les boutons sont crème ou bordeaux.

**Empilement des sections** : le hero est épinglé (`pinSpacing: false`) et les sections suivantes glissent par-dessus. Toute nouvelle section doit donc avoir `position: relative`, `z-index: 3` et un **fond opaque**.

**Réalisations (`initCases`)** : la section `.cases` est épinglée et une timeline GSAP scrubbée enchaîne les slides, chacune dévoilée par un `clip-path: inset()` qui monte. Convention de temps : la slide `i` est entièrement visible au temps entier `i`, la durée totale de la timeline vaut `n - 1`, donc `progress * (n - 1)` donne l'index de la slide. L'aimantation sur les slides se fait via `lenis.scrollTo` après 150 ms d'inactivité (et non via le `snap` de ScrollTrigger, qui lutte avec Lenis ; il n'est utilisé qu'en secours sans Lenis). Ajouter ou retirer une slide : le `<article class="slide slide--…" data-ui="…">`, un `.cases__tick` par slide, et la numérotation « 01 / 04 » écrite en dur ; `n` est calculé. Les couleurs d'une slide viennent de variables CSS (`--bg`, `--fg`, `--panel`, `--p1..p3`) définies par sa classe `slide--bordeaux | --blue | --cream`. Les révélations de texte utilisent `.mask > span` et `.fade`. Le panneau de droite de chaque slide est une grille de 3 cartes `.pub` (« top publications » : reels et posts réels du client, classés par nombre de j'aime). Un clic ouvre `initLightbox()` : le vrai reel/post s'affiche dans un `<iframe>` d'embed Instagram (`https://www.instagram.com/<reel|p>/<ID>/embed/`) **chargé uniquement au clic** (pas de script tiers ni de cookie Instagram avant), puis vidé à la fermeture. Chaque carte porte `data-ig="reel/ID"` ou `"p/ID"`. Pour changer de publication, modifier ce `data-ig` et les chiffres dans `index.html`.

**Logo** : en `<img>` PNG transparent (une version par couleur), **pas** en `mask-image` : les masques CSS chargés depuis `file://` sont bloqués par Chrome et le logo disparaîtrait si l'utilisateur ouvre `index.html` par double-clic. Les `<img>` ont des attributs `width`/`height` : la règle globale `img { height: auto }` est indispensable, sinon le logo se déforme dès qu'on fixe sa largeur en CSS. Le script de détourage n'est pas conservé. Méthode : sur `logo-prestacomm-original.webp` (1185×2000, lettrage seul = recadrage x 228–924, y 352–700, la ligne « Agence marketing digital » est exclue), alpha = `clip((234 − G) / (234 − 15), 0, 1)` d'après le canal vert (crème → bordeaux), agrandi ×3 en Lanczos puis contraste sur l'alpha ; une couleur unie par version (bordeaux `#7C0F27`, crème `#FDEAAD`). Pillow et numpy ne sont pas installés sur le Python du système : les installer dans un dossier temporaire (`pip install --target`).

**Bulles décoratives** : éléments `.blob` (`blob--coral | --blue | --cream`) dont le `border-radius` se déforme en CSS (`morph`) et qui flottent via GSAP (`initBlobs`) ; `data-speed` ajoute un parallaxe au scroll. Elles doivent rester dans une section en `overflow: hidden` : une seule bulle ou un titre qui dépasse élargit le viewport mobile (cause déjà rencontrée avec le titre « Méthode »).

**Vidéo « L'agence »** : la section `.reel` affiche un cadre placeholder. Pour brancher la vidéo motion design, remplacer `.reel__placeholder` par le `<video>` indiqué dans le commentaire HTML (fichier à déposer dans `maquette/assets/`).

**Réservation** : `initBooking()` ne fait qu'un **aperçu** (jours et créneaux générés côté client, rien n'est envoyé). Il doit être remplacé par l'intégration Cal.com (30 min, visio ; champs : nom, email, téléphone, entreprise + lien Instagram ou site, service souhaité ; notification via Apple Calendar et email), qui n'est pas encore faite.

## Avant publication (état actuel du code)

- Retirer le repère `.where__d` (« Maquette v1 — textes à valider ») dans `index.html`.
- Compléter les `.todo` « Chiffre à renseigner » de chaque slide, le pied de page « Mentions légales — à compléter » et le lien Instagram de l'agence (texte seul pour l'instant).
- Remplacer le cadre `.reel__placeholder` par la vidéo, et `initBooking()` par Cal.com.
- Pas encore d'image de partage (`og:image`), ni d'analytics, ni de déploiement.

## Direction visuelle (décisions de l'utilisateur)

Interface validée (structure, slides plein écran, effets) puis habillée avec la charte de l'agence : alternance de couleurs **par section**, gros titres, formes rondes « en bulle » inspirées du logo. Police : **Cormorant Garamond** (équivalent gratuit de « The Seasons ») pour les titres et le texte, **Inter Tight** en majuscules espacées pour les petites étiquettes et boutons. À remplacer par The Seasons seulement si l'utilisateur fournit un fichier avec licence web.

Mouvement : easings `cubic-bezier(.32, .72, 0, 1)` et `cubic-bezier(.19, 1, .22, 1)` (variables `--ease-out` et `--ease-io`), équivalents GSAP `expo.out` / `power3.out`. Pas de rebond sur le texte ; un léger dépassement (`back.out`) est réservé aux bulles et au badge rotatif du hero.
