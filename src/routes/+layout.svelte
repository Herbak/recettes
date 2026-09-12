<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { app } from "$lib/store.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";

  let { children } = $props();

  onMount(() => {
    void app.init();
  });
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-12 items-center gap-2 border-b px-3">
      <Sidebar.Trigger />
    </header>
    <div class="flex-1 p-6">
      {#if app.ready}
        {@render children()}
      {:else}
        <p class="text-sm text-muted-foreground">Chargement…</p>
      {/if}
    </div>
  </Sidebar.Inset>
  <Toaster theme="light" />
</Sidebar.Provider>
