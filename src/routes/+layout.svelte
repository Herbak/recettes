<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { ModeWatcher, mode, toggleMode } from "mode-watcher";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import SunIcon from "@lucide/svelte/icons/sun";
  import { app } from "$lib/store.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";

  let { children } = $props();

  onMount(() => {
    void app.init();
  });
</script>

<ModeWatcher defaultMode="light" />

<Sidebar.Provider>
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
