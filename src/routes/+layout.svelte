<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { app } from "$lib/store.svelte";
  import { cn } from "$lib/utils";
  import { Toaster } from "$lib/components/ui/sonner/index.js";

  let { children } = $props();

  onMount(() => {
    void app.init();
  });

  const links = [
    { href: "/", label: "Semaine" },
    { href: "/repas", label: "Repas" },
    { href: "/ingredients", label: "Ingrédients" },
    { href: "/courses", label: "Courses" },
  ];
</script>

<div class="min-h-screen bg-muted/30">
  <header class="border-b bg-background">
    <div class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
      <span class="text-lg font-semibold text-primary">Recettes</span>
      <nav class="flex gap-1">
        {#each links as link (link.href)}
          <a
            href={link.href}
            class={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              page.url.pathname === link.href
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-6 py-6">
    {#if app.ready}
      {@render children()}
    {:else}
      <p class="text-sm text-muted-foreground">Chargement…</p>
    {/if}
  </main>

  <Toaster theme="light" />
</div>
