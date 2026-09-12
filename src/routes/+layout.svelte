<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { ModeWatcher, mode, toggleMode } from "mode-watcher";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import SunIcon from "@lucide/svelte/icons/sun";
  import { check } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { app } from "$lib/store.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";

  let { children } = $props();

  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  let updateAvailable = $state<{ version: string; body?: string } | null>(null);
  let updateOpen = $state(false);
  let pendingUpdate: Awaited<ReturnType<typeof check>> = null;

  async function checkForUpdate() {
    if (!isTauri) return;
    try {
      const update = await check();
      if (!update) return;
      pendingUpdate = update;
      updateAvailable = { version: update.version, body: update.body };
      updateOpen = true;
    } catch {
      // hors-ligne, aucune release, clé absente… on ignore
    }
  }

  async function installUpdate() {
    if (!pendingUpdate) return;
    const toastId = toast.loading("Téléchargement de la mise à jour…");
    try {
      let total = 0;
      let downloaded = 0;
      await pendingUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) {
              toast.loading(
                `Téléchargement… ${Math.round((downloaded / total) * 100)}%`,
                { id: toastId },
              );
            }
            break;
          case "Finished":
            toast.loading("Installation…", { id: toastId });
            break;
        }
      });
      toast.success("Mise à jour installée, redémarrage…", { id: toastId });
      await relaunch();
    } catch {
      toast.error("Échec de la mise à jour", { id: toastId });
    }
  }

  onMount(() => {
    void app.init();
    void checkForUpdate();
  });
</script>

<ModeWatcher defaultMode="light" />

<Sidebar.Provider class="border-t">
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-12 items-center gap-2 border-b px-3">
      <Sidebar.Trigger />
      <Button
        variant="ghost"
        size="icon"
        class="ml-auto"
        onclick={toggleMode}
        aria-label="Basculer le thème clair/sombre"
        title="Thème clair / sombre"
      >
        {#if mode.current === "dark"}
          <SunIcon />
        {:else}
          <MoonIcon />
        {/if}
      </Button>
    </header>
    <div class="flex-1 p-6">
      {#if app.ready}
        {@render children()}
      {:else}
        <p class="text-sm text-muted-foreground">Chargement…</p>
      {/if}
    </div>
  </Sidebar.Inset>
  <Toaster theme={mode.current === "dark" ? "dark" : "light"} position="top-right" />
</Sidebar.Provider>

<AlertDialog.Root
  bind:open={updateOpen}
  onOpenChange={(open) => {
    if (!open) updateAvailable = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Mise à jour disponible</AlertDialog.Title>
      <AlertDialog.Description>
        La version {updateAvailable?.version} est disponible. L'application va
        télécharger puis redémarrer.
        {#if updateAvailable?.body}
          <span class="mt-2 block text-xs whitespace-pre-wrap">{updateAvailable.body}</span>
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (updateAvailable = null)}>
        Plus tard
      </AlertDialog.Cancel>
      <AlertDialog.Action onclick={installUpdate}>
        Installer la mise à jour
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
