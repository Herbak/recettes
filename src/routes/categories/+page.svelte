<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import { app } from "$lib/store.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  let newCategory = $state("");

  function addCategory() {
    if (!newCategory.trim()) return;
    app.addCategory(newCategory);
    newCategory = "";
  }

  function countFor(categoryId: string) {
    return app.state.items.filter((i) => i.categoryId === categoryId).length;
  }
</script>

<div class="mb-5">
  <h1 class="text-xl font-semibold">Catégories</h1>
  <p class="text-sm text-muted-foreground">
    Classez vos ingrédients en catégories. Elles servent à grouper la liste de
    courses.
  </p>
</div>

<Card.Root class="max-w-xl">
  <Card.Header>
    <Card.Title>Catégories</Card.Title>
  </Card.Header>
  <Card.Content class="flex flex-col gap-3">
    <div class="flex gap-2">
      <Input
        bind:value={newCategory}
        placeholder="Ex : Fromage"
        onkeydown={(e) => e.key === "Enter" && addCategory()}
      />
      <Button
        size="icon"
        onclick={addCategory}
        disabled={!newCategory.trim()}
        aria-label="Ajouter"
      >
        <PlusIcon />
      </Button>
    </div>

    <ul class="flex flex-col gap-2">
      {#each app.state.categories as category (category.id)}
        <li class="flex items-center gap-2">
          <Input bind:value={category.name} class="flex-1" />
          <span class="w-16 shrink-0 text-right text-xs text-muted-foreground">
            {countFor(category.id)} ing.
          </span>
          <AlertDialog.Root>
            <AlertDialog.Trigger
              class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label="Supprimer"
            >
              <XIcon />
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Supprimer « {category.name} » ?</AlertDialog.Title>
                <AlertDialog.Description>
                  Les ingrédients liés ne seront plus classés.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                <AlertDialog.Action
                  variant="destructive"
                  onclick={() => app.removeCategory(category.id)}
                >
                  Supprimer
                </AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </li>
      {/each}
      {#if app.state.categories.length === 0}
        <li class="text-xs text-muted-foreground">Aucune catégorie.</li>
      {/if}
    </ul>
  </Card.Content>
</Card.Root>
