# État du POC — Generator + Fiche générée (OnePlatform)

**Version :** 2026-09-17

---

## Français

### Résumé

Le POC répond à une question : peut-on configurer un écran de saisie (ici, une fiche contact) à la volée, avec de vraies règles métier, sans coder chaque écran à la main dans OnePlatform ?

Deux briques :

1. **`generator`** (ce repo) — petit outil autonome (Express + SQLite + Vue) qui permet de composer un écran par assemblage : des **field types** (un champ réutilisable : texte, select, date, règles de validation, icône...) regroupés en **entities**, posées sur un **screen** (grille 12 colonnes), avec des **actions** métier rattachées à des champs (ex. "Add" → ouvre "Ajouter un téléphone").
2. **`generator-fiche`** — un module dans **OnePlatform** (`eudonet-oportal`) qui lit ce schéma via l'API du generator et rend une vraie page, avec de vraies données (BFF/OPHUB), le vrai design system (OPAL), et les vrais formulaires/modales métier (ajout téléphone, email, réseau social, adresse) — pas des maquettes, les composants réellement utilisés en production.

**Capacités actuelles :**
- Deux fiches générées, chacune avec sa propre URL : Contact (`/generator-fiche/contact/{id}`) et Organisation (`/generator-fiche/organisation/{id}`), toutes deux fonctionnelles en parallèle.
- Fiche Contact : Identité, Profil, Coordonnées, Adresses, Relations actives, Consentements — proche de la vraie fiche `/contacts/{id}`.
- Fiche Organisation : Informations générales, Coordonnées, Adresses — proche de la vraie fiche `/organisations/{id}`.
- Règles de validation réelles répliquées depuis le vrai backend OPHUB (champs requis, longueurs max, date de naissance non future, format de langue).
- Boutons d'action génériques : un seul type d'action (« ajouter un champ ») rattaché à une liste de champs cibles — pas un bouton/kind codé en dur par cas métier, ce qui évite l'explosion de code à mesure que le nombre de champs grandit.
- Icônes des actions configurables directement dans le generator.
- Architecture « adapter par domaine métier » : le renderer générique ne connaît rien de Contact ni d'Organisation ; toute la logique métier vit dans un fichier adapter par domaine. La généricité a été **prouvée avec un 2ᵉ domaine (Organisation)** : ajout du domaine sans toucher au renderer/composable générique — un seul nouveau fichier adapter, un screen JSON, et 2 lignes d'enregistrement.
- Testé de bout en bout dans le navigateur sur les deux domaines : édition, sauvegarde, ouverture des modales réelles d'ajout téléphone/email/réseau social/adresse, non-régression contrôlée de Contact après l'ajout d'Organisation.

**Reste à faire (pistes, non exhaustif) :**
- **Intégrer le generator dans OnePlatform lui-même** : aujourd'hui c'est un outil autonome à côté (repo, stack et base de données séparés). L'évolution naturelle est de porter cette capacité de configuration d'écran dans OnePlatform, pas forcément avec la stack actuelle du generator (Express/SQLite/Vue standalone), mais avec la stack et les conventions d'OnePlatform (mêmes back-ends, mêmes mécanismes d'auth/permissions, même pipeline de déploiement) — le generator actuel sert de preuve de concept pour le modèle de données et l'architecture adapter, pas de socle technique à réutiliser tel quel.
- Pas de tests automatisés (unitaires/e2e) — tout a été vérifié manuellement dans cette session.
- Le generator n'a pas d'authentification/permissions ; à considérer avant tout usage au-delà d'un POC local.
- Pas de validation du schéma à la sauvegarde côté generator (une faute de frappe sur un `kind`/`key` n'est détectée qu'à l'affichage, silencieusement — comportement volontaire pour l'instant, mais à muscler).
- Bug connu, indépendant du POC : le widget "Consents" affiche une erreur de chargement sur l'environnement de dev actuel (le BFF renvoie 405 sur `/contacts/{id}/consents`).
- Le generator reste volontairement minimal (pas de design, pas de multi-tenant).

### Détails techniques

**Repo `generator`** (`C:\works\eudonet\generator`, Express + `node:sqlite` + Vue 3/Vite, ports 4310/4300, sans authentification) :
- Modèle de données : `FieldTypeData { type, key, label, required, placeholder?, icon?, config?: { options?, validation? } }` — `type` inclut `text/number/select/date/display/widget/...` ; `EntityData { fields[], actions[] }` ; `ScreenData { items[], domain? }` ; `ActionData { name, label, kind }`.
- Validation déclarative (`FieldValidationRule`: `maxLength`/`pattern`/`notFutureDate`) répliquant les règles FluentValidation réelles d'OPHUB (`UpdateContactCommandValidator.cs`).
- Modèle d'action générique `add-field` : une action référence une liste de `targetFieldTypeIds` ; le renderer construit le bouton (simple si 1 cible, dropdown si plusieurs) et résout la logique métier par le **`key` du champ cliqué**, pas par le kind de l'action — un seul type d'action suffit quel que soit le nombre de champs.
- Nouveau champ `ScreenData.domain` (ex. `"contact"`), éditable dans l'éditeur d'écran du generator, qui indique au renderer OnePlatform quel adapter métier utiliser.

**Repo OnePlatform**, module `apps/one-platform/eudonet-oportal/src/src/modules/generator-fiche/` :
- `composables/useGeneratorFiche.ts` — composable générique : aucune connaissance métier. Résout l'adapter de domaine depuis `screen.data.domain`, lui délègue fetch/validation-mapping/sauvegarde/valeurs d'affichage, expose un `actionContext` générique `{ recordId, record, onChanged, close }`.
- `domains/contactDomainAdapter.ts` — **seul fichier** qui connaît le métier Contact : implémente `EntityDomainAdapter` (fetch/getFieldValue/getDisplayValue/save) et enregistre les actions/widgets Contact (téléphone, email, réseau social, adresse, relations actives, consentements) sur le registre générique, avec des clés préfixées par domaine (`contact:phoneNumber`, ...) pour éviter toute collision avec un futur domaine.
- `domains/organisationDomainAdapter.ts` — même contrat `EntityDomainAdapter`, pour le métier Organisation (téléphone, email, réseau social, adresse), câblé sur `getOrganisationById`/`saveOrganisationById`/`createAddress` et les vraies modales Organisation (`OrganisationAddEmailModal`, `OrganisationAddPhoneModal`, `AddressFormModal`). Preuve que l'interface `EntityDomainAdapter` tient face à une forme de donnée très différente de Contact (objet `Organisation` imbriqué, mappé depuis un `EntityLayoutResponse` du BFF, plutôt qu'un DTO plat) — zéro changement nécessaire côté renderer/composable générique.
- `presentation/views/GeneratorFicheView.vue` — rendu en grille CSS 12 colonnes avec les composants du design system OPAL (`WidgetShell`, `TextInput`, `SelectInput`, `DatePickerInput`, `Button`, `Dropdown`), rendu direct des widgets auto-portants (ils embarquent déjà leur propre carte), et une modale d'action générique via `<component :is>` résolue dynamiquement.
- `shared/composables/useActionRegistry.ts` et `useDomainAdapterRegistry.ts` — deux registres génériques (`Map<string, …>`), même pattern que le `useEventBus.ts` déjà présent dans le repo ; enregistrés une seule fois au chargement du module (`generator-fiche/index.ts`), pas à chaque affichage d'écran.
- Réutilisation maximale du code métier réel, aucune duplication de logique métier : côté Contact `getContactById`/`updateContact`, `ContactAddEmailModal`/`ContactAddPhoneModal`/`ContactAddressFormModal`/`SocialProfileFormModal`, `ContactActiveRelationsWidget`/`ContactConsentsWidget`, `mapApiAddressToContactAddress`, `mapApiContactByIdToContactDetail`, `useContactRelations`, `contactSocialProfileApi` ; côté Organisation `getOrganisationById`/`saveOrganisationById`/`createAddress`, `mapLayoutToOrganisation`, `organisationSocialProfileApi`.
- Module activé uniquement en développement (`import.meta.env.DEV`), deux routes : `/generator-fiche/contact/:id` (screen id `c12582d7-4038-4a13-9805-8ae229c99dc6`, domaine `"contact"`) et `/generator-fiche/organisation/:id` (screen id `8cfa9baf-d369-4b62-8e44-ed487dfb50af`, domaine `"organisation"`) — le choix du domaine à charger vient du champ `ScreenData.domain` du schéma, pas d'un `if` codé en dur dans le routeur.

**Vérifications effectuées :** typecheck systématique (`vue-tsc`/`tsc`) après chaque étape sur les deux repos, tests manuels en navigateur sur les deux domaines (ajout réel d'un téléphone/email/réseau social LinkedIn/adresse via recherche BAN pour Contact ; ouverture des modales réelles téléphone/email/adresse/réseau social pour Organisation), non-régression de Contact contrôlée après l'ajout du domaine Organisation, comportement sans crash sur un kind/domaine/field-key inconnu.

---

## English

### Summary

The POC answers one question: can a data-entry screen (here, a contact record) be configured on the fly, with real business rules, instead of hand-coding every screen in OnePlatform?

Two pieces:

1. **`generator`** (this repo) — a small standalone tool (Express + SQLite + Vue) that lets you compose a screen from building blocks: **field types** (a reusable field: text, select, date, validation rules, icon...) grouped into **entities**, placed on a **screen** (12-column grid), with business **actions** attached to fields (e.g. "Add" → opens "Add a phone number").
2. **`generator-fiche`** — a module inside **OnePlatform** (`eudonet-oportal`) that reads this schema through the generator's API and renders a real page, with real data (BFF/OPHUB), the real design system (OPAL), and the real business forms/modals (add phone, email, social network, address) — not mockups, the actual components used in production.

**Current capabilities:**
- Two generated records, each with its own URL: Contact (`/generator-fiche/contact/{id}`) and Organisation (`/generator-fiche/organisation/{id}`), both working side by side.
- Contact screen: Identity, Profile, Contact details, Addresses, Active relations, Consents — close to the real `/contacts/{id}` page.
- Organisation screen: General information, Contact details, Addresses — close to the real `/organisations/{id}` page.
- Real validation rules, replicated from the real OPHUB backend (required fields, max lengths, non-future birth date, language format).
- Generic action buttons: a single action type ("add a field") attached to a list of target fields — not one hardcoded button/kind per business case, avoiding a combinatorial explosion of code as the number of fields grows.
- Action icons configurable directly in the generator.
- "Adapter per business domain" architecture: the generic renderer knows nothing about Contact or Organisation; all business logic lives in one adapter file per domain. Genericity was **proven with a 2nd domain (Organisation)**: adding it required no changes to the generic renderer/composable — just one new adapter file, one screen JSON, and 2 registration lines.
- Tested end to end in the browser on both domains: editing, saving, opening the real add-phone/email/social-network/address modals, controlled non-regression of Contact after adding Organisation.

**Remaining work (non-exhaustive):**
- **Integrate the generator into OnePlatform itself**: today it's a standalone tool living alongside OnePlatform (separate repo, stack, and database). The natural next step is to bring this screen-configuration capability into OnePlatform — not necessarily on the generator's current stack (standalone Express/SQLite/Vue), but on OnePlatform's own stack and conventions (same backends, same auth/permission mechanisms, same deployment pipeline). The current generator is a proof of concept for the data model and adapter architecture, not a technical foundation meant to be reused as-is.
- No automated tests (unit/e2e) — everything was verified manually in this session.
- The generator has no authentication/permissions; to consider before any use beyond a local POC.
- No schema validation on save in the generator (a typo in a `kind`/`key` is only silently caught at render time — intentional for now, but worth hardening).
- Known bug, unrelated to the POC: the "Consents" widget shows a load error on the current dev environment (the BFF returns 405 on `/contacts/{id}/consents`).
- The generator stays deliberately minimal (no design polish, no multi-tenancy).

### Technical details

**`generator` repo** (`C:\works\eudonet\generator`, Express + `node:sqlite` + Vue 3/Vite, ports 4310/4300, no authentication):
- Data model: `FieldTypeData { type, key, label, required, placeholder?, icon?, config?: { options?, validation? } }` — `type` includes `text/number/select/date/display/widget/...`; `EntityData { fields[], actions[] }`; `ScreenData { items[], domain? }`; `ActionData { name, label, kind }`.
- Declarative validation (`FieldValidationRule`: `maxLength`/`pattern`/`notFutureDate`) replicating OPHUB's real FluentValidation rules (`UpdateContactCommandValidator.cs`).
- Generic `add-field` action model: an action references a list of `targetFieldTypeIds`; the renderer builds the button (plain if 1 target, dropdown if several) and resolves the business logic by the **key of the clicked field**, not by the action's kind — a single action type suffices regardless of how many fields exist.
- New `ScreenData.domain` field (e.g. `"contact"`), editable in the generator's screen editor, telling the OnePlatform renderer which business adapter to use.

**OnePlatform repo**, module `apps/one-platform/eudonet-oportal/src/src/modules/generator-fiche/`:
- `composables/useGeneratorFiche.ts` — fully generic composable, no business knowledge. Resolves the domain adapter from `screen.data.domain`, delegates fetch/field-mapping/save/display-values to it, exposes a generic `actionContext` (`{ recordId, record, onChanged, close }`).
- `domains/contactDomainAdapter.ts` — the **only file** that knows about the Contact business domain: implements `EntityDomainAdapter` (fetch/getFieldValue/getDisplayValue/save) and registers Contact's actions/widgets (phone, email, social network, address, active relations, consents) on the generic registry, with domain-prefixed keys (`contact:phoneNumber`, ...) to avoid collisions with a future domain.
- `domains/organisationDomainAdapter.ts` — same `EntityDomainAdapter` contract, for the Organisation business domain (phone, email, social network, address), wired to `getOrganisationById`/`saveOrganisationById`/`createAddress` and the real Organisation modals (`OrganisationAddEmailModal`, `OrganisationAddPhoneModal`, `AddressFormModal`). Proof that the `EntityDomainAdapter` interface holds up against a data shape very different from Contact's (a nested `Organisation` object mapped from a BFF `EntityLayoutResponse`, rather than a flat DTO) — zero changes needed in the generic renderer/composable.
- `presentation/views/GeneratorFicheView.vue` — 12-column CSS grid rendering using the OPAL design-system components (`WidgetShell`, `TextInput`, `SelectInput`, `DatePickerInput`, `Button`, `Dropdown`), direct rendering of self-contained widgets (they already ship their own card), and a generic action modal resolved dynamically via `<component :is>`.
- `shared/composables/useActionRegistry.ts` and `useDomainAdapterRegistry.ts` — two generic registries (`Map<string, …>`), same pattern as the existing `useEventBus.ts`; registered once when the module loads (`generator-fiche/index.ts`), not on every screen mount.
- Maximum reuse of real business code, zero business-logic duplication: on the Contact side `getContactById`/`updateContact`, `ContactAddEmailModal`/`ContactAddPhoneModal`/`ContactAddressFormModal`/`SocialProfileFormModal`, `ContactActiveRelationsWidget`/`ContactConsentsWidget`, `mapApiAddressToContactAddress`, `mapApiContactByIdToContactDetail`, `useContactRelations`, `contactSocialProfileApi`; on the Organisation side `getOrganisationById`/`saveOrganisationById`/`createAddress`, `mapLayoutToOrganisation`, `organisationSocialProfileApi`.
- Module enabled in development only (`import.meta.env.DEV`), two routes: `/generator-fiche/contact/:id` (screen id `c12582d7-4038-4a13-9805-8ae229c99dc6`, domain `"contact"`) and `/generator-fiche/organisation/:id` (screen id `8cfa9baf-d369-4b62-8e44-ed487dfb50af`, domain `"organisation"`) — which domain to load comes from the schema's own `ScreenData.domain` field, not a hardcoded `if` in the router.

**Verification performed:** systematic typecheck (`vue-tsc`/`tsc`) after every step on both repos, manual browser testing on both domains (genuinely adding a phone/email/LinkedIn social profile/address via real BAN search for Contact; opening the real phone/email/address/social-network modals for Organisation), controlled non-regression of Contact after adding the Organisation domain, graceful no-crash behavior on an unknown kind/domain/field-key.
