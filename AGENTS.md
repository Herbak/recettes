# AGENTS.md

## Project
Tauri 2 + SvelteKit 5 (runes) + TypeScript desktop app: a weekly menu randomizer
("recettes"). UI is in French, styled with Tailwind CSS v4.

## Commands
- `pnpm install` — install JS deps
- `pnpm check` — svelte-check / TypeScript
- `pnpm build` — SvelteKit static build (outputs `build/`, required before Rust compiles)
- `pnpm tauri dev` — run the desktop app
- `pnpm tauri build` — bundle the app

## Environment (Windows)
- `cargo`/`rustc` are installed at `%USERPROFILE%\.cargo\bin` but may not be on
  `PATH`. Prepend it before Tauri/cargo commands:
  `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"`
- Building Rust targets requires the MSVC linker (`link.exe`) via
  **Visual Studio Build Tools** with the "Desktop development with C++" workload.
  If `cargo check` reports `linker link.exe not found`, install that workload.

## Release (macOS via GitHub Actions)
- macOS apps cannot be cross-compiled from Windows (no `.dmg` without a Mac).
  Build them on a GitHub Actions `macos-latest` runner instead.
- `.github/workflows/build-macos.yml` builds an Apple Silicon
  (`aarch64-apple-darwin`) `.app` + `.dmg`, attached to a **draft GitHub release**.
  Trigger it via Actions → Run workflow, or by pushing a tag `app-v*`.
- Bump `version` in `src-tauri/tauri.conf.json` before each release (the tag is
  derived from it).
- The build is unsigned but ad-hoc signed (`bundle.macOS.signingIdentity: "-"`).
  On first launch macOS blocks it: use right-click → Open, or
  `xattr -cr /Applications/recettes.app`. Clean installs need an Apple Developer
  ID + notarization.

## Architecture
- `src/lib/types.ts` — data model (`Category`, `Item`, `Meal`, `DayPlan`, `AppState`).
  `Item.unit` is a comma-separated list of allowed units (ex: `"g, unité"`) and
  `MealItem.unit` optionally overrides which one a meal line uses; helpers
  `itemUnits` / `primaryUnit` / `lineUnit`.
- `src/lib/store.svelte.ts` — runes-based global store + persistence (CRUD, plan,
  randomize/validate). Persists via `tauri-plugin-store` to `recettes.json` in the
  app data dir; falls back to `localStorage` when running in a plain browser.
- `src/lib/random.ts` — one pick per day from that day's candidate meals
- `src/lib/shopping.ts` — aggregation of chosen meals into a category-grouped list
- `src/lib/transfer.ts` — content export/import (`serializeExport`, `parseExport`,
  `normalizeName`); the store adds `exportContent`/`replaceContent`/`mergeContent`
- `src/routes/` — `+layout.svelte` shell; `/` Semaine, `/repas`, `/ingredients`,
  `/courses`, `/donnees` (export/import content)
- `src-tauri/` — minimal Rust host registering `tauri-plugin-store`,
  `tauri-plugin-opener`, `tauri-plugin-dialog` and `tauri-plugin-fs`
  (permissions in `capabilities/default.json`)

## UI (shadcn-svelte, Tailwind v4)
- Config in `components.json` (style `nova`, base color `zinc`, `iconLibrary: lucide`);
  theme tokens live in `src/app.css`; `cn` helper in `src/lib/utils.ts`.
- Components in `src/lib/components/ui/*`, imported as
  `$lib/components/ui/<name>/index.js` (plus `Toaster` from `sonner`, `toast` from
  `svelte-sonner`). Installed: button, input, label, card, badge, select, checkbox,
  separator, table, alert-dialog, alert, sonner, sidebar, tooltip, sheet, skeleton,
  dialog.
- App shell uses the sidebar layout: `src/lib/components/app-sidebar.svelte` inside
  `Sidebar.Provider` + `Sidebar.Inset` in `src/routes/+layout.svelte` (collapses to
  icons, toggle via `Sidebar.Trigger`). Dark mode is handled by `mode-watcher`
  (`<ModeWatcher />` + `toggleMode` button in the header); `.dark` tokens live in
  `src/app.css`.
- Add more with `pnpm dlx shadcn-svelte@latest add <name>`. The CLI is interactive;
  for non-interactive runs pass the preset `--preset baKeeG` and pipe `y` when it
  prompts (e.g. `"y`n" | pnpm dlx shadcn-svelte@latest ...`).
