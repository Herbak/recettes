<script lang="ts">
  import { toast } from "svelte-sonner";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import { app } from "$lib/store.svelte";
  import { parseExport, type ExportBundle } from "$lib/transfer";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  let pending = $state<ExportBundle | null>(null);
  let mode = $state<"replace" | "merge">("replace");
  let pasted = $state("");
  let importError = $state("");
  let historyOpen = $state(false);

  const exportJson = $derived(app.exportContent());

  async function exportFile() {
    const json = app.exportContent();
    const filename = `recettes-${new Date().toISOString().slice(0, 10)}.json`;

    if (isTauri) {
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({
          defaultPath: filename,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (!path) return;
        await writeTextFile(path, json);
        toast.success("Fichier exporté");
        return;
      } catch {
        toast.error("Export natif impossible, téléchargement à la place");
      }
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier téléchargé");
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(app.exportContent());
      toast.success("JSON copié dans le presse-papiers");
    } catch {
      toast.error("Copie impossible — sélectionnez le texte affiché");
    }
  }

  function analyze(text: string) {
    if (!text.trim()) return;
    try {
      pending = parseExport(text);
      importError = "";
      toast.success("Fichier analysé");
    } catch (error) {
      pending = null;
      importError =
        error instanceof Error ? error.message : "Fichier invalide.";
      toast.error(importError);
    }
  }

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    analyze(await file.text());
    input.value = "";
  }

  function applyImport() {
    if (!pending) return;
    if (mode === "replace") {
      app.replaceContent(pending);
      toast.success("Contenu remplacé");
    } else {
      const summary = app.mergeContent(pending);
      toast.success(
        `Fusion : +${summary.categories} catégories, +${summary.items} ingrédients, +${summary.meals} repas`,
      );
    }
    pending = null;
    pasted = "";
  }

  function resetHistory() {
    app.resetUsage();
    historyOpen = false;
    toast.success("Historique réinitialisé");
  }
</script>

<div class="mb-5">
  <h1 class="text-xl font-semibold">Données</h1>
  <p class="text-sm text-muted-foreground">
    Exportez vos catégories, ingrédients et repas pour les transférer sur un
    autre appareil, ou importez un fichier de contenu.
  </p>
</div>

<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
  <Card.Root>
    <Card.Header>
      <Card.Title>Exporter</Card.Title>
      <Card.Description>
        Crée un fichier contenant {app.state.categories.length} catégories,
        {app.state.items.length} ingrédients et {app.state.meals.length} repas.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2">
        <Button onclick={exportFile}>
          <DownloadIcon /> Exporter le fichier
        </Button>
        <Button variant="outline" onclick={copyJson}>
          <CopyIcon /> Copier le JSON
        </Button>
      </div>

      <details class="group">
        <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Afficher le JSON
        </summary>
        <textarea
          readonly
          value={exportJson}
          rows="10"
          class="mt-2 w-full resize-y rounded-lg border border-input bg-transparent p-2 font-mono text-xs outline-none"
        ></textarea>
      </details>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Importer</Card.Title>
      <Card.Description>
        Sélectionnez un fichier exporté, ou collez son contenu.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="grid gap-1.5">
        <Input type="file" accept=".json,application/json" onchange={onFile} />
      </div>

      <div class="grid gap-1.5">
        <textarea
          bind:value={pasted}
          rows="4"
          placeholder="…ou collez ici le contenu JSON"
          class="w-full resize-y rounded-lg border border-input bg-transparent p-2 font-mono text-xs outline-none"
        ></textarea>
        <Button
          variant="outline"
          size="sm"
          class="justify-self-start"
          disabled={!pasted.trim()}
          onclick={() => analyze(pasted)}
        >
          Analyser
        </Button>
      </div>

      {#if importError}
        <p class="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
          {importError}
        </p>
      {/if}

      {#if pending}
        <div class="rounded-lg border p-3 text-sm">
          <p class="font-medium">Fichier analysé</p>
          <p class="text-muted-foreground">
            {pending.categories.length} catégories · {pending.items.length} ingrédients ·
            {pending.meals.length} repas
          </p>
        </div>

        <div class="grid gap-2">
          <span class="text-sm font-medium">Mode d'import</span>
          <div class="flex gap-2">
            <Button
              variant={mode === "replace" ? "default" : "outline"}
              size="sm"
              onclick={() => (mode = "replace")}
            >
              Remplacer
            </Button>
            <Button
              variant={mode === "merge" ? "default" : "outline"}
              size="sm"
              onclick={() => (mode = "merge")}
            >
              Fusionner
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            {mode === "replace"
              ? "Efface le contenu actuel et le remplace par celui du fichier."
              : "Ajoute uniquement les éléments absents (par nom), sans toucher au reste."}
          </p>
        </div>

        {#if mode === "replace"}
          <AlertDialog.Root>
            <AlertDialog.Trigger class={buttonVariants()}>
              <UploadIcon /> Remplacer et importer
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Remplacer tout le contenu ?</AlertDialog.Title>
                <AlertDialog.Description>
                  Toutes vos catégories, ingrédients et repas actuels seront
                  remplacés, et la semaine sera vidée. Cette action est
                  irréversible.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                <AlertDialog.Action onclick={applyImport}>
                  Remplacer
                </AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        {:else}
          <Button onclick={applyImport}>
            <UploadIcon /> Fusionner
          </Button>
        {/if}
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Historique des repas</Card.Title>
      <Card.Description>
        {Object.keys(app.state.usage).length} repas suivis · {Object.values(
          app.state.usage,
        ).reduce((sum, count) => sum + count, 0)} consommations enregistrées.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <AlertDialog.Root bind:open={historyOpen}>
        <AlertDialog.Trigger class={buttonVariants({ variant: "destructive" })}>
          <RotateCcwIcon /> Réinitialiser l'historique
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Réinitialiser l'historique ?</AlertDialog.Title>
            <AlertDialog.Description>
              Les compteurs de repas consommés seront remis à zéro. Les
              catégories, ingrédients et repas ne sont pas modifiés.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
            <AlertDialog.Action variant="destructive" onclick={resetHistory}>
              Réinitialiser
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card.Content>
  </Card.Root>
</div>
