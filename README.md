# Recettes

Application de bureau pour planifier les repas de la semaine et générer la liste
de courses. Interface en français, pensée pour un usage familial simple.

## Fonctionnalités

- **Cette semaine** — vue en lecture seule du menu de la semaine (jour + repas).
- **Création du menu** — repas candidats par jour, randomisation pondérée par
  l'historique (les repas déjà mangés sortent moins souvent), validation de la
  semaine et bouton « Créer une nouvelle semaine ».
- **Repas** — fiches repas avec ingrédients, quantités et unités (plusieurs unités
  possibles par ingrédient), recherche.
- **Catégories** — organisation des ingrédients.
- **Ingrédients** — ajout / édition / suppression, catégorie et unités, recherche.
- **Courses** — liste agrégée par catégorie ; toutes les catégories sont affichées
  (même vides) pour y ajouter des articles libres, et les cases cochées sont
  conservées jusqu'à « Créer une nouvelle semaine ».
- **Notes** — notes libres persistantes (idées pour les semaines suivantes),
  jamais effacées par « Créer une nouvelle semaine ».
- **Données** — export / import du contenu (catégories, ingrédients, repas) et
  réinitialisation de l'historique des repas.
- Thème clair / sombre, barre latérale rétractable, mises à jour automatiques.

## Stack

- [Tauri 2](https://v2.tauri.app/) (hôte Rust)
- [SvelteKit 5](https://svelte.dev/docs/kit) (runes) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn-svelte](https://shadcn-svelte.com/)
- Plugins Tauri : `store` (persistance), `dialog` / `fs` (export de fichier),
  `opener`, `updater` + `process` (mises à jour)

## Démarrage

Prérequis : Node.js, pnpm, et le toolchain Rust/Tauri pour le build desktop.

```bash
pnpm install       # dépendances JS
pnpm tauri dev     # lance l'application desktop
```

Vérifications et build :

```bash
pnpm check         # svelte-check / TypeScript
pnpm build         # build web statique (build/) — requis avant le build Rust
pnpm tauri build   # bundle l'application
```

> Environnement Windows (chemin `cargo`, linker MSVC) : voir `AGENTS.md`.

## Données & persistance

L'état est enregistré via `tauri-plugin-store` dans `recettes.json`, dans le
dossier de données de l'application (macOS :
`~/Library/Application Support/com.maelg.recettes/recettes.json`). Dans un
navigateur simple, un repli sur `localStorage` est utilisé.

L'export / import ne contient que le **contenu** (catégories, ingrédients,
repas) : l'historique de consommation, les cases cochées et les notes restent
locaux à l'appareil.

## Release & mises à jour

- Les binaires macOS (Apple Silicon) sont construits par GitHub Actions
  (`.github/workflows/build-macos.yml`) sur un runner `macos-latest`, puis publiés
  dans une release `app-vX.Y.Z`.
- L'auto-update s'appuie sur `tauri-plugin-updater` et le `latest.json` de la
  dernière release GitHub. **Bumper `version` dans `src-tauri/tauri.conf.json`**
  avant chaque release, puis lancer le workflow.
- Détails (clés de signature, secrets CI, etc.) : voir `AGENTS.md`.

## Structure du projet

```
src/
  lib/
    types.ts          # modèle de données
    store.svelte.ts   # store (runes) + persistance
    random.ts         # randomisation pondérée
    shopping.ts       # agrégation de la liste de courses
    transfer.ts       # export / import du contenu
    components/       # sidebar + composants d'UI (shadcn-svelte)
  routes/             # pages (/ , /creation-du-menu, /repas, /categories,
                      #        /ingredients, /courses, /notes, /donnees)
src-tauri/            # hôte Rust (plugins, configuration, permissions)
```

Pour le développement, voir aussi `AGENTS.md` (commandes, environnement,
conventions de code).
