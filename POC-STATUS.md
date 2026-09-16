# État du POC — Generator + Fiche générée (OnePlatform)

**Version :** 2026-09-16

---

## Français

### Résumé

Le POC répond à une question : peut-on configurer un écran de saisie (ici, une fiche contact) à la volée, avec de vraies règles métier, sans coder chaque écran à la main dans OnePlatform ?

Deux briques :

1. **`generator`** (ce repo) — petit outil autonome (Express + SQLite + Vue) qui permet de composer un écran par assemblage : des **field types** (un champ réutilisable : texte, select, date, règles de validation, icône...) regroupés en **entities**, posées sur un **screen** (grille 12 colonnes), avec des **actions** métier rattachées à des champs (ex. "Add" → ouvre "Ajouter un téléphone").
2. **`generator-fiche`** — un module dans **OnePlatform** (`eudonet-oportal`) qui lit ce schéma via l'API du generator et rend une vraie page, avec de vraies données contact (BFF/OPHUB), le vrai design system (OPAL), et les vrais formulaires/modales métier (ajout téléphone, email, réseau social, adresse) — pas des maquettes, les composants réellement utilisés sur la fiche contact de production.

**Capacités actuelles :**
- Écran généré : Identité, Profil, Coordonnées, Adresses, Relations actives, Consentements — proche de la vraie fiche `/contacts/{id}`.
- Règles de validation réelles répliquées depuis le vrai backend OPHUB (champs requis, longueurs max, date de naissance non future, format de langue).
- Boutons d'action génériques : un seul type d'action (« ajouter un champ ») rattaché à une liste de champs cibles — pas un bouton/kind codé en dur par cas métier, ce qui évite l'explosion de code à mesure que le nombre de champs grandit.
- Icônes des actions configurables directement dans le generator.
- Architecture « adapter par domaine métier » : le renderer générique ne connaît rien de Contact ; toute la logique Contact vit dans un seul fichier adapter. Ajouter un nouveau type d'entité (Organisation, Donation...) ne demande pas de toucher au renderer, juste un nouvel adapter.
- Testé de bout en bout dans le navigateur : édition, sauvegarde, ajout d'un téléphone/email/réseau social/adresse réellement persistés côté serveur.

**Reste à faire (pistes, non exhaustif) :**
- Prouver la généricité avec un **2ᵉ domaine métier** (Organisation par exemple) — aujourd'hui seul Contact est câblé.
- Pas de tests automatisés (unitaires/e2e) — tout a été vérifié manuellement dans cette session.
- Le generator n'a pas d'authentification/permissions ; à considérer avant tout usage au-delà d'un POC local.
- Pas de validation du schéma à la sauvegarde côté generator (une faute de frappe sur un `kind`/`key` n'est détectée qu'à l'affichage, silencieusement — comportement volontaire pour l'instant, mais à muscler).
- Bug connu, indépendant du POC : le widget "Consents" affiche une erreur de chargement sur l'environnement de dev actuel (le BFF renvoie 405 sur `/contacts/{id}/consents`).
- Le generator reste volontairement minimal (pas de design, pas de multi-tenant, un seul écran de démonstration opérationnel).

### Détails techniques

**Repo `generator`** (`C:\works\eudonet\generator`, Express + `node:sqlite` + Vue 3/Vite, ports 4310/4300, sans authentification) :
- Modèle de données : `FieldTypeData { type, key, label, required, placeholder?, icon?, config?: { options?, validation? } }` — `type` inclut `text/number/select/date/display/widget/...` ; `EntityData { fields[], actions[] }` ; `ScreenData { items[], domain? }` ; `ActionData { name, label, kind }`.
- Validation déclarative (`FieldValidationRule`: `maxLength`/`pattern`/`notFutureDate`) répliquant les règles FluentValidation réelles d'OPHUB (`UpdateContactCommandValidator.cs`).
- Modèle d'action générique `add-field` : une action référence une liste de `targetFieldTypeIds` ; le renderer construit le bouton (simple si 1 cible, dropdown si plusieurs) et résout la logique métier par le **`key` du champ cliqué**, pas par le kind de l'action — un seul type d'action suffit quel que soit le nombre de champs.
- Nouveau champ `ScreenData.domain` (ex. `"contact"`), éditable dans l'éditeur d'écran du generator, qui indique au renderer OnePlatform quel adapter métier utiliser.

**Repo OnePlatform**, module `apps/one-platform/eudonet-oportal/src/src/modules/generator-fiche/` :
- `composables/useGeneratorFiche.ts` — composable générique : aucune connaissance métier. Résout l'adapter de domaine depuis `screen.data.domain`, lui délègue fetch/validation-mapping/sauvegarde/valeurs d'affichage, expose un `actionContext` générique `{ recordId, record, onChanged, close }`.
- `domains/contactDomainAdapter.ts` — **seul fichier** qui connaît le métier Contact : implémente `EntityDomainAdapter` (fetch/getFieldValue/getDisplayValue/save) et enregistre les actions/widgets Contact (téléphone, email, réseau social, adresse, relations actives, consentements) sur le registre générique, avec des clés préfixées par domaine (`contact:phoneNumber`, ...) pour éviter toute collision avec un futur domaine.
- `presentation/views/GeneratorFicheView.vue` — rendu en grille CSS 12 colonnes avec les composants du design system OPAL (`WidgetShell`, `TextInput`, `SelectInput`, `DatePickerInput`, `Button`, `Dropdown`), rendu direct des widgets auto-portants (ils embarquent déjà leur propre carte), et une modale d'action générique via `<component :is>` résolue dynamiquement.
- `shared/composables/useActionRegistry.ts` et `useDomainAdapterRegistry.ts` — deux registres génériques (`Map<string, …>`), même pattern que le `useEventBus.ts` déjà présent dans le repo ; enregistrés une seule fois au chargement du module (`generator-fiche/index.ts`), pas à chaque affichage d'écran.
- Réutilisation maximale du code Contact réel, aucune duplication de logique métier : `getContactById`/`updateContact`, `ContactAddEmailModal`/`ContactAddPhoneModal`/`ContactAddressFormModal`/`SocialProfileFormModal`, `ContactActiveRelationsWidget`/`ContactConsentsWidget`, `mapApiAddressToContactAddress`, `mapApiContactByIdToContactDetail`, `useContactRelations`, `contactSocialProfileApi`.
- Module activé uniquement en développement (`import.meta.env.DEV`), route `/generator-fiche/:id`.

**Vérifications effectuées :** typecheck systématique (`vue-tsc`/`tsc`) après chaque étape sur les deux repos, tests manuels en navigateur (ajout réel d'un téléphone/email/réseau social LinkedIn/adresse via recherche BAN, tous persistés côté BFF et vérifiés sur la vraie fiche `/contacts/{id}`), non-régression contrôlée à chaque refactor, comportement sans crash sur un kind/domaine/field-key inconnu.

---

## English

### Summary

The POC answers one question: can a data-entry screen (here, a contact record) be configured on the fly, with real business rules, instead of hand-coding every screen in OnePlatform?

Two pieces:

1. **`generator`** (this repo) — a small standalone tool (Express + SQLite + Vue) that lets you compose a screen from building blocks: **field types** (a reusable field: text, select, date, validation rules, icon...) grouped into **entities**, placed on a **screen** (12-column grid), with business **actions** attached to fields (e.g. "Add" → opens "Add a phone number").
2. **`generator-fiche`** — a module inside **OnePlatform** (`eudonet-oportal`) that reads this schema through the generator's API and renders a real page, with real contact data (BFF/OPHUB), the real design system (OPAL), and the real business forms/modals (add phone, email, social network, address) — not mockups, the actual components used on the production contact record page.

**Current capabilities:**
- Generated screen: Identity, Profile, Contact details, Addresses, Active relations, Consents — close to the real `/contacts/{id}` page.
- Real validation rules, replicated from the real OPHUB backend (required fields, max lengths, non-future birth date, language format).
- Generic action buttons: a single action type ("add a field") attached to a list of target fields — not one hardcoded button/kind per business case, avoiding a combinatorial explosion of code as the number of fields grows.
- Action icons configurable directly in the generator.
- "Adapter per business domain" architecture: the generic renderer knows nothing about Contact; all Contact logic lives in a single adapter file. Adding a new entity type (Organisation, Donation...) requires no changes to the renderer, just a new adapter.
- Tested end to end in the browser: editing, saving, adding a phone/email/social network/address, all genuinely persisted server-side.

**Remaining work (non-exhaustive):**
- Prove the genericity with a **2nd business domain** (e.g. Organisation) — only Contact is wired up today.
- No automated tests (unit/e2e) — everything was verified manually in this session.
- The generator has no authentication/permissions; to consider before any use beyond a local POC.
- No schema validation on save in the generator (a typo in a `kind`/`key` is only silently caught at render time — intentional for now, but worth hardening).
- Known bug, unrelated to the POC: the "Consents" widget shows a load error on the current dev environment (the BFF returns 405 on `/contacts/{id}/consents`).
- The generator stays deliberately minimal (no design polish, no multi-tenancy, a single working demo screen).

### Technical details

**`generator` repo** (`C:\works\eudonet\generator`, Express + `node:sqlite` + Vue 3/Vite, ports 4310/4300, no authentication):
- Data model: `FieldTypeData { type, key, label, required, placeholder?, icon?, config?: { options?, validation? } }` — `type` includes `text/number/select/date/display/widget/...`; `EntityData { fields[], actions[] }`; `ScreenData { items[], domain? }`; `ActionData { name, label, kind }`.
- Declarative validation (`FieldValidationRule`: `maxLength`/`pattern`/`notFutureDate`) replicating OPHUB's real FluentValidation rules (`UpdateContactCommandValidator.cs`).
- Generic `add-field` action model: an action references a list of `targetFieldTypeIds`; the renderer builds the button (plain if 1 target, dropdown if several) and resolves the business logic by the **key of the clicked field**, not by the action's kind — a single action type suffices regardless of how many fields exist.
- New `ScreenData.domain` field (e.g. `"contact"`), editable in the generator's screen editor, telling the OnePlatform renderer which business adapter to use.

**OnePlatform repo**, module `apps/one-platform/eudonet-oportal/src/src/modules/generator-fiche/`:
- `composables/useGeneratorFiche.ts` — fully generic composable, no business knowledge. Resolves the domain adapter from `screen.data.domain`, delegates fetch/field-mapping/save/display-values to it, exposes a generic `actionContext` (`{ recordId, record, onChanged, close }`).
- `domains/contactDomainAdapter.ts` — the **only file** that knows about the Contact business domain: implements `EntityDomainAdapter` (fetch/getFieldValue/getDisplayValue/save) and registers Contact's actions/widgets (phone, email, social network, address, active relations, consents) on the generic registry, with domain-prefixed keys (`contact:phoneNumber`, ...) to avoid collisions with a future domain.
- `presentation/views/GeneratorFicheView.vue` — 12-column CSS grid rendering using the OPAL design-system components (`WidgetShell`, `TextInput`, `SelectInput`, `DatePickerInput`, `Button`, `Dropdown`), direct rendering of self-contained widgets (they already ship their own card), and a generic action modal resolved dynamically via `<component :is>`.
- `shared/composables/useActionRegistry.ts` and `useDomainAdapterRegistry.ts` — two generic registries (`Map<string, …>`), same pattern as the existing `useEventBus.ts`; registered once when the module loads (`generator-fiche/index.ts`), not on every screen mount.
- Maximum reuse of real Contact code, zero business-logic duplication: `getContactById`/`updateContact`, `ContactAddEmailModal`/`ContactAddPhoneModal`/`ContactAddressFormModal`/`SocialProfileFormModal`, `ContactActiveRelationsWidget`/`ContactConsentsWidget`, `mapApiAddressToContactAddress`, `mapApiContactByIdToContactDetail`, `useContactRelations`, `contactSocialProfileApi`.
- Module enabled in development only (`import.meta.env.DEV`), route `/generator-fiche/:id`.

**Verification performed:** systematic typecheck (`vue-tsc`/`tsc`) after every step on both repos, manual browser testing (genuinely adding a phone/email/LinkedIn social profile/address via real BAN search, all persisted through the BFF and confirmed on the real `/contacts/{id}` page), controlled non-regression after every refactor, graceful no-crash behavior on an unknown kind/domain/field-key.
