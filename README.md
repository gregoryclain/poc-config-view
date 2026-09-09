# Generator — POC de configurateur de field types / entities / écrans

POC exploratoire, **hors du monorepo OnePlatform** (`C:\works\OnePlatform`), volontairement
détaché de ses conventions lourdes (Clean Architecture .NET, Postgres multi-tenant,
Keycloak…) pour itérer vite. Aucune des règles du `CLAUDE.md` OnePlatform ne s'applique
ici par choix — voir la section "Chantier" pour ce qu'il faudrait remettre en place avant
tout passage en production.

## Contexte initial

L'idée : un outil pour composer des écrans applicatifs de façon déclarative, sans
coder chaque écran à la main, en vue d'une **génération procédurale future** (beaucoup
d'écrans et d'entités à produire). Le modèle construit au fil des itérations :

1. **Field types** — catalogue de types de champs réutilisables, en deux catégories :
   - **Saisie** (`text`, `number`, `textarea`, `select`, `multiselect`, `date`, `email`,
     `phone`, `url`, `boolean`, `image-upload`) — mêmes types que l'enum `FieldType`
     d'oportal (`entityLayout.ts`), pour rester alignable avec son pipeline de rendu
     (`FieldResolver`/`GenericBlock`/`LayoutRenderer`) si on branche dessus plus tard.
   - **Affichage** (`display`) — une zone libellée en lecture seule, remplie par un
     end user via une action (voir plus bas), pas un champ de formulaire classique.
2. **Entities** — groupes de champs nommés (ex. "Identity", "Contact Details"),
   composés à partir du catalogue de field types, avec réordonnancement et overrides
   (label/required) par champ.
3. **Boutons d'action** — configurés **sur l'entity** (pas sur le catalogue d'actions
   global) : on choisit une action générique (catalogue `/actions`, un seul type pour
   l'instant, "Remplissage des champs") et on paramètre, pour cette entity, quel
   sous-ensemble de ses champs "Affichage" ce bouton concerne. Reproduit le
   comportement du bouton "+ Add" du bloc "Contact details" d'oportal : le bouton
   ouvre un dropdown listant les champs remplissables, cliquer un champ ouvre une
   modale à un seul champ de saisie.
4. **Écrans** — canvas graphique en grille fixe (12 colonnes), drag & drop d'entities
   depuis une palette, redimensionnement par poignées, aimant/anti-chevauchement
   (lib `grid-layout-plus`). Une **Prévisualisation** en lecture seule simule ce que
   verrait un end user : rendu des champs réels (via `FieldPreview`) et boutons
   d'action fonctionnels (remplissage réellement persisté).
5. **Valeurs de données** — les valeurs saisies par un end user dans les champs
   "Affichage" sont stockées **séparément** de la config (`entity_values`, une ligne
   par entity, merge-patch à chaque remplissage) — la distinction config/données est
   volontaire pour que tout (field types, entities, écrans, actions) reste du JSON
   pur et rejouable/scriptable par une génération procédurale future.

Toute la donnée (config ET valeurs) est stockée en JSON brut dans SQLite — pas de
schéma relationnel rigide, pour rester flexible pendant que le modèle bouge encore.

## Installation

Prérequis : **Node.js ≥ 22.5** (le backend utilise le module natif `node:sqlite`,
pas de dépendance native à compiler — évite le besoin de Visual Studio Build Tools
qu'exigerait `better-sqlite3`).

```bash
# Backend (API)
cd backend
npm install
npm run dev        # tsx watch — http://localhost:4310, rechargement à chaud
# le fichier SQLite backend/data/generator.sqlite est créé automatiquement
# au premier lancement, avec le catalogue d'actions pré-rempli ("Remplissage des champs")

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev        # Vite — http://localhost:4300, proxy /api -> localhost:4310
```

Ouvrir `http://localhost:4300` — page d'accueil vide, navigation en haut vers
Field Types / Entities / Écrans / Actions.

### Build

```bash
cd backend && npm run build   # tsc -> dist/
cd frontend && npm run build  # vue-tsc -b && vite build -> dist/
```

### Lien depuis oportal (optionnel, POC)

Un lien "Generator" a été ajouté ponctuellement dans le menu de gauche d'oportal
(`MainSidebar.vue`), ouvrant `http://localhost:4300` dans un nouvel onglet — utile en
dev local mais pas figé (il a pu être retiré depuis). Rien de tel n'est nécessaire
pour faire tourner ce POC seul.

## Chantier à prévoir pour rendre ça viable dans OnePlatform

Ce POC prouve le modèle (field types → entities → écrans → actions → valeurs), mais
tout le socle technique reste à refaire pour s'intégrer au monorepo. Par ordre
approximatif de priorité :

### Fondations plateforme (bloquant avant tout accès partagé)

- **Backend .NET aligné Clean Architecture** — remplacer l'API Express par un vrai
  service OnePlatform (Domain/Application/Persistence/Presentation, CQRS/MediatR,
  `.Contracts` library pour les DTOs exposés) si le générateur doit vivre dans le
  monorepo. Alternative plus légère : le garder en Node mais lui appliquer les
  standards de sécurité/observabilité qui comptent (auth, logs structurés) sans
  viser la parité architecturale complète.
- **Base de données partagée** — SQLite fichier local ne survit pas à un déploiement
  multi-instance. Migrer vers PostgreSQL, avec un vrai schéma migré (EF Core ou
  équivalent) plutôt que des colonnes `data JSON` — ou au minimum un stockage JSON
  dans Postgres (`jsonb`) pour garder la flexibilité tout en étant partageable.
- **Authentification/autorisation** — aucune actuellement (accès libre à qui a
  l'URL). Il faut au minimum du Keycloak OIDC comme les autres services, et une
  politique d'autorisation (qui peut créer/éditer des field types vs qui peut juste
  consulter).
- **Multi-tenance** — le modèle actuel est global : un field type/entity/screen
  créé n'est scopé à aucune organisation. Un configurateur de production doit
  décider si la config est partagée entre tenants (un field type "Nom" commun à
  tous) ou par tenant (chaque client a son propre catalogue) — ça change toute la
  résolution de connexion (`ITenantService` façon OnePlatform).
- **`entity_values` scopé à un vrai enregistrement** — actuellement une valeur
  "courante" par entity, sans lien à un contact/organisation réel. Pour être
  utilisable, une valeur doit être scopée `(entityId, recordId)` où `recordId` est
  l'id du vrai contact/organisation/etc. concerné.

### Rendu réel des écrans

- **Brancher sur le pipeline de rendu oportal** — la Prévisualisation actuelle est
  un rendu maison en CSS Grid + inputs HTML natifs désactivés. Le vrai objectif est
  de générer des layouts consommables par `LayoutRenderer.vue`/`GenericBlock.vue`/
  `FieldResolver.vue` (déjà existants côté Organisation dans oportal) : il faut un
  mapping explicite entre le modèle du générateur et le contrat `entityLayout.ts`
  (`BlockDefinition`, `FieldType`, etc.), et un export (API ou fichier) qui produise
  ce format à partir d'un Screen du générateur.
- **Champs de saisie réels** — les field types "Saisie" ne sont aujourd'hui rendus
  qu'en lecture seule/désactivés dans la Prévisualisation. Pour un vrai écran
  utilisable, il faut les rendre éditables et brancher leur sauvegarde (même
  mécanisme `entity_values` ou un vrai formulaire métier selon le champ).

### Système d'actions extensible

- **Un seul type d'action existe** ("Remplissage des champs"), codé en dur des deux
  côtés (le comportement du dropdown/modale dans `ScreenPreviewView.vue` est
  spécifique à ce type). Le prochain incrément demandé par le métier : analyser les
  règles métier déjà en place côté Contact (oportal/ophub) pour identifier les
  autres actions à rendre modulaires (ex. actions de changement de statut, envoi de
  notification, validation de règle de gestion) et concevoir un vrai registre
  d'actions — chaque type d'action ayant son propre schéma de paramètres (JSON) et
  son propre composant de rendu, au lieu d'un `if (type === 'fill-fields')` unique.
- **Historique / audit** des remplissages si le métier en a besoin (actuellement une
  seule valeur courante, écrasée à chaque saisie, aucune trace de qui a rempli quoi
  et quand).

### Qualité / exploitation

- **Aucun test** (unit, intégration, e2e) sur backend ou frontend.
- **Aucune validation d'entrée** sérieuse côté API (juste des checks de présence
  minimaux) — pas de FluentValidation/Zod équivalent, pas de messages d'erreur
  structurés (`ProblemDetails`).
- **CORS ouvert sans restriction**, pas de rate limiting, pas de protection CSRF —
  acceptable en local, pas en accès partagé.
- **i18n** — toute l'UI du générateur est en français en dur ; OnePlatform est
  fr/nl/en (R29).
- **Pas de CI/CD, pas de Dockerfile, pas de déploiement** — à faire si le générateur
  doit devenir un service accessible à l'équipe plutôt qu'un outil local.
- **Génération procédurale** — l'objectif final (beaucoup d'écrans/entities générés
  par script) n'a pas encore d'API dédiée (bulk import/export JSON, validation de
  schéma) ; le format actuel (JSON en base) s'y prête mais l'outillage reste à
  écrire.
